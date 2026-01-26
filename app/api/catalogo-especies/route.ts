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

    const rows = await prisma.especies.findMany()
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error obteniendo especies:", error)
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
    // Validar rol por nombre (IDs pueden variar por seeds)
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    if (!body.nombre) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 })
    }

    // 🔒 VALIDAR DUPLICADOS: Verificar que no exista especie con el mismo nombre
    const especieExistente = await prisma.especies.findFirst({
      where: {
        nombre: body.nombre
      }
    })

    if (especieExistente) {
      return NextResponse.json(
        { 
          error: "Ya existe una especie con ese nombre",
          detalles: `La especie "${body.nombre}" ya está registrada`
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    const created = await prisma.especies.create({ data: { nombre: body.nombre } })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creando especie:", error)
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
      return NextResponse.json({ error: "ID de especie es obligatorio" }, { status: 400 })
    }
    const body = await request.json()
    await prisma.especies.update({ where: { id_especie: Number(id) }, data: body })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando especie:", error)
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
      return NextResponse.json({ error: "Solo superadmin puede eliminar especies" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de especie es obligatorio" }, { status: 400 })
    }

    const especieId = Number(id)

    // 🔒 VALIDAR DEPENDENCIAS: Verificar si hay procesos con esta especie
    const procesosAsociados = await prisma.procesos.findMany({
      where: {
        id_especie: especieId,
        fecha_final: {
          gte: new Date() // Procesos que aún no han finalizado
        }
      },
      select: {
        id_proceso: true,
        fecha_inicio: true,
        fecha_final: true
      }
    })

    if (procesosAsociados.length > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar la especie porque tiene procesos activos asociados",
          detalles: `Se encontraron ${procesosAsociados.length} proceso(s) activo(s) o futuro(s). Por favor, finalice o elimine estos procesos primero.`,
          procesos: procesosAsociados
        }, 
        { status: 409 } // 409 Conflict
      )
    }

    // Verificar todos los procesos (incluso finalizados)
    const todosProcesos = await prisma.procesos.count({
      where: { id_especie: especieId }
    })

    if (todosProcesos > 0) {
      // Tiene procesos históricos - podríamos avisar o permitir eliminar de todos modos
      console.warn(`⚠️ Eliminando especie ID ${especieId} que tiene ${todosProcesos} procesos históricos`)
    }

    // Eliminar parámetros asociados primero (cascade manual)
    const deletedParams = await prisma.especie_parametro.deleteMany({
      where: { id_especie: especieId }
    })

    // Eliminar la especie
    await prisma.especies.delete({ where: { id_especie: especieId } })
    
    return NextResponse.json({ 
      message: "Especie eliminada correctamente",
      eliminados: {
        especie: 1,
        parametros: deletedParams.count
      }
    })
  } catch (error: any) {
    console.error("Error eliminando especie:", error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "No se puede eliminar la especie porque tiene registros relacionados",
        detalles: "Existen procesos u otros datos asociados a esta especie"
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Error interno del servidor",
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
