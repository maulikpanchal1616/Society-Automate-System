// Office layout — Operations Manager route group

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import OfficeSidebarNav from '@/components/layout/OfficeSidebarNav'
import MobileSidebar from '@/components/layout/MobileSidebar'
import SignOutButton from '@/components/layout/SignOutButton'

export const metadata: Metadata = {
  title: {
    default: 'Operations Dashboard',
    template: '%s | Office | Shyamved Residency',
  },
}

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'office_man') {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh flex" style={{ background: '#F5F1EB' }}>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50 glass-panel border-r" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <Link href="/office/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center shrink-0 p-1.5" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
              <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#2D2A26' }}>Shyamved Residency</p>
              <p className="text-xs font-semibold" style={{ color: '#B79B6C' }}>Operations</p>
            </div>
          </Link>
        </div>

        <OfficeSidebarNav />

        <div className="p-4 border-t" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #B79B6C, #9E8357)' }}>
              {profile.full_name?.[0]?.toUpperCase() ?? 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#2D2A26' }}>{profile.full_name ?? 'Office Manager'}</p>
              <p className="text-xs" style={{ color: '#8C8680' }}>Office Manager</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-panel border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
        <div className="flex items-center gap-2">
          <MobileSidebar 
            userInitials={profile.full_name?.[0]?.toUpperCase() ?? 'O'}
            userName={profile.full_name ?? 'Office Manager'}
            userRole="Office Manager"
          >
            <OfficeSidebarNav />
          </MobileSidebar>
          <Link href="/office/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border flex items-center justify-center p-1" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
              <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold" style={{ color: '#2D2A26' }}>Shyamved</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block" style={{ color: '#B79B6C', background: 'rgba(183,155,108,0.1)' }}>Office</span>
          <SignOutButton compact />
        </div>
      </div>

      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="p-4 pt-[4.5rem] lg:pt-6 md:p-6 lg:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
