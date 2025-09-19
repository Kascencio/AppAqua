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
    if (![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
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
    if (decoded.id_rol !== USER_ROLES.SUPERADMIN) {
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
    if (![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de sucursal es obligatorio" }, { status: 400 })
    }
    const body = await request.json()
    await prisma.empresa_sucursal.update({ where: { id_empresa_sucursal: Number(id) }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando sucursal:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
