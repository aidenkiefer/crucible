import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.isAdmin === true
    const path = req.nextUrl.pathname

    // Protect /admin routes (except /admin/unauthorized)
    if (path.startsWith('/admin') && !path.startsWith('/admin/unauthorized')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
