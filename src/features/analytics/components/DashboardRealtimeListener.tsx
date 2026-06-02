'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeSubscription } from '@/lib/supabase/hooks/useRealtimeSubscription'
import { useToastStore } from '@/components/ui/Toast'

export default function DashboardRealtimeListener({ societyId }: { societyId: string }) {
  const router = useRouter()
  const { addToast } = useToastStore()

  // Listen to Payments
  const { payload: paymentPayload } = useRealtimeSubscription({
    table: 'payments',
    event: 'INSERT',
    filter: `society_id=eq.${societyId}`
  })

  // Listen to Notices
  const { payload: noticePayload } = useRealtimeSubscription({
    table: 'notices',
    event: '*',
    filter: `society_id=eq.${societyId}`
  })

  useEffect(() => {
    if (paymentPayload) {
      addToast(`Payment Received - ₹${paymentPayload.new.amount_paid}`, 'success')
      router.refresh()
    }
  }, [paymentPayload, addToast, router])

  useEffect(() => {
    if (noticePayload && noticePayload.eventType === 'INSERT') {
      addToast(`New Notice: ${noticePayload.new.title}`, 'info')
      router.refresh()
    }
  }, [noticePayload, addToast, router])

  return null // Invisible listener component
}
