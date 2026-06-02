import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getActiveBillingMonth } from '@/lib/billing/cycle'
import { getBillsByMonth } from '@/features/billing/queries'
import OfficePaymentsClient from './OfficePaymentsClient'

export const metadata: Metadata = { title: 'Cash Payments' }

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function OfficePaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'office_man') {
    redirect('/login')
  }

  // Active month logic via cycle or URL param
  const activeMonth = params.month || getActiveBillingMonth()
  const bills = await getBillsByMonth(activeMonth)

  // Aggregate metrics
  const totalCount = bills.length
  const unpaidCount = bills.filter((b) => b.status === 'pending' || b.status === 'overdue').length
  const paidCount = bills.filter((b) => b.status === 'paid').length

  const totalExpectedAmount = bills
    .filter(b => b.status === 'pending' || b.status === 'overdue')
    .reduce((acc, b) => acc + (b.final_amount ?? 0), 0)

  return (
    <div className="p-4 animate-fade-in pb-20">
      <div className="pt-4 pb-6 border-b border-slate-200/50 mb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#8C8680]">Operations Panel</p>
        <h1 className="text-2xl font-bold text-[#2D2A26] mt-0.5">Cash Payments</h1>
        <p className="text-xs text-[#54504B] mt-1">Record and manage cash collections for residents</p>
      </div>

      <OfficePaymentsClient
        bills={bills}
        activeMonth={activeMonth}
        totalCount={totalCount}
        unpaidCount={unpaidCount}
        paidCount={paidCount}
        totalExpectedAmount={totalExpectedAmount}
      />
    </div>
  )
}
