import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPortalLogin = pathname.startsWith('/portal/login')
  const isPortalSetPassword = pathname.startsWith('/portal/set-password')
  const isPortalRoute = pathname.startsWith('/portal')
  const isStaffLogin = pathname.startsWith('/login')
  const isAuthRoute = pathname.startsWith('/auth')

  // Public routes: login pages, auth callbacks, and password setup
  const isPublic = isStaffLogin || isPortalLogin || isPortalSetPassword || isAuthRoute

  // Not authenticated → redirect to appropriate login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = isPortalRoute ? '/portal/login' : '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Check if this user is a client (has a clients record with their user_id)
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const isClientUser = !!clientRecord

    // Client trying to access staff area → redirect to portal
    if (isClientUser && !isPortalRoute && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal/dashboard'
      return NextResponse.redirect(url)
    }

    // Staff trying to access portal → redirect to dashboard
    if (!isClientUser && isPortalRoute && !isPortalLogin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Authenticated client on portal login → go to portal dashboard
    if (isClientUser && isPortalLogin) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal/dashboard'
      return NextResponse.redirect(url)
    }

    // Authenticated staff on staff login → go to dashboard
    if (!isClientUser && isStaffLogin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
