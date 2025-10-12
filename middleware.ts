import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    const token = req.nextauth.token
    const isAuth = !!token

    // If user is not authenticated and trying to access protected routes
    if (!isAuth && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    if (!isAuth && req.nextUrl.pathname.startsWith('/analysis')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuth && (req.nextUrl.pathname.startsWith('/auth/login') || req.nextUrl.pathname.startsWith('/auth/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages without authentication
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Require authentication for protected routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/analysis')) {
          return !!token
        }
        
        return true
      },
    },
  },
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analysis/:path*",
    "/auth/login",
    "/auth/signup"
  ],
}
