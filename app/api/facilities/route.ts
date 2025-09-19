import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const rows = await prisma.instalacion.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo instalaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id_empresa_sucursal || !body.nombre_instalacion || !body.fecha_instalacion || !body.estado_operativo || !body.descripcion || !body.tipo_uso || !body.id_proceso) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }
    const created = await prisma.instalacion.create({
      data: {
        id_empresa_sucursal: Number(body.id_empresa_sucursal),
        nombre_instalacion: body.nombre_instalacion,
        fecha_instalacion: new Date(body.fecha_instalacion),
        estado_operativo: body.estado_operativo,
        descripcion: body.descripcion,
        tipo_uso: body.tipo_uso,
        id_proceso: Number(body.id_proceso),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de instalación es obligatorio" }, { status: 400 })
    }
    await prisma.instalacion.delete({ where: { id_instalacion: Number(id) } })
    return NextResponse.json({ message: "Instalación eliminada correctamente" })
  } catch (error) {
    console.error("Error eliminando instalación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
