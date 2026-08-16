// =============================================================================
// OFFICE COMPONENT — /office/billing/BillingDashboardClient.tsx
// Renders active month picker, summary metrics, actionable transitions, & lists.
// =============================================================================

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  status: any
  house: {
    id: string
    house_number: string
    block: { id: string; name: string }
  }
}

interface ClientProps {
  bills: BillItem[]
  activeMonth: string
  totalCount: number
  draftCount: number
  pendingCount: number
  paidCount: number
  overdueCount: number
  totalExpectedAmount: number
}

export default function BillingDashboardClient({
  bills,
  activeMonth,
  totalCount,
  draftCount,
  pendingCount,
  paidCount,
  overdueCount,
  totalExpectedAmount
}: ClientProps) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'unpaid' | 'paid'>('all')

  const handleMonthChange = (newMonth: string) => {
    router.push(`/office/billing?month=${newMonth}`)
  }

  // Filter bills by tab
  const filteredBills = bills.filter((b) => {
    if (activeTab === 'draft') return b.status === 'draft'
    if (activeTab === 'unpaid') return b.status === 'pending' || b.status === 'overdue'
    if (activeTab === 'paid') return b.status === 'paid'
    return true
  })

  return (
    <div className="space-y-6">
      {/* 1. Month Picker selector */}
      <div className="glass-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            {/* Keeping flex layout balanced */}
          </div>
          <BillingMonthSelector 
            activeMonth={activeMonth} 
            onChange={handleMonthChange}
          />
        </div>
      </div>

      {/* Aggregate Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Expected</p>
          <p className="text-lg font-extrabold text-slate-100 mt-1">
            {formatCurrency(totalExpectedAmount)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unpublished Drafts</p>
          <p className="text-lg font-extrabold text-yellow-400 mt-1">{draftCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pending / Overdue</p>
          <p className="text-lg font-extrabold text-rose-400 mt-1">{pendingCount + overdueCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Paid / Settled</p>
          <p className="text-lg font-extrabold text-emerald-400 mt-1">{paidCount}</p>
        </div>
      </div>

      {/* Error & Success display notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg animate-fade-in">
          ✔️ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg animate-fade-in">
          ❌ {errorMessage}
        </div>
      )}


      {/* Tab Filter & Invoice Records Table */}
      {/* 2. Main List with Status Tabs */}
      {totalCount > 0 && (
        <div className="space-y-4">
          <div className="flex overflow-x-auto hide-scrollbar border-b" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
            {(['all', 'draft', 'unpaid', 'paid'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="py-2.5 px-4 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap shrink-0"
                style={activeTab === tab
                  ? { borderColor: '#B79B6C', color: '#B79B6C' }
                  : { borderColor: 'transparent', color: '#8C8680' }
                }
              >
                {tab} (
                {tab === 'all'
                  ? totalCount
                  : tab === 'draft'
                  ? draftCount
                  : tab === 'unpaid'
                  ? pendingCount + overdueCount
                  : paidCount}
                )
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredBills.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-500 text-xs">
                No invoices found in this filtered category.
              </div>
            ) : (
              (filteredBills || []).map((bill) => {
                let badgeClass = 'badge-pending'
                if (bill.status === 'paid') badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                else if (bill.status === 'overdue') badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                else if (bill.status === 'draft') badgeClass = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'

                return (
                  <div key={bill.id} className="glass-card p-4 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-200">
                        House {bill.house.house_number} ({bill.house.block.name} Wing)
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {bill.bill_number || 'Drafting No...'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        Maint: {formatCurrency(Number(bill.maintenance_amount))} | Water:{' '}
                        {bill.water_units !== null ? `${Number(bill.water_units).toFixed(1)} units` : 'N/A'}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`badge ${badgeClass} text-[8px] px-1.5 py-0.5`}>
                        {bill.status}
                      </span>
                      <p className="font-extrabold text-slate-200 text-sm">
                        {formatCurrency(bill.final_amount ?? 0)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
