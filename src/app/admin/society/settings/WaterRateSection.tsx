'use client'

import { useState, useTransition } from 'react'
import { createWaterRate } from '@/features/society/actions'
import { AlertBanner, FormError, EmptyState } from '@/components/ui/PageUI'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { WaterRate } from '@/types/database'

interface Props {
  activeRate: WaterRate | null
  history: WaterRate[]
}

export default function WaterRateSection({ activeRate, history }: Props) {
  const [isPending, startTransition] = useTransition()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [price, setPrice] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAlert(null)

    startTransition(async () => {
      const result = await createWaterRate({
        price_per_unit: parseFloat(price),
        effective_from: effectiveFrom,
      })

      if (result.success) {
        setAlert({ type: 'success', message: 'New water rate activated successfully.' })
        setShowForm(false)
        setPrice('')
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="glass-card p-6">
      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* Active Rate */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>Current Active Rate</p>
          {activeRate ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: '#7A8B74' }}>
                {formatCurrency(activeRate.price_per_unit)}
              </span>
              <span className="text-sm" style={{ color: '#8C8680' }}>per unit</span>
            </div>
          ) : (
            <span className="text-sm font-medium" style={{ color: '#9E8357' }}>⚠ No active rate set</span>
          )}
          {activeRate && (
            <p className="text-xs mt-1" style={{ color: '#8C8680' }}>
              Effective from {formatDate(activeRate.effective_from)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn btn-secondary text-sm"
        >
          {showForm ? 'Cancel' : '+ New Rate'}
        </button>
      </div>

      {/* New Rate Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-5 space-y-4" style={{ borderColor: 'rgba(183,155,108,0.2)', background: 'rgba(183,155,108,0.04)' }}>
          <p className="text-sm font-medium" style={{ color: '#2D2A26' }}>Set New Water Rate</p>
          <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#9E8357', background: 'rgba(183,155,108,0.08)', border: '1px solid rgba(183,155,108,0.2)' }}>
            ⚠ Setting a new rate will automatically close the current active rate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Price per Unit (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#8C8680' }}>₹</span>
                <input
                  className="input pl-7"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="3.50"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Effective From</label>
              <input
                className="input"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary w-full text-sm">
            {isPending ? (
              <><span className="spinner" /> Saving...</>
            ) : 'Activate New Rate'}
          </button>
        </form>
      )}

      {/* Rate History */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#8C8680' }}>Rate History</p>
        {history.length === 0 ? (
          <EmptyState icon="💧" title="No water rates configured" description="Add the first water rate above." />
        ) : (
          <div className="space-y-2">
            {(history || []).map((rate) => (
              <div key={rate.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border" style={{ borderColor: 'rgba(183,155,108,0.15)', background: 'rgba(255,255,255,0.4)' }}>
                <div>
                  <span className="font-semibold" style={{ color: '#2D2A26' }}>{formatCurrency(rate.price_per_unit)}/unit</span>
                  <span className="text-xs ml-2" style={{ color: '#8C8680' }}>
                    From {formatDate(rate.effective_from)}
                    {rate.effective_to ? ` → ${formatDate(rate.effective_to)}` : ''}
                  </span>
                </div>
                {rate.effective_to === null ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider" style={{ color: '#5A6855', background: 'rgba(122,139,116,0.1)', borderColor: 'rgba(122,139,116,0.2)' }}>
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: '#8C8680' }}>Closed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
