// =============================================================================
// RESIDENTS FEATURE — Server Queries
// All use createSupabaseServerClient — RLS enforced.
// =============================================================================

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { House, FamilyMember, Block } from '@/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// Extended types
// ─────────────────────────────────────────────────────────────────────────────

export interface HouseWithBlock extends House {
  block: Pick<Block, 'id' | 'name'>
}

/** A family member enriched with their app access status */
export interface FamilyMemberWithAccess extends FamilyMember {
  app_user_id: string | null
  app_user_active: boolean
  app_user_email: string | null
}

export interface HouseWithDetails extends HouseWithBlock {
  family_members: FamilyMemberWithAccess[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all houses for the current society with block info
// ─────────────────────────────────────────────────────────────────────────────

export async function getHouses(filters?: {
  blockId?: string
  search?: string
  occupancy?: string
  isActive?: boolean
}): Promise<HouseWithBlock[]> {
  console.log('[getHouses] Init: Fetching houses with filters:', filters)
  const supabase = await createSupabaseServerClient()

  // Use React Cache instead of making sequential network auth lookups
  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()

  if (!profile?.society_id) {
    console.error('[getHouses] No society_id found on profile')
    return []
  }

  console.log('[getHouses] Profile loaded. Society ID:', profile.society_id, 'Role:', profile.role)

  let query = supabase
    .from('houses')
    .select('*, block:blocks(id, name)')
    .eq('society_id', profile.society_id)
    .order('house_number', { ascending: true })

  if (filters?.blockId) query = query.eq('block_id', filters.blockId)
  if (filters?.occupancy) query = query.eq('occupancy_status', filters.occupancy)
  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive)
  if (filters?.search) {
    const q = filters.search.trim()
    query = query.or(`house_number.ilike.%${q}%,owner_name.ilike.%${q}%,tenant_name.ilike.%${q}%,primary_contact_phone.ilike.%${q}%,owner_phone.ilike.%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getHouses] Query error:', error.message, error.details, error.hint)
    return []
  }

  console.log(`[getHouses] Success. Fetched ${data?.length || 0} houses.`)
  return (data ?? []) as HouseWithBlock[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Get a single house with all details and family members
// ─────────────────────────────────────────────────────────────────────────────

export async function getHouseById(houseId: string): Promise<HouseWithDetails | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('houses')
    .select('*, block:blocks(id, name), family_members(*)')
    .eq('id', houseId)
    .single()

  if (error) {
    console.error('[getHouseById]', error.message)
    return null
  }

  if (!data) return null

  // Enrich family members with their app access status
  const members = (data.family_members ?? []) as FamilyMember[]
  
  // Batch-fetch all linked user accounts for this house's family members
  const memberIds = members.map(m => m.id)
  let linkedUsers: Array<{ id: string; linked_family_member_id: string; is_active: boolean }> = []

  if (memberIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, linked_family_member_id, is_active')
      .in('linked_family_member_id', memberIds)

    linkedUsers = (usersData ?? []) as typeof linkedUsers
  }

  // Also fetch email from auth metadata if available (via users table join)
  const enrichedMembers: FamilyMemberWithAccess[] = members.map(member => {
    const linkedUser = linkedUsers.find(u => u.linked_family_member_id === member.id)
    return {
      ...member,
      app_user_id: linkedUser?.id ?? null,
      app_user_active: linkedUser?.is_active ?? false,
      app_user_email: null, // Email is stored in auth.users, not exposed here for security
    }
  })

  return {
    ...data,
    family_members: enrichedMembers,
  } as HouseWithDetails
}

// ─────────────────────────────────────────────────────────────────────────────
// Get family members for a specific house
// ─────────────────────────────────────────────────────────────────────────────

export async function getFamilyMembers(houseId: string): Promise<FamilyMember[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('house_id', houseId)
    .order('is_primary_contact', { ascending: false })
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[getFamilyMembers]', error.message)
    return []
  }

  return (data ?? []) as FamilyMember[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Get house count per block (for block list display)
// ─────────────────────────────────────────────────────────────────────────────

export async function getBlocksWithHouseCount(): Promise<
  Array<Block & { house_count: number }>
> {
  console.log('[getBlocksWithHouseCount] Init')
  const supabase = await createSupabaseServerClient()

  // Use React Cache instead of making sequential network auth lookups
  const { getCurrentUserProfile } = await import('@/lib/auth/utils')
  const profile = await getCurrentUserProfile()

  if (!profile?.society_id) {
    console.error('[getBlocksWithHouseCount] Missing society_id')
    return []
  }

  const { data, error } = await supabase.rpc('rpc_get_blocks_with_count', {
    p_society_id: profile.society_id
  })

  if (error || !data) {
    console.error('[getBlocksWithHouseCount] RPC Error:', error?.message)
    return []
  }

  console.log(`[getBlocksWithHouseCount] Success. Fetched blocks via RPC.`)
  return data as Array<Block & { house_count: number }>
}
