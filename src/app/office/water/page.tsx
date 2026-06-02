// =============================================================================
// OFFICE ROUTE — /office/water/page.tsx
// Mobile-first water consumption entry workspace with progressive statistics.
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getActiveBillingMonth } from '@/lib/billing/cycle'
import { getPendingWaterEntryHouses, getActiveWaterRate } from '@/features/billing/queries'
import { formatCurrency } from '@/lib/utils'
import WaterEntryClient from './WaterEntryClient'

export const metadata: Metadata = { title: 'Record Water Readings' }

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function OfficeWaterPage({ searchParams }: PageProps) {
  const params = await searchParams
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'office_man') {
    redirect('/login')
  }

  // Default to May 2025 (matching seed data month) or url parameter
  const activeMonth = params.month || getActiveBillingMonth()

  const houses = await getPendingWaterEntryHouses(activeMonth)
  const activeRate = await getActiveWaterRate()

  // Calculate entry statistics
  const totalActive = houses.length
  const recordedCount = houses.filter(h => h.water_entry !== null).length
  const progressPercent = totalActive > 0 ? Math.round((recordedCount / totalActive) * 100) : 0

  return (
    <div className="p-4 animate-fade-in pb-20">
      {/* Top Banner Header */}
      <div className="pt-4 pb-6 border-b border-slate-200/50 mb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#8C8680]">Operations Panel</p>
        <h1 className="text-2xl font-bold text-[#2D2A26] mt-0.5">Water Readings</h1>
        <p className="text-xs text-[#54504B] mt-1">Capture monthly water consumption metrics</p>
      </div>

      {/* Water Rate Banner */}
      <div className="glass-card p-4 border border-indigo-500/20 bg-indigo-500/[0.02] flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Active Water Tariff</p>
          <p className="text-sm font-semibold text-slate-200 mt-0.5">
            {activeRate ? `${formatCurrency(Number(activeRate.price_per_unit))}/unit` : 'No active rate configured'}
          </p>
        </div>
        <span className="text-indigo-400 text-xs">💧 Consumption Model</span>
      </div>

      {/* Interactive Month Picker & Progress Metrics */}
      <WaterEntryClient
        houses={houses}
        activeMonth={activeMonth}
        recordedCount={recordedCount}
        totalActive={totalActive}
        progressPercent={progressPercent}
      />
    </div>
  )
}
