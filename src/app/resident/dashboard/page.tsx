import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getResidentBills } from '@/features/billing/queries'
import { formatCurrency } from '@/lib/utils'
import SignOutButton from '@/components/layout/SignOutButton'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

export const metadata: Metadata = { title: 'My Dashboard' }

// Revalidate dashboard data every 60 seconds
export const revalidate = 60

export default async function ResidentDashboardPage() {
  const profile = await getCurrentUserProfile()

  // Force password reset before allowing dashboard access
  if (profile?.requires_password_reset) {
    redirect('/resident/setup-password')
  }

  return (
    <div className="p-4 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="pt-4 pb-6 flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: '#8C8680' }}>Good day 👋</p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: '#2D2A26' }}>
            {profile?.full_name || 'Resident'}
          </h1>
          <p className="text-xs font-semibold" style={{ color: '#C56E4D' }}>Shyamved Residency</p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        {profile?.house_id ? (
          <ResidentDashboardContent houseId={profile.house_id} />
        ) : (
          <div className="p-8 text-center glass-card rounded-2xl">
            <p className="text-slate-500">Your account is not assigned to a house yet.</p>
          </div>
        )}
      </Suspense>
    </div>
  )
}

async function ResidentDashboardContent({ houseId }: { houseId: string }) {
  const bills = await getResidentBills(houseId)
  
  // Find the latest unpaid bill (pending or overdue)
  const latestBill = bills.find(b => b.status === 'pending' || b.status === 'overdue') || bills[0] || null

  const billMonthName = latestBill 
    ? new Date(latestBill.billing_month).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : ''

  // Format status badge styles using inline styles for globals.css compat
  let badgeStyle = { bg: 'rgba(183,155,108,0.1)', border: 'rgba(183,155,108,0.2)', text: '#B79B6C' }
  let statusText = 'Pending'

  if (latestBill) {
    if (latestBill.status === 'paid') {
      badgeStyle = { bg: 'rgba(122,139,116,0.1)', border: 'rgba(122,139,116,0.2)', text: '#5A6855' }
      statusText = 'Paid'
    } else if (latestBill.status === 'overdue') {
      badgeStyle = { bg: 'rgba(197,110,77,0.1)', border: 'rgba(197,110,77,0.2)', text: '#C56E4D' }
      statusText = 'Overdue'
    }
  }

  return (
    <>
      {/* Premium Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Outstanding / Cleared Card */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: latestBill && latestBill.status !== 'paid' ? '#C56E4D' : '#7A8B74' }} />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Current Balance</p>
              <p className="text-2xl font-bold" style={{ color: latestBill && latestBill.status !== 'paid' ? '#C56E4D' : '#7A8B74' }}>
                {latestBill && latestBill.status !== 'paid' ? formatCurrency(latestBill.final_amount ?? 0) : '₹0.00'}
              </p>
            </div>
            <span className="badge text-[8px]" style={{ background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text }}>
              {statusText}
            </span>
          </div>
          <p className="text-[10px] mt-1 line-clamp-1" style={{ color: '#8C8680' }}>
            {latestBill?.status === 'paid' ? 'No outstanding dues' : `${billMonthName} invoice pending`}
          </p>
        </div>

        {/* Due Date Card */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#B79B6C' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Due Date</p>
          <p suppressHydrationWarning className="text-xl font-bold mt-1" style={{ color: '#2D2A26' }}>
            {latestBill && latestBill.status !== 'paid' && latestBill.due_date ? new Date(latestBill.due_date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC'
            }) : 'Settled'}
          </p>
          <p className="text-[10px] mt-1.5" style={{ color: '#8C8680' }}>
            {latestBill?.status === 'paid' ? 'All clear' : 'Pay before late fees apply'}
          </p>
        </div>

        {/* Action Card */}
        <div className="glass-card p-5 relative overflow-hidden sm:col-span-2 lg:col-span-2 flex flex-col justify-center border border-slate-200">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#54504B' }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Quick Action</p>
              <h3 className="text-sm font-bold text-[#2D2A26]">
                {latestBill?.status === 'paid' ? 'Review Settlement History' : 'Secure Online Payment'}
              </h3>
              <p className="text-[10px] mt-1 text-[#8C8680] max-w-[200px]">
                {latestBill?.status === 'paid' ? 'View details of your cleared invoices.' : 'Pay instantly using UPI or Net Banking.'}
              </p>
            </div>
            {latestBill && (
              <a
                href={`/resident/bills/${latestBill.id}`}
                className={`btn ${latestBill.status === 'paid' ? 'btn-secondary' : 'btn-primary'} w-full sm:w-auto px-6 py-2.5 text-xs shrink-0`}
              >
                {latestBill.status === 'paid' ? 'View Receipt' : 'Review & Pay'}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Notices Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2D2A26' }}>
            Society Notices
          </h2>
          <a href="/resident/notices" className="text-[10px] font-bold hover:underline" style={{ color: '#C56E4D' }}>View All &rarr;</a>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-xl border flex gap-4" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(183,155,108,0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(197,110,77,0.1)', color: '#C56E4D' }}>
              📢
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(183,155,108,0.1)', color: '#9E8357' }}>
                  Update
                </span>
                <span className="text-[9px] font-semibold text-slate-400">Just now</span>
              </div>
              <h4 className="text-sm font-bold" style={{ color: '#2D2A26' }}>Phase 3 Billing Engine Live</h4>
              <p className="text-xs mt-1" style={{ color: '#54504B' }}>
                Residents can now view real-time itemized bills, consumption meter readings, and dynamic overdue fees in real time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
