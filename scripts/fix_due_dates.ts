import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import WebSocket from 'ws'

// @ts-ignore
globalThis.WebSocket = WebSocket

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Fetching societies...')
  const { data: societies } = await supabase.from('societies').select('id, payment_window_end')
  
  if (!societies) return

  for (const soc of societies) {
    const { data: bills } = await supabase
      .from('bills')
      .select('id, billing_month')
      .eq('society_id', soc.id)

    if (!bills) continue

    for (const bill of bills) {
      const [yearStr, monthStr] = bill.billing_month.split('-')
      let year = parseInt(yearStr)
      let month = parseInt(monthStr)

      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }

      const paddedMonth = String(month).padStart(2, '0')
      const paddedDay = String(soc.payment_window_end).padStart(2, '0')
      const newDueDate = `${year}-${paddedMonth}-${paddedDay}`

      await supabase
        .from('bills')
        .update({ due_date: newDueDate })
        .eq('id', bill.id)
    }
  }

  console.log('Fixed all due dates.')
}

run()
