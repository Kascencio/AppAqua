import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Verificar si viene de la página temporal (permite lectura sin autenticación)
    const { searchParams } = new URL(request.url)
    const fromTemp = searchParams.get('fromTemp') === 'true'

    // Si no es de la página temp, requerir autenticación
    if (!fromTemp) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
      const decoded = token ? JWTUtils.verifyToken(token) : null
      if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      
      const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
      const roleName = role?.nombre?.toLowerCase()
      if (!roleName || !["superadmin", "admin"].includes(roleName)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const roles = await prisma.tipo_rol.findMany({
      include: {
        _count: {
          select: { usuario: true }
        }
      },
      orderBy: {
        id_rol: 'asc'
      }
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error en /api/roles GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.nombre || !body.nombre.trim()) {
      return NextResponse.json({ error: "El nombre del rol es obligatorio" }, { status: 400 })
    }

    // Verificar si viene de la página temporal (permite creación sin autenticación)
    // Solo permitir creación sin autenticación si viene explícitamente marcado desde temp
    const isFromTempPage = body.fromTemp === true

    // Si no es de la página temp, requerir autenticación
    if (!isFromTempPage) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
      const decoded = token ? JWTUtils.verifyToken(token) : null
      if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      
      const requesterRole = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
      const requesterRoleName = requesterRole?.nombre?.toLowerCase()
      if (requesterRoleName !== 'superadmin') {
        return NextResponse.json({ error: 'Solo SuperAdmin puede crear roles' }, { status: 403 })
      }
    }

    // Validar nombre único
    const rolExistente = await prisma.tipo_rol.findFirst({
      where: { 
        nombre: {
          equals: body.nombre.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (rolExistente) {
      return NextResponse.json({ 
        error: 'El nombre del rol ya existe',
        detalles: `Ya existe un rol con el nombre "${body.nombre}"`
      }, { status: 409 })
    }

    const created = await prisma.tipo_rol.create({
      data: {
        nombre: body.nombre.trim()
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error("Error en /api/roles POST:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'El nombre del rol ya existe',
        detalles: error.meta?.target ? `El campo ${error.meta.target} ya existe` : 'Ya existe un rol con este nombre'
      }, { status: 409 })
    }
    
    // Error de conexión de Prisma
    if (error.message?.includes('Can\'t reach database server') || error.message?.includes('connection')) {
      return NextResponse.json({ 
        error: 'Error de conexión a la base de datos',
        detalles: 'No se pudo conectar a la base de datos. Verifica la configuración.'
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: "Error al crear rol",
      detalles: error.message || 'Error desconocido'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de rol es obligatorio" }, { status: 400 })
    }

    const body = await request.json()
    
    // Verificar si viene de la página temporal (permite edición sin autenticación)
    const isFromTempPage = body.fromTemp === true

    // Si no es de la página temp, requerir autenticación
    if (!isFromTempPage) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
      const decoded = token ? JWTUtils.verifyToken(token) : null
      if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      
      const requesterRole = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
      const requesterRoleName = requesterRole?.nombre?.toLowerCase()
      if (requesterRoleName !== 'superadmin') {
        return NextResponse.json({ error: 'Solo SuperAdmin puede editar roles' }, { status: 403 })
      }
    }
    
    // Validar que el rol existe
    const rolExistente = await prisma.tipo_rol.findUnique({ where: { id_rol: Number(id) } })
    if (!rolExistente) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    // No permitir editar roles del sistema (SuperAdmin, Admin, Standard)
    const nombreActual = rolExistente.nombre.toLowerCase()
    if (['superadmin', 'admin', 'standard'].includes(nombreActual)) {
      return NextResponse.json({ 
        error: 'No se puede editar un rol del sistema',
        detalles: 'Los roles SuperAdmin, Admin y Standard son roles del sistema y no pueden ser editados'
      }, { status: 403 })
    }

    // Validar nombre único si se está cambiando
    if (body.nombre && body.nombre.trim() !== rolExistente.nombre) {
      const nombreDuplicado = await prisma.tipo_rol.findFirst({
        where: { 
          nombre: {
            equals: body.nombre.trim(),
            mode: 'insensitive'
          },
          NOT: { id_rol: Number(id) }
        }
      })

      if (nombreDuplicado) {
        return NextResponse.json({ 
          error: 'El nombre del rol ya existe',
          detalles: `Ya existe otro rol con el nombre "${body.nombre}"`
        }, { status: 409 })
      }
    }

    const updated = await prisma.tipo_rol.update({
      where: { id_rol: Number(id) },
      data: {
        nombre: body.nombre?.trim() || rolExistente.nombre
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error en /api/roles PUT:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El nombre del rol ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al actualizar rol" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de rol es obligatorio" }, { status: 400 })
    }

    // Verificar si viene de la página temporal usando header o query param
    const fromTempHeader = request.headers.get('x-from-temp') === 'true'
    const fromTempQuery = searchParams.get('fromTemp') === 'true'
    const isFromTempPage = fromTempHeader || fromTempQuery

    // Si no es de la página temp, requerir autenticación
    if (!isFromTempPage) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
      const decoded = token ? JWTUtils.verifyToken(token) : null
      if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      
      const requesterRole = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
      const requesterRoleName = requesterRole?.nombre?.toLowerCase()
      if (requesterRoleName !== 'superadmin') {
        return NextResponse.json({ error: 'Solo SuperAdmin puede eliminar roles' }, { status: 403 })
      }
    }

    const rolAEliminar = await prisma.tipo_rol.findUnique({
      where: { id_rol: Number(id) },
      include: {
        _count: {
          select: { usuario: true }
        }
      }
    })

    if (!rolAEliminar) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    // No permitir eliminar roles del sistema
    const nombreRol = rolAEliminar.nombre.toLowerCase()
    if (['superadmin', 'admin', 'standard'].includes(nombreRol)) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un rol del sistema',
        detalles: 'Los roles SuperAdmin, Admin y Standard son roles del sistema y no pueden ser eliminados'
      }, { status: 403 })
    }

    // Verificar si hay usuarios con este rol
    if (rolAEliminar._count.usuario > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el rol',
        detalles: `Hay ${rolAEliminar._count.usuario} usuario(s) asignado(s) a este rol. Reasigne los usuarios a otro rol antes de eliminar este.`
      }, { status: 409 })
    }

    await prisma.tipo_rol.delete({
      where: { id_rol: Number(id) }
    })

    return NextResponse.json({ 
      message: "Rol eliminado correctamente"
    })
  } catch (error: any) {
    console.error("Error en /api/roles DELETE:", error)
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'No se puede eliminar el rol',
        detalles: 'Hay usuarios asignados a este rol. Reasigne los usuarios antes de eliminar.'
      }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al eliminar rol" }, { status: 500 })
  }
}

