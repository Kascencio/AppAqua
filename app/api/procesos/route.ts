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

    const rows = await prisma.procesos.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo procesos:", error)
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
    if (!body.id_especie || !body.fecha_inicio || !body.fecha_final) {
      return NextResponse.json({ error: "id_especie, fecha_inicio, fecha_final requeridos" }, { status: 400 })
    }
    const created = await prisma.procesos.create({
      data: {
        id_especie: Number(body.id_especie),
        fecha_inicio: new Date(body.fecha_inicio),
        fecha_final: new Date(body.fecha_final),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando proceso:", error)
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
      return NextResponse.json({ error: "ID de proceso es obligatorio" }, { status: 400 })
    }
    const body = await request.json()
    await prisma.procesos.update({ where: { id_proceso: Number(id) }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando proceso:", error)
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
      return NextResponse.json({ error: "Solo superadmin puede eliminar procesos" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de proceso es obligatorio" }, { status: 400 })
    }
    await prisma.procesos.delete({ where: { id_proceso: Number(id) } })
    return NextResponse.json({ message: "Proceso eliminado correctamente" })
  } catch (error) {
    console.error("Error eliminando proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
