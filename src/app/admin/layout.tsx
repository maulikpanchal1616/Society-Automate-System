// Admin layout — Chairman route group

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import AdminSidebarNav from '@/components/layout/AdminSidebarNav'
import MobileSidebar from '@/components/layout/MobileSidebar'
import SignOutButton from '@/components/layout/SignOutButton'

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Admin | Shyamved Residency',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'chairman') {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh flex" style={{ background: '#F5F1EB' }}>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50 glass-panel border-r" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center shrink-0 p-1.5" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
              <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#2D2A26' }}>Shyamved Residency</p>
              <p className="text-xs font-semibold" style={{ color: '#C56E4D' }}>Chairman</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <AdminSidebarNav />

        {/* User footer */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white gradient-brand shadow-sm">
              {profile.full_name?.[0]?.toUpperCase() ?? 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#2D2A26' }}>{profile.full_name ?? 'Chairman'}</p>
              <p className="text-xs" style={{ color: '#8C8680' }}>Chairman</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-panel border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
        <div className="flex items-center gap-2">
          <MobileSidebar 
            userInitials={profile.full_name?.[0]?.toUpperCase() ?? 'C'}
            userName={profile.full_name ?? 'Chairman'}
            userRole="Chairman"
          >
            <AdminSidebarNav />
          </MobileSidebar>
          
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border flex items-center justify-center p-1" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
              <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold" style={{ color: '#2D2A26' }}>Shyamved</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block" style={{ color: '#C56E4D', background: 'rgba(197,110,77,0.1)' }}>Chairman</span>
          <SignOutButton compact />
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="p-4 pt-20 md:p-6 md:pt-24 lg:p-8 lg:pt-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
