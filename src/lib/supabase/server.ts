// =============================================================================
// SUPABASE SERVER CLIENT
// Use this in Server Components, Server Actions, and API Route Handlers.
// Reads cookies from the request to maintain session state.
// RLS is enforced using the user's JWT from the session.
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
            // Middleware handles session refresh
          }
        },
      },
    }
  )
}

// =============================================================================
// SUPABASE SERVICE ROLE CLIENT
// Use ONLY for operations that must bypass RLS (e.g., admin seed, webhooks).
// NEVER expose this client to the browser. Server-side only.
// =============================================================================

import { createClient } from '@supabase/supabase-js'

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
