// =============================================================================
// RAZORPAY CLIENT — Server-side only
// Placeholder module ready for activation when Razorpay keys are available.
// All payment logic uses this module — adding real keys requires no refactoring.
//
// USAGE:
//   1. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local
//   2. Set RAZORPAY_ENABLED=true in .env.local
//   3. Remove the placeholder guards below
// =============================================================================

import Razorpay from 'razorpay'

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay client singleton — initialized once per server process
// ─────────────────────────────────────────────────────────────────────────────

let razorpayClient: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret || keyId.includes('placeholder')) {
    throw new Error(
      'Razorpay is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local'
    )
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }

  return razorpayClient
}

// ─────────────────────────────────────────────────────────────────────────────
// Check if Razorpay is configured and available
// ─────────────────────────────────────────────────────────────────────────────

export function isRazorpayConfigured(): boolean {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  return !!(keyId && keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder'))
}
