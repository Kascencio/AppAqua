import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id_instalacion = Number(params.id)
    const body = await request.json()

    // Encontrar proceso asociado a la instalación
    const inst = await prisma.instalacion.findUnique({
      where: { id_instalacion },
      select: { id_proceso: true },
    })
    if (!inst) return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 })

    await prisma.procesos.update({
      where: { id_proceso: inst.id_proceso },
      data: body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando proceso de instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
