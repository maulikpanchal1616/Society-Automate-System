'use client'

// =============================================================================
// FAMILY MEMBERS SECTION — shown on house detail page
// Now includes "Grant App Access" and "Revoke Access" flows.
// =============================================================================

import { useState, useTransition } from 'react'
import {
  createFamilyMember,
  deleteFamilyMember,
  setPrimaryContact,
  grantAppAccess,
  revokeAppAccess,
  adminResetResidentPassword,
} from '@/features/residents/actions'
import { AlertBanner, EmptyState } from '@/components/ui/PageUI'
import { formatPhone } from '@/lib/utils'
import type { HouseWithDetails, FamilyMemberWithAccess } from '@/features/residents/queries'

interface Props { house: HouseWithDetails }

export default function FamilyMembersSection({ house }: Props) {
  const [isPending, startTransition] = useTransition()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  // New member form state
  const [fullName, setFullName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)

  // Grant access modal state
  const [grantTarget, setGrantTarget] = useState<FamilyMemberWithAccess | null>(null)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantPassword, setGrantPassword] = useState('')
  const [grantResult, setGrantResult] = useState<{ email: string; password: string } | null>(null)

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<FamilyMemberWithAccess | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetResult, setResetResult] = useState<{ password: string } | null>(null)

  function resetForm() {
    setFullName(''); setRelationship(''); setAge('')
    setPhone(''); setEmail(''); setIsPrimary(false)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAlert(null)
    startTransition(async () => {
      const result = await createFamilyMember({
        house_id: house.id,
        full_name: fullName.trim(),
        relationship: relationship.trim(),
        age: age ? parseInt(age) : null,
        phone: phone.replace(/\s/g, '') || '',
        email: email.trim(),
        is_primary_contact: isPrimary,
      })
      if (result.success) {
        setAlert({ type: 'success', message: `${fullName} added successfully.` })
        setShowForm(false)
        resetForm()
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  function handleSetPrimary(member: FamilyMemberWithAccess) {
    setAlert(null)
    startTransition(async () => {
      const result = await setPrimaryContact(member.id, house.id)
      if (result.success) {
        setAlert({ type: 'success', message: `${member.full_name} set as primary contact.` })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  function handleDelete(member: FamilyMemberWithAccess) {
    if (!confirm(`Remove ${member.full_name}?`)) return
    setAlert(null)
    startTransition(async () => {
      const result = await deleteFamilyMember(member.id)
      if (result.success) {
        setAlert({ type: 'success', message: 'Family member removed.' })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  function openGrantModal(member: FamilyMemberWithAccess) {
    setGrantTarget(member)
    setGrantEmail(member.email || '')
    setGrantPassword(Math.random().toString(36).slice(-8) + '!')
    setGrantResult(null)
    setAlert(null)
  }

  function openResetModal(member: FamilyMemberWithAccess) {
    setResetTarget(member)
    setResetPassword(Math.random().toString(36).slice(-8) + '!')
    setResetResult(null)
    setAlert(null)
  }

  function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!grantTarget) return
    setAlert(null)
    startTransition(async () => {
      const result = await grantAppAccess({
        family_member_id: grantTarget.id,
        email: grantEmail.trim(),
        password: grantPassword,
      })
      if (result.success) {
        setGrantResult({ email: grantEmail.trim(), password: grantPassword })
        setAlert({ type: 'success', message: `App access granted to ${grantTarget.full_name}!` })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetTarget || !resetTarget.app_user_id) return
    setAlert(null)
    startTransition(async () => {
      const result = await adminResetResidentPassword({
        userId: resetTarget.app_user_id!,
        newPassword: resetPassword,
      })
      if (result.success) {
        setResetResult({ password: resetPassword })
        setAlert({ type: 'success', message: `Password reset for ${resetTarget.full_name}.` })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  function handleRevoke(member: FamilyMemberWithAccess) {
    if (!member.app_user_id) return
    if (!confirm(`Revoke app access for ${member.full_name}? They will no longer be able to log in.`)) return
    setAlert(null)
    startTransition(async () => {
      const result = await revokeAppAccess(member.app_user_id!)
      if (result.success) {
        setAlert({ type: 'success', message: `App access revoked for ${member.full_name}.` })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  const members = (house.family_members ?? []) as FamilyMemberWithAccess[]

  return (
    <div className="glass-card p-5">
      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#2D2A26' }}>
          {members.length} Member{members.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setAlert(null) }}
          className="text-xs font-medium transition-colors"
          style={{ color: '#C56E4D' }}
        >
          {showForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border rounded-xl p-4 mb-4 space-y-3" style={{ borderColor: 'rgba(183,155,108,0.2)', background: 'rgba(183,155,108,0.04)' }}>
          <p className="text-sm font-medium" style={{ color: '#2D2A26' }}>Add Family Member</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input className="input text-sm" placeholder="Priya Patel" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Relationship</label>
              <input className="input text-sm" placeholder="Wife, Son, Daughter…"
                value={relationship} onChange={(e) => setRelationship(e.target.value)} />
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input text-sm" type="number" min="0" max="120"
                placeholder="32" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="label">Mobile (optional)</label>
              <div className="flex gap-1">
                <span className="phone-prefix">+91</span>
                <input className="input flex-1 font-mono text-sm" type="tel" maxLength={10}
                  placeholder="9876543210" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input className="input text-sm" type="email" placeholder="priya@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: '#C56E4D' }}
              checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
            <span className="text-sm" style={{ color: '#54504B' }}>Set as primary contact</span>
          </label>
          {isPrimary && (
            <p className="text-xs rounded-lg px-3 py-2 mt-2" style={{ color: '#9E8357', background: 'rgba(183,155,108,0.08)', border: '1px solid rgba(183,155,108,0.2)' }}>
              ⚠ This will remove primary contact status from any existing member.
            </p>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary w-full text-sm mt-3">
            {isPending
              ? <><span className="spinner" /> Adding...</>
              : 'Add Member'}
          </button>
        </form>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <EmptyState icon="👨‍👩‍👧" title="No family members" description="Add family members to this house." />
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-3 rounded-xl border transition-colors group"
              style={member.is_primary_contact
                ? { borderColor: 'rgba(197,110,77,0.3)', background: 'rgba(197,110,77,0.05)' }
                : { borderColor: 'rgba(183,155,108,0.2)', background: 'rgba(255,255,255,0.4)' }
              }
            >
              {/* Row 1: Name + badges */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: '#2D2A26' }}>{member.full_name}</p>
                    {member.is_primary_contact && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0" style={{ color: '#C56E4D', background: 'rgba(197,110,77,0.1)', border: '1px solid rgba(197,110,77,0.2)' }}>
                        Primary
                      </span>
                    )}
                    {/* App Access Badge */}
                    {member.app_user_active ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0" style={{ color: '#5A6855', background: 'rgba(122,139,116,0.1)', border: '1px solid rgba(122,139,116,0.2)' }}>
                        App Access
                      </span>
                    ) : member.app_user_id ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0" style={{ color: '#8C8680', background: 'rgba(140,134,128,0.1)', border: '1px solid rgba(140,134,128,0.2)' }}>
                        Revoked
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {member.relationship && (
                      <span className="text-xs" style={{ color: '#54504B' }}>{member.relationship}</span>
                    )}
                    {member.age !== null && (
                      <span className="text-xs" style={{ color: '#8C8680' }}>{member.age} yrs</span>
                    )}
                    {member.phone && (
                      <span className="text-xs font-mono" style={{ color: '#8C8680' }}>{formatPhone(member.phone)}</span>
                    )}
                  </div>
                </div>

                {/* Actions — always visible for touch devices */}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {!member.app_user_active && !member.app_user_id && (
                    <button
                      type="button"
                      onClick={() => openGrantModal(member)}
                      disabled={isPending}
                      className="text-[11px] px-2 py-1 rounded-lg transition-colors font-medium"
                      style={{ color: '#5A6855', background: 'rgba(122,139,116,0.08)', border: '1px solid rgba(122,139,116,0.2)' }}
                      title="Grant app login access"
                    >
                      🔑 Grant Access
                    </button>
                  )}
                  {member.app_user_active && member.app_user_id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openResetModal(member)}
                        disabled={isPending}
                        className="text-[11px] px-2 py-1 rounded-lg transition-colors"
                        style={{ color: '#B79B6C' }}
                        title="Reset app password"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(member)}
                        disabled={isPending}
                        className="text-[11px] px-2 py-1 rounded-lg transition-colors"
                        style={{ color: '#C56E4D' }}
                        title="Revoke app access"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                  {!member.is_primary_contact && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(member)}
                      disabled={isPending}
                      className="text-[11px] px-2 py-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      style={{ color: '#B79B6C' }}
                      title="Set as primary contact"
                    >
                      Primary
                    </button>
                  )}
                  {!member.is_primary_contact && (
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={isPending}
                      className="text-[11px] px-2 py-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      style={{ color: '#C56E4D' }}
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Grant App Access Modal ── */}
      {grantTarget && (
        <div
          onClick={() => { setGrantTarget(null); setGrantResult(null) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,12,9,0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '440px',
              background: '#FDFAF6',
              borderRadius: '20px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(183,155,108,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Gradient Header Band */}
            <div style={{
              background: 'linear-gradient(135deg, #2D2A26 0%, #3D3830 100%)',
              padding: '1.5rem 1.5rem 1rem',
              position: 'relative',
            }}>
              {/* Close button */}
              <button
                type="button"
                onClick={() => { setGrantTarget(null); setGrantResult(null) }}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 'bold', transition: 'background 0.2s',
                }}
              >✕</button>

              {/* Avatar */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #C56E4D, #B79B6C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '0.75rem',
                boxShadow: '0 4px 12px rgba(197,110,77,0.4)',
              }}>🔑</div>

              <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: 0 }}>
                Grant App Access
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '4px' }}>
                {grantTarget.full_name} · {grantTarget.relationship || 'Family Member'} · House {house.house_number}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              {grantResult ? (
                /* ── Success State ── */
                <div>
                  {/* Success banner */}
                  <div style={{
                    borderRadius: '12px', padding: '1rem',
                    background: 'rgba(90,104,85,0.08)',
                    border: '1px solid rgba(90,104,85,0.2)',
                    marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#3D5038', margin: 0 }}>
                        Account Created Successfully
                      </p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#54504B', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Share these credentials securely. The resident will be asked to set a new password on first login.
                    </p>
                    {/* Credential rows */}
                    {[
                      { label: 'Login Email', value: grantResult.email },
                      { label: 'Temporary Password', value: grantResult.password },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        background: '#fff', borderRadius: '8px', padding: '10px 12px',
                        marginBottom: '8px', border: '1px solid rgba(183,155,108,0.2)',
                      }}>
                        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#8C8680', margin: '0 0 4px' }}>{label}</p>
                        <p style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#2D2A26', margin: 0, userSelect: 'all' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setGrantTarget(null); setGrantResult(null) }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #C56E4D, #B05A3A)',
                      color: '#fff', fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', letterSpacing: '0.02em',
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* ── Form State ── */
                <form onSubmit={handleGrantAccess}>
                  {/* Info box */}
                  <div style={{
                    borderRadius: '10px', padding: '10px 12px', marginBottom: '16px',
                    background: 'rgba(183,155,108,0.07)', border: '1px solid rgba(183,155,108,0.18)',
                    fontSize: '12px', color: '#54504B', lineHeight: 1.6,
                  }}>
                    This resident will be able to log in and view bills, payments, and notices for their house.
                  </div>

                  {/* Email field */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#54504B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Login Email
                    </label>
                    <input
                      type="email" required
                      value={grantEmail}
                      onChange={(e) => setGrantEmail(e.target.value)}
                      placeholder="resident@email.com"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px', boxSizing: 'border-box',
                        border: '1.5px solid rgba(183,155,108,0.3)', background: '#fff',
                        fontSize: '14px', color: '#2D2A26', outline: 'none',
                        fontFamily: 'inherit', transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#C56E4D' }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(183,155,108,0.3)' }}
                    />
                    <p style={{ fontSize: '11px', color: '#8C8680', marginTop: '4px' }}>Must be a valid, unique email address.</p>
                  </div>

                  {/* Password field */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#54504B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Temporary Password
                    </label>
                    <input
                      type="text" required minLength={6}
                      value={grantPassword}
                      onChange={(e) => setGrantPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px', boxSizing: 'border-box',
                        border: '1.5px solid rgba(183,155,108,0.3)', background: '#fff',
                        fontSize: '14px', color: '#2D2A26', outline: 'none', fontFamily: 'monospace',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#C56E4D' }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(183,155,108,0.3)' }}
                    />
                    <p style={{ fontSize: '11px', color: '#8C8680', marginTop: '4px' }}>Resident will set a new password on first login.</p>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setGrantTarget(null)}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px',
                        border: '1.5px solid rgba(183,155,108,0.3)', background: 'transparent',
                        color: '#54504B', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(183,155,108,0.06)' }}
                      onMouseOut={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || !grantEmail || grantPassword.length < 6}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                        background: isPending || !grantEmail || grantPassword.length < 6
                          ? 'rgba(197,110,77,0.4)'
                          : 'linear-gradient(135deg, #C56E4D, #B05A3A)',
                        color: '#fff', fontSize: '14px', fontWeight: 700, cursor: isPending ? 'wait' : 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {isPending ? (
                        <>
                          <span style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                            display: 'inline-block', animation: 'spin 0.7s linear infinite',
                          }} />
                          Creating...
                        </>
                      ) : '🔑 Create Account'}
                    </button>
                  </div>

                  {/* Error display */}
                  {alert?.type === 'error' && (
                    <div style={{
                      marginTop: '12px', padding: '10px 12px', borderRadius: '10px',
                      background: 'rgba(197,110,77,0.08)', border: '1px solid rgba(197,110,77,0.25)',
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                      <p style={{ fontSize: '12px', color: '#C56E4D', margin: 0, lineHeight: 1.5 }}>{alert.message}</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(26,24,22,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px', boxSizing: 'border-box',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: '420px', background: '#f0ece1',
            borderRadius: '24px', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(183,155,108,0.3)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)',
              borderBottom: '1px solid rgba(183,155,108,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#2D2A26', letterSpacing: '-0.02em' }}>
                    Reset App Password
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#8C8680', lineHeight: 1.4 }}>
                    Generate a new temporary password for <strong style={{ color: '#54504B' }}>{resetTarget.full_name}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  style={{
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(183,155,108,0.2)',
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#8C8680', fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { (e.currentTarget.style.background = '#fff'); (e.currentTarget.style.color = '#2D2A26') }}
                  onMouseOut={(e) => { (e.currentTarget.style.background = 'rgba(255,255,255,0.5)'); (e.currentTarget.style.color = '#8C8680') }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {resetResult ? (
                // Success state
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'rgba(122,139,116,0.1)', border: '2px solid #7A8B74',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', margin: '0 auto 16px', color: '#5A6855'
                  }}>✓</div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#2D2A26' }}>Password Reset Successful!</h4>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#54504B', lineHeight: 1.5 }}>
                    Please securely share this new temporary password with the resident.
                  </p>
                  
                  <div style={{
                    background: '#fff', border: '1px solid rgba(183,155,108,0.3)',
                    borderRadius: '12px', padding: '16px', marginBottom: '24px',
                    textAlign: 'left'
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: '#8C8680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Login Email
                    </p>
                    <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#2D2A26' }}>
                      {resetTarget.email || 'Resident Email'}
                    </p>
                    
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: '#8C8680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      New Temporary Password
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#C56E4D', letterSpacing: '0.05em', flex: 1 }}>
                        {resetResult.password}
                      </p>
                      <button
                        onClick={(e) => {
                          navigator.clipboard.writeText(
                            `Login details for Shyamved Residency App:\nEmail: ${resetTarget.email || 'Your Email'}\nTemporary Password: ${resetResult.password}\n\nPlease log in to the resident portal. You will be asked to set a new permanent password immediately.`
                          )
                          const btn = e.currentTarget
                          const originalText = btn.innerHTML
                          btn.innerHTML = 'Copied!'
                          btn.style.background = 'rgba(122,139,116,0.1)'
                          btn.style.color = '#5A6855'
                          btn.style.borderColor = '#7A8B74'
                          setTimeout(() => {
                            btn.innerHTML = originalText
                            btn.style.background = '#fff'
                            btn.style.color = '#54504B'
                            btn.style.borderColor = 'rgba(183,155,108,0.4)'
                          }, 2000)
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(183,155,108,0.4)',
                          background: '#fff', color: '#54504B', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                      >
                        Copy Details
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setResetTarget(null)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                      background: '#2D2A26', color: '#fff', fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', transition: 'opacity 0.2s'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                // Form state
                <form onSubmit={handleResetPassword}>
                  {/* Warning Info */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
                    background: 'rgba(183,155,108,0.08)', borderRadius: '12px', marginBottom: '20px',
                    border: '1px solid rgba(183,155,108,0.2)'
                  }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: '12px', color: '#54504B', lineHeight: 1.5 }}>
                      This will forcefully change the resident's current password. They will be logged out and required to enter a new password upon their next login.
                    </p>
                  </div>

                  {/* Password field */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#54504B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      New Temporary Password
                    </label>
                    <input
                      type="text" required minLength={6}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px', boxSizing: 'border-box',
                        border: '1.5px solid rgba(183,155,108,0.3)', background: '#fff',
                        fontSize: '14px', color: '#2D2A26', outline: 'none', fontFamily: 'monospace',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#C56E4D' }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(183,155,108,0.3)' }}
                    />
                    <p style={{ fontSize: '11px', color: '#8C8680', marginTop: '4px' }}>A secure 8-character password has been auto-generated.</p>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setResetTarget(null)}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px',
                        border: '1.5px solid rgba(183,155,108,0.3)', background: 'transparent',
                        color: '#54504B', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(183,155,108,0.06)' }}
                      onMouseOut={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || resetPassword.length < 6}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                        background: isPending || resetPassword.length < 6
                          ? 'rgba(197,110,77,0.4)'
                          : 'linear-gradient(135deg, #C56E4D, #B05A3A)',
                        color: '#fff', fontSize: '14px', fontWeight: 700, cursor: isPending ? 'wait' : 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {isPending ? (
                        <>
                          <span style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                            display: 'inline-block', animation: 'spin 0.7s linear infinite',
                          }} />
                          Resetting...
                        </>
                      ) : '🔑 Reset Password'}
                    </button>
                  </div>

                  {/* Error display */}
                  {alert?.type === 'error' && (
                    <div style={{
                      marginTop: '12px', padding: '10px 12px', borderRadius: '10px',
                      background: 'rgba(197,110,77,0.08)', border: '1px solid rgba(197,110,77,0.25)',
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                      <p style={{ fontSize: '12px', color: '#C56E4D', margin: 0, lineHeight: 1.5 }}>{alert.message}</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
