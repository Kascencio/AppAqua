import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const rows = await prisma.organizacion_sucursal.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo sucursales:", error)
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
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    if (!body.nombre || !body.tipo || !body.estado_operativo || !body.fecha_registro || !body.id_estado || !body.id_cp || !body.id_colonia || !body.calle) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    const created = await prisma.organizacion_sucursal.create({
      data: {
        nombre_sucursal: body.nombre,
        telefono_sucursal: body.telefono ?? null,
        correo_sucursal: body.email ?? null,
        estado: body.estado_operativo === 'activo' ? 'activa' : 'inactiva',
        id_estado: Number(body.id_estado),
        id_municipio: Number(body.id_municipio), // Changed from id_cp/id_colonia/calle as they assume new model
        id_organizacion: Number(body.id_padre),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando sucursal:", error)
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
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (roleName !== "superadmin") {
      return NextResponse.json({ error: "Solo superadmin puede eliminar sucursales" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de sucursal es obligatorio" }, { status: 400 })
    }
    await prisma.organizacion_sucursal.delete({ where: { id_organizacion_sucursal: Number(id) } })
    return NextResponse.json({ message: "Sucursal eliminada correctamente" })
  } catch (error) {
    console.error("Error eliminando sucursal:", error)
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
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de sucursal es obligatorio" }, { status: 400 })
    }
    const body = await request.json()

    // Map old body fields to new schema
    const data: any = {}
    if (body.nombre) data.nombre_sucursal = body.nombre
    if (body.telefono) data.telefono_sucursal = body.telefono
    if (body.email) data.correo_sucursal = body.email
    if (body.estado_operativo) data.estado = body.estado_operativo === 'activo' ? 'activa' : 'inactiva'
    if (body.id_estado) data.id_estado = Number(body.id_estado)
    if (body.id_municipio) data.id_municipio = Number(body.id_municipio)
    if (body.id_padre) data.id_organizacion = Number(body.id_padre)

    const updated = await prisma.organizacion_sucursal.update({
      where: { id_organizacion_sucursal: Number(id) },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error actualizando sucursal:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
