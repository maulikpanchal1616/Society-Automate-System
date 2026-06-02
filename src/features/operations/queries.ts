import { createSupabaseServerClient } from '@/lib/supabase/server'
import { startOfDay, format, startOfMonth } from 'date-fns'

export async function getOperationsData(society_id: string, dateObj: Date = new Date()) {
  const supabase = await createSupabaseServerClient()
  const todayStart = format(startOfDay(dateObj), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const currentMonthStart = format(startOfMonth(dateObj), "yyyy-MM-dd")

  // 1. Water Readings (Current Month)
  const { data: houses } = await supabase
    .from('houses')
    .select('id, house_number, block_id')
    .eq('society_id', society_id)

  const { data: readings } = await supabase
    .from('water_meter_entries')
    .select('house_id')
    .eq('society_id', society_id)
    .eq('billing_month', currentMonthStart)

  const totalHousesWithMeter = houses?.length || 0 // Assuming all houses need a reading for now
  const readingsCompleted = readings?.length || 0
  const pendingReadings = totalHousesWithMeter - readingsCompleted

  // 2. Bills Generated (Current Month)
  const { count: billsGenerated } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('society_id', society_id)
    .eq('billing_month', currentMonthStart)

  // 3. Cash Collected Today
  const { data: paymentsToday } = await supabase
    .from('payments')
    .select('amount_paid')
    .eq('society_id', society_id)
    .eq('payment_mode', 'cash')
    .eq('status', 'success')
    .gte('paid_at', todayStart)

  const cashCollectedToday = (paymentsToday || []).reduce((acc, p) => acc + Number(p.amount_paid || 0), 0)

  // 4. Overdue Accounts (All time)
  const { count: overdueAccounts } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('society_id', society_id)
    .eq('status', 'overdue')

  // 5. Recent Activity Log (from audit_logs)
  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action_type,
      created_at,
      users ( full_name )
    `)
    .eq('society_id', society_id)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    waterReadingsCompleted: readingsCompleted,
    waterReadingsPending: pendingReadings,
    billsGenerated: billsGenerated || 0,
    cashCollectedToday,
    overdueAccounts: overdueAccounts || 0,
    recentActivity: recentActivity || []
  }
}
