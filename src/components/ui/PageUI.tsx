// =============================================================================
// UI Components — Shared primitives for the design system
// =============================================================================

import { cn } from '@/lib/utils'

// ─── Page Header ───

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mt-2 mb-6 w-full', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold leading-tight" style={{ color: '#2D2A26' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: '#8C8680' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Empty State ───

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card p-10 text-center animate-fade-in">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-1" style={{ color: '#2D2A26' }}>{title}</h3>
      {description && <p className="text-sm mb-4" style={{ color: '#8C8680' }}>{description}</p>}
      {action}
    </div>
  )
}

// ─── Form Error ───

interface FormErrorProps {
  message?: string
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null
  return <p className="text-xs mt-1" style={{ color: '#C56E4D' }}>{message}</p>
}

// ─── Alert Banner ───

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}

const ALERT_STYLES: Record<AlertBannerProps['type'], { bg: string; border: string; text: string }> = {
  success: { bg: 'rgba(122,139,116,0.08)', border: 'rgba(122,139,116,0.2)',  text: '#5A6855' },
  error:   { bg: 'rgba(197,110,77,0.08)',   border: 'rgba(197,110,77,0.2)',   text: '#C56E4D' },
  warning: { bg: 'rgba(183,155,108,0.08)',  border: 'rgba(183,155,108,0.2)',  text: '#9E8357' },
  info:    { bg: 'rgba(183,155,108,0.06)',  border: 'rgba(183,155,108,0.15)', text: '#54504B' },
}

const ALERT_ICONS: Record<AlertBannerProps['type'], string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

export function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
  const s = ALERT_STYLES[type]
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-4 animate-fade-in"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      <span
        className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold"
        style={{ borderColor: s.text }}
      >
        {ALERT_ICONS[type]}
      </span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs opacity-60 hover:opacity-100 transition-opacity">✕</button>
      )}
    </div>
  )
}

// ─── Skeleton Loader ───

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'heading' | 'card' | 'circle'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'skeleton skeleton-text',
    heading: 'skeleton skeleton-heading',
    card: 'skeleton skeleton-card',
    circle: 'skeleton rounded-full w-10 h-10',
  }
  return <div className={cn(variants[variant], className)} />
}

// ─── Skeleton Card Group ───

export function SkeletonCardGroup({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton variant="heading" />
              <Skeleton className="w-3/4" />
            </div>
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-full" />
            <Skeleton className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ───

interface StatCardProps {
  label: string
  value: string | number
  accent?: string
  icon?: string
}

export function StatCard({ label, value, accent = '#C56E4D', icon }: StatCardProps) {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: accent }} />
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C8680' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent }}>
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </p>
    </div>
  )
}
