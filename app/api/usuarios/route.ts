import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils, USER_ROLES, PasswordUtils } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
    const decoded = token ? JWTUtils.verifyToken(token) : null
    if (!decoded || ![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const rol = searchParams.get("rol")
    const estado = searchParams.get("estado")

    const users = await prisma.usuario.findMany({
      where: {
        ...(id ? { id_usuario: Number(id) } : {}),
        ...(estado ? { estado: estado as any } : {}),
        ...(rol ? { tipo_rol: { nombre: rol } } : {}),
      },
      include: { tipo_rol: true },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error en /api/usuarios GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
    const decoded = token ? JWTUtils.verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.nombre_completo || !body.correo || !body.password || !body.id_rol) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const requestedRole: number = Number(body.id_rol)
    if (![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.STANDARD].includes(requestedRole)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const isRequesterSuperadmin = decoded.id_rol === USER_ROLES.SUPERADMIN
    if (!isRequesterSuperadmin && requestedRole !== USER_ROLES.STANDARD) {
      return NextResponse.json({ error: 'Solo superadmin puede crear administradores' }, { status: 403 })
    }

    const password_hash = await PasswordUtils.hashPassword(body.password)

    const created = await prisma.usuario.create({
      data: {
        id_rol: requestedRole,
        nombre_completo: body.nombre_completo,
        correo: body.correo.toLowerCase(),
        telefono: body.telefono ?? null,
        password_hash,
        estado: body.estado ?? 'activo',
      },
      include: { tipo_rol: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error en /api/usuarios POST:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de usuario es obligatorio" }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
    const decoded = token ? JWTUtils.verifyToken(token) : null
    if (!decoded || ![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    if (typeof body.id_rol !== 'undefined') {
      const newRole = Number(body.id_rol)
      if (![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.STANDARD].includes(newRole)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      if (decoded.id_rol === USER_ROLES.ADMIN && newRole !== USER_ROLES.STANDARD) {
        return NextResponse.json({ error: 'Solo superadmin puede asignar roles de admin/superadmin' }, { status: 403 })
      }
    }

    await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: body,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en /api/usuarios PUT:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID de usuario es obligatorio" }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
    const decoded = token ? JWTUtils.verifyToken(token) : null
    if (!decoded || ![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(decoded.id_rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (decoded.id_rol === USER_ROLES.ADMIN) {
      const target = await prisma.usuario.findUnique({
        where: { id_usuario: Number(id) },
        select: { id_rol: true }
      })
      if (target && (target.id_rol === USER_ROLES.SUPERADMIN || target.id_rol === USER_ROLES.ADMIN)) {
        return NextResponse.json({ error: 'No puede eliminar cuentas admin/superadmin' }, { status: 403 })
      }
    }

    await prisma.usuario.delete({ where: { id_usuario: Number(id) } })
    return NextResponse.json({ message: "Usuario eliminado correctamente" })
  } catch (error) {
    console.error("Error en /api/usuarios DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
