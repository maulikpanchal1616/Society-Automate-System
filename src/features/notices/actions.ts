'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNotice(data: any) {
  const supabase = await createSupabaseServerClient()
  
  // Get current user profile
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return { error: 'Unauthorized' }
  
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('society_id')
    .eq('id', userData.user.id)
    .single()
    
  if (profileError || !profile) return { error: 'Profile not found' }
  
  const { data: notice, error } = await supabase
    .from('notices')
    .insert([{
      ...data,
      society_id: profile.society_id,
      published_by: userData.user.id,
      published_at: data.status === 'published' ? new Date().toISOString() : null
    }])
    .select()
    .single()
    
  if (error) {
    console.error('Error creating notice:', error)
    return { error: 'Failed to create notice' }
  }
  
  revalidatePath('/admin/notices')
  revalidatePath('/office/notices')
  revalidatePath('/resident/dashboard')
  
  return { data: notice }
}

export async function updateNotice(id: string, data: any) {
  const supabase = await createSupabaseServerClient()
  
  const { data: existing, error: fetchError } = await supabase
    .from('notices')
    .select('status')
    .eq('id', id)
    .single()
    
  if (fetchError) return { error: 'Notice not found' }
  
  // Set published_at if status changes to published
  const updates = { ...data }
  if (existing.status !== 'published' && data.status === 'published') {
    updates.published_at = new Date().toISOString()
  }
  
  const { data: notice, error } = await supabase
    .from('notices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating notice:', error)
    return { error: 'Failed to update notice' }
  }
  
  revalidatePath('/admin/notices')
  revalidatePath('/office/notices')
  revalidatePath('/resident/dashboard')
  
  return { data: notice }
}

export async function archiveNotice(id: string) {
  return updateNotice(id, { status: 'archived' })
}

export async function deleteNotice(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { error } = await supabase
    .from('notices')
    .delete()
    .eq('id', id)
    
  if (error) {
    console.error('Error deleting notice:', error)
    return { error: 'Failed to delete notice' }
  }
  
  revalidatePath('/admin/notices')
  revalidatePath('/office/notices')
  revalidatePath('/resident/dashboard')
  
  return { success: true }
}

// Events
export async function createEvent(data: any) {
  const supabase = await createSupabaseServerClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return { error: 'Unauthorized' }
  
  const { data: profile } = await supabase
    .from('users')
    .select('society_id')
    .eq('id', userData.user.id)
    .single()
    
  if (!profile) return { error: 'Profile not found' }
  
  const { data: event, error } = await supabase
    .from('events')
    .insert([{
      ...data,
      society_id: profile.society_id,
      published_by: userData.user.id
    }])
    .select()
    .single()
    
  if (error) {
    console.error('Error creating event:', error)
    return { error: 'Failed to create event' }
  }
  
  revalidatePath('/admin/notices')
  revalidatePath('/office/notices')
  revalidatePath('/resident/dashboard')
  
  return { data: event }
}
