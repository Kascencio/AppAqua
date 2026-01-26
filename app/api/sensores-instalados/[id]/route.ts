import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const row = await prisma.sensor_instalado.findUnique({ where: { id_sensor_instalado: id } })
    if (!row) {
      return NextResponse.json({ error: "Sensor no encontrado" }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (error) {
    console.error("Error obteniendo sensor_instalado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await request.json()
    await prisma.sensor_instalado.update({ where: { id_sensor_instalado: id }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando sensor_instalado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    await prisma.sensor_instalado.delete({ where: { id_sensor_instalado: id } })
    return NextResponse.json({ message: "Sensor eliminado correctamente" })
  } catch (error) {
    console.error("Error eliminando sensor_instalado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
