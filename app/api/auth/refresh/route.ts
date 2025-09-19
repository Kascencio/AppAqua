import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { JWTUtils } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token no encontrado' },
        { status: 401 }
      )
    }

    const decoded = JWTUtils.verifyToken(refreshToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Refresh token inválido' },
        { status: 401 }
      )
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id_usuario },
      select: { id_usuario: true, estado: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      )
    }

    if (user.estado !== 'activo') {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 401 }
      )
    }

    const tokens = JWTUtils.generateTokens({
      id_usuario: decoded.id_usuario,
      id_rol: decoded.id_rol,
      correo: decoded.correo
    })

    const response = NextResponse.json({
      success: true,
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

    return response

  } catch (error) {
    console.error('Error en refresh token:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
