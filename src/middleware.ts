
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/', '/clients', '/users', '/projects', '/agency', '/financials', '/proposals', '/prospects'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is not authenticated and tries to access a protected page, redirect to login
  if (!token && protectedRoutes.find(p => pathname.startsWith(p) && (p !== '/' || pathname === '/'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
