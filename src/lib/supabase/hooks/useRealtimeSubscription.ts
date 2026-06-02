'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type SubscriptionOptions = {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
}

export function useRealtimeSubscription({ table, event = '*', filter }: SubscriptionOptions) {
  const [payload, setPayload] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    // Unique channel name based on table and filter
    const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          setPayload(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
        }
      })

    return () => {
      // Cleanup subscription on unmount to prevent memory leaks
      supabase.removeChannel(channel)
    }
  }, [table, event, filter]) // Re-run if configuration changes

  return { payload, isConnected }
}
