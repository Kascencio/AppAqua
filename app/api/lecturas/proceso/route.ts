import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { parseDateForPrisma } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proceso = searchParams.get("proceso")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    if (!proceso) {
      return NextResponse.json({ error: "Parámetro proceso es obligatorio" }, { status: 400 })
    }

    const instalaciones = await prisma.instalacion.findMany({
      where: { id_proceso: Number(proceso) },
      select: { id_instalacion: true },
    })
    const instalacionIds = instalaciones.map(i => i.id_instalacion)
    if (instalacionIds.length === 0) {
      return NextResponse.json({ lecturas: [], parametros: [], proceso_id: Number(proceso), periodo: { inicio: from || "", fin: to || "" }, total_lecturas: 0 })
    }

    const sensores = await prisma.sensor_instalado.findMany({
      where: { id_instalacion: { in: instalacionIds } },
      select: { id_sensor_instalado: true },
    })
    const sensorIds = sensores.map(s => s.id_sensor_instalado)
    if (sensorIds.length === 0) {
      return NextResponse.json({ lecturas: [], parametros: [], proceso_id: Number(proceso), periodo: { inicio: from || "", fin: to || "" }, total_lecturas: 0 })
    }

    let lecturas: any[] = []
    if (from && to) {
      lecturas = await prisma.lectura.findMany({
        where: {
          id_sensor_instalado: { in: sensorIds },
          fecha: { gte: parseDateForPrisma(from)!, lte: parseDateForPrisma(to)! },
        },
      })
    }

    return NextResponse.json({
      lecturas,
      parametros: [],
      proceso_id: Number(proceso),
      periodo: { inicio: from || "", fin: to || "" },
      total_lecturas: lecturas.length,
    })
  } catch (error) {
    console.error("Error en /api/lecturas/proceso GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id_sensor_instalado || body.valor == null || !body.fecha || !body.hora || !body.id_proceso) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const created = await prisma.lectura.create({
      data: {
        id_sensor_instalado: Number(body.id_sensor_instalado),
        valor: body.valor,
        fecha: parseDateForPrisma(body.fecha)!,
        hora: parseDateForPrisma(`1970-01-01T${body.hora}`)!,
      }
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando lectura para proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
