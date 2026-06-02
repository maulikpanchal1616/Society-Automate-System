// =============================================================================
// RAZORPAY SIGNATURE VERIFICATION — Server-side only
// Verifies that payment callbacks and webhooks come from Razorpay.
// This file must NEVER be imported in client components.
// =============================================================================

import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Verify Razorpay payment signature (from checkout callback)
// Called after UPI payment to verify the payment before marking as complete.
//
// Signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
// ─────────────────────────────────────────────────────────────────────────────

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret || keySecret.includes('placeholder')) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured')
  }

  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')

  // Use timingSafeEqual to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify Razorpay webhook signature
// Called in /api/webhooks/razorpay to verify incoming webhook events.
//
// Signature = HMAC-SHA256(raw_body, webhook_secret)
// ─────────────────────────────────────────────────────────────────────────────

export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string
  signature: string
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret || webhookSecret.includes('placeholder')) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured')
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}
