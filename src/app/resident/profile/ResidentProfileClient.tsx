'use client'

// =============================================================================
// RESIDENT COMPONENT — /resident/profile/ResidentProfileClient.tsx
// Interactive profile editor: display name, phone, change password.
// Premium card-based layout, mobile-first.
// =============================================================================

import { useState, useTransition } from 'react'
import {
  updateResidentName,
  updateResidentPhone,
  changeResidentPassword,
} from '@/features/auth/profileActions'

interface ProfileProps {
  profile: {
    id: string
    full_name: string | null
    phone: string | null
    email: string | null
    house_id: string | null
  }
  house: {
    house_number: string
    owner_name: string
    occupancy_status: string
    primary_contact_phone: string
    floor: number | null
    block: { name: string }
  } | null
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
function InlineToast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in"
      style={
        type === 'success'
          ? {
              background: 'rgba(122,139,116,0.08)',
              border: '1px solid rgba(122,139,116,0.2)',
              color: '#5A6855',
            }
          : {
              background: 'rgba(197,110,77,0.08)',
              border: '1px solid rgba(197,110,77,0.2)',
              color: '#C56E4D',
            }
      }
    >
      <span className="text-base">{type === 'success' ? '✓' : '✕'}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-xs opacity-60 hover:opacity-100 transition-opacity">
        ✕
      </button>
    </div>
  )
}

