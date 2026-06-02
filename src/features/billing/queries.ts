// =============================================================================
// BILLING FEATURE — Server Queries
// All use createSupabaseServerClient — RLS enforced.
// Dynamically evaluates late fees for active pending/overdue bills.
// =============================================================================

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Bill, WaterMeterEntry, WaterRate, House, Block } from '@/types/database'
import { calculateDynamicPenalty, calculateGrandTotal } from '@/lib/billing/calculator'

export interface BillWithDetails extends Bill {
  house: House & {
    block: Pick<Block, 'id' | 'name'>
  }
  society?: any
}

export interface WaterMeterEntryWithHouse extends WaterMeterEntry {
  house: House & {
    block: Pick<Block, 'id' | 'name'>
  }
}

import { cache } from 'react'

/**
 * Gets society details (specifically penalty rate and maintenance amount config)
 * Cached per request to prevent duplicate DB hits.
 */
const getSocietyConfig = cache(async () => {
  const supabase = await createSupabaseServerClient()
  
  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()
  
  if (!profile?.society_id) return null

  const { data: society } = await supabase
    .from('societies')
    .select('*')
    .eq('id', profile.society_id)
    .single()

  return society
})

/**
 * Fetches all bills for a specific society and billing month.
 * Computes dynamic penalties for pending/overdue bills.
 */
export async function getBillsByMonth(monthStr: string): Promise<BillWithDetails[]> {
  const supabase = await createSupabaseServerClient()
  const society = await getSocietyConfig()
  if (!society) return []

  const { data, error } = await supabase
    .from('bills')
    .select('*, house:houses(*, block:blocks(id, name))')
    .eq('society_id', society.id)
    .eq('billing_month', monthStr)
    .order('status')

  if (error) {
    console.error('[getBillsByMonth]', error.message)
    return []
  }

  const bills = data as BillWithDetails[]
  
  // Calculate dynamic penalties and final amounts
  return bills.map(bill => {
    if (bill.status === 'pending' || bill.status === 'overdue') {
      const dynamicPenalty = calculateDynamicPenalty(
        bill.billing_month,
        society.penalty_per_day,
        society.payment_window_end,
        bill.penalty_waived
      )
      const currentPayable = calculateGrandTotal(
        bill.maintenance_amount,
        bill.water_bill_amount ?? 0,
        dynamicPenalty
      )
      
      // If payment has overdue IST dates, mark as overdue dynamically
      let currentStatus = bill.status
      if (dynamicPenalty > 0 && bill.status === 'pending') {
        currentStatus = 'overdue'
      }

      return {
        ...bill,
        status: currentStatus,
        penalty_amount: dynamicPenalty,
        final_amount: currentPayable
      }
    }
    
    // For paid or already finalized states, return stored values or calculate if null
    return {
      ...bill,
      penalty_amount: bill.penalty_amount ?? 0,
      final_amount: bill.final_amount ?? calculateGrandTotal(
        bill.maintenance_amount,
        bill.water_bill_amount ?? 0,
        bill.penalty_amount ?? 0
      )
    }
  })
}

/**
 * Fetches a single house bill details with calculated dynamic amounts
 */
export async function getHouseBillDetails(houseId: string, monthStr: string): Promise<BillWithDetails | null> {
  const supabase = await createSupabaseServerClient()
  const society = await getSocietyConfig()
  if (!society) return null

  const { data, error } = await supabase
    .from('bills')
    .select('*, house:houses(*, block:blocks(id, name))')
    .eq('house_id', houseId)
    .eq('billing_month', monthStr)
    .maybeSingle()

  if (error) {
    console.error('[getHouseBillDetails]', error.message)
    return null
  }

  if (!data) return null
  const bill = data as BillWithDetails

  if (bill.status === 'pending' || bill.status === 'overdue') {
    const dynamicPenalty = calculateDynamicPenalty(
      bill.billing_month,
      society.penalty_per_day,
      society.payment_window_end,
      bill.penalty_waived
    )
    const currentPayable = calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      dynamicPenalty
    )
    
    let currentStatus = bill.status
    if (dynamicPenalty > 0 && bill.status === 'pending') {
      currentStatus = 'overdue'
    }

    return {
      ...bill,
      status: currentStatus,
      penalty_amount: dynamicPenalty,
      final_amount: currentPayable
    }
  }

  return {
    ...bill,
    penalty_amount: bill.penalty_amount ?? 0,
    final_amount: bill.final_amount ?? calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      bill.penalty_amount ?? 0
    )
  }
}

/**
 * Retrieves the currently active water rate price config
 */
