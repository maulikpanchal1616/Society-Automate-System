import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { generateReportBuffer } from '@/features/reports/utils/renderPdf'
import { getCollectionStatement, getOutstandingDuesReport, getIncomeVsExpenseSummary } from '@/features/reports/queries'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, society_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'chairman') {
      return new NextResponse('Forbidden Access', { status: 403 })
    }

    const today = new Date()
    let title = ''
    let data: any[] = []
    let columns: string[] = []

    if (type === 'collections') {
      title = 'Monthly Collection Statement'
      columns = ['Receipt', 'Date', 'House', 'Mode', 'Amount']
      const rawData = await getCollectionStatement(profile.society_id, today)
      data = rawData.map(r => ({
        ...r,
        receipt: r.receipt.replace('RCPT-', ''), // Make receipt ID shorter to avoid PDF overflow
        date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }))
    } else if (type === 'outstanding') {
      title = 'Outstanding Dues Report'
      columns = ['House', 'Contact', 'Month', 'Status', 'Amount']
      const rawData = await getOutstandingDuesReport(profile.society_id)
      data = rawData.map(r => ({
        ...r,
        month: new Date(r.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      }))
    } else {
      title = 'Income vs Expense Summary'
      columns = ['Category', 'Amount']
      const summary = await getIncomeVsExpenseSummary(profile.society_id, today)
      data = [
        { category: 'Total Income', amount: summary.totalIncome },
        { category: 'Total Expense', amount: summary.totalExpense },
        { category: 'Net Surplus', amount: summary.netSurplus },
        ...summary.expenseBreakdown.map((e: any) => ({ category: `Expense: ${e.category}`, amount: e.amount }))
      ]
    }

    const pdfBuffer = await generateReportBuffer(title, data, columns)

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${type}-report.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('[Report PDF Error]', error)
    return new NextResponse(`Error generating PDF: ${error.message}`, { status: 500 })
  }
}
