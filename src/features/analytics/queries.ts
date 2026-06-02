import { createSupabaseServerClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function getAnalyticsData(society_id: string, dateObj: Date) {
  const supabase = await createSupabaseServerClient()
  const start = format(startOfMonth(dateObj), 'yyyy-MM-dd')
  const end = format(endOfMonth(dateObj), 'yyyy-MM-dd')
  const sixMonthsAgo = format(subMonths(startOfMonth(new Date()), 5), 'yyyy-MM-dd')

  const { data, error } = await supabase.rpc('get_dashboard_analytics', {
    p_society_id: society_id,
    p_start_date: start,
    p_end_date: end,
    p_six_months_ago: sixMonthsAgo
  })

  if (error || !data) {
    console.error('Failed to fetch analytics:', error)
    return {
      totalHouses: 0, occupiedHouses: 0, vacantHouses: 0, totalResidents: 0,
      currentMonthTotalBilled: 0, currentMonthMaintenance: 0, currentMonthWater: 0,
      currentMonthPending: 0, collectedThisMonth: 0, totalOverdue: 0, totalOutstanding: 0,
      collectionTrend: []
    }
  }

  // Parse JSONB payload returned from Postgres
  const {
    totalHouses,
    occupiedHouses,
    vacantHouses,
    totalResidents,
    currentMonthTotalBilled,
    currentMonthMaintenance,
    currentMonthWater,
    currentMonthPending,
    collectedThisMonth,
    totalOverdue,
    totalOutstanding,
    recentPayments
  } = data

  // Last 6 Months Chart Data processing (kept in JS since date-fns makes grouping easy)
  const chartDataMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const monthKey = format(subMonths(startOfMonth(new Date()), i), 'MMM yyyy')
    chartDataMap[monthKey] = 0
  }

  if (recentPayments && Array.isArray(recentPayments)) {
    recentPayments.forEach((p: any) => {
      const monthKey = format(new Date(p.paid_at), 'MMM yyyy')
      if (chartDataMap[monthKey] !== undefined) {
        chartDataMap[monthKey] += Number(p.amount_paid || 0)
      }
    })
  }

  const collectionTrend = Object.keys(chartDataMap).map(key => ({
    name: key,
    Collected: chartDataMap[key]
  }))

  return {
    totalHouses: Number(totalHouses || 0),
    occupiedHouses: Number(occupiedHouses || 0),
    vacantHouses: Number(vacantHouses || 0),
    totalResidents: Number(totalResidents || 0),
    currentMonthTotalBilled: Number(currentMonthTotalBilled || 0),
    currentMonthMaintenance: Number(currentMonthMaintenance || 0),
    currentMonthWater: Number(currentMonthWater || 0),
    currentMonthPending: Number(currentMonthPending || 0),
    collectedThisMonth: Number(collectedThisMonth || 0),
    totalOverdue: Number(totalOverdue || 0),
    totalOutstanding: Number(totalOutstanding || 0),
    collectionTrend
  }
}
