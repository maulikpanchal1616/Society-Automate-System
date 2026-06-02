// =============================================================================
// SOCIETY FEATURE — Server Queries (read-only, server components)
// Use createSupabaseServerClient (RLS enforced via user JWT)
// =============================================================================

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Society, Block, WaterRate } from '@/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// Get current society for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────

export async function getSociety(): Promise<Society | null> {
  const supabase = await createSupabaseServerClient()

  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()

  if (!profile?.society_id) return null

  const { data, error } = await supabase
    .from('societies')
    .select('*')
    .eq('id', profile.society_id)
    .single()

  if (error) {
    console.error('[getSociety]', error.message)
    return null
  }

  return data as Society
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all blocks for the current society
// ─────────────────────────────────────────────────────────────────────────────

export async function getBlocks(): Promise<Block[]> {
  const supabase = await createSupabaseServerClient()

  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()

  if (!profile?.society_id) return []

  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('society_id', profile.society_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('[getBlocks]', error.message)
    return []
  }

  return (data ?? []) as Block[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all water rates (history + active) for current society
// ─────────────────────────────────────────────────────────────────────────────

export async function getWaterRates(): Promise<WaterRate[]> {
  const supabase = await createSupabaseServerClient()

  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()

  if (!profile?.society_id) return []

  const { data, error } = await supabase
    .from('water_rates')
    .select('*')
    .eq('society_id', profile.society_id)
    .order('effective_from', { ascending: false })

  if (error) {
    console.error('[getWaterRates]', error.message)
    return []
  }

  return (data ?? []) as WaterRate[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Get the currently active water rate
// ─────────────────────────────────────────────────────────────────────────────

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
    .single()

  if (error) return null
  return data as WaterRate
}
