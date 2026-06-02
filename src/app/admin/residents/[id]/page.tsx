// =============================================================================
// HOUSE DETAIL PAGE — /admin/residents/[id]
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHouseById } from '@/features/residents/queries'
import { getBlocks } from '@/features/society/queries'
import { PageHeader } from '@/components/ui/PageUI'
import { OccupancyBadge } from '@/components/ui/StatusBadge'
import { formatPhone } from '@/lib/utils'
import HouseForm from '../HouseForm'
import FamilyMembersSection from './FamilyMembersSection'

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const house = await getHouseById(id)
  return { title: house ? `House ${house.house_number}` : 'House Not Found' }
}

export default async function HouseDetailPage({ params }: PageProps) {
  const { id } = await params
  const [house, blocks] = await Promise.all([
    getHouseById(id),
    getBlocks(),
  ])

  if (!house) notFound()

  const primaryMember = house.family_members?.find((m) => m.is_primary_contact)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <PageHeader
        title={house.house_number}
        subtitle={`${(house.block as { name: string }).name} Block${house.floor !== null ? ` · Floor ${house.floor}` : ''}`}
        action={
          <div className="flex gap-2">
            <Link href="/admin/residents" className="btn btn-secondary text-sm">
              ← Residents
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col — summary card ── */}
        <div className="space-y-4">

          {/* Status card */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
              <OccupancyBadge status={house.occupancy_status} />
            </div>
            <div className="space-y-3">
              <InfoRow label="Owner" value={house.owner_name} />
              <InfoRow label="Owner Phone" value={formatPhone(house.owner_phone)} mono />
              {house.owner_email && <InfoRow label="Email" value={house.owner_email} />}
              {house.occupancy_status === 'tenant_occupied' && (
                <>
                  <div className="border-t border-slate-700/40 pt-3 mt-3" />
                  <InfoRow label="Tenant" value={house.tenant_name ?? '—'} />
                  <InfoRow label="Tenant Phone" value={house.tenant_phone ? formatPhone(house.tenant_phone) : '—'} mono />
                </>
              )}
              <div className="border-t border-slate-700/40 pt-3 mt-3" />
              <InfoRow
                label="Primary Contact"
                value={formatPhone(house.primary_contact_phone)}
                mono
                highlight
              />
              {house.water_meter_id && (
                <InfoRow label="Water Meter" value={house.water_meter_id} mono />
              )}
              {!house.is_active && (
                <div className="mt-3 text-xs text-slate-500 bg-slate-800/60 rounded-lg px-3 py-2">
                  ⚠ This house is inactive
                </div>
              )}
            </div>
          </div>

          {/* Primary contact member */}
          {primaryMember && (
            <div className="glass-card p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Primary Contact Member
              </p>
              <p className="text-slate-100 font-semibold">{primaryMember.full_name}</p>
              {primaryMember.relationship && (
                <p className="text-slate-400 text-xs mt-0.5">{primaryMember.relationship}</p>
              )}
              {primaryMember.phone && (
                <p className="text-slate-300 text-sm font-mono mt-1">{formatPhone(primaryMember.phone)}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Right col — tabs: Edit + Family ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit House */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Edit House Details
            </p>
            <HouseForm blocks={blocks} mode="edit" house={house} />
          </div>

          {/* Family Members */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Family Members
            </p>
            <FamilyMembersSection house={house} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reusable info row ──
function InfoRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 text-xs w-24 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm flex-1 ${mono ? 'font-mono' : ''} ${highlight ? 'text-indigo-300 font-semibold' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  )
}
