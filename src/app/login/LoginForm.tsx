'use client'

import { useState, useTransition } from 'react'
import { signInWithEmail, sendPhoneOtp, verifyPhoneOtp } from '@/features/auth/actions'
import { cn } from '@/lib/utils'

type LoginMode = 'email' | 'phone'
type PhoneStep = 'number' | 'otp'

export default function LoginForm() {
  const [mode, setMode] = useState<LoginMode>('email')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('number')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Email / Password Login ──

  async function handleEmailSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (!result.success) setError(result.error)
    })
  }

  // ── Phone OTP — Step 1: Send OTP ──

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await sendPhoneOtp(phoneNumber)
      if (result.success) {
        setPhoneStep('otp')
      } else {
        setError(result.error)
      }
    })
  }

  // ── Phone OTP — Step 2: Verify OTP ──

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const normalizedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber.replace(/^0/, '')}`

    startTransition(async () => {
      const result = await verifyPhoneOtp(normalizedPhone, otp)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="glass-card p-6 sm:p-8">
      {/* Mode switcher */}
      <div className="flex rounded-lg bg-slate-900/60 p-1 mb-6 gap-1">
        {(['phone', 'email'] as LoginMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); setPhoneStep('number') }}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200',
              mode === m
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {m === 'phone' ? '📱 Mobile OTP' : '✉️ Email'}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── EMAIL LOGIN FORM ── */}
      {mode === 'email' && (
        <form action={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="chairman@shyamved.com"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary w-full mt-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      )}

      {/* ── PHONE OTP FORM ── */}
      {mode === 'phone' && phoneStep === 'number' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="phone" className="label">Mobile Number</label>
            <div className="flex gap-2">
              <span className="input w-16 flex items-center justify-center text-slate-400 text-sm shrink-0">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="98765 43210"
                maxLength={10}
                pattern="[0-9]{10}"
                className="input flex-1"
                autoComplete="tel"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Enter your 10-digit mobile number</p>
          </div>
          <button
            type="submit"
            disabled={isPending || phoneNumber.length < 10}
            className="btn btn-primary w-full"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      )}

      {mode === 'phone' && phoneStep === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-slate-300 text-sm">
              OTP sent to{' '}
              <span className="font-semibold text-indigo-400">+91 {phoneNumber}</span>
            </p>
          </div>
          <div>
            <label htmlFor="otp" className="label">Enter OTP</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="input text-center text-2xl tracking-[0.5em] font-mono"
              autoComplete="one-time-code"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || otp.length !== 6}
            className="btn btn-primary w-full"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </button>
          <button
            type="button"
            onClick={() => { setPhoneStep('number'); setOtp(''); setError(null) }}
            className="btn btn-secondary w-full text-sm"
          >
            ← Change Number
          </button>
        </form>
      )}

      {/* Help text */}
      <p className="text-center text-xs text-slate-500 mt-6">
        Residents use Mobile OTP · Admins use Email login
      </p>
    </div>
  )
}
