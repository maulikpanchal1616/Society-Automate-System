// =============================================================================
// SUPABASE BROWSER CLIENT
// Use this ONLY in Client Components ('use client') for realtime subscriptions
// and client-side reads. For mutations and sensitive operations, use server
// actions with the server client instead.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
