// =============================================================================
// OFFICE RESIDENTS PAGE — /office/residents
// Same data as admin but from Office Man's route. Reuses all query/components.
// Office Man cannot delete blocks — only Chairman can.
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader, EmptyState } from '@/components/ui/PageUI'
import { OccupancyBadge } from '@/components/ui/StatusBadge'
import { getHouses, getBlocksWithHouseCount } from '@/features/residents/queries'

export const metadata: Metadata = { title: 'Residents' }

interface PageProps {
  searchParams: Promise<{ q?: string; block?: string; occupancy?: string }>
}

export default async function OfficeResidentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.q?.trim() ?? ''
  const blockId = params.block ?? ''
  const occupancy = params.occupancy ?? ''

  const [houses, blocks] = await Promise.all([
    getHouses({
      search: search || undefined,
      blockId: blockId || undefined,
      occupancy: occupancy || undefined,
      isActive: true,
    }),
    getBlocksWithHouseCount(),
  ])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Residents & Houses"
        subtitle={`${houses.length} active house${houses.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/office/residents/new" className="btn btn-primary text-sm">
            + Add House
          </Link>
        }
      />

      {/* Search bar */}
      <form method="GET" action="/office/residents" className="relative flex gap-2 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={search}
            className="input !pl-10 text-sm"
            placeholder="Search by house number, owner, phone..."
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-primary text-sm px-4 shrink-0">Search</button>
      </form>

      {/* Block tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Link
          href="/office/residents"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !blockId ? 'bg-violet-600 text-white' : 'glass-card text-slate-400 hover:text-slate-200'
          }`}
        >
          All Blocks
        </Link>
        {blocks.map((block) => (
          <Link
            key={block.id}
            href={`/office/residents?block=${block.id}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              blockId === block.id ? 'bg-violet-600 text-white' : 'glass-card text-slate-400 hover:text-slate-200'
            }`}
          >
            {block.name} <span className="opacity-60">({block.house_count})</span>
          </Link>
        ))}
      </div>

      {/* Houses */}
      {houses.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No houses found"
          description={search ? `No results for "${search}"` : 'No active houses in this block.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {houses.map((house) => (
            <Link
              key={house.id}
              href={`/office/residents/${house.id}`}
              className="glass-card p-4 hover:border-[#B79B6C]/30 transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-[#2D2A26] group-hover:text-[#C56E4D] transition-colors">
                    {house.house_number}
                  </p>
                  <p className="text-xs text-[#8C8680]">
                    {(house.block as { name: string }).name} Block
                  </p>
                </div>
                <OccupancyBadge status={house.occupancy_status} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[#8C8680] text-xs w-12 shrink-0">Owner</span>
                  <span className="text-[#2D2A26] text-sm font-medium truncate">{house.owner_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8C8680] text-xs w-12 shrink-0">Phone</span>
                  <span className="text-[#54504B] text-sm font-mono">{house.primary_contact_phone}</span>
                </div>
                {house.occupancy_status === 'tenant_occupied' && house.tenant_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#8C8680] text-xs w-12 shrink-0">Tenant</span>
                    <span className="text-[#2D2A26] text-sm truncate">{house.tenant_name}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <span className="text-xs text-[#C56E4D] opacity-0 group-hover:opacity-100 transition-opacity">
                  View details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
