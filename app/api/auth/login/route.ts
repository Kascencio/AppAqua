import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  PasswordUtils,
  JWTUtils,
  ValidationUtils,
  RateLimitUtils,
  SecurityLogger,
  USER_ROLES
} from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { correo, password } = body

    if (!correo || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (!ValidationUtils.isValidEmail(correo)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!RateLimitUtils.checkRateLimit(clientIP)) {
      SecurityLogger.logFailedLogin(clientIP, correo, 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.' },
        { status: 429 }
      )
    }

    const user = await prisma.usuario.findFirst({
      where: { correo: correo.toLowerCase(), estado: 'activo' },
      include: { tipo_rol: true, asignacion_usuario: true },
    })

    if (!user) {
      SecurityLogger.logFailedLogin(clientIP, correo, 'User not found or inactive')
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isPasswordValid = await PasswordUtils.verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      SecurityLogger.logFailedLogin(clientIP, correo, 'Invalid password')
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const tokens = JWTUtils.generateTokens({
      id_usuario: user.id_usuario,
      id_rol: user.id_rol,
      correo: user.correo
    })

    const branchAccess = user.asignacion_usuario
      .filter(a => a.id_organizacion_sucursal !== null)
      .map(a => String(a.id_organizacion_sucursal))
    const facilityAccess: string[] = []

    const userData = {
      id: String(user.id_usuario),
      name: user.nombre_completo,
      email: user.correo,
      role: user.tipo_rol?.nombre?.toLowerCase() || 'standard',
      status: user.estado,
      phone: user.telefono || undefined,
      branchAccess,
      createdAt: user.fecha_creacion as unknown as string,
      lastLogin: new Date().toISOString(),
    }

    SecurityLogger.logSuccessfulLogin(clientIP, correo, user.id_usuario)

    const response = NextResponse.json({
      success: true,
      user: userData,
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    }

    response.cookies.set('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60
    })

    response.cookies.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60
    })

    response.cookies.set('isAuthenticated', 'true', {
      ...cookieOptions,
      maxAge: 24 * 60 * 60
    })

    return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
