'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/utils'
import { writeAuditLog } from '@/lib/audit/logger'
import { normalizeToFirstOfMonth, getPreviousBillingMonth } from '@/lib/billing/cycle'

export interface SaveWaterReadingParams {
  houseId: string
  billingMonthInput: string
  currentReading: number
}

/**
 * Saves a water reading for a house.
 * Automatically fetches the previous month's reading to calculate consumed units.
 */
export async function saveWaterReading({ houseId, billingMonthInput, currentReading }: SaveWaterReadingParams) {
  try {
    const admin = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const billingMonth = normalizeToFirstOfMonth(billingMonthInput)
    const previousMonth = getPreviousBillingMonth(billingMonth)

    if (currentReading < 0) {
      return { success: false, error: 'Current reading cannot be negative.' }
    }

    // 1. Resolve current active water rate
    const { data: waterRate } = await supabase
      .from('water_rates')
      .select('price_per_unit')
      .eq('society_id', admin.society_id)
      .is('effective_to', null)
      .maybeSingle()

    if (!waterRate) {
      return { success: false, error: 'No active water rate configured for this society.' }
    }
    const pricePerUnit = Number(waterRate.price_per_unit)

    // 2. Lock Check: Ensure bills for this month aren't already generated (status = pending/paid)
    const { data: bill } = await supabase
      .from('bills')
      .select('status')
      .eq('house_id', houseId)
      .eq('billing_month', billingMonth)
      .maybeSingle()

    if (bill) {
      return { success: false, error: 'Bills for this month have already been generated. Water readings are locked.' }
    }

    // 3. Fetch previous month's reading to calculate units
    const { data: previousEntry } = await supabase
      .from('water_meter_entries')
      .select('current_reading')
      .eq('house_id', houseId)
      .eq('billing_month', previousMonth)
      .maybeSingle()

    const previousReading = previousEntry?.current_reading ?? 0
    
    if (currentReading < previousReading) {
      return { success: false, error: `Current reading (${currentReading}) cannot be less than previous month's reading (${previousReading}).` }
    }

    const unitsConsumed = currentReading - previousReading

    // 4. Check if entry already exists for this month
    const { data: existingEntry } = await supabase
      .from('water_meter_entries')
      .select('id, current_reading, units_consumed, unit_price')
      .eq('house_id', houseId)
      .eq('billing_month', billingMonth)
      .maybeSingle()

    let actionType: 'water_unit_entered' | 'water_unit_updated' = 'water_unit_entered'
    let previousValue: any = null

    if (existingEntry) {
      actionType = 'water_unit_updated'
      previousValue = {
        current_reading: existingEntry.current_reading,
        units_consumed: existingEntry.units_consumed,
        unit_price: existingEntry.unit_price
      }

      const { error } = await supabase
        .from('water_meter_entries')
        .update({
          previous_reading: previousReading,
          current_reading: currentReading,
          units_consumed: unitsConsumed,
          unit_price: pricePerUnit,
          entered_by: admin.id,
          entry_date: new Date().toISOString()
        })
        .eq('id', existingEntry.id)

      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('water_meter_entries')
        .insert({
          society_id: admin.society_id,
          house_id: houseId,
          billing_month: billingMonth,
          previous_reading: previousReading,
          current_reading: currentReading,
          units_consumed: unitsConsumed,
          unit_price: pricePerUnit,
          entered_by: admin.id,
          entry_date: new Date().toISOString()
        })

      if (error) throw new Error(error.message)
    }

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
        previous_reading: previousReading,
        current_reading: currentReading,
        units_consumed: unitsConsumed,
        unit_price: pricePerUnit
      }
    })

    return { success: true, message: 'Water reading saved successfully.' }

  } catch (err: any) {
    console.error('[saveWaterReading] Error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
