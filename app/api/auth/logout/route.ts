import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Crear respuesta de logout exitoso
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Limpiar cookies de autenticación
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    }

    // Eliminar access token
    response.cookies.set('access_token', '', {
      ...cookieOptions,
      maxAge: 0
    })

    // Eliminar refresh token
    response.cookies.set('refreshToken', '', {
      ...cookieOptions,
      maxAge: 0
    })

    // Eliminar cookie de autenticación
    response.cookies.set('isAuthenticated', '', {
      ...cookieOptions,
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
