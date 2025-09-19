import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const rows = await prisma.especie_parametro.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo especie_parametro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id_especie || !body.id_parametro || body.Rmin == null || body.Rmax == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }
    const created = await prisma.especie_parametro.create({
      data: {
        id_especie: Number(body.id_especie),
        id_parametro: Number(body.id_parametro),
        Rmin: Number(body.Rmin),
        Rmax: Number(body.Rmax),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando especie_parametro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const id_especie = searchParams.get("id_especie")
    if (!id && !id_especie) {
      return NextResponse.json({ error: "ID de especie_parametro o id_especie es obligatorio" }, { status: 400 })
    }
    if (id) {
      await prisma.especie_parametro.delete({ where: { id_especie_parametro: Number(id) } })
      return NextResponse.json({ message: "Registro eliminado correctamente" })
    }
    // eliminar todos los parámetros de una especie
    await prisma.especie_parametro.deleteMany({ where: { id_especie: Number(id_especie) } })
    return NextResponse.json({ message: "Parámetros de la especie eliminados" })
  } catch (error) {
    console.error("Error eliminando especie_parametro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
