import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    const token = req.nextauth.token
    const isAuth = !!token

    // If user is not authenticated and trying to access protected routes
    const protectedRoutes = ['/dashboard', '/analysis', '/upload', '/history']
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
    
    if (!isAuth && isProtectedRoute) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    // UNLESS there's a callbackUrl (during login process)
    if (isAuth && (req.nextUrl.pathname.startsWith('/auth/login') || req.nextUrl.pathname.startsWith('/auth/signup'))) {
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
      
      // If there's a callbackUrl, redirect there instead of dashboard
      if (callbackUrl) {
        return NextResponse.redirect(new URL(callbackUrl, req.url))
      }
      
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
        const protectedRoutes = ['/dashboard', '/analysis', '/upload', '/history']
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
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
    "/upload/:path*",
    "/history/:path*",
    "/auth/login",
    "/auth/signup"
  ],
}
