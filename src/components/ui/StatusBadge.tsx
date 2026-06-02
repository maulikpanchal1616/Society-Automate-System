// =============================================================================
// StatusBadge — displays bill/payment/occupancy status with colour
// =============================================================================

import { cn } from '@/lib/utils'
import type { BillStatus, OccupancyStatus } from '@/types/database'

const BILL_BADGE: Record<BillStatus, { label: string; bg: string; text: string; border: string }> = {
  draft:     { label: 'Draft',     text: '#8C8680', bg: 'rgba(140,134,128,0.1)',  border: 'rgba(140,134,128,0.2)' },
  pending:   { label: 'Pending',   text: '#B79B6C', bg: 'rgba(183,155,108,0.1)',  border: 'rgba(183,155,108,0.2)' },
  overdue:   { label: 'Overdue',   text: '#C56E4D', bg: 'rgba(197,110,77,0.1)',   border: 'rgba(197,110,77,0.2)' },
  paid:      { label: 'Paid',      text: '#5A6855', bg: 'rgba(122,139,116,0.1)',  border: 'rgba(122,139,116,0.2)' },
  waived:    { label: 'Waived',    text: '#9E8357', bg: 'rgba(183,155,108,0.1)',  border: 'rgba(183,155,108,0.2)' },
  cancelled: { label: 'Cancelled', text: '#8C8680', bg: 'rgba(140,134,128,0.08)', border: 'rgba(140,134,128,0.15)' },
}

const OCCUPANCY_BADGE: Record<OccupancyStatus, { label: string; bg: string; text: string; border: string }> = {
  owner_occupied:  { label: 'Owner',  text: '#C56E4D', bg: 'rgba(197,110,77,0.1)',   border: 'rgba(197,110,77,0.2)' },
  tenant_occupied: { label: 'Tenant', text: '#B79B6C', bg: 'rgba(183,155,108,0.1)',  border: 'rgba(183,155,108,0.2)' },
  vacant:          { label: 'Vacant', text: '#8C8680', bg: 'rgba(140,134,128,0.08)', border: 'rgba(140,134,128,0.15)' },
}

interface BillStatusBadgeProps {
  status: BillStatus
  className?: string
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  const config = BILL_BADGE[status]
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide', className)}
      style={{ color: config.text, background: config.bg, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  )
}

interface OccupancyBadgeProps {
  status: OccupancyStatus
  className?: string
}

export function OccupancyBadge({ status, className }: OccupancyBadgeProps) {
  const config = OCCUPANCY_BADGE[status]
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide', className)}
      style={{ color: config.text, background: config.bg, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  )
}
