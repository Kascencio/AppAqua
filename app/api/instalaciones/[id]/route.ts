import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const row = await prisma.instalacion.findUnique({ where: { id_instalacion: id } })
    if (!row) {
      return NextResponse.json({ error: "Instalación no encontrada" }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (error) {
    console.error("Error obteniendo instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await request.json()
    await prisma.instalacion.update({ where: { id_instalacion: id }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    await prisma.instalacion.delete({ where: { id_instalacion: id } })
    return NextResponse.json({ message: "Instalación eliminada correctamente" })
  } catch (error) {
    console.error("Error eliminando instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
