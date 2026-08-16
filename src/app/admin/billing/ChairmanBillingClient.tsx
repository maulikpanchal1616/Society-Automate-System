// =============================================================================
// ADMIN COMPONENT — /admin/billing/ChairmanBillingClient.tsx
// Seamless search, dynamic filter states, and validation-guarded waiver modals.
// =============================================================================

'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { waiveBillPenalty } from '@/features/billing/actions'
import { recordCashPayment } from '@/features/payments/actions'
import { getBillingMonthPreview, generateMonthlyBills } from '@/features/billing/actions'
import { formatCurrency } from '@/lib/utils'
import { BillingMonthSelector } from '@/components/ui/BillingMonthSelector'

interface BillItem {
  id: string
  bill_number: string | null
  billing_month: string
  maintenance_amount: number
  water_units: number | null
  water_unit_price: number | null
  water_bill_amount: number | null
  penalty_amount: number | null
  final_amount: number | null
  penalty_waived: boolean
  penalty_waiver_reason: string | null
  status: any
  house: {
    id: string
    house_number: string
    owner_name: string
    tenant_name: string | null
    block: { id: string; name: string }
  }
}

interface ClientProps {
  bills: BillItem[]
  activeMonth: string
  totalCount: number
  unpaidCount: number
  paidCount: number
  waivedCount: number
  totalOutstanding: number
  totalCollected: number
}

