// =============================================================================
// ADMIN ROUTE — /admin/billing/page.tsx
// Chairman financial monitoring cockpit and penalty waiver workspace.
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getActiveBillingMonth } from '@/lib/billing/cycle'
import { getBillsByMonth } from '@/features/billing/queries'
import ChairmanBillingClient from './ChairmanBillingClient'

export const metadata: Metadata = { title: 'Billing Administration' }

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

export default async function AdminBillingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const profile = await getCurrentUserProfile()

  // Enforce Chairman role authorization
  if (!profile || profile.role !== 'chairman') {
    redirect('/login')
  }

  // Default to May 2025 (matching seed data month) or url parameter
  const activeMonth = params.month || getActiveBillingMonth()

  return (
    <div className="p-6 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Cockpit Header */}
      <div className="pb-6 border-b mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#8C8680' }}>Chairman Portal</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#2D2A26' }}>Billing Administration</h1>
          <p className="text-xs mt-1" style={{ color: '#54504B' }}>Supervise collections, aging accounts, and approve penalty waivers</p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <BillingContent activeMonth={activeMonth} />
      </Suspense>
    </div>
  )
}

async function BillingContent({ activeMonth }: { activeMonth: string }) {
  const bills = await getBillsByMonth(activeMonth)

  // Calculate aggregated chairman statistics
  const totalCount = bills.length
  const unpaidCount = bills.filter(b => b.status === 'pending' || b.status === 'overdue').length
  const paidCount = bills.filter(b => b.status === 'paid').length
  const waivedCount = bills.filter(b => b.penalty_waived).length

  const totalOutstanding = bills
    .filter(b => b.status === 'pending' || b.status === 'overdue')
    .reduce((acc, b) => acc + (b.final_amount ?? 0), 0)

  const totalCollected = bills
    .filter(b => b.status === 'paid')
    .reduce((acc, b) => acc + (b.final_amount ?? 0), 0)

  return (
    <ChairmanBillingClient
      bills={bills}
      activeMonth={activeMonth}
      totalCount={totalCount}
      unpaidCount={unpaidCount}
      paidCount={paidCount}
      waivedCount={waivedCount}
      totalOutstanding={totalOutstanding}
      totalCollected={totalCollected}
    />
  )
}
