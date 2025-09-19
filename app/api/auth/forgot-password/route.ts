import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { 
  ValidationUtils, 
  RecoveryTokenUtils, 
  SecurityLogger 
} from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { correo } = body

    if (!correo) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    if (!ValidationUtils.isValidEmail(correo)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    const user = await prisma.usuario.findFirst({
      where: { correo: correo.toLowerCase(), estado: 'activo' },
      select: { id_usuario: true, nombre_completo: true }
    })

    if (user) {
      const recoveryToken = RecoveryTokenUtils.generateRecoveryToken()
      const expirationDate = RecoveryTokenUtils.getExpirationDate()

      await prisma.token_recuperacion.deleteMany({ where: { id_usuario: user.id_usuario } })

      await prisma.token_recuperacion.create({
        data: {
          id_usuario: user.id_usuario,
          token: recoveryToken,
          expiracion: expirationDate as unknown as Date,
        }
      })

      console.log(`[RECOVERY] Token para ${correo}: ${recoveryToken}`)
      console.log(`[RECOVERY] Expira: ${expirationDate}`)

      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
      SecurityLogger.logPasswordChange(user.id_usuario, clientIP)
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'
    })

  } catch (error) {
    console.error('Error en forgot-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
