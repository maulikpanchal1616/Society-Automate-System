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
