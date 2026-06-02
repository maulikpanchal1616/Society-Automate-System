import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getActiveBillingMonth } from '@/lib/billing/cycle'
import { getBillsByMonth } from '@/features/billing/queries'
import AdminPaymentsClient from './AdminPaymentsClient'

export const metadata: Metadata = { title: 'Cash Payments' }

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'chairman') {
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
        <p className="text-sm font-bold uppercase tracking-wider text-[#C56E4D]">Chairman Panel</p>
        <h1 className="text-2xl font-bold text-[#2D2A26] mt-0.5">Payments Oversight</h1>
        <p className="text-xs text-[#54504B] mt-1">Review and manage society collections</p>
      </div>

      <AdminPaymentsClient
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
