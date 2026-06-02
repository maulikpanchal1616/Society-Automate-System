// =============================================================================
// CREATE HOUSE PAGE — /admin/residents/new
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlocks } from '@/features/society/queries'
import { PageHeader } from '@/components/ui/PageUI'
import HouseForm from '../HouseForm'

export const metadata: Metadata = { title: 'Add House' }

export default async function NewHousePage() {
  const blocks = await getBlocks()

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Add New House"
        subtitle="Register a new house or flat in the society"
        action={
          <Link href="/admin/residents" className="btn btn-secondary text-sm">
            ← Back
          </Link>
        }
      />

      {blocks.length === 0 ? (
        <div className="glass-card p-6">
          <p className="text-amber-400 font-medium mb-2">⚠ No blocks configured</p>
          <p className="text-slate-400 text-sm mb-4">
            You need to create at least one block before adding houses.
          </p>
          <Link href="/admin/residents" className="btn btn-primary text-sm">
            Go to Residents to Add a Block
          </Link>
        </div>
      ) : (
        <HouseForm blocks={blocks} mode="create" />
      )}
    </div>
  )
}
