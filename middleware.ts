import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = [
  '/',
  '/organizaciones',
  '/sucursales',
  '/instalaciones',
  '/sensors',
  '/especies',
  '/procesos',
  '/users',
  '/monitoreo',
  '/analytics',
  '/notifications',
  '/map'
]

// Rutas que solo pueden acceder usuarios no autenticados
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password'
]

// Rutas públicas (no requieren autenticación)
const publicRoutes = [
  '/reset-password',
  '/temp'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const accessToken = request.cookies.get('access_token')?.value

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isProtectedRoute) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|external-api|external-health|health|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
