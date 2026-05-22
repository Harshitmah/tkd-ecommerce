import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Bypass Server Actions to prevent middleware from corrupting the RSC payload
  if (request.headers.has("next-action")) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Use anon key for authentication to properly handle user sessions and cookies
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data: { user: fetchedUser }, error } = await supabaseAuth.auth.getUser()
    if (error) {
      if (
        error.message !== 'Auth session missing!' && 
        !error.message.includes('Refresh Token Not Found') &&
        !error.message.includes('refresh_token_not_found')
      ) {
        console.warn("Proxy auth check failed:", error.message)
      }
    } else {
      user = fetchedUser
    }
  } catch (err) {
    console.error("Proxy auth exception caught:", err)
  }

  // Protected Admin Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin/login') {
      return supabaseResponse
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Use service role key to bypass RLS when querying profiles in middleware
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {}
        }
      }
    )

    // Check role from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      console.warn("Proxy: User not admin. Profile:", profile, "Error:", profileError, "User ID:", user.id)
      // If not admin, redirect to admin login with error
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
