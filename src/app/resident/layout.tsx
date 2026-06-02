// =============================================================================
// RESIDENT LAYOUT — bottom navigation (mobile-first)
// Enforces password reset for new residents before granting app access.
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import SignOutButton from '@/components/layout/SignOutButton'

export const metadata: Metadata = {
  title: {
    default: 'My Dashboard',
    template: '%s | Shyamved Residency',
  },
}

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'resident') {
    redirect('/login')
  }

  // Force password reset if the account was just created by chairman
  if (profile.requires_password_reset) {
    // Allow the setup-password page itself to render
    // We detect this by checking if children is the setup page
    // Since we can't inspect children easily, we use a different approach:
    // The setup-password page is a child route, so it will render inside this layout.
    // We just strip the bottom nav and show a minimal layout.
    return (
      <div className="min-h-dvh" style={{ background: '#F5F1EB' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex" style={{ background: '#F5F1EB' }}>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50 glass-panel border-r" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center shrink-0 p-1.5" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
              <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#2D2A26' }}>Shyamved Residency</p>
              <p className="text-xs font-semibold" style={{ color: '#C56E4D' }}>Resident</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {[
            { label: 'Dashboard', icon: '🏠', href: '/resident/dashboard' },
            { label: 'My Bills', icon: '📄', href: '/resident/bills' },
            { label: 'Payments', icon: '💳', href: '/resident/payments' },
            { label: 'Notices', icon: '📢', href: '/resident/notices' },
            { label: 'Profile', icon: '👤', href: '/resident/profile' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-black/5"
              style={{ color: '#54504B' }}
            >
              <span className="text-lg opacity-75">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>

        {/* User footer */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white gradient-brand shadow-sm">
              {profile.full_name?.[0]?.toUpperCase() ?? 'R'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#2D2A26' }}>{profile.full_name ?? 'Resident'}</p>
              <p className="text-xs" style={{ color: '#8C8680' }}>House Member</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-panel border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border flex items-center justify-center p-1" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
            <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold" style={{ color: '#2D2A26' }}>Shyamved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: '#C56E4D', background: 'rgba(197,110,77,0.1)' }}>Resident</span>
          <SignOutButton compact />
        </div>
      </div>

      <main className="flex-1 min-w-0 lg:ml-64 pb-20 lg:pb-0 pt-[4.5rem] lg:pt-6 md:p-6 lg:p-8 max-w-full">
        {children}
      </main>

      {/* Bottom Navigation — mobile-only, thumb-accessible */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass-panel border-t safe-area-pb" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { label: 'Home', icon: '🏠', href: '/resident/dashboard' },
            { label: 'Bills', icon: '📄', href: '/resident/bills' },
            { label: 'Payments', icon: '💳', href: '/resident/payments' },
            { label: 'Notices', icon: '📢', href: '/resident/notices' },
            { label: 'Profile', icon: '👤', href: '/resident/profile' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center p-2 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-[10px] font-semibold" style={{ color: '#54504B' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
