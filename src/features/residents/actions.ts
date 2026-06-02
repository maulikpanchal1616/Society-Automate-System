'use server'

// =============================================================================
// RESIDENTS FEATURE — Server Actions
// Pattern: requireAdmin/requireChairman → Zod → DB → audit → revalidate
// =============================================================================

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireAdmin, requireChairman, requireResident } from '@/lib/auth/utils'
import { writeAuditLog } from '@/lib/audit/logger'
import {
  CreateHouseSchema,
  UpdateHouseSchema,
  CreateFamilyMemberSchema,
} from './schemas'
import type { ActionResult } from '@/features/auth/actions'
import type { Json } from '@/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE HOUSE
// ─────────────────────────────────────────────────────────────────────────────

export async function createHouse(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const parsed = CreateHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const d = parsed.data

    // Verify block belongs to this society
    const { data: block } = await supabase
      .from('blocks')
      .select('id, name')
      .eq('id', d.block_id)
      .eq('society_id', profile.society_id)
      .single()

    if (!block) {
      return { success: false, error: 'Invalid block selected.' }
    }

    // Build full house_number if not already prefixed with block name
    const houseNumber = d.house_number.toUpperCase().startsWith(block.name.toUpperCase())
      ? d.house_number.toUpperCase()
      : `${block.name.toUpperCase()}-${d.house_number.toUpperCase()}`

    const { data: house, error } = await supabase
      .from('houses')
      .insert({
        society_id: profile.society_id,
        block_id: d.block_id,
        house_number: houseNumber,
        floor: d.floor ?? null,
        occupancy_status: d.occupancy_status,
        owner_name: d.owner_name,
        owner_phone: d.owner_phone,
        owner_email: d.owner_email || null,
        tenant_name: d.tenant_name || null,
        tenant_phone: d.tenant_phone || null,
        primary_contact_phone: d.primary_contact_phone,
        water_meter_id: d.water_meter_id || null,
        is_active: d.is_active,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: `House number "${houseNumber}" already exists in this society.`,
        }
      }
      console.error('[createHouse]', error.message)
      return { success: false, error: 'Failed to create house. Please try again.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'house_created',
      entityType: 'houses',
      entityId: house.id,
      newValue: { houseNumber, ownerId: d.owner_name } as unknown as Json,
    })

    revalidatePath('/admin/residents')
    revalidatePath('/office/residents')
    return { success: true, data: { id: house.id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'You do not have permission to create houses.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. UPDATE HOUSE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateHouse(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const parsed = UpdateHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { id, ...fields } = parsed.data

    // Fetch previous value for audit
    const { data: previous } = await supabase
      .from('houses')
      .select('*')
      .eq('id', id)
      .eq('society_id', profile.society_id)
      .single()

    if (!previous) {
      return { success: false, error: 'House not found.' }
    }

    const updatePayload: Record<string, unknown> = {}
    if (fields.occupancy_status !== undefined) updatePayload.occupancy_status = fields.occupancy_status
    if (fields.owner_name !== undefined) updatePayload.owner_name = fields.owner_name
    if (fields.owner_phone !== undefined) updatePayload.owner_phone = fields.owner_phone
    if (fields.owner_email !== undefined) updatePayload.owner_email = fields.owner_email || null
    if (fields.tenant_name !== undefined) updatePayload.tenant_name = fields.tenant_name || null
    if (fields.tenant_phone !== undefined) updatePayload.tenant_phone = fields.tenant_phone || null
    if (fields.primary_contact_phone !== undefined) updatePayload.primary_contact_phone = fields.primary_contact_phone
    if (fields.water_meter_id !== undefined) updatePayload.water_meter_id = fields.water_meter_id || null
    if (fields.is_active !== undefined) updatePayload.is_active = fields.is_active

    const { error } = await supabase
      .from('houses')
      .update(updatePayload)
      .eq('id', id)
      .eq('society_id', profile.society_id)

    if (error) {
      console.error('[updateHouse]', error.message)
      return { success: false, error: 'Failed to update house. Please try again.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'house_updated',
      entityType: 'houses',
      entityId: id,
      previousValue: previous as unknown as Json,
      newValue: updatePayload as unknown as Json,
    })

    revalidatePath(`/admin/residents/${id}`)
    revalidatePath('/admin/residents')
    revalidatePath('/office/residents')
    return { success: true, data: { id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'You do not have permission to update houses.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEACTIVATE HOUSE (soft delete — Chairman only)
// Houses are never hard deleted — they may have billing history.
// ─────────────────────────────────────────────────────────────────────────────

export async function deactivateHouse(houseId: string): Promise<ActionResult> {
  try {
    const profile = await requireChairman()
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('houses')
      .update({ is_active: false })
      .eq('id', houseId)
      .eq('society_id', profile.society_id)

    if (error) {
      return { success: false, error: 'Failed to deactivate house.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'house_updated',
      entityType: 'houses',
      entityId: houseId,
      newValue: { is_active: false } as unknown as Json,
    })

    revalidatePath('/admin/residents')
    redirect('/admin/residents')
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'Only the Chairman can deactivate houses.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CREATE FAMILY MEMBER
// Enforces single primary contact per house at application level.
// ─────────────────────────────────────────────────────────────────────────────

export async function createFamilyMember(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const parsed = CreateFamilyMemberSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const d = parsed.data

    // If this member is being set as primary, un-set any existing primary
    if (d.is_primary_contact) {
      await supabase
        .from('family_members')
        .update({ is_primary_contact: false })
        .eq('house_id', d.house_id)
        .eq('is_primary_contact', true)
    }

    const { data: member, error } = await supabase
      .from('family_members')
      .insert({
        society_id: profile.society_id,
        house_id: d.house_id,
        full_name: d.full_name,
        relationship: d.relationship || null,
        age: d.age ?? null,
        phone: d.phone || null,
        email: d.email || null,
        is_primary_contact: d.is_primary_contact,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createFamilyMember]', error.message)
      return { success: false, error: 'Failed to add family member. Please try again.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'resident_added',
      entityType: 'family_members',
      entityId: member.id,
      newValue: { full_name: d.full_name, house_id: d.house_id } as unknown as Json,
    })

    revalidatePath(`/admin/residents/${d.house_id}`)
    return { success: true, data: { id: member.id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'You do not have permission to add family members.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SET PRIMARY CONTACT (replaces previous primary in same house)
// ─────────────────────────────────────────────────────────────────────────────

export async function setPrimaryContact(
  memberId: string,
  houseId: string
): Promise<ActionResult> {
  try {
    const profile = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    // Verify house belongs to this society
    const { data: house } = await supabase
      .from('houses')
      .select('id')
      .eq('id', houseId)
      .eq('society_id', profile.society_id)
      .single()

    if (!house) return { success: false, error: 'House not found.' }

    // Remove existing primary
    await supabase
      .from('family_members')
      .update({ is_primary_contact: false })
      .eq('house_id', houseId)

    // Set new primary
    const { error } = await supabase
      .from('family_members')
      .update({ is_primary_contact: true })
      .eq('id', memberId)
      .eq('house_id', houseId)

    if (error) {
      return { success: false, error: 'Failed to set primary contact.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'house_updated',
      entityType: 'family_members',
      entityId: memberId,
      newValue: { is_primary_contact: true, house_id: houseId } as unknown as Json,
    })

    revalidatePath(`/admin/residents/${houseId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'You do not have permission to update primary contact.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE FAMILY MEMBER (Admin — cannot delete primary contact)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteFamilyMember(
  memberId: string
): Promise<ActionResult> {
  try {
    const profile = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const { data: member } = await supabase
      .from('family_members')
      .select('id, house_id, full_name, is_primary_contact')
      .eq('id', memberId)
      .single()

    if (!member) return { success: false, error: 'Member not found.' }

    if (member.is_primary_contact) {
      return {
        success: false,
        error: 'Cannot remove the primary contact. Set another member as primary first.',
      }
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      return { success: false, error: 'Failed to remove family member.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'resident_removed',
      entityType: 'family_members',
      entityId: memberId,
      previousValue: { full_name: member.full_name, house_id: member.house_id } as unknown as Json,
    })

    revalidatePath(`/admin/residents/${member.house_id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'You do not have permission to remove family members.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GRANT APP ACCESS — Chairman creates a Supabase Auth account for a
//    family member so they can log in as a resident.
// ─────────────────────────────────────────────────────────────────────────────

export async function grantAppAccess(input: {
  family_member_id: string
  email: string
  password: string
}): Promise<ActionResult<{ userId: string; email: string }>> {
  try {
    const profile = await requireChairman()

    // Validate inputs
    if (!input.family_member_id || !input.email || !input.password) {
      return { success: false, error: 'Family member, email, and temporary password are required.' }
    }
    if (input.password.length < 6) {
      return { success: false, error: 'Temporary password must be at least 6 characters.' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    const supabase = await createSupabaseServerClient()

    // 1. Verify the family member exists and belongs to this society
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('id, full_name, phone, email, house_id, society_id')
      .eq('id', input.family_member_id)
      .eq('society_id', profile.society_id)
      .single()

    if (memberError || !member) {
      return { success: false, error: 'Family member not found in this society.' }
    }

    // 2. Check if this family member already has an app account
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('linked_family_member_id', member.id)
      .maybeSingle()

    if (existingUser) {
      if (existingUser.is_active) {
        return { success: false, error: `${member.full_name} already has an active app account.` }
      }
      // Re-activate the existing account
      await supabase
        .from('users')
        .update({ is_active: true, requires_password_reset: true })
        .eq('id', existingUser.id)

      revalidatePath(`/admin/residents/${member.house_id}`)
      return { success: true, data: { userId: existingUser.id, email: input.email } }
    }

    // 3. Create the Supabase Auth account using the Service Role client.
    //    IMPORTANT: We pass NO user_metadata here intentionally. The database
    //    trigger (handle_new_user) runs on every auth.users insert and tries
    //    to create a public.users row. If we pass metadata, the trigger might
    //    fail due to schema issues. Instead, we let the trigger attempt and
    //    fail silently (after applying the fault-tolerant trigger below), then
    //    we manually insert the profile row ourselves in step 4.
    const adminClient = createSupabaseServiceClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      // No user_metadata — we handle the public.users insert manually below
    })

    if (authError) {
      console.error('[grantAppAccess] Auth create error:', authError.message)
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return { success: false, error: 'This email is already registered. Use a different email.' }
      }
      return { success: false, error: `Failed to create account: ${authError.message}` }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create auth account. Please try again.' }
    }

    const newUserId = authData.user.id

    // 4. Manually insert the public.users profile row using the service role client.
    //    This bypasses the trigger entirely and gives us full control.
    const { error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: newUserId,
        society_id: profile.society_id,
        role: 'resident' as const,
        house_id: member.house_id,
        linked_family_member_id: member.id,
        full_name: member.full_name,
        phone: member.phone ?? null,
        is_active: true,
        requires_password_reset: true,
      }, { onConflict: 'id' })

    if (profileError) {
      // Profile insert failed — clean up the auth user so we don't leave an orphan
      console.error('[grantAppAccess] Profile insert error:', profileError.message)
      await adminClient.auth.admin.deleteUser(newUserId)
      return { success: false, error: `Failed to create user profile: ${profileError.message}` }
    }

    // 5. Update auth metadata so the JWT contains the correct claims for middleware
    await adminClient.auth.admin.updateUserById(newUserId, {
      user_metadata: {
        full_name: member.full_name,
        phone: member.phone ?? null,
        society_id: profile.society_id,
        house_id: member.house_id,
        linked_family_member_id: member.id,
        role: 'resident',
        requires_password_reset: true,
      },
    })

    // 6. Audit log
    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'resident_access_granted',
      entityType: 'users',
      entityId: newUserId,
      newValue: {
        family_member_id: member.id,
        full_name: member.full_name,
        email: input.email,
        house_id: member.house_id,
      } as unknown as Json,
    })

    revalidatePath(`/admin/residents/${member.house_id}`)
    return {
      success: true,
      data: { userId: authData.user.id, email: input.email },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      return { success: false, error: 'Only the Chairman can grant app access.' }
    }
    console.error('[grantAppAccess] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. REVOKE APP ACCESS — Chairman deactivates a resident's app account.
//    Does NOT delete the auth user — just marks public.users as inactive.
// ─────────────────────────────────────────────────────────────────────────────

export async function revokeAppAccess(
  userId: string
): Promise<ActionResult> {
  try {
    const profile = await requireChairman()
    const supabase = await createSupabaseServerClient()

    // Get the user to find their house_id for revalidation
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, house_id, linked_family_member_id, full_name, role')
      .eq('id', userId)
      .eq('society_id', profile.society_id)
      .single()

    if (!targetUser) {
      return { success: false, error: 'User not found.' }
    }

    if (targetUser.role !== 'resident') {
      return { success: false, error: 'Can only revoke access for resident accounts.' }
    }

    // Soft-deactivate
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('society_id', profile.society_id)

    if (error) {
      console.error('[revokeAppAccess]', error.message)
      return { success: false, error: 'Failed to revoke access.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'resident_access_revoked',
      entityType: 'users',
      entityId: userId,
      previousValue: { full_name: targetUser.full_name } as unknown as Json,
    })

    if (targetUser.house_id) {
      revalidatePath(`/admin/residents/${targetUser.house_id}`)
    }
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Only the Chairman can revoke app access.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ADMIN RESET PASSWORD — Chairman forcefully resets a resident's password.
// ─────────────────────────────────────────────────────────────────────────────

export async function adminResetResidentPassword(input: {
  userId: string
  newPassword: string
}): Promise<ActionResult> {
  try {
    const profile = await requireChairman()
    const supabase = await createSupabaseServerClient()

    if (!input.newPassword || input.newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }

    const { data: targetUser } = await supabase
      .from('users')
      .select('id, house_id, role')
      .eq('id', input.userId)
      .eq('society_id', profile.society_id)
      .single()

    if (!targetUser || targetUser.role !== 'resident') {
      return { success: false, error: 'Can only reset passwords for resident accounts in your society.' }
    }

    const adminClient = createSupabaseServiceClient()
    
    // Update auth password
    const { error: authError } = await adminClient.auth.admin.updateUserById(input.userId, {
      password: input.newPassword
    })

    if (authError) {
      console.error('[adminResetResidentPassword] Auth error:', authError)
      return { success: false, error: 'Failed to update authentication credentials.' }
    }

    // Force them to change it on next login
    await supabase
      .from('users')
      .update({ requires_password_reset: true })
      .eq('id', input.userId)

    if (targetUser.house_id) {
      revalidatePath(`/admin/residents/${targetUser.house_id}`)
    }
    
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: 'Only the Chairman can reset passwords.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RESET RESIDENT PASSWORD — Resident changes their temporary password.
//    Called from the forced password reset page after first login.
// ─────────────────────────────────────────────────────────────────────────────

export async function resetResidentPassword(
  newPassword: string
): Promise<ActionResult> {
  try {
    const profile = await requireResident()

    if (!profile.requires_password_reset) {
      return { success: false, error: 'Password reset is not required for this account.' }
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }

    const supabase = await createSupabaseServerClient()

    // Update the auth password
    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (pwError) {
      console.error('[resetResidentPassword] Password update error:', pwError.message)
      return { success: false, error: 'Failed to update password. Please try again.' }
    }

    // Clear the reset flag
    const { error: flagError } = await supabase
      .from('users')
      .update({ requires_password_reset: false })
      .eq('id', profile.id)

    if (flagError) {
      console.error('[resetResidentPassword] Flag clear error:', flagError.message)
      // Password was changed successfully, but flag didn't clear — non-fatal
    }

    revalidatePath('/resident', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unauthorized')) {
      return { success: false, error: 'Authentication required.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
