'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAdmin, requireRole } from '@/lib/auth/utils'
import { writeAuditLog } from '@/lib/audit/logger'
import { calculateDynamicPenalty, calculateGrandTotal } from '@/lib/billing/calculator'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const recordCashPaymentSchema = z.object({
  billId: z.string().uuid(),
  expectedAmount: z.number().min(1),
})

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Admin action to record a manual cash payment for a bill.
 * Safely calls the process_payment_transaction RPC.
 */
export async function recordCashPayment(formData: FormData): Promise<ActionResult<{ receiptId: string }>> {
  try {
    const profile = await requireRole(['chairman', 'office_man'])
    const supabase = await createSupabaseServerClient()

    const parseResult = recordCashPaymentSchema.safeParse({
      billId: formData.get('billId'),
      expectedAmount: Number(formData.get('expectedAmount')),
    })

    if (!parseResult.success) {
      return { success: false, error: 'Invalid payment data provided.' }
    }

    const { billId, expectedAmount } = parseResult.data

    // 1. Fetch full bill details to build the receipt snapshot
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*, house:houses(*, block:blocks(*)), society:societies(*)')
      .eq('id', billId)
      .single()

    if (billError || !bill) {
      return { success: false, error: 'Failed to fetch bill details.' }
    }

    if (bill.status === 'paid' || bill.status === 'cancelled' || bill.status === 'draft') {
      return { success: false, error: `Cannot record payment for a ${bill.status} bill.` }
    }

    // 2. Fetch the primary resident name for the receipt
    let residentName = bill.house.tenant_name || bill.house.owner_name || 'Resident'
    
    // Check if any app user is registered for this house
    const { data: appUser } = await supabase
      .from('users')
      .select('full_name')
      .eq('house_id', bill.house_id)
      .eq('role', 'resident')
      .maybeSingle()
      
    if (appUser && appUser.full_name) {
      residentName = appUser.full_name
    } else {
      // Fallback to primary contact in family_members if no app access user exists
      const { data: member } = await supabase
        .from('family_members')
        .select('full_name')
        .eq('house_id', bill.house_id)
        .eq('is_primary_contact', true)
        .maybeSingle()
        
      if (member && member.full_name) {
        residentName = member.full_name
      }
    }

    // 3. Compute penalty & grand total dynamically for right now
    const penaltyAmount = calculateDynamicPenalty(
      bill.billing_month,
      bill.society.penalty_per_day,
      bill.society.payment_window_end,
      bill.penalty_waived
    )
    const grandTotal = calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      penaltyAmount
    )

    // Ensure the admin is paying the exact expected amount
    if (grandTotal !== expectedAmount) {
      return { success: false, error: `Payment amount mismatch. Bill amount has changed to ₹${grandTotal}. Please refresh and try again.` }
    }

    // 4. Construct Immutable Receipt Snapshot (Gujarati Template Ready)
    const receiptData = {
      societyName: bill.society.name,
      societyAddress: bill.society.address || 'Ahmedabad', // Fallback for safety
      residentName,
      houseNumber: bill.house.house_number,
      blockName: bill.house.block.name,
      billMonth: bill.billing_month,
      maintenanceAmount: bill.maintenance_amount,
      waterCharges: bill.water_bill_amount ?? 0,
      penaltyAmount,
      otherCharges: 0,
      previousDues: 0,
      totalAmount: grandTotal,
      collectedBy: profile.full_name || 'Admin',
      // Dynamic fields (receipt_number, payment_mode, paid_at) injected by RPC
    }

    // 5. Call PostgreSQL RPC Transaction
    const { data: result, error: rpcError } = await supabase.rpc('process_payment_transaction', {
      p_bill_id: billId,
      p_amount: grandTotal,
      p_payment_mode: 'cash',
      p_collected_by: profile.id,
      p_razorpay_order_id: null,
      p_razorpay_payment_id: null,
      p_razorpay_signature: null,
      p_receipt_data: receiptData
    })

    if (rpcError) {
      console.error('[recordCashPayment] RPC Error:', rpcError)
      return { success: false, error: 'Database transaction failed. Payment not recorded.' }
    }

    // 6. Audit Log
    await writeAuditLog({
      actionType: 'payment_cash_recorded',
      actorId: profile.id,
      actorRole: profile.role,
      societyId: profile.society_id,
      entityType: 'payments',
      entityId: bill.house_id,
      newValue: { billId, amount: grandTotal, receiptNumber: result.receipt_number, description: `Recorded manual cash payment of ₹${grandTotal} for bill ${billId}` }
    })

    revalidatePath('/admin/billing')
    revalidatePath('/office/billing')

    return { success: true, data: { receiptId: result.receipt_id } }

  } catch (error) {
    console.error('[recordCashPayment]', error)
    return { success: false, error: 'An unexpected error occurred while processing the payment.' }
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * RAZORPAY ONLINE PAYMENTS ACTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'

const createOrderSchema = z.object({
  billId: z.string().uuid(),
})

const verifyPaymentSchema = z.object({
  billId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

/**
 * Creates a Razorpay order for a specific resident bill.
 */
export async function createOnlineOrder(billId: string): Promise<ActionResult<{ orderId: string; amount: number; keyId: string }>> {
  try {
    const profile = await requireRole(['resident'])
    if (!profile.house_id) {
      return { success: false, error: 'User is not linked to any house.' }
    }

    const parseResult = createOrderSchema.safeParse({ billId })
    if (!parseResult.success) {
      return { success: false, error: 'Invalid bill ID.' }
    }

    const supabase = await createSupabaseServerClient()

    // Fetch the bill details and enforce resident ownership
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*, society:societies(*)')
      .eq('id', billId)
      .eq('house_id', profile.house_id)
      .single()

    if (billError || !bill) {
      return { success: false, error: 'Bill not found or access denied.' }
    }

    if (bill.status === 'paid' || bill.status === 'cancelled' || bill.status === 'draft') {
      return { success: false, error: `Cannot pay a ${bill.status} bill.` }
    }

    // Compute grand total dynamically
    const penaltyAmount = calculateDynamicPenalty(
      bill.billing_month,
      bill.society.penalty_per_day,
      bill.society.payment_window_end,
      bill.penalty_waived
    )
    const grandTotal = calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      penaltyAmount
    )

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return { success: false, error: 'Razorpay keys are not configured on the server.' }
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // Create Razorpay Order (Amount in Paise)
    const amountInPaise = Math.round(grandTotal * 100)
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${billId.substring(0, 14)}`,
    })

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        keyId,
      },
    }

  } catch (error) {
    console.error('[createOnlineOrder]', error)
    return { success: false, error: 'Failed to initiate online transaction.' }
  }
}

/**
 * Verifies Razorpay payment signature and completes the payment in the DB.
 */
export async function verifyOnlinePayment(params: {
  billId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): Promise<ActionResult<{ receiptId: string }>> {
  try {
    const profile = await requireRole(['resident'])
    if (!profile.house_id) {
      return { success: false, error: 'User is not linked to any house.' }
    }

    const parseResult = verifyPaymentSchema.safeParse(params)
    if (!parseResult.success) {
      return { success: false, error: 'Invalid verification parameters.' }
    }

    const { billId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseResult.data

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return { success: false, error: 'Razorpay server keys are missing.' }
    }

    // Verify signature using Hmac-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      return { success: false, error: 'Payment signature verification failed.' }
    }

    const supabase = await createSupabaseServerClient()

    // Fetch the bill details to build the receipt snapshot
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*, house:houses(*, block:blocks(*)), society:societies(*)')
      .eq('id', billId)
      .eq('house_id', profile.house_id)
      .single()

    if (billError || !bill) {
      return { success: false, error: 'Bill details fetch failed.' }
    }

    if (bill.status === 'paid') {
      return { success: false, error: 'Bill is already paid.' }
    }

    // Compute penalty & grand total dynamically
    const penaltyAmount = calculateDynamicPenalty(
      bill.billing_month,
      bill.society.penalty_per_day,
      bill.society.payment_window_end,
      bill.penalty_waived
    )
    const grandTotal = calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      penaltyAmount
    )

    const residentName = profile.full_name || bill.house.owner_name || 'Resident'

    // Construct Immutable Receipt Snapshot
    const receiptData = {
      societyName: bill.society.name,
      societyAddress: bill.society.address || 'Ahmedabad',
      residentName,
      houseNumber: bill.house.house_number,
      blockName: bill.house.block.name,
      billMonth: bill.billing_month,
      maintenanceAmount: bill.maintenance_amount,
      waterCharges: bill.water_bill_amount ?? 0,
      penaltyAmount,
      otherCharges: 0,
      previousDues: 0,
      totalAmount: grandTotal,
      collectedBy: 'Razorpay PG',
    }

    // Call DB RPC Transaction
    const { data: result, error: rpcError } = await supabase.rpc('process_payment_transaction', {
      p_bill_id: billId,
      p_amount: grandTotal,
      p_payment_mode: 'upi', // Standard mapping for online gateway payments
      p_collected_by: profile.id,
      p_razorpay_order_id: razorpayOrderId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_signature: razorpaySignature,
      p_receipt_data: receiptData
    })

    if (rpcError) {
      console.error('[verifyOnlinePayment] RPC Error:', rpcError)
      return { success: false, error: 'Database transaction failed. Payment not logged.' }
    }

    // Write audit log
    await writeAuditLog({
      actionType: 'payment_upi_verified',
      actorId: profile.id,
      actorRole: profile.role,
      societyId: profile.society_id,
      entityType: 'payments',
      entityId: bill.house_id,
      newValue: { billId, amount: grandTotal, receiptNumber: result.receipt_number, razorpayPaymentId }
    })

    revalidatePath('/resident/bills')
    revalidatePath(`/resident/bills/${billId}`)
    revalidatePath('/resident/payments')
    revalidatePath('/admin/payments')

    return { success: true, data: { receiptId: result.receipt_id } }

  } catch (error) {
    console.error('[verifyOnlinePayment]', error)
    return { success: false, error: 'An unexpected error occurred during verification.' }
  }
}

