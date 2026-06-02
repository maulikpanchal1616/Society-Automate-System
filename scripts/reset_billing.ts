import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import WebSocket from 'ws'

// @ts-ignore
globalThis.WebSocket = WebSocket

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetBillingTransactions() {
  console.log('--- STARTING CONTROLLED FINANCIAL RESET ---')

  try {
    // 1. Delete Receipts (Dependent on Payments)
    console.log('1. Deleting all receipts...')
    const { error: receiptsError } = await supabase
      .from('receipts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // A dummy condition to bypass empty filter restrictions if any
    
    if (receiptsError) throw receiptsError
    console.log('   ✅ Receipts cleared.')

    // 2. Delete Payments (Dependent on Bills)
    console.log('2. Deleting all payments...')
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', 'uuid-force-delete')
    
    if (paymentsError) throw paymentsError
    console.log('   ✅ Payments cleared.')

    // 3. Delete Bills (Dependent on Houses/Societies)
    console.log('3. Deleting all generated bills...')
    const { error: billsError } = await supabase
      .from('bills')
      .delete()
      .neq('id', 'uuid-force-delete')
    
    if (billsError) throw billsError
    console.log('   ✅ Bills cleared.')

    // 4. Clean Audit Logs (Only specific financial events)
    console.log('4. Deleting billing-related audit logs...')
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .in('action_type', [
        'bill_generated',
        'bill_updated',
        'bill_cancelled',
        'payment_cash_recorded',
        'payment_upi_initiated',
        'payment_upi_verified',
        'penalty_waived',
        'receipt_generated'
      ])

    if (auditError) throw auditError
    console.log('   ✅ Billing audit logs cleared.')

    console.log('\n--- SUCCESS: DATABASE FINANCIAL RESET COMPLETE ---')
    console.log('NOTE: Users, Houses, Water Meter Entries, and Authentication remain fully intact.')

  } catch (error) {
    console.error('\n❌ ERROR DURING RESET:', error)
  }
}

resetBillingTransactions()
