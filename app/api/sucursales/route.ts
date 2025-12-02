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

    const rows = await prisma.empresa_sucursal.findMany()
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

    const created = await prisma.empresa_sucursal.create({
      data: {
        nombre: body.nombre,
        tipo: body.tipo,
        telefono: body.telefono ?? null,
        email: body.email ?? null,
        estado_operativo: body.estado_operativo,
        fecha_registro: new Date(body.fecha_registro),
        id_estado: Number(body.id_estado),
        id_cp: Number(body.id_cp),
        id_colonia: Number(body.id_colonia),
        calle: body.calle,
        numero_int_ext: body.numero_int_ext ?? null,
        referencia: body.referencia ?? null,
        id_padre: body.id_padre ? Number(body.id_padre) : null,
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
    await prisma.empresa_sucursal.delete({ where: { id_empresa_sucursal: Number(id) } })
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
    const {
      // Campos válidos de la tabla
      id_padre,
      nombre,
      tipo,
      telefono,
      email,
      estado_operativo,
      fecha_registro,
      id_estado,
      id_cp,
      id_colonia,
      calle,
      numero_int_ext,
      referencia,
    } = body

    const updated = await prisma.empresa_sucursal.update({
      where: { id_empresa_sucursal: Number(id) },
      data: {
        ...(id_padre !== undefined ? { id_padre: id_padre === null ? null : Number(id_padre) } : {}),
        ...(nombre !== undefined ? { nombre } : {}),
        ...(tipo !== undefined ? { tipo } : {}),
        ...(telefono !== undefined ? { telefono } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(estado_operativo !== undefined ? { estado_operativo } : {}),
        ...(fecha_registro !== undefined ? { fecha_registro: new Date(fecha_registro) } : {}),
        ...(id_estado !== undefined ? { id_estado: Number(id_estado) } : {}),
        ...(id_cp !== undefined ? { id_cp: Number(id_cp) } : {}),
        ...(id_colonia !== undefined ? { id_colonia: Number(id_colonia) } : {}),
        ...(calle !== undefined ? { calle } : {}),
        ...(numero_int_ext !== undefined ? { numero_int_ext } : {}),
        ...(referencia !== undefined ? { referencia } : {}),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error actualizando sucursal:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
