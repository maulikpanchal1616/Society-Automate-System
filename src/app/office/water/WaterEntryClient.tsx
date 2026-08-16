// =============================================================================
// OFFICE COMPONENT — /office/water/WaterEntryClient.tsx
// Seamless single-input form, stateful loaders, and inline overwrite warning banners.
// =============================================================================

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWaterReading } from '@/features/water/actions'
import { formatCurrency } from '@/lib/utils'
import { getActiveBillingMonth } from '@/lib/billing/cycle'
import { BillingMonthSelector } from '@/components/ui/BillingMonthSelector'

interface HouseWithWaterEntry {
  id: string
  house_number: string
  owner_name: string
  tenant_name: string | null
  occupancy_status: string
  water_meter_id: string | null
  block: { id: string; name: string }
  previous_reading: number
  water_entry: {
    id: string
    current_reading: number | null
    units_consumed: any
    unit_price: any
  } | null
}

interface ClientProps {
  houses: HouseWithWaterEntry[]
  activeMonth: string
  recordedCount: number
  totalActive: number
  progressPercent: number
}

export default function WaterEntryClient({
  houses,
  activeMonth,
  recordedCount,
  totalActive,
  progressPercent
}: ClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null)
  const [readingInput, setReadingInput] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleMonthChange = (newMonth: string) => {
    router.push(`/office/water?month=${newMonth}`)
  }

  const handleOpenForm = (houseId: string, currentReading?: number | null) => {
    setEditingHouseId(houseId)
    setReadingInput(currentReading !== undefined && currentReading !== null ? String(currentReading) : '')
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleCloseForm = () => {
    setEditingHouseId(null)
    setReadingInput('')
    setErrorMessage(null)
  }

  const handleSave = async (houseId: string, prevReading: number) => {
    const currentReading = parseFloat(readingInput)
    if (isNaN(currentReading) || currentReading < 0) {
      setErrorMessage('Please enter a valid positive number for current reading.')
      return
    }
    if (currentReading < prevReading) {
      setErrorMessage(`Current reading (${currentReading}) cannot be less than previous (${prevReading}).`)
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    startTransition(async () => {
      const res = await saveWaterReading({
        houseId,
        billingMonthInput: activeMonth,
        currentReading
      })
      if (res.success) {
        const units = currentReading - prevReading
        setSuccessMessage(`Successfully recorded ${units} units (Reading: ${currentReading}).`)
        setEditingHouseId(null)
        setReadingInput('')
        router.refresh()
      } else {
        setErrorMessage(res.error || 'Failed to save water reading.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Month Dropdown & Progress Summary */}
      <div className="glass-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="w-full sm:w-auto flex-1">
            {/* Keeping flex layout balanced */}
          </div>
          <BillingMonthSelector 
            activeMonth={activeMonth} 
            onChange={handleMonthChange}
          />
        </div>

        {/* Progress Bar Display */}
        <div className="mt-4 pt-4 border-t border-slate-200/50">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-semibold text-[#8C8680]">Completion Status</span>
            <span className="text-xs font-bold text-[#C56E4D]">
              {recordedCount} / {totalActive} Houses ({progressPercent}%)
            </span>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-[#C56E4D] to-[#B79B6C] h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inline success / error warnings */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg animate-fade-in">
          ✔️ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg animate-fade-in">
          ❌ {errorMessage}
        </div>
      )}

      {/* House List Card Grid */}
      <div className="space-y-4">
        {(houses || []).map((house) => {
          const isEditing = editingHouseId === house.id
          const hasEntry = house.water_entry !== null
          const residentName = house.tenant_name || house.owner_name

          return (
            <div
              key={house.id}
              className={`glass-card p-4 transition-all duration-300 ${
                isEditing ? 'border-indigo-500 bg-indigo-500/[0.01]' : 'hover:border-slate-700'
              }`}
            >
              {/* Card Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    House {house.house_number}
                    <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800/40">
                      Block {house.block.name}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Occupant: {residentName}</p>
                  {house.water_meter_id && (
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Meter: {house.water_meter_id}</p>
                  )}
                </div>

                {/* Status Badges */}
                {!isEditing && (
                  <div>
                    {hasEntry ? (
                      <div className="text-right">
                        <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5">
                          ✓ {Number(house.water_entry?.current_reading).toFixed(1)} reading
                        </span>
                        <p className="text-[9px] text-slate-400 font-semibold mt-1">
                          {Number(house.water_entry?.units_consumed).toFixed(1)} units used
                        </p>
                      </div>
                    ) : (
                      <span className="badge bg-slate-900 text-slate-400 border border-slate-800 text-[9px] px-2 py-0.5">
                        Pending
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <div className="mt-2 flex items-center justify-between border-t border-slate-800/40 pt-2 text-[10px]">
                   <span className="text-slate-400">Previous Reading:</span>
                   <span className="font-mono text-slate-200 bg-slate-800/50 px-2 py-0.5 rounded">{Number(house.previous_reading || 0).toFixed(1)}</span>
                </div>
              )}

              {/* Inline Reading Recorder Form */}
              {isEditing ? (
                <div className="mt-4 pt-4 border-t border-slate-800/60 animate-fade-in">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    {hasEntry ? 'Overwrite Water Reading' : 'Record Water Reading'}
                  </p>

                  <div className="flex justify-between text-[10px] mb-3 p-2 bg-slate-900 rounded border border-slate-800/60">
                    <span className="text-slate-400">Previous:</span>
                    <span className="font-mono text-slate-200">{Number(house.previous_reading || 0).toFixed(1)}</span>
                  </div>

                  {/* Overwrite Safeguard Warning */}
                  {hasEntry && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded-lg mb-3 leading-relaxed">
                      ⚠️ <strong>Duplicate Reading Warning:</strong> A reading of{' '}
                      <strong>{Number(house.water_entry?.current_reading).toFixed(1)}</strong> already exists.
                      Saving will overwrite this and record an entry change in the system audit logs.
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 2504.5"
                      value={readingInput}
                      onChange={(e) => setReadingInput(e.target.value)}
                      disabled={isPending}
                      className="input text-xs bg-slate-900 border-slate-800 text-slate-100 flex-1 max-w-[200px]"
                    />
                    <button
                      onClick={() => handleSave(house.id, house.previous_reading)}
                      disabled={isPending}
                      className="btn btn-primary px-4 py-2 text-xs font-semibold"
                    >
                      {isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCloseForm}
                      disabled={isPending}
                      className="btn btn-secondary px-4 py-2 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit / Enter Triggers */
                <div className="flex justify-end pt-3 border-t border-slate-800/40 mt-3 text-xs">
                  {hasEntry ? (
                    <button
                      onClick={() => handleOpenForm(house.id, house.water_entry?.current_reading)}
                      className="text-slate-400 hover:text-indigo-400 transition-colors font-medium text-[11px]"
                    >
                      Edit Reading &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenForm(house.id)}
                      className="btn btn-primary px-4 py-1.5 text-[10px] font-semibold"
                    >
                      Record Reading
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
