// =============================================================================
// NEXT.JS MIDDLEWARE — Route protection and session management
// Runs on every request matching the config.matcher pattern.
//
// Responsibilities:
//   1. Refresh Supabase session (keeps auth state fresh)
//   2. Redirect unauthenticated users to /login
//   3. Redirect authenticated users away from /login
//   4. Enforce role-based route access
//   5. Redirect to correct home based on role after login
//
// This is the FIRST security layer. Supabase RLS is the SECOND and final layer.
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────────────────────
// Route access configuration per role
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_ROUTES: Record<string, string[]> = {
  chairman: ['/admin'],
  office_man: ['/office'],
  resident: ['/resident'],
}

const ROLE_HOME: Record<string, string> = {
  chairman: '/admin/dashboard',
  office_man: '/office/dashboard',
  resident: '/resident/dashboard',
}

// Public routes — accessible without authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/api/webhooks']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware function
// ─────────────────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow webhook routes without auth (they use signature verification)
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // Create Supabase client for session management
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getSession() is much faster than getUser() as it only decodes the JWT locally.
  // It avoids a network round-trip to Supabase Auth servers on every route change.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const user = session?.user

  // ── Unauthenticated user trying to access protected route ──
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Authenticated user trying to access /login ──
  if (user && pathname === '/login') {
    // Do not redirect Server Actions or POST requests to avoid breaking them
    if (request.method !== 'GET') {
      return NextResponse.next()
    }
    // Fetch role to redirect to correct home
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile?.role && profile.is_active) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[profile.role] || '/login', request.url)
      )
    }
  }

  // ── Authenticated user accessing a protected route ──
  if (user && !isPublicRoute(pathname) && !isApiRoute(pathname)) {
    let { data: profile, error } = await supabase
      .from('users')
      .select('role, is_active, requires_password_reset')
      .eq('id', user.id)
      .single()

    // ── Graceful Fallback for Unapplied Migrations ──
    // If the requires_password_reset column doesn't exist yet, the query will fail.
    // We catch the error and fallback to the basic columns to prevent infinite redirect loops.
    if (error && error.message.includes('requires_password_reset')) {
      console.warn('[Middleware] requires_password_reset column missing. Please apply migration 006.')
      const fallback = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', user.id)
        .single()
      profile = fallback.data as any
      error = fallback.error
    }

    // No profile found — account not set up
    if (!profile) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Deactivated account
    if (!profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_deactivated', request.url))
    }

    const role = profile.role as string
    const allowedPrefixes = ROLE_ROUTES[role] || []

    // ── Enforce Password Reset for new Resident accounts ──
    if (role === 'resident' && profile.requires_password_reset && pathname !== '/resident/setup-password' && !isApiRoute(pathname)) {
      return NextResponse.redirect(new URL('/resident/setup-password', request.url))
    }

    // Check if current route is allowed for this role
    const isAllowed = allowedPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    )

    // Redirect to root — let root page redirect to correct home
    if (!isAllowed && pathname === '/') {
      return NextResponse.redirect(
        new URL(ROLE_HOME[role] || '/login', request.url)
      )
    }

    // Role accessing wrong section — redirect to their home
    if (!isAllowed && !pathname.startsWith('/api')) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[role] || '/login', request.url)
      )
    }
  }

  return response
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware matcher — run on all routes except static files and Next.js internals
// ─────────────────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
}
