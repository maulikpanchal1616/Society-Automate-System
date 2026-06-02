import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getResidentReceipts(houseId: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('receipts')
    .select('*, payments(*)')
    .eq('house_id', houseId)
    .order('generated_at', { ascending: false })

  if (error) {
    console.error('[getResidentReceipts]', error.message)
    return []
  }

  return data
}