export async function getActiveWaterRate(): Promise<WaterRate | null> {
  const supabase = await createSupabaseServerClient()
  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()
  
  if (!profile?.society_id) return null

  const { data, error } = await supabase
    .from('water_rates')
    .select('*')
    .eq('society_id', profile.society_id)
    .is('effective_to', null)
    .maybeSingle()

  if (error) {
    console.error('[getActiveWaterRate]', error.message)
    return null
  }

  return data as WaterRate
}

/**
 * Office Man interface query: fetches all active houses in the society
 * along with their water_meter_entries for the selected month to show entry cards.
 */
export async function getPendingWaterEntryHouses(monthStr: string) {
  const supabase = await createSupabaseServerClient()
  
  // Use React Cache instead of making sequential network auth lookups
  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()
  
  if (!profile?.society_id) return []

  const currentMonthDate = new Date(monthStr)
  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1)
  const prevMonthStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase.rpc('rpc_get_water_entries', {
    p_society_id: profile.society_id,
    p_current_month: monthStr,
    p_prev_month: prevMonthStr
  })

  if (error || !data) {
    console.error('[getPendingWaterEntryHouses RPC]', error?.message)
    return []
  }

  // PostgreSQL JSON aggregation already formats it into the exact array of objects we need.
  return data
}

/**
 * Resident view query: fetches all bills for the resident's house
 * Filters out 'draft' and 'cancelled' status bills.
 * Computes dynamic late penalties for pending or overdue bills.
 */
export async function getResidentBills(houseId: string): Promise<BillWithDetails[]> {
  const supabase = await createSupabaseServerClient()
  const society = await getSocietyConfig()
  if (!society) return []

  const { data, error } = await supabase
    .from('bills')
    .select('*, house:houses(*, block:blocks(id, name))')
    .eq('house_id', houseId)
    .in('status', ['pending', 'overdue', 'paid', 'waived'])
    .order('billing_month', { ascending: false })

  if (error) {
    console.error('[getResidentBills]', error.message)
    return []
  }

  const bills = data as BillWithDetails[]

  return bills.map(bill => {
    if (bill.status === 'pending' || bill.status === 'overdue') {
      const dynamicPenalty = calculateDynamicPenalty(
        bill.billing_month,
        society.penalty_per_day,
        society.payment_window_end,
        bill.penalty_waived
      )
      const currentPayable = calculateGrandTotal(
        bill.maintenance_amount,
        bill.water_bill_amount ?? 0,
        dynamicPenalty
      )

      let currentStatus = bill.status
      if (dynamicPenalty > 0 && bill.status === 'pending') {
        currentStatus = 'overdue'
      }

      return {
        ...bill,
        status: currentStatus,
        penalty_amount: dynamicPenalty,
        final_amount: currentPayable
      }
    }

    return {
      ...bill,
      penalty_amount: bill.penalty_amount ?? 0,
      final_amount: bill.final_amount ?? calculateGrandTotal(
        bill.maintenance_amount,
        bill.water_bill_amount ?? 0,
        bill.penalty_amount ?? 0
      )
    }
  })
}

/**
 * Fetches a single bill by its ID, applying dynamic penalty calculations.
 */
export async function getBillById(billId: string): Promise<BillWithDetails | null> {
  const supabase = await createSupabaseServerClient()
  const society = await getSocietyConfig()
  if (!society) return null

  const { data, error } = await supabase
    .from('bills')
    .select('*, house:houses(*, block:blocks(id, name))')
    .eq('id', billId)
    .maybeSingle()

  if (error || !data) {
    console.error('[getBillById]', error?.message)
    return null
  }

  const bill = data as BillWithDetails

  if (bill.status === 'pending' || bill.status === 'overdue') {
    const dynamicPenalty = calculateDynamicPenalty(
      bill.billing_month,
      society.penalty_per_day,
      society.payment_window_end,
      bill.penalty_waived
    )
    const currentPayable = calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      dynamicPenalty
    )

    let currentStatus = bill.status
    if (dynamicPenalty > 0 && bill.status === 'pending') {
      currentStatus = 'overdue'
    }

    return {
      ...bill,
      status: currentStatus,
      penalty_amount: dynamicPenalty,
      final_amount: currentPayable
    }
  }

  return {
    ...bill,
    penalty_amount: bill.penalty_amount ?? 0,
    final_amount: bill.final_amount ?? calculateGrandTotal(
      bill.maintenance_amount,
      bill.water_bill_amount ?? 0,
      bill.penalty_amount ?? 0
    )
  }
}
