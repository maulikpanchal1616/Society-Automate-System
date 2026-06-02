'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = { label: string; href: string; icon: string; soon?: boolean }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/office/dashboard',   icon: '📊' },
  { label: 'Residents',    href: '/office/residents',   icon: '🏠' },
  { label: 'Water Units',  href: '/office/water',       icon: '💧' },
  { label: 'Bills',        href: '/office/billing',     icon: '📄' },
  { label: 'Cash Payments',href: '/office/payments',    icon: '💵' },
  { label: 'Expenses',     href: '/office/expenses',    icon: '💰' },
  { label: 'Notices',      href: '/office/notices',     icon: '📢' },
]

export default function OfficeSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <p className="text-[10px] px-3 mb-2 font-bold uppercase tracking-widest" style={{ color: '#8C8680' }}>
        Operations
      </p>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'shadow-sm'
                : 'hover:bg-[rgba(183,155,108,0.08)]'
            )}
            style={isActive ? {
              background: 'linear-gradient(135deg, rgba(183,155,108,0.15), rgba(183,155,108,0.08))',
              color: '#9E8357',
              border: '1px solid rgba(183,155,108,0.2)',
            } : {
              color: '#54504B',
            }}
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
