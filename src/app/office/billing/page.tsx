// =============================================================================
// OFFICE ROUTE — /office/billing/page.tsx
// Operational bills dashboard to trigger draft cycles and publish billing runs.
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getActiveBillingMonth } from '@/lib/billing/cycle'
import { getBillsByMonth } from '@/features/billing/queries'
import BillingDashboardClient from './BillingDashboardClient'

export const metadata: Metadata = { title: 'Manage Monthly Bills' }

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function OfficeBillingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'office_man') {
    redirect('/login')
  }

  // Default to May 2025 (matching seed data month) or url parameter
  const activeMonth = params.month || getActiveBillingMonth()

  const bills = await getBillsByMonth(activeMonth)

  // Aggregate metrics
  const totalCount = bills.length
  const draftCount = bills.filter((b) => b.status === 'draft').length
  const pendingCount = bills.filter((b) => b.status === 'pending').length
  const paidCount = bills.filter((b) => b.status === 'paid').length
  const overdueCount = bills.filter((b) => b.status === 'overdue').length

  const totalExpectedAmount = bills.reduce(
    (acc, b) => acc + (b.final_amount ?? 0),
    0
  )

  return (
    <div className="p-4 animate-fade-in pb-20">
      {/* Page Header */}
      <div className="pt-4 pb-6 border-b border-slate-200/50 mb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#8C8680]">Operations Panel</p>
        <h1 className="text-2xl font-bold text-[#2D2A26] mt-0.5">Billing Runs</h1>
        <p className="text-xs text-[#54504B] mt-1">Manage society maintenance & water billing cycles</p>
      </div>

      <BillingDashboardClient
        bills={bills}
        activeMonth={activeMonth}
        totalCount={totalCount}
        draftCount={draftCount}
        pendingCount={pendingCount}
        paidCount={paidCount}
        overdueCount={overdueCount}
        totalExpectedAmount={totalExpectedAmount}
      />
    </div>
  )
}
