import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value

  // Define public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/"]
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!token && !isPublicPath) {
    // No token and trying to access protected route
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (token && request.nextUrl.pathname === "/auth/login") {
    // Already logged in and trying to access login page
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

