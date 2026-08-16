// =============================================================================
// RESIDENT ROUTE — /resident/bills/page.tsx
// Renders outstanding and historical bills with interactive card interfaces.
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getResidentBills } from '@/features/billing/queries'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Bills' }

export default async function ResidentBillsPage() {
  const profile = await getCurrentUserProfile()

  if (!profile || !profile.house_id) {
    redirect('/login')
  }

  const bills = await getResidentBills(profile.house_id)

  return (
    <div className="p-4 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="pt-4 pb-6">
        <p className="text-slate-400 text-sm">Shyamved Residency</p>
        <h1 className="text-2xl font-bold text-[#2D2A26] mt-0.5">My Bills</h1>
        <p className="text-slate-400 text-xs mt-1">View and manage your society dues</p>
      </div>

      {/* Bill List */}
      <div className="space-y-4">
        {bills.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <span className="text-3xl">📭</span>
            <h3 className="text-slate-200 font-semibold mt-2">No Bills Found</h3>
            <p className="text-slate-400 text-xs mt-1">There are no bills published for your house yet.</p>
          </div>
        ) : (
          (bills || []).map((bill) => {
            const billMonthName = new Date(bill.billing_month).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC'
            })

            // Format status badge styles
            let badgeClass = 'badge-pending'
            let statusText = 'Pending'

            if (bill.status === 'paid') {
              badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              statusText = 'Paid'
            } else if (bill.status === 'overdue') {
              badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              statusText = 'Overdue'
            } else if (bill.status === 'waived') {
              badgeClass = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              statusText = 'Waiver Applied'
            }

            return (
              <div key={bill.id} className="glass-card p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">{billMonthName}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{bill.bill_number || 'N/A'}</p>
                  </div>
                  <span className={`badge ${badgeClass} text-[10px]`}>{statusText}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/40 mt-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Payable</p>
                    <p className="text-xl font-bold text-slate-100 mt-0.5">
                      {formatCurrency(bill.final_amount ?? 0)}
                    </p>
                  </div>
                  <a
                    href={`/resident/bills/${bill.id}`}
                    className="btn btn-secondary py-1.5 px-4 text-xs font-semibold"
                  >
                    Details &rarr;
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
