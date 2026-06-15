// =============================================================================
// RESIDENT ROUTE — /resident/notices/page.tsx
// Read-only view of all published society notices for residents.
// Real-time updates via NoticesClient subscription.
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ResidentNoticesClient from './ResidentNoticesClient'

export const metadata: Metadata = { title: 'Society Notices' }

export default async function ResidentNoticesPage() {
  const supabase = await createSupabaseServerClient()

  // Verify resident role
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, society_id')
    .eq('id', userData.user.id)
    .single()

  if (!profile || profile.role !== 'resident') redirect('/login')

  // Fetch only published notices for residents
  const { data: notices } = await supabase
    .from('notices')
    .select(`
      *,
      publisher:users(full_name)
    `)
    .eq('society_id', profile.society_id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="p-4 animate-fade-in pb-20">
      {/* Page Header */}
      <div className="pt-4 pb-6 border-b mb-6" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#8C8680' }}>
          Shyamved Residency
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#2D2A26' }}>
          Society Notices
        </h1>
        <p className="text-xs mt-1" style={{ color: '#54504B' }}>
          Stay up to date with announcements and updates from management
        </p>
      </div>

      <ResidentNoticesClient
        initialNotices={notices || []}
        currentUserId={userData.user.id}
      />
    </div>
  )
}
