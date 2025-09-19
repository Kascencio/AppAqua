import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils, USER_ROLES } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const empresaSucursalId = searchParams.get('id_empresa_sucursal')

    const rows = await prisma.instalacion.findMany({
      where: empresaSucursalId ? { id_empresa_sucursal: Number(empresaSucursalId) } : undefined,
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo instalaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    if (![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const requiredFields = [
      "id_empresa_sucursal",
      "nombre_instalacion",
      "fecha_instalacion",
      "estado_operativo",
      "descripcion",
      "tipo_uso",
      "id_proceso",
    ]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 })
      }
    }

    const created = await prisma.instalacion.create({
      data: {
        id_empresa_sucursal: Number(body.id_empresa_sucursal),
        nombre_instalacion: body.nombre_instalacion,
        fecha_instalacion: new Date(body.fecha_instalacion),
        estado_operativo: body.estado_operativo,
        descripcion: body.descripcion,
        tipo_uso: body.tipo_uso,
        id_proceso: Number(body.id_proceso),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando instalacion:", error)
    return NextResponse.json({ error: "Error al crear instalación" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    if (![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de instalación es obligatorio" }, { status: 400 })
    }
    const body = await request.json()

    await prisma.instalacion.update({
      where: { id_instalacion: Number(id) },
      data: body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    if (decoded.id_rol !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Solo superadmin puede eliminar instalaciones" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de instalación es obligatorio" }, { status: 400 })
    }
    await prisma.instalacion.delete({ where: { id_instalacion: Number(id) } })
    return NextResponse.json({ message: "Instalación eliminada correctamente" })
  } catch (error) {
    console.error("Error eliminando instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
