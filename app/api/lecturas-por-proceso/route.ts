import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { parseDateForPrisma } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id_proceso = searchParams.get("id_proceso")
    const fecha_inicio = searchParams.get("fecha_inicio")
    const fecha_fin = searchParams.get("fecha_fin")
    if (!id_proceso) {
      return NextResponse.json({ error: "ID de proceso requerido" }, { status: 400 })
    }

    // Opcionalmente obtener lecturas reales si se requieren
    return NextResponse.json({
      lecturas: [],
      parametros: [],
      total: 0,
      proceso_id: Number(id_proceso),
    })
  } catch (error) {
    console.error("Error en API lecturas-por-proceso:", error)
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
