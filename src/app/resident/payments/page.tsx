import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getResidentBills } from '@/features/billing/queries'
import { getResidentReceipts } from '@/features/receipts/queries'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import OnlinePaymentButton from '@/features/payments/components/OnlinePaymentButton'

export const metadata: Metadata = { title: 'Payments & Receipts' }

export default async function ResidentPaymentsPage() {
  const profile = await getCurrentUserProfile()
  
  if (!profile || profile.role !== 'resident' || !profile.house_id) {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()
  const { data: society } = await supabase
    .from('societies')
    .select('name')
    .eq('id', profile.society_id)
    .maybeSingle()

  // Fetch all active bills (pending, overdue, paid)
  const bills = await getResidentBills(profile.house_id)
  const receipts = await getResidentReceipts(profile.house_id)

  const unpaidBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue')
  const totalDue = unpaidBills.reduce((sum, b) => sum + (b.final_amount ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-lg mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payments & Receipts</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your maintenance dues and view past receipts</p>
      </div>

      {/* Current Dues Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden shadow-lg border border-red-900/10" style={{ background: 'linear-gradient(145deg, #FDFAF6 0%, #F5F0E6 100%)' }}>
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C56E4D]" />
        
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C56E4D] mb-1">Total Outstanding Dues</p>
        <p className="text-3xl font-extrabold text-[#2D2A26]">
          {formatCurrency(totalDue)}
        </p>

        {unpaidBills.length > 0 ? (
          <div className="mt-5 space-y-3">
            {(unpaidBills || []).map(bill => (
              <div key={bill.id} className="p-3 bg-white/60 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">{format(new Date(bill.billing_month), 'MMMM yyyy')} Bill</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Maint: {formatCurrency(Number(bill.maintenance_amount))} | Water: {formatCurrency(Number(bill.water_bill_amount || 0))}</p>
                  {Number(bill.penalty_amount) > 0 && !bill.penalty_waived && (
                    <p className="text-[10px] font-semibold text-[#C56E4D]">Includes {formatCurrency(Number(bill.penalty_amount))} Late Fee</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-800">{formatCurrency(bill.final_amount ?? 0)}</p>
                  <OnlinePaymentButton
                    billId={bill.id}
                    amount={bill.final_amount ?? 0}
                    billMonthName={format(new Date(bill.billing_month), 'MMMM yyyy')}
                    residentName={profile.full_name || 'Resident'}
                    residentPhone={profile.phone || ''}
                    societyName={society?.name || 'Society'}
                    className="mt-1 text-[10px] font-bold px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all hover:scale-105"
                    buttonText="Pay Now"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-[#5A6855] mt-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#5A6855]/10 flex items-center justify-center">✓</span>
            All clear! No pending dues.
          </p>
        )}
      </div>

      {/* Payment History & Receipts */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Payment History</h2>
        
        {receipts.length > 0 ? (
          <div className="space-y-3">
            {(receipts || []).map(receipt => (
              <div key={receipt.id} className="glass-card p-4 rounded-xl flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#7A8B74]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#5A6855] font-bold text-lg">₹</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(receipt.receipt_data.totalAmount)}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {format(new Date(receipt.generated_at), 'dd MMM yyyy')} • {receipt.receipt_number}
                    </p>
                  </div>
                </div>
                
                <a 
                  href={`/api/pdf/${receipt.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Download PDF Receipt"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 rounded-xl text-center">
            <p className="text-sm text-slate-500">No payment history found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
