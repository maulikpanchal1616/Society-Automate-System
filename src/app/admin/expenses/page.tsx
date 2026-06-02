import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import ExpensesClient from '@/features/expenses/components/ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function AdminExpensesPage() {
  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'chairman') {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()
  
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('society_id', profile.society_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ExpensesClient 
        initialExpenses={expenses || []} 
        userRole={profile.role} 
      />
    </div>
  )
}
