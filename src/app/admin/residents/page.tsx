// =============================================================================
// RESIDENTS LIST PAGE — /admin/residents
// Server Component — reads search params for filtering
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader, EmptyState } from '@/components/ui/PageUI'
import { OccupancyBadge } from '@/components/ui/StatusBadge'
import { getHouses } from '@/features/residents/queries'
import { getBlocksWithHouseCount } from '@/features/residents/queries'
import ResidentSearch from './ResidentSearch'
import BlockManager from './BlockManager'

export const metadata: Metadata = { title: 'Residents' }

interface PageProps {
  searchParams: Promise<{
    q?: string
    block?: string
    occupancy?: string
    active?: string
  }>
}

import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

export default async function ResidentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.q?.trim() ?? ''
  const blockId = params.block ?? ''
  const occupancy = params.occupancy ?? ''
  const showInactive = params.active === 'false'

  return (
    <div className="animate-fade-in">
      <Suspense fallback={<DashboardSkeleton />}>
        <ResidentsContent 
          search={search} 
          blockId={blockId} 
          occupancy={occupancy} 
          showInactive={showInactive} 
        />
      </Suspense>
    </div>
  )
}

async function ResidentsContent({ 
  search, 
  blockId, 
  occupancy, 
  showInactive 
}: { 
  search: string, 
  blockId: string, 
  occupancy: string, 
  showInactive: boolean 
}) {
  const [houses, blocks] = await Promise.all([
    getHouses({
      search: search || undefined,
      blockId: blockId || undefined,
      occupancy: occupancy || undefined,
      isActive: showInactive ? undefined : true,
    }),
    getBlocksWithHouseCount(),
  ])

  return (
    <>
      <PageHeader
        title="Residents & Houses"
        subtitle={`${houses.length} house${houses.length !== 1 ? 's' : ''} found`}
        action={
          <Link href="/admin/residents/new" className="btn btn-primary text-sm">
            + Add House
          </Link>
        }
      />

      {/* Search + Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ResidentSearch defaultValue={search} />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(['', 'owner_occupied', 'tenant_occupied', 'vacant'] as const).map((o) => (
            <Link
              key={o}
              href={`/admin/residents?q=${search}&block=${blockId}&occupancy=${o}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={occupancy === o
                ? { background: 'linear-gradient(135deg, #C56E4D, #B79B6C)', color: 'white' }
                : { background: 'rgba(183,155,108,0.08)', color: '#8C8680' }
              }
            >
              {o === '' ? 'All' : o === 'owner_occupied' ? 'Owner' : o === 'tenant_occupied' ? 'Tenant' : 'Vacant'}
            </Link>
          ))}
        </div>
      </div>

      {/* Block Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Link
          href={`/admin/residents?q=${search}&occupancy=${occupancy}`}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={!blockId
            ? { background: 'linear-gradient(135deg, #C56E4D, #B79B6C)', color: 'white' }
            : { background: 'rgba(183,155,108,0.08)', color: '#8C8680' }
          }
        >
          All Blocks
        </Link>
        {blocks.map((block) => (
          <Link
            key={block.id}
            href={`/admin/residents?q=${search}&block=${block.id}&occupancy=${occupancy}`}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={blockId === block.id
              ? { background: 'linear-gradient(135deg, #C56E4D, #B79B6C)', color: 'white' }
              : { background: 'rgba(183,155,108,0.08)', color: '#8C8680' }
            }
          >
            {block.name} Block
            <span className="ml-1.5 opacity-60">({block.house_count})</span>
          </Link>
        ))}
      </div>

      {/* Block Manager (add/delete blocks) */}
      <BlockManager blocks={blocks} />

      {/* Houses Grid */}
      {houses.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No houses found"
          description={search ? `No results for "${search}"` : 'Start by adding the first house.'}
          action={
            <Link href="/admin/residents/new" className="btn btn-primary text-sm">
              Add First House
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {houses.map((house) => (
            <Link
              key={house.id}
              href={`/admin/residents/${house.id}`}
              className="glass-card p-4 transition-all hover:-translate-y-0.5 group border-transparent hover:border-[#C56E4D]/20"
            >
              {/* House number + Block */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold transition-colors" style={{ color: '#2D2A26' }}>
                    {house.house_number}
                  </p>
                  <p className="text-xs" style={{ color: '#8C8680' }}>
                    {(house.block as { name: string }).name} Block
                    {house.floor !== null ? ` · Floor ${house.floor}` : ''}
                  </p>
                </div>
                <OccupancyBadge status={house.occupancy_status} />
              </div>

              {/* Owner */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-12 shrink-0" style={{ color: '#8C8680' }}>Owner</span>
                  <span className="text-sm font-medium truncate" style={{ color: '#2D2A26' }}>{house.owner_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-12 shrink-0" style={{ color: '#8C8680' }}>Phone</span>
                  <span className="text-sm font-mono" style={{ color: '#54504B' }}>{house.primary_contact_phone}</span>
                </div>
                {house.occupancy_status === 'tenant_occupied' && house.tenant_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12 shrink-0" style={{ color: '#8C8680' }}>Tenant</span>
                    <span className="text-sm truncate" style={{ color: '#54504B' }}>{house.tenant_name}</span>
                  </div>
                )}
              </div>

              {/* Active indicator */}
              {!house.is_active && (
                <div className="mt-3 text-xs rounded px-2 py-1" style={{ color: '#8C8680', background: 'rgba(183,155,108,0.06)' }}>
                  Inactive
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#C56E4D' }}>
                  View details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
