// =============================================================================
// AUTH UTILITIES — Server-side session and user retrieval
// Used by server actions, route handlers, and server components.
// =============================================================================

import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types/database'
import type { UserRole } from '@/types/roles'

// ─────────────────────────────────────────────────────────────────────────────
// Get the current authenticated user from Supabase Auth
// Returns null if not authenticated — use getAuthenticatedUser for strict check
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) return null
  return session.user
})

// ─────────────────────────────────────────────────────────────────────────────
// Get the current user's profile (role, society_id, house_id, etc.)
// Returns null if not authenticated or profile not found
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null
  const user = session.user

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return data as UserProfile
})

// ─────────────────────────────────────────────────────────────────────────────
// Require authentication — throws if not authenticated
// Use at the start of server actions that require login
// ─────────────────────────────────────────────────────────────────────────────
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }

  return user
}

// ─────────────────────────────────────────────────────────────────────────────
// Require a specific role — throws if role doesn't match
// Use at the start of server actions that require specific permissions
//
// Example:
//   const profile = await requireRole(['chairman', 'office_man'])
// ─────────────────────────────────────────────────────────────────────────────
export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new Error('Unauthorized: Authentication required')
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(
      `Forbidden: Role '${profile.role}' is not authorized for this action`
    )
  }

  if (!profile.is_active) {
    throw new Error('Forbidden: Your account has been deactivated')
  }

  return profile
}

// ─────────────────────────────────────────────────────────────────────────────
// Require Chairman role specifically
// ─────────────────────────────────────────────────────────────────────────────
export async function requireChairman(): Promise<UserProfile> {
  return requireRole(['chairman'])
}

// ─────────────────────────────────────────────────────────────────────────────
// Require Admin role (Chairman or Office Man)
// ─────────────────────────────────────────────────────────────────────────────
export async function requireAdmin(): Promise<UserProfile> {
  return requireRole(['chairman', 'office_man'])
}

// ─────────────────────────────────────────────────────────────────────────────
// Require Resident role
// ─────────────────────────────────────────────────────────────────────────────
export async function requireResident(): Promise<UserProfile> {
  return requireRole(['resident'])
}
