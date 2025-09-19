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

    const rows = await prisma.sensor_instalado.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo sensores instalados:", error)
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
    if (!body.id_sensor || !body.id_instalacion || !body.fecha_instalada || !body.descripcion) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }
    const created = await prisma.sensor_instalado.create({
      data: {
        id_sensor: Number(body.id_sensor),
        id_instalacion: Number(body.id_instalacion),
        fecha_instalada: new Date(body.fecha_instalada),
        descripcion: body.descripcion,
        id_lectura: body.id_lectura ? Number(body.id_lectura) : null,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando sensor_instalado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
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
      return NextResponse.json({ error: "ID de sensor_instalado es obligatorio" }, { status: 400 })
    }
    const body = await request.json()
    await prisma.sensor_instalado.update({
      where: { id_sensor_instalado: Number(id) },
      data: body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando sensor_instalado:", error)
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
      return NextResponse.json({ error: "Solo superadmin puede eliminar sensores" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de sensor_instalado es obligatorio" }, { status: 400 })
    }
    await prisma.sensor_instalado.delete({ where: { id_sensor_instalado: Number(id) } })
    return NextResponse.json({ message: "Sensor eliminado correctamente" })
  } catch (error) {
    console.error("Error eliminando sensor_instalado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
