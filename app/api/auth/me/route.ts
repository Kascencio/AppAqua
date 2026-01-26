import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { JWTUtils } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader

    if (!token) {
      return NextResponse.json(
        { error: 'Token de acceso requerido' },
        { status: 401 }
      )
    }

    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id_usuario },
      include: {
        tipo_rol: true,
      },
    })

    if (!user || user.estado !== 'activo') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener asignaciones
    const asignaciones = await prisma.asignacion_usuario.findMany({
      where: { id_usuario: decoded.id_usuario },
      select: {
        id_organizacion_sucursal: true,
        id_instalacion: true
      }
    })

    const branchAccess = asignaciones
      .filter(a => a.id_organizacion_sucursal !== null)
      .map(a => String(a.id_organizacion_sucursal))

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

    return NextResponse.json({
      success: true,
      user: userData,
    })

  } catch (error) {
    console.error('Error en /me:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
