import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. Check Payload redirects first
  const redirectResponse = await checkPayloadRedirects(request)
  if (redirectResponse) return redirectResponse

  // 2. Run Supabase auth token refresh
  return supabaseProxy(request)
}

async function checkPayloadRedirects(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip admin and API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000)

  try {
    const serverUrl =
      process.env.NEXT_PUBLIC_SERVER_URL || ''
    const res = await fetch(
      `${serverUrl}/api/redirects?where[from][equals]=${encodeURIComponent(pathname)}&limit=1`,
      {
        signal: controller.signal,
        next: { tags: ['redirects'] },
      },
    )
    clearTimeout(timeoutId)

    if (!res.ok) return null

    const data = await res.json()
    const redirect = data?.docs?.[0]

    if (!redirect) return null

    const destination =
      redirect.to?.url ||
      (redirect.to?.reference?.value?.slug
        ? `/${redirect.to.reference.value.slug}`
        : null)

    if (!destination) return null

    return NextResponse.redirect(
      new URL(destination, request.url),
      redirect.type === '301' ? 301 : 302,
    )
  } catch {
    clearTimeout(timeoutId)
    // Fail open — don't block requests if redirect lookup fails
    return null
  }
}

async function supabaseProxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // Refresh the auth token
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
