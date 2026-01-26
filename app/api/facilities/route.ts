import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { parseDateForPrisma } from "@/lib/date-utils"

function normalizeOrganizacionSucursalId(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : (raw as number)
  if (!Number.isFinite(n) || n <= 0) return null
  return n >= 10000 ? n - 10000 : n
}

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
    // Accept either id_empresa_sucursal or id_organizacion_sucursal
    const rawOrgId = body.id_organizacion_sucursal ?? body.id_empresa_sucursal
    if (!rawOrgId || !body.nombre_instalacion || !body.fecha_instalacion || !body.estado_operativo || !body.descripcion || !body.tipo_uso) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }
    
    const orgId = normalizeOrganizacionSucursalId(rawOrgId)
    if (!orgId) {
      return NextResponse.json({ error: "ID de organización/sucursal inválido" }, { status: 400 })
    }
    
    const fechaInst = parseDateForPrisma(body.fecha_instalacion)
    if (!fechaInst) {
      return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
    }
    
    const idProceso = body.id_proceso ? Number(body.id_proceso) : null
    if (!idProceso) {
      return NextResponse.json({ error: "ID de proceso inválido" }, { status: 400 })
    }

    const created = await prisma.instalacion.create({
      data: {
        id_organizacion_sucursal: orgId,
        nombre_instalacion: body.nombre_instalacion,
        fecha_instalacion: fechaInst,
        estado_operativo: body.estado_operativo,
        descripcion: body.descripcion,
        tipo_uso: body.tipo_uso,
        id_proceso: idProceso,
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