export default function ChairmanBillingClient({
  bills,
  activeMonth,
  totalCount,
  unpaidCount,
  paidCount,
  waivedCount,
  totalOutstanding,
  totalCollected
}: ClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'waived' | 'paid'>('all')

  // Generate modal states
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [isGenerating, startGenerating] = useTransition()

  // Waiver modal states
  const [waiveBillId, setWaiveBillId] = useState<string | null>(null)
  const [waiverReason, setWaiverReason] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Cash payment modal states
  const [payBill, setPayBill] = useState<BillItem | null>(null)
  const [paymentPending, startPaymentTransition] = useTransition()

  // Add scroll lock class to body when modal is open
  useEffect(() => {
    if (waiveBillId || payBill) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [waiveBillId, payBill])



  const handleMonthChange = (newMonth: string) => {
    router.push(`/admin/billing?month=${newMonth}`)
  }

  const handleOpenWaiver = (billId: string) => {
    setWaiveBillId(billId)
    setWaiverReason('')
    setModalError(null)
    setSuccessMessage(null)
  }

  const handleCloseWaiver = () => {
    setWaiveBillId(null)
    setWaiverReason('')
    setModalError(null)
  }

  const handleSubmitWaiver = async () => {
    if (!waiverReason || waiverReason.trim().length < 5) {
      setModalError('Waiver reason must be at least 5 characters long.')
      return
    }

    if (!waiveBillId) return

    setModalError(null)
    startTransition(async () => {
      const res = await waiveBillPenalty(waiveBillId, waiverReason)
      if (res.success) {
        setSuccessMessage('Late fee penalty successfully waived.')
        setWaiveBillId(null)
        setWaiverReason('')
        router.refresh()
      } else {
        setModalError(res.error || 'Failed to apply waiver.')
      }
    })
  }

  const handleOpenPayment = (bill: BillItem) => {
    setPayBill(bill)
    setModalError(null)
    setSuccessMessage(null)
  }

  const handleClosePayment = () => {
    setPayBill(null)
    setModalError(null)
  }

  const handlePreviewBills = async () => {
    setModalError(null)
    startGenerating(async () => {
      const res = await getBillingMonthPreview(activeMonth)
      if (res.success) {
        setPreviewData(res.data)
        setShowPreview(true)
      } else {
        setModalError(res.error || 'Failed to preview billing month.')
      }
    })
  }

  const handleGenerateBills = async () => {
    setModalError(null)
    startGenerating(async () => {
      const res = await generateMonthlyBills(activeMonth)
      if (res.success) {
        setSuccessMessage(res.message || 'Bills generated successfully.')
        setShowPreview(false)
        router.refresh()
      } else {
        setModalError(res.error || 'Failed to generate bills.')
      }
    })
  }

  const handleSubmitPayment = async () => {
    if (!payBill) return

    setModalError(null)
    startPaymentTransition(async () => {
      const formData = new FormData()
      formData.append('billId', payBill.id)
      formData.append('expectedAmount', (payBill.final_amount ?? 0).toString())

      const res = await recordCashPayment(formData)
      if (res.success) {
        setSuccessMessage(`Cash payment of ${formatCurrency(payBill.final_amount ?? 0)} recorded successfully.`)
        setPayBill(null)
        // In the future, we can trigger a PDF download here with res.data.receiptId
        router.refresh()
      } else {
        setModalError(res.error || 'Failed to record payment.')
      }
    })
  }

  // Filter and search computation
  const filteredBills = bills.filter((b) => {
    // Search filter
    const matchesSearch =
      b.house.house_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.house.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.house.tenant_name && b.house.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.bill_number && b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    // Tab filter
    if (activeTab === 'unpaid') return b.status === 'pending' || b.status === 'overdue'
    if (activeTab === 'waived') return b.penalty_waived
    if (activeTab === 'paid') return b.status === 'paid'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Financial aggregate dashboards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#7A8B74' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Total Collected</p>
          <p className="text-2xl font-bold" style={{ color: '#7A8B74' }}>
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>{paidCount} Cleared Invoices</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#C56E4D' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Outstanding Dues</p>
          <p className="text-2xl font-bold" style={{ color: '#C56E4D' }}>
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>{unpaidCount} Pending Payments</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#B79B6C' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Waivers Applied</p>
          <p className="text-2xl font-bold" style={{ color: '#B79B6C' }}>{waivedCount}</p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>By Chairman Resolution</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#54504B' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Generated Bills</p>
          <p className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{totalCount}</p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>Total in Billing Month</p>
        </div>
      </div>

      {/* Global notifications banners */}
      {successMessage && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in" style={{ background: 'rgba(122,139,116,0.08)', border: '1px solid rgba(122,139,116,0.2)', color: '#5A6855' }}>
          <span className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold" style={{ borderColor: '#5A6855' }}>✓</span>
          <span className="flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="shrink-0 text-xs opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* Controls & searching */}
      <div className="glass-card p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by Flat No., Block, or Occupant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input text-xs w-full md:max-w-md"
        />

        {/* Month selector & Generation controls */}
        <div className="flex flex-wrap items-end gap-4 w-full md:w-auto shrink-0 justify-between md:justify-end">
          {totalCount === 0 && (
            <button
              onClick={handlePreviewBills}
              disabled={isGenerating}
              className="btn btn-primary px-4 py-2 text-xs font-bold shrink-0"
            >
              {isGenerating ? 'Preparing...' : 'Prepare Bills'}
            </button>
          )}

          <div className="flex items-end ml-auto md:ml-0">
            <BillingMonthSelector
              activeMonth={activeMonth}
              onChange={handleMonthChange}
              label="Billing Cycle"
            />
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Prepare Bills</h3>
                <p className="text-xs text-slate-400 mt-1">Review generation summary before locking.</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Total Houses</p>
                  <p className="text-xl font-bold text-slate-200">{previewData.totalHouses}</p>
                </div>
                <div className="p-4 bg-emerald-900/20 border border-emerald-900/30 rounded-lg">
                  <p className="text-[10px] uppercase text-emerald-400/70 font-bold mb-1">Readings Logged</p>
                  <p className="text-xl font-bold text-emerald-400">{previewData.housesWithWater}</p>
                </div>
                <div className={`p-4 rounded-lg col-span-2 ${previewData.housesMissingWater > 0 ? 'bg-amber-900/20 border border-amber-900/30' : 'bg-slate-800/50'}`}>
                  <p className={`text-[10px] uppercase font-bold mb-1 ${previewData.housesMissingWater > 0 ? 'text-amber-400/70' : 'text-slate-400'}`}>Missing Water Readings</p>
                  <p className={`text-xl font-bold ${previewData.housesMissingWater > 0 ? 'text-amber-400' : 'text-slate-200'}`}>{previewData.housesMissingWater}</p>
                  {previewData.housesMissingWater > 0 && (
                    <p className="text-[10px] text-amber-400/70 mt-1 mt-2 leading-relaxed">
                      ⚠️ These {previewData.housesMissingWater} houses will be billed ₹0 for water. You can manually adjust them next month.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-3">Estimated Projections</p>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-400">Total Maintenance:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(previewData.estimatedMaintenance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-400">Total Water Charges:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(previewData.estimatedWater)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800">
                  <span className="text-slate-300">Grand Total:</span>
                  <span className="font-mono text-indigo-400">{formatCurrency(previewData.estimatedMaintenance + previewData.estimatedWater)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                disabled={isGenerating}
                className="btn border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateBills}
                disabled={isGenerating}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 text-xs font-bold flex items-center gap-2"
              >
                {isGenerating ? 'Generating...' : 'Lock & Generate Bills'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main lists */}
      <div className="space-y-4">
        {/* Status filtering tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
          {(['all', 'unpaid', 'waived', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="py-2.5 px-4 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap shrink-0"
              style={activeTab === tab
                ? { borderColor: '#C56E4D', color: '#C56E4D' }
                : { borderColor: 'transparent', color: '#8C8680' }
              }
            >
              {tab} (
              {tab === 'all'
                ? totalCount
                : tab === 'unpaid'
                  ? unpaidCount
                  : tab === 'waived'
                    ? waivedCount
                    : paidCount}
              )
            </button>
          ))}
        </div>

        {/* Custom Lists display */}
        <div className="space-y-4">
          {filteredBills.length === 0 ? (
            <div className="glass-card p-10 text-center text-xs" style={{ color: '#8C8680' }}>
              No bills found matching search and filters.
            </div>
          ) : (
            (filteredBills || []).map((bill) => {
              // Get badge styles based on exact globals.css tokens
              let badgeBg = 'rgba(183,155,108,0.1)'
              let badgeBorder = 'rgba(183,155,108,0.2)'
              let badgeText = '#B79B6C'

              if (bill.status === 'paid') {
                badgeBg = 'rgba(122,139,116,0.1)'
                badgeBorder = 'rgba(122,139,116,0.2)'
                badgeText = '#5A6855'
              } else if (bill.status === 'overdue') {
                badgeBg = 'rgba(197,110,77,0.1)'
                badgeBorder = 'rgba(197,110,77,0.2)'
                badgeText = '#C56E4D'
              } else if (bill.status === 'draft') {
                badgeBg = 'rgba(140,134,128,0.1)'
                badgeBorder = 'rgba(140,134,128,0.2)'
                badgeText = '#8C8680'
              } else if (bill.status === 'waived') {
                badgeBg = 'rgba(183,155,108,0.1)'
                badgeBorder = 'rgba(183,155,108,0.2)'
                badgeText = '#9E8357'
              }

              const penaltyAmount = Number(bill.penalty_amount || 0)
              const hasAccruedPenalty = penaltyAmount > 0 && !bill.penalty_waived

              return (
                <div key={bill.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm" style={{ color: '#2D2A26' }}>
                        House {bill.house.house_number} ({bill.house.block.name} Wing)
                      </h4>
                      <span className="badge text-[8px] px-1.5 py-0.5" style={{ background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeText }}>
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: '#54504B' }}>
                      Primary Resident: <strong>{bill.house.tenant_name || bill.house.owner_name}</strong>
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: '#8C8680' }}>
                      Invoice: {bill.bill_number || 'Drafting No...'}
                    </p>
                    <p className="text-[10px]" style={{ color: '#54504B' }}>
                      Maint: {formatCurrency(Number(bill.maintenance_amount))} | Water:{' '}
                      {bill.water_units !== null
                        ? `${Number(bill.water_units).toFixed(1)} units (${formatCurrency(
                          Number(bill.water_bill_amount)
                        )})`
                        : 'N/A'}
                    </p>
                    {bill.penalty_waived && (
                      <p className="text-[10px] font-medium" style={{ color: '#9E8357' }}>
                        ✨ Waiver Resolution: "{bill.penalty_waiver_reason || 'N/A'}"
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0" style={{ borderColor: 'rgba(183,155,108,0.1)' }}>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: '#8C8680' }}>Total Payable</p>
                      <p className="text-base font-extrabold mt-0.5" style={{ color: '#2D2A26' }}>
                        {formatCurrency(bill.final_amount ?? 0)}
                      </p>
                      {hasAccruedPenalty && (
                        <p className="text-[9px] font-semibold mt-0.5" style={{ color: '#C56E4D' }}>
                          Includes {formatCurrency(penaltyAmount)} late penalty
                        </p>
                      )}
                    </div>

                    {/* Record Cash Payment Trigger */}
                    {(bill.status === 'pending' || bill.status === 'overdue') && (
                      <button
                        onClick={() => handleOpenPayment(bill)}
                        className="btn btn-sm font-bold"
                        style={{ background: 'rgba(122,139,116,0.08)', color: '#5A6855', border: '1px solid rgba(122,139,116,0.2)' }}
                      >
                        Record Cash Payment
                      </button>
                    )}

                    {/* Waive Penalty Button Trigger */}
                    {hasAccruedPenalty && (
                      <button
                        onClick={() => handleOpenWaiver(bill.id)}
                        className="btn btn-sm"
                        style={{ background: 'rgba(183,155,108,0.08)', color: '#9E8357', border: '1px solid rgba(183,155,108,0.2)' }}
                      >
                        Waive Late Fees
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chairman Waiver Modal Dialog Box */}
      {waiveBillId && (
        <div className="modal-overlay">
          <div className="modal-content glass-card p-6 animate-scale-up space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2D2A26' }}>
                Apply Penalty Waiver
              </h3>
              <button
                onClick={handleCloseWaiver}
                className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: '#8C8680' }}
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: '#8C8680' }}>
              Applying a penalty waiver will reset the dynamic late fees to ₹0.00 and permanently freeze it at 0.00. This requires explicit administrative justification.
            </p>

            {modalError && (
              <div className="p-2.5 text-xs rounded-lg" style={{ background: 'rgba(197,110,77,0.08)', border: '1px solid rgba(197,110,77,0.2)', color: '#C56E4D' }}>
                ❌ {modalError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#54504B' }}>
                Reason for Waiver (Min 5 chars)
              </label>
              <textarea
                placeholder="e.g. resident was travelling abroad and paid immediately upon return."
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                disabled={isPending}
                rows={3}
                className="input text-xs w-full resize-none p-3"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
              <button
                onClick={handleCloseWaiver}
                disabled={isPending}
                className="btn btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWaiver}
                disabled={isPending}
                className="btn btn-primary px-5 py-2 text-xs font-bold"
              >
                {isPending ? 'Waiving...' : 'Approve Waiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Cash Payment Modal */}
      {payBill && (
        <div className="modal-overlay">
          <div className="modal-content glass-card p-6 animate-scale-up space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(122,139,116,0.15)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2D2A26' }}>
                Confirm Cash Payment
              </h3>
              <button
                onClick={handleClosePayment}
                className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: '#8C8680' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(122,139,116,0.05)', border: '1px solid rgba(122,139,116,0.15)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5A6855' }}>Payment Details</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-slate-800">House {payBill.house.house_number}</p>
                    <p className="text-xs text-slate-500">{payBill.house.owner_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold" style={{ color: '#5A6855' }}>
                      {formatCurrency(payBill.final_amount ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: '#8C8680' }}>
                By clicking confirm, you acknowledge that you have received <strong>{formatCurrency(payBill.final_amount ?? 0)}</strong> in cash. This will generate an immutable receipt and permanently mark the bill as paid.
              </p>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs rounded-lg" style={{ background: 'rgba(197,110,77,0.08)', border: '1px solid rgba(197,110,77,0.2)', color: '#C56E4D' }}>
                ❌ {modalError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'rgba(122,139,116,0.15)' }}>
              <button
                onClick={handleClosePayment}
                disabled={paymentPending}
                className="btn btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={paymentPending}
                className="btn px-5 py-2 text-xs font-bold text-white shadow-sm"
                style={{ background: paymentPending ? '#8C8680' : '#5A6855', opacity: paymentPending ? 0.7 : 1 }}
              >
                {paymentPending ? 'Recording...' : 'Confirm Cash Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
