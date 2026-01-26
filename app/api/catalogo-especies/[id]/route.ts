import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const row = await prisma.especies.findUnique({ where: { id_especie: id } })
    if (!row) {
      return NextResponse.json({ error: "Especie no encontrada" }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (error) {
    console.error("Error obteniendo especie:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await request.json()
    await prisma.especies.update({ where: { id_especie: id }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando especie:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    await prisma.especies.delete({ where: { id_especie: id } })
    return NextResponse.json({ message: "Especie eliminada correctamente" })
  } catch (error) {
    console.error("Error eliminando especie:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
