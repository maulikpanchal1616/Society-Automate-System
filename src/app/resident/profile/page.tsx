// =============================================================================
// RESIDENT ROUTE — /resident/profile/page.tsx
// Server Component — fetches profile + house data and passes to client form.
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ResidentProfileClient from './ResidentProfileClient'

export const metadata: Metadata = { title: 'My Profile' }

export default async function ResidentProfilePage() {
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'resident') {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()

  // Fetch email from auth
  const { data: authData } = await supabase.auth.getUser()
  const email = authData?.user?.email ?? null

  // Fetch house + block info if the resident is linked to a house
  let house: {
    house_number: string
    owner_name: string
    occupancy_status: string
    primary_contact_phone: string
    floor: number | null
    block: { name: string }
  } | null = null

  if (profile.house_id) {
    const { data: houseData } = await supabase
      .from('houses')
      .select(`
        house_number,
        owner_name,
        occupancy_status,
        primary_contact_phone,
        floor,
        block:blocks(name)
      `)
      .eq('id', profile.house_id)
      .single()

    if (houseData) {
      house = {
        ...houseData,
        block: Array.isArray(houseData.block) ? houseData.block[0] : houseData.block,
      }
    }
  }

  return (
    <div className="p-4 animate-fade-in pb-20 max-w-lg mx-auto">
      {/* Page Header */}
      <div className="pt-4 pb-6">
        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#8C8680' }}>
          Shyamved Residency
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#2D2A26' }}>
          My Profile
        </h1>
        <p className="text-xs mt-1" style={{ color: '#54504B' }}>
          View and manage your account details
        </p>
      </div>

      <ResidentProfileClient
        profile={{
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          email,
          house_id: profile.house_id,
        }}
        house={house}
      />
    </div>
  )
}
