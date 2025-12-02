import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = JWTUtils.extractTokenFromHeader(authHeader)
    const token = tokenFromCookie || tokenFromHeader
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const decoded = JWTUtils.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const empresaSucursalId = searchParams.get('id_empresa_sucursal')

    const rows = await prisma.instalacion.findMany({
      where: empresaSucursalId ? { id_empresa_sucursal: Number(empresaSucursalId) } : undefined,
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo instalaciones:", error)
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
    const requiredFields = [
      "id_empresa_sucursal",
      "nombre_instalacion",
      "fecha_instalacion",
      "estado_operativo",
      "descripcion",
      "tipo_uso",
      "id_proceso",
    ]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 })
      }
    }

    // 🔒 VALIDAR DUPLICADOS: Verificar que no exista instalación con el mismo nombre en la misma sucursal
    const instalacionExistente = await prisma.instalacion.findFirst({
      where: {
        id_empresa_sucursal: Number(body.id_empresa_sucursal),
        nombre_instalacion: body.nombre_instalacion
      },
      include: {
        empresa_sucursal: true
      }
    })

    if (instalacionExistente) {
      return NextResponse.json(
        { 
          error: "Ya existe una instalación con ese nombre en esta sucursal",
          detalles: `La instalación "${body.nombre_instalacion}" ya existe en "${instalacionExistente.empresa_sucursal.nombre}"`,
          instalacion_existente: {
            id: instalacionExistente.id_instalacion,
            nombre: instalacionExistente.nombre_instalacion,
            estado: instalacionExistente.estado_operativo,
            tipo_uso: instalacionExistente.tipo_uso
          }
        }, 
        { status: 409 } // 409 Conflict
      )
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
    console.error("Error creando instalacion:", error)
    return NextResponse.json({ error: "Error al crear instalación" }, { status: 500 })
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
      return NextResponse.json({ error: "ID de instalación es obligatorio" }, { status: 400 })
    }
    const body = await request.json()

    await prisma.instalacion.update({
      where: { id_instalacion: Number(id) },
      data: body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando instalación:", error)
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
      return NextResponse.json({ error: "Solo superadmin puede eliminar instalaciones" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de instalación es obligatorio" }, { status: 400 })
    }

    const instalacionId = Number(id)

    // 🔒 VALIDAR DEPENDENCIAS: Verificar sensores asociados
    const sensoresAsociados = await prisma.sensor_instalado.count({
      where: { id_instalacion: instalacionId }
    })

    if (sensoresAsociados > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar la instalación porque tiene sensores asociados",
          detalles: `Se encontraron ${sensoresAsociados} sensor(es) instalado(s). Por favor, elimine o reasigne los sensores primero.`,
          sensores: sensoresAsociados
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    // 🔒 VALIDAR DEPENDENCIAS: Verificar procesos activos
    const procesosActivos = await prisma.instalacion.count({
      where: {
        id_instalacion: instalacionId,
        procesos: {
          fecha_final: {
            gte: new Date() // Procesos que aún no han finalizado
          }
        }
      }
    })

    if (procesosActivos > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar la instalación porque tiene procesos activos",
          detalles: `Se encontraron ${procesosActivos} proceso(s) activo(s) o futuro(s). Por favor, finalice estos procesos primero.`,
          procesos: procesosActivos
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    // 🔒 VALIDAR DEPENDENCIAS: Verificar lecturas recientes
    const lecturasRecientes = await prisma.lectura.count({
      where: {
        sensor_instalado: {
          id_instalacion: instalacionId
        },
        fecha: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      }
    })

    if (lecturasRecientes > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar la instalación porque tiene datos recientes",
          detalles: `Se encontraron ${lecturasRecientes} lectura(s) en los últimos 30 días. Considere desactivar la instalación en lugar de eliminarla.`,
          sugerencia: "Use el estado 'inactivo' para preservar el historial de datos"
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    // Eliminar la instalación si no tiene dependencias
    await prisma.instalacion.delete({ where: { id_instalacion: instalacionId } })
    
    return NextResponse.json({ 
      message: "Instalación eliminada correctamente",
      nota: "La instalación y sus datos asociados han sido eliminados permanentemente"
    })
  } catch (error: any) {
    console.error("Error eliminando instalación:", error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "No se puede eliminar la instalación porque tiene registros relacionados",
        detalles: "Existen sensores, procesos u otros datos asociados a esta instalación"
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Error interno del servidor",
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
