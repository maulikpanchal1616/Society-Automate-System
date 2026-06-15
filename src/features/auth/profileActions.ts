'use server'

// =============================================================================
// RESIDENT PROFILE ACTIONS — Server Actions
// Pattern: requireResident → Validate → DB update → revalidate
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireResident } from '@/lib/auth/utils'
import type { ActionResult } from '@/features/auth/actions'

// ─────────────────────────────────────────────────────────────────────────────
// 1. UPDATE DISPLAY NAME
// ─────────────────────────────────────────────────────────────────────────────
export async function updateResidentName(
  fullName: string
): Promise<ActionResult> {
  try {
    const profile = await requireResident()

    const trimmed = fullName?.trim()
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' }
    }
    if (trimmed.length > 80) {
      return { success: false, error: 'Name must be under 80 characters.' }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('users')
      .update({ full_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      console.error('[updateResidentName]', error.message)
      return { success: false, error: 'Failed to update name. Please try again.' }
    }

    revalidatePath('/resident', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'Authentication required.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. UPDATE PHONE NUMBER
// ─────────────────────────────────────────────────────────────────────────────
export async function updateResidentPhone(
  phone: string
): Promise<ActionResult> {
  try {
    const profile = await requireResident()

    const trimmed = phone?.trim()
    if (!trimmed) {
      return { success: false, error: 'Phone number is required.' }
    }
    // Allow 10-digit Indian numbers (with or without +91)
    const cleaned = trimmed.replace(/[\s\-()]/g, '')
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/
    if (!phoneRegex.test(cleaned)) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('users')
      .update({ phone: cleaned, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      console.error('[updateResidentPhone]', error.message)
      return { success: false, error: 'Failed to update phone. Please try again.' }
    }

    revalidatePath('/resident', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'Authentication required.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHANGE PASSWORD (resident self-service, not forced reset)
// ─────────────────────────────────────────────────────────────────────────────
export async function changeResidentPassword(
  newPassword: string,
  confirmPassword: string
): Promise<ActionResult> {
  try {
    await requireResident()

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' }
    }
    if (newPassword.length > 72) {
      return { success: false, error: 'Password is too long (max 72 characters).' }
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      console.error('[changeResidentPassword]', error.message)
      // Supabase returns a specific message when same password is reused
      if (error.message.toLowerCase().includes('same')) {
        return { success: false, error: 'New password must be different from the current password.' }
      }
      return { success: false, error: 'Failed to update password. Please try again.' }
    }

    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'Authentication required.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
