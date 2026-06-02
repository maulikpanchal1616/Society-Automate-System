'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { revalidatePath } from 'next/cache'
import { expenseFormSchema, ExpenseFormValues } from './schemas'
import { writeAuditLog } from '@/lib/audit/logger'

type ActionResponse = {
  success: boolean
  error?: string
  data?: any
}

// 1. Create Expense
export async function createExpenseAction(data: ExpenseFormValues): Promise<ActionResponse> {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }
    
    if (profile.role !== 'chairman' && profile.role !== 'office_man') {
      return { success: false, error: 'Permission denied' }
    }

    const parsed = expenseFormSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    // Default to 'draft' when created
    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert({
        society_id: profile.society_id,
        title: parsed.title,
        category: parsed.category,
        amount: parsed.amount,
        expense_date: parsed.expense_date,
        paid_to: parsed.paid_to,
        payment_mode: parsed.payment_mode,
        notes: parsed.notes || null,
        attachment_url: parsed.attachment_url || null,
        created_by: profile.id,
        status: 'draft'
      })
      .select()
      .single()

    if (error || !inserted) throw error

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'expense_created',
      entityType: 'expenses',
      entityId: inserted.id,
      newValue: inserted
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/office/expenses')
    
    return { success: true, data: inserted }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create expense' }
  }
}

// 2. Update Expense
export async function updateExpenseAction(id: string, data: ExpenseFormValues): Promise<ActionResponse> {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase = await createSupabaseServerClient()
    
    // Fetch current to check status
    const { data: existing } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Expense not found' }

    // Enforce Role Rules
    if (existing.status !== 'draft') {
      // If it's approved or locked, ONLY Chairman can edit (or no one if Locked)
      if (existing.status === 'locked') {
        return { success: false, error: 'Locked expenses cannot be modified' }
      }
      if (profile.role === 'office_man') {
        return { success: false, error: 'Office Managers cannot modify approved expenses' }
      }
    }

    const parsed = expenseFormSchema.parse(data)

    const { data: updated, error } = await supabase
      .from('expenses')
      .update({
        title: parsed.title,
        category: parsed.category,
        amount: parsed.amount,
        expense_date: parsed.expense_date,
        paid_to: parsed.paid_to,
        payment_mode: parsed.payment_mode,
        notes: parsed.notes || null,
        attachment_url: parsed.attachment_url || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) throw error

    // Only log if something actually changed (for simplicity we log the update)
    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'expense_updated',
      entityType: 'expenses',
      entityId: id,
      previousValue: existing,
      newValue: updated
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/office/expenses')
    
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update expense' }
  }
}

// 3. Delete Expense
export async function deleteExpenseAction(id: string): Promise<ActionResponse> {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const supabase = await createSupabaseServerClient()
    
    const { data: existing } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Expense not found' }

    if (existing.status !== 'draft') {
      if (existing.status === 'locked') {
        return { success: false, error: 'Locked expenses cannot be deleted' }
      }
      if (profile.role === 'office_man') {
        return { success: false, error: 'Office Managers cannot delete approved expenses' }
      }
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: 'expense_deleted',
      entityType: 'expenses',
      entityId: id,
      previousValue: existing
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/office/expenses')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete expense' }
  }
}

// 4. Change Status (Approve / Lock)
export async function changeExpenseStatusAction(id: string, newStatus: 'approved' | 'locked'): Promise<ActionResponse> {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) return { success: false, error: 'Unauthorized' }

    if (profile.role !== 'chairman') {
      return { success: false, error: 'Only the Chairman can approve or lock expenses' }
    }

    const supabase = await createSupabaseServerClient()
    
    const { data: existing } = await supabase
      .from('expenses')
      .select('status')
      .eq('id', id)
      .single()

    if (!existing) return { success: false, error: 'Expense not found' }
    if (existing.status === 'locked') {
      return { success: false, error: 'Expense is already locked immutably' }
    }

    const { data: updated, error } = await supabase
      .from('expenses')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) throw error

    await writeAuditLog({
      societyId: profile.society_id,
      actorId: profile.id,
      actorRole: profile.role,
      actionType: newStatus === 'approved' ? 'expense_approved' : 'expense_locked',
      entityType: 'expenses',
      entityId: id,
      previousValue: { status: existing.status },
      newValue: { status: newStatus }
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/office/expenses')
    
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to change status' }
  }
}
