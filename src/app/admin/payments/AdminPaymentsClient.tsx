'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { BillingMonthSelector } from '@/components/ui/BillingMonthSelector'
import { recordCashPayment } from '@/features/payments/actions'

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
  totalExpectedAmount: number
}

export default function AdminPaymentsClient({
  bills,
  activeMonth,
  totalCount,
  unpaidCount,
  paidCount,
  totalExpectedAmount
}: ClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid')
  
  // Payment Modal State
  const [payBill, setPayBill] = useState<BillItem | null>(null)
  const [isPending, startPaymentTransition] = useTransition()
  const [modalError, setModalError] = useState<string | null>(null)
  
  // Success State
  const [successReceiptId, setSuccessReceiptId] = useState<string | null>(null)

  const handleMonthChange = (newMonth: string) => {
    router.push(`/admin/payments?month=${newMonth}`)
    setSuccessReceiptId(null)
  }

  const handleRecordPayment = async () => {
    if (!payBill) return

    setModalError(null)
    startPaymentTransition(async () => {
      const formData = new FormData()
      formData.append('billId', payBill.id)
      formData.append('expectedAmount', (payBill.final_amount ?? 0).toString())
      
      const res = await recordCashPayment(formData)
      if (res.success) {
        setSuccessReceiptId(res.data.receiptId)
        setPayBill(null)
        router.refresh()
      } else {
        setModalError(res.error || 'Failed to record payment.')
      }
    })
  }

  const filteredBills = bills.filter((b) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      b.house.house_number.toLowerCase().includes(searchLower) ||
      b.house.owner_name.toLowerCase().includes(searchLower) ||
      (b.house.tenant_name && b.house.tenant_name.toLowerCase().includes(searchLower)) ||
      (b.bill_number && b.bill_number.toLowerCase().includes(searchLower))

    if (!matchesSearch) return false

    if (activeTab === 'unpaid') return b.status === 'pending' || b.status === 'overdue'
    if (activeTab === 'paid') return b.status === 'paid'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Billing Cycle</h2>
            <p className="text-xs text-slate-400 mt-1">Select month to manage payments</p>
          </div>
          <BillingMonthSelector activeMonth={activeMonth} onChange={handleMonthChange} />
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#C56E4D' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Expected Dues</p>
          <p className="text-2xl font-bold" style={{ color: '#C56E4D' }}>
            {formatCurrency(totalExpectedAmount)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>{unpaidCount} Pending Invoices</p>
        </div>
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#7A8B74' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Cleared Payments</p>
          <p className="text-2xl font-bold" style={{ color: '#7A8B74' }}>{paidCount}</p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>Fully paid this cycle</p>
        </div>
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#54504B' }} />
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Total Invoices</p>
          <p className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{totalCount}</p>
          <p className="text-[10px] mt-1" style={{ color: '#8C8680' }}>Generated this cycle</p>
        </div>
      </div>

      {/* Success Notification & Receipt Download */}
      {successReceiptId && (
        <div className="glass-card p-6 border border-emerald-500/30 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-emerald-500/50 flex items-center justify-center text-xs">✓</span>
                Payment Recorded Successfully!
              </h3>
              <p className="text-xs text-slate-400 mt-1 pl-7">
                The cash receipt has been generated and the bill is marked as paid.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <a 
                href={`/api/pdf/${successReceiptId}`}
                target="_blank"
                rel="noreferrer"
                className="btn glass-card text-xs hover:text-emerald-300"
              >
                👁️ View Receipt
              </a>
              <a 
                href={`/api/pdf/${successReceiptId}?download=true`}
                className="btn bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs hover:bg-emerald-500/20"
              >
                ⬇️ Download
              </a>
              <button 
                onClick={() => setSuccessReceiptId(null)}
                className="btn glass-card text-xs text-slate-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tools & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8C8680' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input !pl-10 text-sm w-full"
            placeholder="Search house, owner, or bill number..."
          />
        </div>
      </div>

      {/* Tabs & List */}
      {totalCount > 0 ? (
        <div className="space-y-4">
          <div className="flex overflow-x-auto hide-scrollbar border-b" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`py-2.5 px-4 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap shrink-0 ${
                activeTab === 'unpaid' ? 'border-[#C56E4D] text-[#C56E4D]' : 'border-transparent text-[#8C8680]'
              }`}
            >
              Unpaid ({unpaidCount})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`py-2.5 px-4 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap shrink-0 ${
                activeTab === 'paid' ? 'border-[#7A8B74] text-[#7A8B74]' : 'border-transparent text-[#8C8680]'
              }`}
            >
              Paid ({paidCount})
            </button>
          </div>

          <div className="space-y-3">
            {filteredBills.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-500 text-xs">
                No invoices found in this category.
              </div>
            ) : (
              (filteredBills || []).map((bill) => {
                let badgeClass = 'badge-pending'
                if (bill.status === 'paid') badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                else if (bill.status === 'overdue') badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'

                return (
                  <div key={bill.id} className="glass-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-200 text-sm">
                          House {bill.house.house_number}
                        </h4>
                        <span className={`badge ${badgeClass} text-[8px] px-1.5 py-0.5`}>
                          {bill.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {bill.bill_number || 'Pending Assignment'} • {bill.house.owner_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Maint: {formatCurrency(Number(bill.maintenance_amount))} 
                        {bill.water_bill_amount ? ` | Water: ${formatCurrency(Number(bill.water_bill_amount))}` : ''}
                        {bill.penalty_amount ? ` | Penalty: ${formatCurrency(Number(bill.penalty_amount))}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="font-extrabold text-slate-200 text-base">
                          {formatCurrency(bill.final_amount ?? 0)}
                        </p>
                        <p className="text-[8px] uppercase text-slate-500">Total Payable</p>
                      </div>
                      
                      {activeTab === 'unpaid' && (
                        <button
                          onClick={() => setPayBill(bill)}
                          className="btn btn-primary text-xs py-1.5 px-4"
                        >
                          Collect Cash
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-lg font-bold text-slate-200">No Bills Found</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto">
            There are no generated bills for this month yet. Check back later or ask the Chairman to finalize the drafts.
          </p>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {payBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 overflow-hidden relative">
            <h3 className="text-lg font-bold text-[#2D2A26] border-b border-slate-200/50 pb-3 mb-4">
              Confirm Cash Collection
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Resident</span>
                <span className="font-semibold text-slate-200">{payBill.house.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">House Number</span>
                <span className="font-semibold text-slate-200">{payBill.house.house_number} ({payBill.house.block.name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Cycle</span>
                <span className="font-semibold text-slate-200">
                  {new Date(payBill.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </span>
              </div>
              
              <div className="my-4 border-t border-slate-800/50 pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Maintenance Base</span>
                  <span className="text-slate-300">{formatCurrency(payBill.maintenance_amount)}</span>
                </div>
                {payBill.water_bill_amount && payBill.water_bill_amount > 0 ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Water Consumption</span>
                    <span className="text-slate-300">{formatCurrency(payBill.water_bill_amount)}</span>
                  </div>
                ) : null}
                {payBill.penalty_amount && payBill.penalty_amount > 0 ? (
                  <div className="flex justify-between text-xs text-rose-400/80">
                    <span>Late Payment Penalty</span>
                    <span>{formatCurrency(payBill.penalty_amount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800 mt-2">
                <span className="text-slate-300 font-semibold">Total Collection Due</span>
                <span className="text-xl font-extrabold text-indigo-400">
                  {formatCurrency(payBill.final_amount ?? 0)}
                </span>
              </div>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setPayBill(null)
                  setModalError(null)
                }}
                className="btn glass-card text-xs px-4"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="btn btn-primary text-xs px-6"
                disabled={isPending}
              >
                {isPending ? (
                  <><span className="spinner" /> Recording...</>
                ) : (
                  'Confirm & Generate Receipt'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
