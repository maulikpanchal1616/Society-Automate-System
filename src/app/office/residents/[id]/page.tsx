// Office — House detail page
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHouseById } from '@/features/residents/queries'
import { getBlocks } from '@/features/society/queries'
import { PageHeader } from '@/components/ui/PageUI'
import { OccupancyBadge } from '@/components/ui/StatusBadge'
import { formatPhone } from '@/lib/utils'
import HouseForm from '@/app/admin/residents/HouseForm'
import FamilyMembersSection from '@/app/admin/residents/[id]/FamilyMembersSection'

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const house = await getHouseById(id)
  return { title: house ? `House ${house.house_number}` : 'Not Found' }
}

export default async function OfficeHouseDetailPage({ params }: PageProps) {
  const { id } = await params
  const [house, blocks] = await Promise.all([getHouseById(id), getBlocks()])
  if (!house) notFound()

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={house.house_number}
        subtitle={`${(house.block as { name: string }).name} Block`}
        action={<Link href="/office/residents" className="btn btn-secondary text-sm">← Residents</Link>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status card */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
              <OccupancyBadge status={house.occupancy_status} />
            </div>
            <div className="space-y-2.5">
              <Row label="Owner" value={house.owner_name} />
              <Row label="Phone" value={formatPhone(house.owner_phone)} mono />
              {house.occupancy_status === 'tenant_occupied' && (
                <>
                  <div className="border-t border-slate-700/40 pt-2" />
                  <Row label="Tenant" value={house.tenant_name ?? '—'} />
                  <Row label="T.Phone" value={house.tenant_phone ? formatPhone(house.tenant_phone) : '—'} mono />
                </>
              )}
              <div className="border-t border-slate-700/40 pt-2" />
              <Row label="Primary" value={formatPhone(house.primary_contact_phone)} mono highlight />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Edit House</p>
            <HouseForm blocks={blocks} mode="edit" house={house} redirectBase="/office/residents" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Family Members</p>
            <FamilyMembersSection house={house} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono = false, highlight = false }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 text-xs w-16 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm flex-1 ${mono ? 'font-mono' : ''} ${highlight ? 'text-violet-300 font-semibold' : 'text-slate-200'}`}>{value}</span>
    </div>
  )
}
