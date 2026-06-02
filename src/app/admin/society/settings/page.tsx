// =============================================================================
// SOCIETY SETTINGS PAGE — Chairman only
// Server Component fetches current settings → passes to client form
// =============================================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireChairman } from '@/lib/auth/utils'
import { getSociety, getWaterRates } from '@/features/society/queries'
import { PageHeader } from '@/components/ui/PageUI'
import SocietySettingsForm from './SocietySettingsForm'
import WaterRateSection from './WaterRateSection'

export const metadata: Metadata = {
  title: 'Society Settings',
  description: 'Manage Shyamved Residency configuration',
}

export default async function SocietySettingsPage() {
  await requireChairman().catch(() => redirect('/admin/dashboard'))

  const [society, waterRates] = await Promise.all([
    getSociety(),
    getWaterRates(),
  ])

  if (!society) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card p-6">
          <p className="text-red-400">Society configuration not found. Please contact support.</p>
        </div>
      </div>
    )
  }

  const activeRate = waterRates.find((r) => r.effective_to === null) ?? null

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Society Settings"
        subtitle="Manage billing configuration for Shyamved Residency"
      />

      {/* General Settings */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          General Configuration
        </h2>
        <SocietySettingsForm society={society} />
      </section>

      {/* Water Rate */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Water Rate Management
        </h2>
        <WaterRateSection activeRate={activeRate} history={waterRates} />
      </section>
    </div>
  )
}
