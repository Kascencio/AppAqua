import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

function normalizeOrganizacionSucursalId(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : (raw as number)
  if (!Number.isFinite(n) || n <= 0) return null
  return n >= 10000 ? n - 10000 : n
}

// Parse date string (YYYY-MM-DD) to proper Date object for Prisma @db.Date
function parseDateForPrisma(dateStr: string | Date | undefined): Date | undefined {
  if (!dateStr) return undefined
  if (dateStr instanceof Date) return dateStr
  if (typeof dateStr === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr + 'T00:00:00.000Z')
    }
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

function buildInstalacionUpdateData(body: any) {
  const idOrgSuc =
    body?.id_organizacion_sucursal !== undefined
      ? normalizeOrganizacionSucursalId(body.id_organizacion_sucursal)
      : body?.id_empresa_sucursal !== undefined
        ? normalizeOrganizacionSucursalId(body.id_empresa_sucursal)
        : null

  const fechaInst = parseDateForPrisma(body?.fecha_instalacion)

  return {
    ...(idOrgSuc ? { id_organizacion_sucursal: idOrgSuc } : {}),
    ...(body?.nombre_instalacion !== undefined ? { nombre_instalacion: body.nombre_instalacion } : {}),
    ...(fechaInst ? { fecha_instalacion: fechaInst } : {}),
    ...(body?.estado_operativo !== undefined ? { estado_operativo: body.estado_operativo } : {}),
    ...(body?.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
    ...(body?.tipo_uso !== undefined ? { tipo_uso: body.tipo_uso } : {}),
    ...(body?.id_proceso !== undefined ? { id_proceso: Number(body.id_proceso) } : {}),
  }
}

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
    const data = buildInstalacionUpdateData(body)
    await prisma.instalacion.update({ where: { id_instalacion: id }, data })
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
