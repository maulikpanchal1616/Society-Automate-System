'use client'

// =============================================================================
// HOUSE FORM — Shared create/edit form component
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createHouse, updateHouse } from '@/features/residents/actions'
import { PageHeader, EmptyState, AlertBanner, FormError } from '@/components/ui/PageUI'
import { CustomSelect } from '@/components/ui/CustomSelect'
import type { Block, House } from '@/types/database'

interface Props {
  blocks: Block[]
  mode: 'create'
  house?: never
  redirectBase?: string
}
interface EditProps {
  blocks: Block[]
  mode: 'edit'
  house: House
  redirectBase?: string
}

export default function HouseForm({ blocks, mode, house, redirectBase = '/admin/residents' }: Props | EditProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [blockId, setBlockId] = useState(house?.block_id ?? blocks[0]?.id ?? '')
  const [houseNumber, setHouseNumber] = useState(
    mode === 'edit' ? (house.house_number.includes('-') ? house.house_number.split('-').slice(1).join('-') : house.house_number) : ''
  )
  const [floor, setFloor] = useState(house?.floor !== null && house?.floor !== undefined ? String(house.floor) : '')
  const [occupancy, setOccupancy] = useState<'owner_occupied' | 'tenant_occupied' | 'vacant'>(
    house?.occupancy_status ?? 'owner_occupied'
  )
  const [ownerName, setOwnerName] = useState(house?.owner_name ?? '')
  const [ownerPhone, setOwnerPhone] = useState(house?.owner_phone ?? '')
  const [ownerEmail, setOwnerEmail] = useState(house?.owner_email ?? '')
  const [tenantName, setTenantName] = useState(house?.tenant_name ?? '')
  const [tenantPhone, setTenantPhone] = useState(house?.tenant_phone ?? '')
  const [primaryPhone, setPrimaryPhone] = useState(house?.primary_contact_phone ?? '')
  const [waterMeterId, setWaterMeterId] = useState(house?.water_meter_id ?? '')
  const [isActive, setIsActive] = useState(house?.is_active ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleOwnerPhoneChange(val: string) {
    setOwnerPhone(val)
    if (occupancy !== 'tenant_occupied' && !primaryPhone) {
      setPrimaryPhone(val)
    }
  }

  function handleOccupancyChange(val: typeof occupancy) {
    setOccupancy(val)
    if (val !== 'tenant_occupied') {
      setTenantName('')
      setTenantPhone('')
      if (ownerPhone) setPrimaryPhone(ownerPhone)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAlert(null)
    setErrors({})

    const payload = {
      block_id: blockId,
      house_number: houseNumber.trim(),
      floor: floor ? parseInt(floor) : null,
      occupancy_status: occupancy,
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.replace(/\s/g, ''),
      owner_email: ownerEmail.trim(),
      tenant_name: tenantName.trim(),
      tenant_phone: tenantPhone.replace(/\s/g, ''),
      primary_contact_phone: primaryPhone.replace(/\s/g, ''),
      water_meter_id: waterMeterId.trim(),
      is_active: isActive,
    }

    startTransition(async () => {
      const result = mode === 'create'
        ? await createHouse(payload)
        : await updateHouse({ ...payload, id: house!.id })

      if (result.success) {
        if (mode === 'create') {
          router.push(`${redirectBase}/${result.data.id}`)
        } else {
          setAlert({ type: 'success', message: 'House updated successfully.' })
        }
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  const selectedBlock = blocks.find((b) => b.id === blockId)

  const occupancyOptions = [
    { value: 'owner_occupied' as const, label: 'Owner', icon: '🏠' },
    { value: 'tenant_occupied' as const, label: 'Tenant', icon: '🔑' },
    { value: 'vacant' as const, label: 'Vacant', icon: '📭' },
  ]

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* ── House Details ── */}
      <div>
        <p className="form-section-title">House Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Block / Wing</label>
            <CustomSelect
              className="w-full bg-white"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              options={(blocks || []).map(b => ({ value: b.id, label: `${b.name} Block` }))}
            />
          </div>
          <div>
            <label className="label">House / Flat Number</label>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono shrink-0" style={{ color: '#8C8680' }}>
                {selectedBlock?.name}-
              </span>
              <input
                className="input flex-1 font-mono uppercase"
                placeholder="101"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value.toUpperCase())}
                required
              />
            </div>
            <p className="text-xs mt-1" style={{ color: '#8C8680' }}>
              Saved as <span className="font-mono" style={{ color: '#C56E4D' }}>{selectedBlock?.name}-{houseNumber || '101'}</span>
            </p>
            <FormError message={errors.house_number} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Floor (optional)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="99"
              placeholder="e.g. 1"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Water Meter ID (optional)</label>
            <input
              className="input"
              placeholder="e.g. WM-A101"
              value={waterMeterId}
              onChange={(e) => setWaterMeterId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Occupancy ── */}
      <div>
        <label className="label">Occupancy Status</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(occupancyOptions || []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleOccupancyChange(opt.value)}
              className="py-2.5 rounded-xl text-sm font-medium transition-all text-center"
              style={occupancy === opt.value
                ? { background: 'rgba(197,110,77,0.1)', border: '1px solid rgba(197,110,77,0.3)', color: '#C56E4D' }
                : { border: '1px solid rgba(183,155,108,0.15)', color: '#8C8680' }
              }
            >
              <span className="block text-lg mb-0.5">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Owner Details ── */}
      <div>
        <p className="form-section-title">Owner Details</p>
        <div className="space-y-3">
          <div>
            <label className="label">Owner Full Name</label>
            <input
              className="input"
              placeholder="Ramesh Patel"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
            <FormError message={errors.owner_name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Owner Phone</label>
              <div className="flex gap-1">
                <span className="phone-prefix">+91</span>
                <input
                  className="input flex-1 font-mono"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={ownerPhone}
                  onChange={(e) => handleOwnerPhoneChange(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <FormError message={errors.owner_phone} />
            </div>
            <div>
              <label className="label">Owner Email (optional)</label>
              <input
                className="input"
                type="email"
                placeholder="owner@email.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tenant Details (conditional) ── */}
      {occupancy === 'tenant_occupied' && (
        <div>
          <p className="form-section-title">Tenant Details</p>
          <div className="space-y-3 rounded-xl p-4" style={{ border: '1px solid rgba(183,155,108,0.2)', background: 'rgba(183,155,108,0.04)' }}>
            <div>
              <label className="label">Tenant Full Name</label>
              <input
                className="input"
                placeholder="Suresh Shah"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
              <FormError message={errors.tenant_name} />
            </div>
            <div>
              <label className="label">Tenant Phone</label>
              <div className="flex gap-1">
                <span className="phone-prefix">+91</span>
                <input
                  className="input flex-1 font-mono"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <FormError message={errors.tenant_phone} />
            </div>
          </div>
        </div>
      )}

      {/* ── Primary Contact ── */}
      <div>
        <label className="label">Primary Contact Phone (for billing)</label>
        <p className="text-xs mb-2" style={{ color: '#8C8680' }}>
          This number receives bills and payment reminders.
        </p>
        <div className="flex gap-1">
          <span className="phone-prefix">+91</span>
          <input
            className="input flex-1 font-mono"
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={primaryPhone}
            onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>
        <div className="flex gap-3 mt-2">
          {ownerPhone && (
            <button
              type="button"
              onClick={() => setPrimaryPhone(ownerPhone)}
              className="text-xs font-medium transition-colors"
              style={{ color: '#C56E4D' }}
            >
              Use owner&apos;s phone
            </button>
          )}
          {occupancy === 'tenant_occupied' && tenantPhone && (
            <button
              type="button"
              onClick={() => setPrimaryPhone(tenantPhone)}
              className="text-xs font-medium transition-colors"
              style={{ color: '#B79B6C' }}
            >
              Use tenant&apos;s phone
            </button>
          )}
        </div>
        <FormError message={errors.primary_contact_phone} />
      </div>

      {/* ── Active Status (edit only) ── */}
      {mode === 'edit' && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: '#C56E4D' }}
          />
          <label htmlFor="is_active" className="text-sm" style={{ color: '#54504B' }}>
            House is active (uncheck to deactivate)
          </label>
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? (
          <><span className="spinner" />
          {mode === 'create' ? 'Creating House...' : 'Saving Changes...'}</>
        ) : mode === 'create' ? 'Create House' : 'Save Changes'}
      </button>
    </form>
  )
}