// ─── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div
        className="px-5 py-3.5 border-b flex items-center gap-2"
        style={{ borderColor: 'rgba(183,155,108,0.12)' }}
      >
        <span className="text-base">{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#54504B' }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function ResidentProfileClient({ profile, house }: ProfileProps) {
  // ── Name edit state ──────────────────────────────────────────────────────────
  const [nameValue, setNameValue] = useState(profile.full_name ?? '')
  const [nameEditing, setNameEditing] = useState(false)
  const [namePending, startNameTransition] = useTransition()
  const [nameToast, setNameToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Phone edit state ─────────────────────────────────────────────────────────
  const [phoneValue, setPhoneValue] = useState(profile.phone ?? '')
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [phonePending, startPhoneTransition] = useTransition()
  const [phoneToast, setPhoneToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Password change state ────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwPending, startPwTransition] = useTransition()
  const [pwToast, setPwToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleNameSave() {
    startNameTransition(async () => {
      const res = await updateResidentName(nameValue)
      if (res.success) {
        setNameToast({ msg: 'Name updated successfully.', type: 'success' })
        setNameEditing(false)
      } else {
        setNameToast({ msg: res.error || 'Failed to update name.', type: 'error' })
      }
    })
  }

  function handlePhoneSave() {
    startPhoneTransition(async () => {
      const res = await updateResidentPhone(phoneValue)
      if (res.success) {
        setPhoneToast({ msg: 'Phone updated successfully.', type: 'success' })
        setPhoneEditing(false)
      } else {
        setPhoneToast({ msg: res.error || 'Failed to update phone.', type: 'error' })
      }
    })
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwToast(null)
    startPwTransition(async () => {
      const res = await changeResidentPassword(newPassword, confirmPassword)
      if (res.success) {
        setPwToast({ msg: 'Password changed successfully. Please use your new password next time.', type: 'success' })
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwToast({ msg: res.error || 'Failed to change password.', type: 'error' })
      }
    })
  }

  const OCCUPANCY_LABELS: Record<string, string> = {
    owner_occupied: 'Owner Occupied',
    tenant_occupied: 'Tenant Occupied',
    vacant: 'Vacant',
  }

  return (
    <div className="space-y-5">
      {/* ── Avatar + Name Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-1">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #C56E4D, #B79B6C)' }}
        >
          {(profile.full_name?.[0] ?? 'R').toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: '#2D2A26' }}>
            {profile.full_name ?? 'Resident'}
          </p>
          <p className="text-xs font-semibold" style={{ color: '#C56E4D' }}>
            Resident · Shyamved Residency
          </p>
          {house && (
            <p className="text-xs mt-0.5" style={{ color: '#8C8680' }}>
              House {house.house_number}, {house.block.name} Wing
            </p>
          )}
        </div>
      </div>

      {/* ── House Information (read-only) ───────────────────────────────────── */}
      {house && (
        <SectionCard title="House Details" icon="🏠">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'House No.', value: house.house_number },
              { label: 'Block', value: `${house.block.name} Wing` },
              { label: 'Floor', value: house.floor !== null ? `Floor ${house.floor}` : 'Ground' },
              { label: 'Occupancy', value: OCCUPANCY_LABELS[house.occupancy_status] ?? house.occupancy_status },
              { label: 'Owner', value: house.owner_name },
              { label: 'Contact', value: house.primary_contact_phone },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#8C8680' }}>
                  {label}
                </p>
                <p className="text-sm font-semibold" style={{ color: '#2D2A26' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Account Info ────────────────────────────────────────────────────── */}
      <SectionCard title="Account Information" icon="👤">
        <div className="space-y-5">
          {/* Email — read-only */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>
              Email Address
            </p>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(84,80,75,0.04)', border: '1px solid rgba(84,80,75,0.1)' }}
            >
              <span className="text-sm" style={{ color: '#2D2A26' }}>{profile.email ?? '—'}</span>
              <span
                className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(122,139,116,0.1)', color: '#5A6855' }}
              >
                Read-only
              </span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>
              Display Name
            </p>
            {nameToast && (
              <div className="mb-2">
                <InlineToast message={nameToast.msg} type={nameToast.type} onClose={() => setNameToast(null)} />
              </div>
            )}
            {nameEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="input text-sm flex-1"
                  placeholder="Your full name"
                  maxLength={80}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  disabled={namePending}
                  className="btn btn-primary text-xs px-4 py-2 shrink-0"
                >
                  {namePending ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => { setNameEditing(false); setNameValue(profile.full_name ?? '') }}
                  disabled={namePending}
                  className="btn btn-secondary text-xs px-3 py-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(183,155,108,0.06)', border: '1px solid rgba(183,155,108,0.15)' }}
                onClick={() => setNameEditing(true)}
              >
                <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>
                  {profile.full_name ?? 'Not set'}
                </span>
                <span className="text-xs font-semibold" style={{ color: '#C56E4D' }}>Edit ✏️</span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>
              Mobile Number
            </p>
            {phoneToast && (
              <div className="mb-2">
                <InlineToast message={phoneToast.msg} type={phoneToast.type} onClose={() => setPhoneToast(null)} />
              </div>
            )}
            {phoneEditing ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  className="input text-sm flex-1"
                  placeholder="+91 98765 43210"
                  maxLength={13}
                  autoFocus
                />
                <button
                  onClick={handlePhoneSave}
                  disabled={phonePending}
                  className="btn btn-primary text-xs px-4 py-2 shrink-0"
                >
                  {phonePending ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => { setPhoneEditing(false); setPhoneValue(profile.phone ?? '') }}
                  disabled={phonePending}
                  className="btn btn-secondary text-xs px-3 py-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(183,155,108,0.06)', border: '1px solid rgba(183,155,108,0.15)' }}
                onClick={() => setPhoneEditing(true)}
              >
                <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>
                  {profile.phone ?? 'Not set — tap to add'}
                </span>
                <span className="text-xs font-semibold" style={{ color: '#C56E4D' }}>Edit ✏️</span>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Change Password ──────────────────────────────────────────────────── */}
      <SectionCard title="Security" icon="🔐">
        {pwToast && (
          <div className="mb-4">
            <InlineToast message={pwToast.msg} type={pwToast.type} onClose={() => setPwToast(null)} />
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: '#8C8680' }}>
            Set a new password for your account. Must be at least 6 characters.
          </p>

          {/* New Password */}
          <div>
            <label className="label text-[10px]" htmlFor="new-pw">New Password</label>
            <div className="relative">
              <input
                id="new-pw"
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input w-full pr-10 text-sm"
                placeholder="Minimum 6 characters"
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label text-[10px]" htmlFor="confirm-pw">Confirm Password</label>
            <div className="relative">
              <input
                id="confirm-pw"
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full pr-10 text-sm"
                placeholder="Re-enter password"
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPw ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Strength hint */}
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs mt-1 font-medium" style={{ color: '#C56E4D' }}>
                ✕ Passwords do not match
              </p>
            )}
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs mt-1 font-medium" style={{ color: '#5A6855' }}>
                ✓ Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwPending || newPassword.length < 6 || newPassword !== confirmPassword}
            className="btn btn-primary w-full py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {pwPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner w-4 h-4" /> Updating…
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </SectionCard>

      {/* ── Account Meta ────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 rounded-2xl text-center"
        style={{ background: 'rgba(183,155,108,0.04)', border: '1px solid rgba(183,155,108,0.1)' }}
      >
        <p className="text-[10px] font-semibold" style={{ color: '#8C8680' }}>
          Shyamved Residency · Society Management Portal
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: '#8C8680' }}>
          Account ID: {profile.id.slice(0, 8)}…
        </p>
      </div>
    </div>
  )
}
