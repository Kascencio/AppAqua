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

    const { searchParams } = new URL(request.url)
    const id_instalacion = searchParams.get('id_instalacion')
    const where = id_instalacion ? { id_instalacion: Number(id_instalacion) } : {}
    const rows = await prisma.alertas.findMany({ where, orderBy: { id_alertas: 'desc' } })
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo alertas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


