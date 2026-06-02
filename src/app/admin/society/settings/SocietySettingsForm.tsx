'use client'

import { useState, useTransition } from 'react'
import { updateSocietySettings } from '@/features/society/actions'
import { AlertBanner, FormError } from '@/components/ui/PageUI'
import { formatCurrency } from '@/lib/utils'
import type { Society } from '@/types/database'

interface Props { society: Society }

export default function SocietySettingsForm({ society }: Props) {
  const [isPending, startTransition] = useTransition()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Controlled fields
  const [name, setName] = useState(society.name)
  const [address, setAddress] = useState(society.address ?? '')
  const [maintenance, setMaintenance] = useState(String(society.maintenance_amount))
  const [windowStart, setWindowStart] = useState(String(society.payment_window_start))
  const [windowEnd, setWindowEnd] = useState(String(society.payment_window_end))
  const [penalty, setPenalty] = useState(String(society.penalty_per_day))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAlert(null)
    setErrors({})

    startTransition(async () => {
      const result = await updateSocietySettings({
        name: name.trim(),
        address: address.trim(),
        maintenance_amount: parseFloat(maintenance),
        payment_window_start: parseInt(windowStart),
        payment_window_end: parseInt(windowEnd),
        penalty_per_day: parseFloat(penalty),
      })

      if (result.success) {
        setAlert({ type: 'success', message: 'Society settings updated successfully.' })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* Society Name */}
      <div>
        <label className="label">Society Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Shyamved Residency"
          required
        />
        <FormError message={errors.name} />
      </div>

      {/* Address */}
      <div>
        <label className="label">Address</label>
        <textarea
          className="input resize-none"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Naroda, Ahmedabad, Gujarat - 382330"
        />
      </div>

      {/* Maintenance Amount */}
      <div>
        <label className="label">Monthly Maintenance (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#8C8680' }}>₹</span>
          <input
            className="input !pl-9"
            type="number"
            min="0"
            step="0.01"
            value={maintenance}
            onChange={(e) => setMaintenance(e.target.value)}
            required
          />
        </div>
        <p className="text-xs mt-1" style={{ color: '#8C8680' }}>
          Current: {formatCurrency(society.maintenance_amount)} / month per house
        </p>
        <FormError message={errors.maintenance_amount} />
      </div>

      {/* Payment Window */}
      <div>
        <label className="label">Payment Window (day of month)</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8C8680' }}>Start Day</label>
            <input
              className="input"
              type="number"
              min="1"
              max="28"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8C8680' }}>End Day (due date)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="28"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              required
            />
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: '#8C8680' }}>
          Residents can pay between day {windowStart} and day {windowEnd} of each month without penalty.
        </p>
        <FormError message={errors.payment_window_end} />
      </div>

      {/* Penalty per Day */}
      <div>
        <label className="label">Late Penalty (₹ / day after due date)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#8C8680' }}>₹</span>
          <input
            className="input !pl-9"
            type="number"
            min="0"
            step="0.01"
            value={penalty}
            onChange={(e) => setPenalty(e.target.value)}
            required
          />
        </div>
        <FormError message={errors.penalty_per_day} />
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? (
          <><span className="spinner" /> Saving...</>
        ) : 'Save Settings'}
      </button>
    </form>
  )
}
