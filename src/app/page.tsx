// Root page — redirects to appropriate home based on auth state
// This is a server component — redirect happens before any client JS executes

import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { ROLE_HOME_ROUTES } from '@/types/roles'

export default async function RootPage() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect('/login')
  }

  redirect(ROLE_HOME_ROUTES[profile.role])
}
