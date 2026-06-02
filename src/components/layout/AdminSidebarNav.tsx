'use client'

// =============================================================================
// ADMIN SIDEBAR NAV — client component for active link highlighting
// =============================================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = { label: string; href: string; icon: string; soon?: boolean }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/admin/dashboard',         icon: '📊' },
  { label: 'Residents',  href: '/admin/residents',          icon: '🏠' },
  { label: 'Billing',    href: '/admin/billing',            icon: '📄' },
  { label: 'Payments',   href: '/admin/payments',           icon: '💳' },
  { label: 'Expenses',   href: '/admin/expenses',           icon: '💰' },
  { label: 'Reports',    href: '/admin/reports',            icon: '📈' },
  { label: 'Notices',    href: '/admin/notices',            icon: '📢' },
  { label: 'Settings',   href: '/admin/society/settings',   icon: '⚙️' },
]

export default function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <p className="text-[10px] px-3 mb-2 font-bold uppercase tracking-widest" style={{ color: '#8C8680' }}>
        Navigation
      </p>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.soon ? '#' : item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'text-white shadow-sm'
                : 'hover:bg-[rgba(183,155,108,0.08)]',
              item.soon && 'opacity-40 cursor-not-allowed'
            )}
            style={isActive ? {
              background: 'linear-gradient(135deg, rgba(197,110,77,0.15), rgba(183,155,108,0.1))',
              color: '#C56E4D',
              border: '1px solid rgba(197,110,77,0.2)',
            } : {
              color: '#54504B',
            }}
            onClick={(e) => item.soon && e.preventDefault()}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide" style={{ color: '#8C8680', background: 'rgba(183,155,108,0.1)' }}>
                Soon
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
