// =============================================================================
// RESIDENT ROUTE — /resident/bills/[id]/page.tsx
// Renders comprehensive invoice items, consumption snapshots, and late penalties.
// =============================================================================

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { getBillById } from '@/features/billing/queries'
import { formatCurrency } from '@/lib/utils'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { calculateDynamicPenalty } from '@/lib/billing/calculator'
import OnlinePaymentButton from '@/features/payments/components/OnlinePaymentButton'


export const metadata: Metadata = { title: 'Bill Details' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResidentBillDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getCurrentUserProfile()

  if (!profile || !profile.house_id) {
    redirect('/login')
  }

  const bill = await getBillById(id)

  // Enforce resident RLS: cannot view another house's bill
  if (!bill || bill.house_id !== profile.house_id) {
    notFound()
  }

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

  // Calculate dynamic penalty for unpaid bills
  let dynamicPenalty = bill.penalty_amount ? Number(bill.penalty_amount) : 0
  if (bill.status === 'pending' || bill.status === 'overdue') {
    const calcPenalty = calculateDynamicPenalty(
      bill.billing_month,
      bill.society.penalty_per_day,
      bill.society.payment_window_end,
      bill.penalty_waived
    )
    if (calcPenalty > dynamicPenalty) dynamicPenalty = calcPenalty
  }

  // Calculate values
  const maintenance = Number(bill.maintenance_amount)
  const waterUnits = bill.water_units ? Number(bill.water_units) : 0
  const waterUnitPrice = bill.water_unit_price ? Number(bill.water_unit_price) : 0
  const waterAmount = bill.water_bill_amount ? Number(bill.water_bill_amount) : 0
  const penalty = dynamicPenalty
  const total = (bill.status === 'paid' && bill.final_amount) 
    ? bill.final_amount 
    : (maintenance + waterAmount + penalty)

  let receiptId = null
  if (bill.status === 'paid') {
    const supabase = await createSupabaseServerClient()
    const { data: receipt } = await supabase
      .from('receipts')
      .select('id')
      .eq('bill_id', bill.id)
      .maybeSingle()
    if (receipt) receiptId = receipt.id
  }

  return (
    <div className="p-4 animate-fade-in pb-12">
      {/* Navigation Header */}
      <div className="pt-4 pb-6 flex items-center justify-between">
        <div>
          <a
            href="/resident/bills"
            className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
          >
            &larr; Back to Bills
          </a>
          <h1 className="text-xl font-bold text-[#2D2A26] mt-1">Invoice Details</h1>
        </div>
        <span className={`badge ${badgeClass} text-xs`}>{statusText}</span>
      </div>

      {/* Bill Overview Card */}
      <div className="glass-card p-6 mb-6">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Billing Month</p>
        <h2 className="text-2xl font-bold text-slate-100 mt-1">{billMonthName}</h2>
        
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/40 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Invoice Number</p>
            <p className="text-slate-200 font-semibold mt-0.5">{bill.bill_number || 'Pending'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Flat / Block</p>
            <p className="text-slate-200 font-semibold mt-0.5">
              House {bill.house.house_number} ({bill.house.block.name} Wing)
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Due Date</p>
            <p className="text-slate-200 font-semibold mt-0.5">
              {bill.due_date ? new Date(bill.due_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC'
              }) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Primary Contact</p>
            <p className="text-slate-200 font-semibold mt-0.5">{bill.house.owner_name}</p>
          </div>
        </div>
      </div>

      {/* Itemized Invoice Details */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          Itemized Charges
        </h3>

        <div className="space-y-4">
          {/* Maintenance */}
          <div className="flex justify-between items-start text-xs">
            <div>
              <p className="font-semibold text-slate-200">Monthly Society Maintenance</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Fixed maintenance charge</p>
            </div>
            <p className="font-bold text-slate-100">{formatCurrency(maintenance)}</p>
          </div>

          {/* Water Consumption */}
          <div className="flex justify-between items-start text-xs pt-4 border-t border-slate-800/20">
            <div>
              <p className="font-semibold text-slate-200">Water Consumption Fee</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {waterUnits > 0 
                  ? `${waterUnits.toFixed(1)} units consumed @ ${formatCurrency(waterUnitPrice)}/unit`
                  : 'No units recorded for this month'}
              </p>
            </div>
            <p className="font-bold text-slate-100">{formatCurrency(waterAmount)}</p>
          </div>

          {/* Late Penalty */}
          <div className="flex justify-between items-start text-xs pt-4 border-t border-slate-800/20">
            <div>
              <p className="font-semibold text-slate-200">Late Payment Penalty</p>
              {bill.penalty_waived ? (
                <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">
                  ✨ Waived by Chairman: "{bill.penalty_waiver_reason || 'N/A'}"
                </p>
              ) : penalty > 0 ? (
                <p className="text-[10px] text-rose-400 mt-0.5">
                  Overdue penalty fee accrued daily ({Math.floor(penalty / 10)} days @ ₹10/day)
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Within grace period (Ends on 10th IST)
                </p>
              )}
            </div>
            <p className={`font-bold ${penalty > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {formatCurrency(penalty)}
            </p>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-4 border-t border-slate-800 mt-4">
            <p className="text-sm font-bold text-slate-200">Total Payable Amount</p>
            <p className="text-2xl font-extrabold text-indigo-400">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Payment CTA */}
      {bill.status !== 'paid' ? (
        <div className="glass-card p-5 border border-indigo-500/20 bg-indigo-500/[0.02]">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
            Secure Payment Gateway
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
            Pay instantly using local UPI options (GPay, PhonePe, Paytm) or net banking. Transactions are signature-verified instantly.
          </p>
          <OnlinePaymentButton
            billId={bill.id}
            amount={total}
            billMonthName={billMonthName}
            residentName={profile.full_name || bill.house.owner_name || 'Resident'}
            residentPhone={profile.phone || bill.house.primary_contact_phone || ''}
            societyName={bill.society.name}
          />
          <p className="text-[9px] text-slate-500 text-center mt-2.5">
            🔒 High-security SSL Razorpay checkout gateway integration active.
          </p>
        </div>
      ) : (
        <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/[0.02] text-center">
          <span className="text-2xl text-emerald-400">✔️</span>
          <h4 className="text-xs font-bold text-emerald-300 mt-1 uppercase tracking-wider">
            Payment Completed
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            This invoice has been settled in full. Thank you for prompt payment!
          </p>
          {receiptId ? (
            <a 
              href={`/api/pdf/${receiptId}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full mt-4 py-2 text-xs font-semibold block"
            >
              📄 Download PDF Receipt
            </a>
          ) : (
            <button className="btn btn-secondary w-full mt-4 py-2 text-xs font-semibold disabled:opacity-50" disabled>
              📄 PDF Receipt (Generating...)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
