import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // 1. Permanent 301 redirect from charlie-news-one.vercel.app to https://propertynewsaustralia.com
  // Preserves path and query parameters; prevents redirect loops by checking destination host
  if (host.toLowerCase().includes('charlie-news-one.vercel.app')) {
    const destinationUrl = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      'https://propertynewsaustralia.com',
    )
    return NextResponse.redirect(destinationUrl, 301)
  }

  // 2. Permanent 301 redirect for uppercase /Market to lowercase /market
  if (
    request.nextUrl.pathname === '/Market' ||
    request.nextUrl.pathname.startsWith('/Market/')
  ) {
    const lowercasePath = request.nextUrl.pathname.replace(/^\/Market(\/|$)/, '/market$1')
    const destinationUrl = new URL(lowercasePath + request.nextUrl.search, request.url)
    return NextResponse.redirect(destinationUrl, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static asset files (favicon, logos, icons)
     * - Internal Vercel cron endpoints
     */
    '/((?!_next/static|_next/image|favicon.ico|fav-icon.png|apple-touch-icon.png|api/cron).*)',
  ],
}
