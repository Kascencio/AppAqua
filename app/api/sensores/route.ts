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

    const rows = await prisma.sensor_instalado.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo sensores instalados:", error)
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
    if (!body.id_sensor || !body.id_instalacion || !body.fecha_instalada || !body.descripcion) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    // 🔒 VALIDAR DUPLICADOS: Verificar que no exista el mismo sensor en la misma instalación
    const sensorExistente = await prisma.sensor_instalado.findFirst({
      where: {
        id_sensor: Number(body.id_sensor),
        id_instalacion: Number(body.id_instalacion)
      },
      include: {
        catalogo_sensores: true,
        instalacion: true
      }
    })

    if (sensorExistente) {
      return NextResponse.json(
        { 
          error: "El sensor ya está instalado en esta instalación",
          detalles: `El sensor "${sensorExistente.catalogo_sensores.sensor}" ya está instalado en "${sensorExistente.instalacion.nombre_instalacion}"`,
          sensor_existente: {
            id: sensorExistente.id_sensor_instalado,
            descripcion: sensorExistente.descripcion,
            fecha_instalacion: sensorExistente.fecha_instalada
          }
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    const created = await prisma.sensor_instalado.create({
      data: {
        id_sensor: Number(body.id_sensor),
        id_instalacion: Number(body.id_instalacion),
        fecha_instalada: new Date(body.fecha_instalada),
        descripcion: body.descripcion,
        id_lectura: body.id_lectura ? Number(body.id_lectura) : null,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando sensor_instalado:", error)
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
      return NextResponse.json({ error: "ID de sensor_instalado es obligatorio" }, { status: 400 })
    }
    const body = await request.json()
    await prisma.sensor_instalado.update({
      where: { id_sensor_instalado: Number(id) },
      data: body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando sensor_instalado:", error)
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
      return NextResponse.json({ error: "Solo superadmin puede eliminar sensores" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de sensor_instalado es obligatorio" }, { status: 400 })
    }

    const sensorId = Number(id)

    // 🔒 VALIDAR DEPENDENCIAS: Verificar lecturas asociadas
    const totalLecturas = await prisma.lectura.count({
      where: { id_sensor_instalado: sensorId }
    })

    if (totalLecturas > 0) {
      // Verificar lecturas recientes (último mes)
      const lecturasRecientes = await prisma.lectura.count({
        where: {
          id_sensor_instalado: sensorId,
          fecha: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })

      return NextResponse.json(
        { 
          error: "No se puede eliminar el sensor porque tiene datos históricos",
          detalles: `El sensor tiene ${totalLecturas} lectura(s) registrada(s), de las cuales ${lecturasRecientes} son del último mes.`,
          recomendacion: "Los datos de sensores son críticos para el historial y análisis. No se permite la eliminación de sensores con lecturas.",
          alternativa: "Si el sensor ya no está en uso, puede actualizar su descripción para indicar que está 'Fuera de servicio' o 'Retirado'"
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    // 🔒 VALIDAR DEPENDENCIAS: Verificar alertas asociadas
    const alertasAsociadas = await prisma.alertas.count({
      where: { id_sensor_instalado: sensorId }
    })

    if (alertasAsociadas > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el sensor porque tiene alertas asociadas",
          detalles: `El sensor tiene ${alertasAsociadas} alerta(s) registrada(s).`,
          recomendacion: "Elimine o reasigne las alertas antes de eliminar el sensor"
        }, 
        { status: 409 }
      )
    }

    // 🔒 VALIDAR DEPENDENCIAS: Verificar promedios
    const promediosAsociados = await prisma.promedio.count({
      where: { id_sensor_instalado: sensorId }
    })

    if (promediosAsociados > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el sensor porque tiene datos estadísticos",
          detalles: `El sensor tiene ${promediosAsociados} registro(s) de promedios calculados.`,
          recomendacion: "Los datos estadísticos deben preservarse para análisis histórico"
        }, 
        { status: 409 }
      )
    }

    // Si no tiene dependencias, permitir eliminación (caso poco común)
    await prisma.sensor_instalado.delete({ where: { id_sensor_instalado: sensorId } })
    
    return NextResponse.json({ 
      message: "Sensor eliminado correctamente",
      nota: "El sensor no tenía datos asociados y ha sido eliminado permanentemente"
    })
  } catch (error: any) {
    console.error("Error eliminando sensor_instalado:", error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "No se puede eliminar el sensor porque tiene registros relacionados",
        detalles: "Existen lecturas, alertas u otros datos asociados a este sensor"
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Error interno del servidor",
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
