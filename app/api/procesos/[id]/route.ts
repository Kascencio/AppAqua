import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { parseDateForPrisma } from "@/lib/date-utils"

function buildProcesoUpdateData(body: any) {
  return {
    ...(body?.id_especie !== undefined ? { id_especie: Number(body.id_especie) } : {}),
    ...(body?.fecha_inicio ? { fecha_inicio: parseDateForPrisma(body.fecha_inicio) } : {}),
    ...(body?.fecha_final ? { fecha_final: parseDateForPrisma(body.fecha_final) } : {}),
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const row = await prisma.procesos.findUnique({ where: { id_proceso: id } })
    if (!row) {
      return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (error) {
    console.error("Error obteniendo proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await request.json()
    const data = buildProcesoUpdateData(body)
    await prisma.procesos.update({ where: { id_proceso: id }, data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    await prisma.procesos.delete({ where: { id_proceso: id } })
    return NextResponse.json({ message: "Proceso eliminado correctamente" })
  } catch (error) {
    console.error("Error eliminando proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
