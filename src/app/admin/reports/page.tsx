import { getCurrentUserProfile } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { getCollectionStatement, getOutstandingDuesReport, getIncomeVsExpenseSummary } from '@/features/reports/queries'
import ReportsClient from '@/features/reports/components/ReportsClient'

import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

export const revalidate = 60

export default async function AdminReportsPage() {
  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'chairman') {
    redirect('/login')
  }

  // Defaulting to current month
  const today = new Date()

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <Suspense fallback={<DashboardSkeleton />}>
        <ReportsContent societyId={profile.society_id} today={today} />
      </Suspense>
    </div>
  )
}

async function ReportsContent({ societyId, today }: { societyId: string, today: Date }) {
  const [collectionData, outstandingData, summaryData] = await Promise.all([
    getCollectionStatement(societyId, today),
    getOutstandingDuesReport(societyId),
    getIncomeVsExpenseSummary(societyId, today)
  ])

  return (
    <ReportsClient 
      collectionData={collectionData}
      outstandingData={outstandingData}
      summaryData={summaryData}
    />
  )
}
