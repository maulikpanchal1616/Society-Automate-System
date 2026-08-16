import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { StatCard } from '@/components/ui/PageUI'
import { getAnalyticsData } from '@/features/analytics/queries'
import { CollectionTrendChart } from '@/features/analytics/components/DashboardCharts'
import { formatCurrency } from '@/lib/utils'
import DashboardRealtimeListener from '@/features/analytics/components/DashboardRealtimeListener'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Chairman overview dashboard for Shyamved Residency',
}

// Revalidate dashboard data every 60 seconds
export const revalidate = 60

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile()
  if (!profile) return null

  const today = new Date()

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <DashboardRealtimeListener societyId={profile.society_id} />
      
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Financial Overview</h1>
          <p className="mt-1 text-sm" style={{ color: '#8C8680' }}>
            Welcome back, {profile.full_name || 'Chairman'} — Data for {today.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsContent societyId={profile.society_id} today={today} />
      </Suspense>
    </div>
  )
}

async function AnalyticsContent({ societyId, today }: { societyId: string, today: Date }) {
  const analytics = await getAnalyticsData(societyId, today)

  return (
    <>
      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Collected This Month" value={formatCurrency(analytics.collectedThisMonth)} accent="#7A8B74" />
        <StatCard label="Outstanding Dues" value={formatCurrency(analytics.totalOutstanding)} accent="#C56E4D" />
        <StatCard label="Overdue Amount" value={formatCurrency(analytics.totalOverdue)} accent="#C56E4D" />
        <StatCard label="Month Billed Revenue" value={formatCurrency(analytics.currentMonthTotalBilled)} accent="#B79B6C" />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Total Houses</p>
          <p className="text-lg font-bold" style={{ color: '#2D2A26' }}>{analytics.totalHouses}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Occupied</p>
          <p className="text-lg font-bold" style={{ color: '#7A8B74' }}>{analytics.occupiedHouses}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Vacant</p>
          <p className="text-lg font-bold" style={{ color: '#C56E4D' }}>{analytics.vacantHouses}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Residents</p>
          <p className="text-lg font-bold" style={{ color: '#B79B6C' }}>{analytics.totalResidents}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Water Rev</p>
          <p className="text-sm font-bold mt-1" style={{ color: '#2D2A26' }}>{formatCurrency(analytics.currentMonthWater)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Maint Rev</p>
          <p className="text-sm font-bold mt-1" style={{ color: '#2D2A26' }}>{formatCurrency(analytics.currentMonthMaintenance)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CollectionTrendChart data={analytics.collectionTrend} />
        </div>
        
        {/* Collection vs Pending visual summary */}
        <div className="glass-card p-6 flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#2D2A26' }}>Current Month Progress</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">Collected</span>
                <span className="font-bold text-[#7A8B74]">{formatCurrency(analytics.collectedThisMonth)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-[#7A8B74] h-2 rounded-full" style={{ width: `${Math.min(100, (analytics.collectedThisMonth / (analytics.currentMonthTotalBilled || 1)) * 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">Pending Dues</span>
                <span className="font-bold text-[#C56E4D]">{formatCurrency(analytics.currentMonthPending)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-[#C56E4D] h-2 rounded-full" style={{ width: `${Math.min(100, (analytics.currentMonthPending / (analytics.currentMonthTotalBilled || 1)) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
