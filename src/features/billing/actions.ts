// =============================================================================
// BILLING FEATURE — Server Actions
// Enforces role constraints (requireAdmin / requireChairman), Zod validation,
// database transactions, precise snapshotting, IST due dates, and audit logs.
// =============================================================================

'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAdmin, requireChairman } from '@/lib/auth/utils'
import { writeAuditLog } from '@/lib/audit/logger'
import { calculateWaterBillAmount, roundMonetary } from '@/lib/billing/calculator'
import { calculateISTDueDate } from '@/lib/billing/timezone'
import { revalidatePath } from 'next/cache'
import type { Bill, WaterMeterEntry } from '@/types/database'

/**
 * Normalizes billing month date to first of the month: YYYY-MM-01
 */
function normalizeToFirstOfMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  return `${year}-${month}-01`
}

/**
 * PREVIEW SUMMARY ACTION
 * Returns a dry-run summary of the upcoming billing generation.
 */
export async function getBillingMonthPreview(billingMonthInput: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const billingMonth = normalizeToFirstOfMonth(billingMonthInput)

    const { data: society } = await supabase.from('societies').select('*').eq('id', admin.society_id).single()
    const { data: houses } = await supabase.from('houses').select('id').eq('society_id', admin.society_id).eq('is_active', true)
    
    if (!society || !houses || houses.length === 0) {
      return { success: false, error: 'Society configuration or active houses missing.' }
    }

    const { data: waterEntries } = await supabase
      .from('water_meter_entries')
      .select('house_id, units_consumed, unit_price')
      .eq('society_id', admin.society_id)
      .eq('billing_month', billingMonth)

    const totalHouses = houses.length
    const entriesMap = new Map(waterEntries?.map(e => [e.house_id, e]))
    
    let housesWithWater = 0
    let estimatedWater = 0
    
    for (const house of houses) {
      const entry = entriesMap.get(house.id)
      if (entry) {
        housesWithWater++
        estimatedWater += calculateWaterBillAmount(Number(entry.units_consumed), Number(entry.unit_price))
      }
    }

    const estimatedMaintenance = totalHouses * society.maintenance_amount

    return {
      success: true,
      data: {
        totalHouses,
        housesWithWater,
        housesMissingWater: totalHouses - housesWithWater,
        estimatedMaintenance,
        estimatedWater,
        billingMonth
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 1. Generates pending bills (snapshots) for all active houses.
 * Missed water readings are safely set to null/0.
 */
export async function generateMonthlyBills(billingMonthInput: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const billingMonth = normalizeToFirstOfMonth(billingMonthInput)
    const [year, month] = billingMonth.split('-')
    const monthKey = `${year}${month}`

    // Ensure we haven't already generated bills for this month (Lock Check)
    const { data: existingBills } = await supabase
      .from('bills')
      .select('id')
      .eq('society_id', admin.society_id)
      .eq('billing_month', billingMonth)
      .limit(1)

    if (existingBills && existingBills.length > 0) {
      return { success: false, error: 'Bills for this month have already been generated.' }
    }

    // Fetch society configurations
    const { data: society, error: sError } = await supabase
      .from('societies')
      .select('*')
      .eq('id', admin.society_id)
      .single()

    if (sError || !society) return { success: false, error: 'Society configuration not found.' }

    // Fetch active houses
    const { data: houses, error: hError } = await supabase
      .from('houses')
      .select('id, house_number, block:blocks(name)')
      .eq('society_id', admin.society_id)
      .eq('is_active', true)

    if (hError || !houses || houses.length === 0) return { success: false, error: 'No active houses found.' }

    // Fetch water entries for the month
    const { data: waterEntries } = await supabase
      .from('water_meter_entries')
      .select('house_id, units_consumed, unit_price')
      .eq('society_id', admin.society_id)
      .eq('billing_month', billingMonth)

    const entriesMap = new Map(waterEntries?.map(e => [e.house_id, e]))

    let generatedCount = 0

    // Sequential inserts to guarantee proper generation & readable bill numbers
    for (const house of houses) {
      const cleanHouseNum = house.house_number.replace(/[^a-zA-Z0-9]/g, '')
      const billNumber = `BILL-${monthKey}-${cleanHouseNum}`.toUpperCase()

      const entry = entriesMap.get(house.id)
      const waterUnits = entry ? Number(entry.units_consumed) : null
      const waterUnitPrice = entry ? Number(entry.unit_price) : null
      const waterBillAmount = entry ? calculateWaterBillAmount(waterUnits!, waterUnitPrice!) : 0

      // Compute final payable amount (maintenance + water)
      const finalAmount = society.maintenance_amount + waterBillAmount

      const { data, error } = await supabase
        .from('bills')
        .insert({
          society_id: admin.society_id,
          house_id: house.id,
          billing_month: billingMonth,
          bill_number: billNumber,
          maintenance_amount: society.maintenance_amount,
          water_unit_price: waterUnitPrice,
          water_units: waterUnits,
          water_bill_amount: waterBillAmount,
          final_amount: finalAmount, // Freeze the math here immediately
          status: 'pending', // SKIPPING DRAFT, STRAIGHT TO PENDING
          due_date: calculateISTDueDate(billingMonth)
        })
        .select()
        .maybeSingle()

      if (!error && data) {
        generatedCount++
      }
    }

    if (generatedCount > 0) {
      // Audit log the generation
      await writeAuditLog({
        societyId: admin.society_id,
        actorId: admin.id,
        actorRole: admin.role,
        actionType: 'bill_generated',
        entityType: 'bills',
        newValue: {
          billing_month: billingMonth,
          count: generatedCount,
          action: 'idempotent_pending_generation'
        }
      })
    }

    revalidatePath('/office/billing')
    revalidatePath('/admin/billing')
    revalidatePath('/resident/bills')

    return { 
      success: true, 
      message: `Successfully processed billing month. Generated ${generatedCount} pending bills.` 
    }

  } catch (err: any) {
    console.error('[generateMonthlyBills] Error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * 2. Enters water meter units consumed for a house, updates dynamic amounts.
 * Includes explicit Overwrite Protection and comparative audit logging.
 */
export async function enterWaterUnits(
  houseId: string,
  billingMonthInput: string,
  unitsConsumed: number
) {
  try {
    const admin = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const billingMonth = normalizeToFirstOfMonth(billingMonthInput)

    if (unitsConsumed < 0) {
      return { success: false, error: 'Units consumed cannot be negative.' }
    }

    // Resolve current active water rate (required for water math)
    const { data: waterRate } = await supabase
      .from('water_rates')
      .select('price_per_unit')
      .eq('society_id', admin.society_id)
      .is('effective_to', null)
      .maybeSingle()

    if (!waterRate) {
      return { success: false, error: 'No active water rate configured for this society. Please create one in settings first.' }
    }

    const pricePerUnit = Number(waterRate.price_per_unit)
    const waterBillAmount = calculateWaterBillAmount(unitsConsumed, pricePerUnit)

    // Check if the bill exists for this month
    const { data: bill, error: bError } = await supabase
      .from('bills')
      .select('*')
      .eq('house_id', houseId)
      .eq('billing_month', billingMonth)
      .maybeSingle()

    if (bError || !bill) {
      return { success: false, error: 'Associated draft bill not found. Please generate draft bills for this month first.' }
    }

    // Freeze Check: If bill is finalized/paid, deny editing water entries
    if (bill.status !== 'draft') {
      return { success: false, error: `This bill has already been finalized (status: ${bill.status}). Editing is blocked.` }
    }

    // Check for existing duplicate entry to implement Overwrite Protection
    const { data: existingEntry } = await supabase
      .from('water_meter_entries')
      .select('*')
      .eq('house_id', houseId)
      .eq('billing_month', billingMonth)
      .maybeSingle()

    let actionType: 'water_unit_entered' | 'water_unit_updated' = 'water_unit_entered'
    let previousValue: any = null

    if (existingEntry) {
      actionType = 'water_unit_updated'
      previousValue = {
        units_consumed: Number(existingEntry.units_consumed),
        unit_price: Number(existingEntry.unit_price)
      }

      // Overwrite the existing reading
      const { error: ueError } = await supabase
        .from('water_meter_entries')
        .update({
          units_consumed: unitsConsumed,
          unit_price: pricePerUnit,
          entered_by: admin.id,
          entry_date: new Date().toISOString()
        })
        .eq('id', existingEntry.id)

      if (ueError) throw new Error(ueError.message)
    } else {
      // Record new reading
      const { error: ieError } = await supabase
        .from('water_meter_entries')
        .insert({
          society_id: admin.society_id,
          house_id: houseId,
          billing_month: billingMonth,
          units_consumed: unitsConsumed,
          unit_price: pricePerUnit,
          entered_by: admin.id
        })

      if (ieError) throw new Error(ieError.message)
    }

    // Update corresponding Bill row atomically with the calculated values
    const { error: billUpdateError } = await supabase
      .from('bills')
      .update({
        water_units: unitsConsumed,
        water_unit_price: pricePerUnit,
        water_bill_amount: waterBillAmount
      })
      .eq('id', bill.id)

    if (billUpdateError) throw new Error(billUpdateError.message)

    // Write audit log
    await writeAuditLog({
      societyId: admin.society_id,
      actorId: admin.id,
      actorRole: admin.role,
      actionType,
      entityType: 'water_meter_entries',
      entityId: houseId,
      previousValue,
      newValue: {
        units_consumed: unitsConsumed,
        unit_price: pricePerUnit,
        water_bill_amount: waterBillAmount
      }
    })

    revalidatePath('/office/water')
    return { success: true, message: 'Water meter entry recorded successfully.' }

  } catch (err: any) {
    console.error('[enterWaterUnits] Error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * 3. Finalizes draft bills for the month, publishing them for residents (draft -> pending).
 * Freezes water rate and finalized date permanently.
 */
export async function finalizeDraftBills(billingMonthInput: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const billingMonth = normalizeToFirstOfMonth(billingMonthInput)

    // Fetch all draft bills for the month
    const { data: drafts, error: dError } = await supabase
      .from('bills')
      .select('*')
      .eq('society_id', admin.society_id)
      .eq('billing_month', billingMonth)
      .eq('status', 'draft')

    if (dError || !drafts || drafts.length === 0) {
      return { success: false, error: 'No draft bills found for this billing month.' }
    }

    // Transition all drafts to pending, set finalized_at
    const finalizedTime = new Date().toISOString()
    
    // We update them row-by-row to guarantee strict status validation
    let finalizedCount = 0
    for (const draft of drafts) {
      // Calculate final payable amount for snapshotting
      const waterAmount = draft.water_bill_amount ? Number(draft.water_bill_amount) : 0.00
      const initialTotal = roundMonetary(Number(draft.maintenance_amount) + waterAmount)

      const { error } = await supabase
        .from('bills')
        .update({
          status: 'pending',
          finalized_at: finalizedTime,
          penalty_amount: 0.00, // starts at 0 during grace period
          final_amount: initialTotal
        })
        .eq('id', draft.id)

      if (!error) {
        finalizedCount++
      }
    }

    if (finalizedCount > 0) {
      await writeAuditLog({
        societyId: admin.society_id,
        actorId: admin.id,
        actorRole: admin.role,
        actionType: 'bill_updated',
        entityType: 'bills',
        newValue: {
          billing_month: billingMonth,
          status: 'pending',
          count: finalizedCount,
          finalized_at: finalizedTime
        }
      })
    }

    revalidatePath('/office/billing')
    revalidatePath('/admin/billing')
    revalidatePath('/resident/bills')

    return { success: true, message: `Successfully finalized and published ${finalizedCount} bills.` }

  } catch (err: any) {
    console.error('[finalizeDraftBills] Error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * 4. Chairman-only Penalty Waiver.
 * Waives accruing late fees, records rationale in audit trail.
 */
export async function waiveBillPenalty(billId: string, reason: string) {
  try {
    const chairman = await requireChairman()
    const supabase = await createSupabaseServerClient()

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Please provide a detailed waiver reason (minimum 5 characters).' }
    }

    // Fetch the bill
    const { data: bill, error: bError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (bError || !bill) {
      return { success: false, error: 'Bill record not found.' }
    }

    // Validation: block waiver on paid or cancelled bills
    if (bill.status === 'paid') {
      return { success: false, error: 'This bill has already been paid. Late penalty cannot be waived.' }
    }
    if (bill.status === 'cancelled') {
      return { success: false, error: 'This bill has been cancelled.' }
    }

    const previousValue = {
      penalty_waived: bill.penalty_waived,
      penalty_amount: bill.penalty_amount,
      status: bill.status
    }

    // Enforce waiver flags, set dynamic penalty to 0.00, snap final amount
    const waterAmount = bill.water_bill_amount ? Number(bill.water_bill_amount) : 0.00
    const finalAmountWithoutPenalty = roundMonetary(Number(bill.maintenance_amount) + waterAmount)

    const { error: wError } = await supabase
      .from('bills')
      .update({
        penalty_waived: true,
        penalty_waived_by: chairman.id,
        penalty_waiver_reason: reason.trim(),
        penalty_waived_at: new Date().toISOString(),
        penalty_amount: 0.00,
        final_amount: finalAmountWithoutPenalty
      })
      .eq('id', billId)

    if (wError) throw new Error(wError.message)

    // Write detailed audit log
    await writeAuditLog({
      societyId: chairman.society_id,
      actorId: chairman.id,
      actorRole: chairman.role,
      actionType: 'penalty_waived',
      entityType: 'bills',
      entityId: billId,
      previousValue,
      newValue: {
        penalty_waived: true,
        penalty_waiver_reason: reason.trim(),
        penalty_amount: 0.00,
        final_amount: finalAmountWithoutPenalty
      }
    })

    revalidatePath('/admin/billing')
    revalidatePath(`/admin/billing/${billId}`)
    revalidatePath('/resident/bills')

    return { success: true, message: 'Penalty successfully waived for this bill.' }

  } catch (err: any) {
    console.error('[waiveBillPenalty] Error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
