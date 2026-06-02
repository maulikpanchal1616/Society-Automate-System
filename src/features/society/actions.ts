'use server'

// =============================================================================
// SOCIETY FEATURE — Server Actions
// Pattern: requireRole → Zod validate → DB mutation → audit log → revalidate
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireChairman, requireAdmin } from '@/lib/auth/utils'
import { writeAuditLog } from '@/lib/audit/logger'
import {
  UpdateSocietySettingsSchema,
  CreateWaterRateSchema,
  CreateBlockSchema,
} from './schemas'
import type { ActionResult } from '@/features/auth/actions'
import type { Json } from '@/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// 1. UPDATE SOCIETY SETTINGS (Chairman only)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSocietySettings(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireChairman()
    const supabase = await createSupabaseServerClient()

    // Validate input
    const parsed = UpdateSocietySettingsSchema.safeParse(input)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError.message }
    }

    const data = parsed.data

    // Fetch current for audit diff
    const { data: current } = await supabase
      .from('societies')
      .select('*')
      .eq('id', profile.society_id)
      .single()

    const { error } = await supabase
      .from('societies')
      .update({
        name: data.name,
        address: data.address || null,
        maintenance_amount: data.maintenance_amount,
        payment_window_start: data.payment_window_start,
        payment_window_end: data.payment_window_end,
        penalty_per_day: data.penalty_per_day,
      })
      .eq('id', profile.society_id)

    if (error) {
      console.error('[updateSocietySettings]', error.message)
      return { success: false, error: 'Failed to update society settings. Please try again.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'settings_updated',
      entityType: 'societies',
      entityId: profile.society_id,
      previousValue: current as unknown as Json,
      newValue: data as unknown as Json,
    })

    revalidatePath('/admin/society/settings')
    return { success: true, data: { id: profile.society_id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized'
    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return { success: false, error: 'You do not have permission to update society settings.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CREATE WATER RATE (Chairman only)
// Closes the current active rate before inserting new one.
// ─────────────────────────────────────────────────────────────────────────────

export async function createWaterRate(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireChairman()
    const supabase = await createSupabaseServerClient()

    const parsed = CreateWaterRateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { price_per_unit, effective_from } = parsed.data

    // Close current active rate (set effective_to = new effective_from - 1 day)
    const { data: activeRate } = await supabase
      .from('water_rates')
      .select('id, effective_from')
      .eq('society_id', profile.society_id)
      .is('effective_to', null)
      .single()

    if (activeRate) {
      // Calculate day before new effective_from
      const newFrom = new Date(effective_from)
      const dayBefore = new Date(newFrom)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const effectiveTo = dayBefore.toISOString().split('T')[0]

      await supabase
        .from('water_rates')
        .update({ effective_to: effectiveTo })
        .eq('id', activeRate.id)
    }

    // Insert new rate
    const { data: newRate, error } = await supabase
      .from('water_rates')
      .insert({
        society_id: profile.society_id,
        price_per_unit,
        effective_from,
        effective_to: null,
        created_by: profile.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createWaterRate]', error.message)
      return { success: false, error: 'Failed to create water rate. Please try again.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'settings_updated',
      entityType: 'water_rates',
      entityId: newRate.id,
      newValue: { price_per_unit, effective_from } as unknown as Json,
    })

    revalidatePath('/admin/society/settings')
    return { success: true, data: { id: newRate.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return { success: false, error: 'Only the Chairman can manage water rates.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CREATE BLOCK (Admin — Chairman or Office Man)
// ─────────────────────────────────────────────────────────────────────────────

export async function createBlock(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireAdmin()
    const supabase = await createSupabaseServerClient()

    const parsed = CreateBlockSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    // Normalize block name to uppercase
    const name = parsed.data.name.toUpperCase()

    const { data: block, error } = await supabase
      .from('blocks')
      .insert({ society_id: profile.society_id, name })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Block "${name}" already exists in this society.` }
      }
      console.error('[createBlock]', error.message)
      return { success: false, error: 'Failed to create block. Please try again.' }
    }

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'house_created',
      entityType: 'blocks',
      entityId: block.id,
      newValue: { name } as unknown as Json,
    })

    revalidatePath('/admin/residents', 'layout')
    revalidatePath('/office/residents', 'layout')
    return { success: true, data: { id: block.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return { success: false, error: 'You do not have permission to create blocks.' }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DELETE BLOCK (Chairman only — only if no houses exist in it)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteBlock(
  blockId: string
): Promise<ActionResult> {
  try {
    const profile = await requireChairman()
    const supabase = await createSupabaseServerClient()

    // Check no houses exist in this block
    const { count } = await supabase
      .from('houses')
      .select('id', { count: 'exact', head: true })
      .eq('block_id', blockId)

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete block — it contains ${count} house(s). Remove all houses first.`,
      }
    }

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)
      .eq('society_id', profile.society_id)

    if (error) {
      console.error('[deleteBlock]', error.message)
      return { success: false, error: 'Failed to delete block.' }
    }

    revalidatePath('/admin/residents', 'layout')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Only the Chairman can delete blocks.' }
  }
}
