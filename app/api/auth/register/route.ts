import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { 
  PasswordUtils, 
  JWTUtils, 
  ValidationUtils, 
  SecurityLogger,
  USER_ROLES 
} from '@/lib/auth-utils'

// Registro público deshabilitado: solo superadmin/admin pueden crear usuarios vía endpoints protegidos
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { error: 'Registro deshabilitado. Contacte a un administrador.' },
      { status: 403 }
    )

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
