import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils } from "@/lib/auth-utils"
import { parseDateForPrisma } from "@/lib/date-utils"

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
    const instalacion = searchParams.get("instalacion")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    if (!instalacion || !from || !to) {
      return NextResponse.json({ error: "Parámetros instalacion, from y to son obligatorios" }, { status: 400 })
    }

    const sensores = await prisma.sensor_instalado.findMany({
      where: { id_instalacion: Number(instalacion) },
      select: { id_sensor_instalado: true },
    })
    const sensorIds = sensores.map(s => s.id_sensor_instalado)
    if (sensorIds.length === 0) return NextResponse.json([])

    const lecturas = await prisma.lectura.findMany({
      where: {
        id_sensor_instalado: { in: sensorIds },
        fecha: { gte: parseDateForPrisma(from)!, lte: parseDateForPrisma(to)! },
      },
    })
    return NextResponse.json(lecturas)
  } catch (error) {
    console.error("Error en /api/lecturas GET:", error)
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
    if (!body.id_sensor_instalado || body.valor == null || !body.fecha || !body.hora) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }
    const created = await prisma.lectura.create({
      data: {
        id_sensor_instalado: Number(body.id_sensor_instalado),
        valor: body.valor,
        fecha: parseDateForPrisma(body.fecha)!,
        hora: parseDateForPrisma(`1970-01-01T${body.hora}`)!,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando lectura:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
