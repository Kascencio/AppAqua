import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils } from "@/lib/auth-utils"
import { parseDateForPrisma } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const rows = await prisma.procesos.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo procesos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    if (!body.id_especie || !body.fecha_inicio || !body.fecha_final) {
      return NextResponse.json({ error: "id_especie, fecha_inicio, fecha_final requeridos" }, { status: 400 })
    }

    const fechaInicio = parseDateForPrisma(body.fecha_inicio)
    const fechaFinal = parseDateForPrisma(body.fecha_final)

    if (!fechaInicio || !fechaFinal) {
      return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
    }

    // 🔒 VALIDAR RANGO DE FECHAS
    if (fechaFinal <= fechaInicio) {
      return NextResponse.json(
        { 
          error: "Rango de fechas inválido",
          detalles: "La fecha final debe ser posterior a la fecha de inicio"
        }, 
        { status: 400 }
      )
    }

    // 🔒 VALIDAR SOLAPAMIENTO: Si se proporciona id_instalacion, verificar que no haya procesos solapados
    if (body.id_instalacion) {
      const procesosEnConflicto = await prisma.procesos.findMany({
        where: {
          instalacion: {
            some: {
              id_instalacion: Number(body.id_instalacion)
            }
          },
          OR: [
            {
              // Nuevo proceso comienza durante un proceso existente
              AND: [
                { fecha_inicio: { lte: fechaInicio } },
                { fecha_final: { gte: fechaInicio } }
              ]
            },
            {
              // Nuevo proceso termina durante un proceso existente
              AND: [
                { fecha_inicio: { lte: fechaFinal } },
                { fecha_final: { gte: fechaFinal } }
              ]
            },
            {
              // Nuevo proceso envuelve completamente a un proceso existente
              AND: [
                { fecha_inicio: { gte: fechaInicio } },
                { fecha_final: { lte: fechaFinal } }
              ]
            }
          ]
        },
        select: {
          id_proceso: true,
          fecha_inicio: true,
          fecha_final: true,
          especies: {
            select: {
              nombre: true
            }
          }
        }
      })

      if (procesosEnConflicto.length > 0) {
        return NextResponse.json(
          { 
            error: "Conflicto de fechas",
            detalles: `La instalación ya tiene ${procesosEnConflicto.length} proceso(s) programado(s) en el rango de fechas seleccionado`,
            procesos_conflictivos: procesosEnConflicto.map(p => ({
              id: p.id_proceso,
              especie: p.especies.nombre,
              fecha_inicio: p.fecha_inicio,
              fecha_final: p.fecha_final
            }))
          }, 
          { status: 409 } // 409 Conflict
        )
      }
    }

    const created = await prisma.procesos.create({
      data: {
        id_especie: Number(body.id_especie),
        fecha_inicio: fechaInicio,
        fecha_final: fechaFinal,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de proceso es obligatorio" }, { status: 400 })
    }
    
    const body = await request.json()
    const procesoId = Number(id)

    // 🔒 VALIDAR RANGO DE FECHAS si se están actualizando
    if (body.fecha_inicio && body.fecha_final) {
      const fechaInicio = parseDateForPrisma(body.fecha_inicio)
      const fechaFinal = parseDateForPrisma(body.fecha_final)

      if (!fechaInicio || !fechaFinal) {
        return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
      }

      if (fechaFinal <= fechaInicio) {
        return NextResponse.json(
          { 
            error: "Rango de fechas inválido",
            detalles: "La fecha final debe ser posterior a la fecha de inicio"
          }, 
          { status: 400 }
        )
      }

      // 🔒 VALIDAR SOLAPAMIENTO: Obtener instalaciones del proceso
      const procesoActual = await prisma.procesos.findUnique({
        where: { id_proceso: procesoId },
        include: { instalacion: true }
      })

      if (procesoActual && procesoActual.instalacion.length > 0) {
        for (const inst of procesoActual.instalacion) {
          const procesosEnConflicto = await prisma.procesos.findMany({
            where: {
              id_proceso: { not: procesoId }, // Excluir el proceso actual
              instalacion: {
                some: {
                  id_instalacion: inst.id_instalacion
                }
              },
              OR: [
                {
                  AND: [
                    { fecha_inicio: { lte: fechaInicio } },
                    { fecha_final: { gte: fechaInicio } }
                  ]
                },
                {
                  AND: [
                    { fecha_inicio: { lte: fechaFinal } },
                    { fecha_final: { gte: fechaFinal } }
                  ]
                },
                {
                  AND: [
                    { fecha_inicio: { gte: fechaInicio } },
                    { fecha_final: { lte: fechaFinal } }
                  ]
                }
              ]
            },
            select: {
              id_proceso: true,
              fecha_inicio: true,
              fecha_final: true,
              especies: {
                select: {
                  nombre: true
                }
              }
            }
          })

          if (procesosEnConflicto.length > 0) {
            return NextResponse.json(
              { 
                error: "Conflicto de fechas",
                detalles: `La instalación "${inst.nombre_instalacion}" ya tiene ${procesosEnConflicto.length} proceso(s) programado(s) en el nuevo rango de fechas`,
                procesos_conflictivos: procesosEnConflicto.map(p => ({
                  id: p.id_proceso,
                  especie: p.especies.nombre,
                  fecha_inicio: p.fecha_inicio,
                  fecha_final: p.fecha_final
                }))
              }, 
              { status: 409 }
            )
          }
        }
      }
    }

    await prisma.procesos.update({ where: { id_proceso: procesoId }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (roleName !== "superadmin") {
      return NextResponse.json({ error: "Solo superadmin puede eliminar procesos" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de proceso es obligatorio" }, { status: 400 })
    }
    await prisma.procesos.delete({ where: { id_proceso: Number(id) } })
    return NextResponse.json({ message: "Proceso eliminado correctamente" })
  } catch (error) {
    console.error("Error eliminando proceso:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
