'use server'

// =============================================================================
// AUTH SERVER ACTIONS
// All authentication mutations happen server-side.
// Client components call these actions — no direct Supabase calls from client.
// =============================================================================

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROLE_HOME_ROUTES } from '@/types/roles'
import type { UserRole } from '@/types/roles'

// ─────────────────────────────────────────────────────────────────────────────
// Result type for server actions
// ─────────────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// Sign in with email and password (for Chairman and Office Man)
// ─────────────────────────────────────────────────────────────────────────────

export async function signInWithEmail(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('[SERVER ACTION] signInWithEmail started')
  console.log('[SERVER ACTION] Email:', email)

  if (!email || !password) {
    console.log('[SERVER ACTION] Error: Missing email or password')
    return { success: false, error: 'Email and password are required' }
  }

  const supabase = await createSupabaseServerClient()
  
  console.log('[SERVER ACTION] Calling supabase.auth.signInWithPassword...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log(
    '[SERVER ACTION] Supabase response - User ID:',
    data?.user?.id || 'None',
    '| Error:',
    error?.message || 'None'
  )

  if (error) {
    console.log('[SERVER ACTION] Auth error:', error.message)
    return { success: false, error: error.message || 'Invalid login credentials. Please try again.' }
  }

  if (!data.user) {
    console.log('[SERVER ACTION] No user data returned to client')
    return { success: false, error: 'Authentication failed. Please try again.' }
  }

  console.log('[SERVER ACTION] Fetching user profile for ID:', data.user.id)
  // Fetch user profile to determine redirect destination
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  console.log('[SERVER ACTION] Profile response:', profile, '| Error:', profileError?.message || 'None')

  if (!profile) {
    console.log('[SERVER ACTION] Profile not found, signing out')
    await supabase.auth.signOut()
    return { success: false, error: 'User profile not found. Contact your administrator.' }
  }

  if (!profile.is_active) {
    console.log('[SERVER ACTION] Account deactivated, signing out')
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been deactivated. Contact your administrator.' }
  }

  console.log('[SERVER ACTION] Initiating redirect flow to:', ROLE_HOME_ROUTES[profile.role as UserRole])
  revalidatePath('/', 'layout')
  redirect(ROLE_HOME_ROUTES[profile.role as UserRole])
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign in with phone OTP — Step 1: Send OTP
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPhoneOtp(
  phone: string
): Promise<ActionResult<{ phone: string }>> {
  if (!phone) {
    return { success: false, error: 'Phone number is required' }
  }

  // Normalize phone number — add +91 if not present
  const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  })

  if (error) {
    return { success: false, error: 'Failed to send OTP. Please verify the phone number and try again.' }
  }

  return { success: true, data: { phone: normalizedPhone } }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign in with phone OTP — Step 2: Verify OTP
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<ActionResult> {
  if (!phone || !token) {
    return { success: false, error: 'Phone number and OTP are required' }
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) {
    return { success: false, error: 'Invalid or expired OTP. Please try again.' }
  }

  if (!data.user) {
    return { success: false, error: 'Verification failed. Please try again.' }
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return { success: false, error: 'User profile not found. Contact your administrator.' }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been deactivated. Contact your administrator.' }
  }

  revalidatePath('/', 'layout')
  redirect(ROLE_HOME_ROUTES[profile.role as UserRole])
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign out
// ─────────────────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
