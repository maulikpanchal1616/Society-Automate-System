// Office — Add House (same form, different route group)
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlocks } from '@/features/society/queries'
import { PageHeader } from '@/components/ui/PageUI'
import HouseForm from '@/app/admin/residents/HouseForm'

export const metadata: Metadata = { title: 'Add House' }

export default async function OfficeNewHousePage() {
  const blocks = await getBlocks()

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Add New House"
        subtitle="Register a new house in the society"
        action={<Link href="/office/residents" className="btn btn-secondary text-sm">← Back</Link>}
      />
      {blocks.length === 0 ? (
        <div className="glass-card p-6">
          <p className="text-amber-400 font-medium mb-2">⚠ No blocks configured</p>
          <p className="text-slate-400 text-sm">Ask the Chairman to create blocks first.</p>
        </div>
      ) : (
        <HouseForm blocks={blocks} mode="create" redirectBase="/office/residents" />
      )}
    </div>
  )
}
