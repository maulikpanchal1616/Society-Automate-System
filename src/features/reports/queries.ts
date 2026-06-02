import { createSupabaseServerClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function getCollectionStatement(society_id: string, monthDate: Date) {
  const supabase = await createSupabaseServerClient()
  const start = format(startOfMonth(monthDate), "yyyy-MM-dd'T'00:00:00'Z'")
  const end = format(endOfMonth(monthDate), "yyyy-MM-dd'T'23:59:59'Z'")

  const { data } = await supabase
    .from('payments')
    .select(`
      id,
      amount_paid,
      payment_mode,
      paid_at,
      receipt_number,
      houses ( house_number, block_id, blocks (name) )
    `)
    .eq('society_id', society_id)
    .eq('status', 'success')
    .gte('paid_at', start)
    .lte('paid_at', end)
    .order('paid_at', { ascending: true })

  return (data || []).map((p: any) => ({
    receipt: p.receipt_number,
    date: p.paid_at,
    house: `${p.houses?.blocks?.name}-${p.houses?.house_number}`,
    mode: p.payment_mode,
    amount: Number(p.amount_paid)
  }))
}

export async function getOutstandingDuesReport(society_id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data } = await supabase
    .from('bills')
    .select(`
      id,
      billing_month,
      final_amount,
      status,
      due_date,
      houses ( house_number, blocks (name), primary_contact_phone )
    `)
    .eq('society_id', society_id)
    .in('status', ['pending', 'overdue'])
    .order('billing_month', { ascending: true })

  return (data || []).map((b: any) => ({
    house: `${b.houses?.blocks?.name}-${b.houses?.house_number}`,
    contact: b.houses?.primary_contact_phone,
    month: b.billing_month,
    status: b.status,
    amount: Number(b.final_amount)
  }))
}

export async function getIncomeVsExpenseSummary(society_id: string, monthDate: Date) {
  const supabase = await createSupabaseServerClient()
  const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd")
  const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd")
  
  const { data, error } = await supabase.rpc('rpc_get_reports_summary', {
    p_society_id: society_id,
    p_start_date: startDate,
    p_end_date: endDate
  })

  if (error || !data) {
    console.error('Failed to fetch reports summary:', error)
    return {
      month: format(monthDate, 'MMMM yyyy'),
      totalIncome: 0,
      totalExpense: 0,
      netSurplus: 0,
      expenseBreakdown: []
    }
  }

  return {
    month: format(monthDate, 'MMMM yyyy'),
    totalIncome: Number(data.totalIncome || 0),
    totalExpense: Number(data.totalExpense || 0),
    netSurplus: Number(data.netSurplus || 0),
    expenseBreakdown: data.expenseBreakdown || []
  }
}
