import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NoticesClient from '@/features/notices/components/NoticesClient'

export default async function OfficeNoticesPage() {
  const supabase = await createSupabaseServerClient()

  // Verify Office Manager role
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, society_id')
    .eq('id', userData.user.id)
    .single()

  if (!profile || profile.role !== 'office_man') redirect('/login')

  // Fetch all notices for the society
  const { data: notices } = await supabase
    .from('notices')
    .select(`
      *,
      publisher:users(full_name)
    `)
    .eq('society_id', profile.society_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Notices & Events</h1>
          <p className="text-sm mt-1" style={{ color: '#8C8680' }}>Manage operations announcements</p>
        </div>
      </div>

      <NoticesClient initialNotices={notices || []} isAdmin={false} currentUserId={userData.user.id} />
    </div>
  )
}
