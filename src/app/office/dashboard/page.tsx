import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { StatCard } from '@/components/ui/PageUI'
import { getOperationsData } from '@/features/operations/queries'
import { formatCurrency } from '@/lib/utils'
import { FileText, Droplets, CheckCircle, AlertCircle, Clock, Receipt, Banknote, ShieldAlert } from 'lucide-react'
import DashboardRealtimeListener from '@/features/analytics/components/DashboardRealtimeListener'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

export const metadata: Metadata = { title: 'Operations Dashboard' }

// Revalidate dashboard data every 60 seconds
export const revalidate = 60

export default async function OfficeDashboardPage() {
  const profile = await getCurrentUserProfile()
  if (!profile) return null

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <DashboardRealtimeListener societyId={profile.society_id} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Operations Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: '#8C8680' }}>
          Welcome, {profile.full_name || 'Office Manager'} — Daily Tasks & Activity
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <OperationsContent societyId={profile.society_id} />
      </Suspense>
    </div>
  )
}

const ActionIcon = ({ type }: { type: string }) => {
  switch(type) {
    case 'water_unit_entered': return <Droplets size={14} className="text-[#B79B6C]" />
    case 'bill_generated': return <FileText size={14} className="text-[#8C8680]" />
    case 'payment_cash_recorded': return <Banknote size={14} className="text-[#7A8B74]" />
    case 'expense_created': return <Receipt size={14} className="text-slate-500" />
    default: return <Clock size={14} className="text-slate-400" />
  }
}

async function OperationsContent({ societyId }: { societyId: string }) {
  const opsData = await getOperationsData(societyId)

  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Water Entry" value={opsData.waterReadingsPending.toString()} accent="#B79B6C" />
        <StatCard label="Bills Generated" value={opsData.billsGenerated.toString()} accent="#8C8680" />
        <StatCard label="Cash Collected Today" value={formatCurrency(opsData.cashCollectedToday)} accent="#7A8B74" />
        <StatCard label="Overdue Houses" value={opsData.overdueAccounts.toString()} accent="#C56E4D" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actionable List */}
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2D2A26' }}>Action Required</h3>
            <span className="badge bg-[#B79B6C]/10 text-[#9E8357] border border-[#B79B6C]/20 text-[10px]">
              {opsData.waterReadingsPending} Tasks Pending
            </span>
          </div>
          
          <div className="space-y-4 flex-1">
            {opsData.waterReadingsPending > 0 ? (
              <div className="p-4 rounded-xl border flex gap-4 items-start" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(183,155,108,0.15)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(183,155,108,0.1)', color: '#B79B6C' }}>
                  <Droplets size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Water Readings Incomplete</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    There are {opsData.waterReadingsPending} houses awaiting water meter entries for the active billing cycle.
                  </p>
                  <a href="/office/water" className="btn btn-primary px-4 py-1.5 text-xs inline-block">Record Readings</a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border flex gap-4 items-center" style={{ background: 'rgba(122,139,116,0.05)', borderColor: 'rgba(122,139,116,0.15)' }}>
                <CheckCircle size={20} className="text-[#7A8B74]" />
                <span className="text-sm font-semibold text-slate-700">All water readings recorded for this cycle!</span>
              </div>
            )}

            {opsData.overdueAccounts > 0 && (
              <div className="p-4 rounded-xl border flex gap-4 items-start" style={{ background: 'rgba(197,110,77,0.05)', borderColor: 'rgba(197,110,77,0.15)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(197,110,77,0.1)', color: '#C56E4D' }}>
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Overdue Payments</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    {opsData.overdueAccounts} houses have overdue payments past the late fee deadline.
                  </p>
                  <a href="/office/billing" className="btn btn-secondary border border-slate-200 px-4 py-1.5 text-xs inline-block">Review Accounts</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="glass-card p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2D2A26' }}>Recent Activity</h3>
            <span className="text-xs text-slate-400">Live feed</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '350px' }}>
            {opsData.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No recent activity</div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-6">
                {(opsData?.recentActivity || []).map((log: any) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[27px] top-1 p-1 bg-white border border-slate-100 rounded-full">
                      <ActionIcon type={log.action_type} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">
                        {log.users?.full_name || 'System'}
                      </span>
                      <span className="text-sm text-slate-600 mt-0.5">
                        {log.action_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      <span suppressHydrationWarning className="text-[10px] text-slate-400 mt-1">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
