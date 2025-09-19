import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const rows = await prisma.parametros.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo parámetros:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.nombre_parametro || !body.unidad_medida) {
      return NextResponse.json({ error: "Nombre y unidad de medida son requeridos" }, { status: 400 })
    }
    const created = await prisma.parametros.create({
      data: { nombre_parametro: body.nombre_parametro, unidad_medida: body.unidad_medida },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando parámetro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de parámetro es obligatorio" }, { status: 400 })
    }
    const body = await request.json()
    await prisma.parametros.update({ where: { id_parametro: Number(id) }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando parámetro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de parámetro es obligatorio" }, { status: 400 })
    }
    await prisma.parametros.delete({ where: { id_parametro: Number(id) } })
    return NextResponse.json({ message: "Parámetro eliminado correctamente" })
  } catch (error) {
    console.error("Error eliminando parámetro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
