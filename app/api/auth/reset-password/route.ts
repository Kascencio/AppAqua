import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { 
  PasswordUtils, 
  ValidationUtils, 
  SecurityLogger 
} from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword, confirmPassword } = body

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, nueva contraseña y confirmación son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Contraseña inválida', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    const tokenRow = await prisma.token_recuperacion.findFirst({
      where: { token, expiracion: { gt: new Date() } },
      include: { usuario: true },
    })

    if (!tokenRow || tokenRow.usuario.estado !== 'activo') {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    const passwordHash = await PasswordUtils.hashPassword(newPassword)

    await prisma.usuario.update({
      where: { id_usuario: tokenRow.id_usuario },
      data: { password_hash: passwordHash },
    })

    await prisma.token_recuperacion.delete({ where: { id_token: tokenRow.id_token } })

    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    SecurityLogger.logPasswordChange(tokenRow.id_usuario, clientIP)

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    })

  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
