import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { JWTUtils, PasswordUtils, ValidationUtils } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
    const decoded = token ? JWTUtils.verifyToken(token) : null
    if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
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
    const body = await request.json()
    
    // Verificar si viene de la página temporal (permite creación sin autenticación)
    const isFromTempPage = body.fromTemp === true

    // Si no es de la página temp, requerir autenticación
    if (!isFromTempPage) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
      const decoded = token ? JWTUtils.verifyToken(token) : null
      if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      const requesterRole = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
      const requesterRoleName = requesterRole?.nombre?.toLowerCase()
      if (!requesterRoleName || !["superadmin", "admin"].includes(requesterRoleName)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }
    if (!body.nombre_completo || !body.correo || !body.password || !body.id_rol) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // 🔒 VALIDAR FORMATO DE EMAIL
    if (!ValidationUtils.isValidEmail(body.correo)) {
      return NextResponse.json({ 
        error: 'Formato de email inválido',
        detalles: 'Por favor, ingrese un email válido (ejemplo: usuario@dominio.com)'
      }, { status: 400 })
    }

    // 🔒 VALIDAR FORMATO DE TELÉFONO (si se proporciona)
    if (body.telefono && !ValidationUtils.isValidPhone(body.telefono)) {
      return NextResponse.json({ 
        error: 'Formato de teléfono inválido',
        detalles: 'Formatos válidos: 5512345678, 55 1234 5678, +52 55 1234 5678'
      }, { status: 400 })
    }

    // 🔒 VALIDAR FORTALEZA DE CONTRASEÑA
    const passwordValidation = PasswordUtils.validatePasswordStrength(body.password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Contraseña débil',
        detalles: passwordValidation.errors
      }, { status: 400 })
    }

    // 🔒 VALIDAR EMAIL DUPLICADO
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { correo: body.correo.toLowerCase() }
    })

    if (usuarioExistente) {
      return NextResponse.json({ 
        error: 'El email ya está registrado',
        detalles: `Ya existe un usuario con el email "${body.correo}"`
      }, { status: 409 }) // 409 Conflict
    }

    const requestedRole: number = Number(body.id_rol)
    const requestedRoleRow = await prisma.tipo_rol.findUnique({ where: { id_rol: requestedRole } })
    if (!requestedRoleRow) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 400 })
    }
    
    // Si viene de temp, permitir cualquier rol. Si no, aplicar restricciones normales
    if (!isFromTempPage) {
      const requestedRoleName = requestedRoleRow.nombre?.toLowerCase()
      if (!requestedRoleName || !["superadmin", "admin", "standard"].includes(requestedRoleName)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      
      // Obtener el rol del usuario que hace la petición (solo si no es temp)
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : request.cookies.get('access_token')?.value
      const decoded = token ? JWTUtils.verifyToken(token) : null
      if (decoded) {
        const requesterRole = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
        const requesterRoleName = requesterRole?.nombre?.toLowerCase()
        if (requesterRoleName !== 'superadmin' && requestedRoleName !== 'standard') {
          return NextResponse.json({ error: 'Solo superadmin puede crear administradores' }, { status: 403 })
        }
      }
    }

    const password_hash = await PasswordUtils.hashPassword(body.password)

    const created = await prisma.usuario.create({
      data: {
        id_rol: requestedRole,
        nombre_completo: ValidationUtils.sanitizeInput(body.nombre_completo),
        correo: body.correo.toLowerCase().trim(),
        telefono: body.telefono ? ValidationUtils.sanitizeInput(body.telefono) : null,
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
    if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validar formato de email si se está actualizando
    if (body.correo && !ValidationUtils.isValidEmail(body.correo)) {
      return NextResponse.json({ 
        error: 'Formato de email inválido',
        detalles: 'El email debe tener un formato válido (ej: usuario@dominio.com)'
      }, { status: 400 })
    }

    // Validar formato de teléfono si se está actualizando
    if (body.telefono && !ValidationUtils.isValidPhone(body.telefono)) {
      return NextResponse.json({ 
        error: 'Formato de teléfono inválido',
        detalles: 'El teléfono debe tener 10 dígitos (ej: 5512345678)'
      }, { status: 400 })
    }

    // Validar que el email no esté siendo usado por otro usuario
    if (body.correo) {
      const usuarioExistente = await prisma.usuario.findFirst({
        where: {
          correo: body.correo.toLowerCase(),
          NOT: { id_usuario: Number(id) } // Excluir el usuario actual
        }
      })
      if (usuarioExistente) {
        return NextResponse.json({ 
          error: 'El email ya está registrado',
          detalles: 'Otro usuario ya está usando este email'
        }, { status: 409 })
      }
    }

    // Validar fortaleza de contraseña si se está actualizando
    if (body.password) {
      const passwordValidation = PasswordUtils.validatePasswordStrength(body.password)
      if (!passwordValidation.isValid) {
        return NextResponse.json({ 
          error: 'Contraseña débil',
          detalles: passwordValidation.errors
        }, { status: 400 })
      }
    }
    
    if (typeof body.id_rol !== 'undefined') {
      const newRoleId = Number(body.id_rol)
      const newRoleRow = await prisma.tipo_rol.findUnique({ where: { id_rol: newRoleId } })
      const newRoleName = newRoleRow?.nombre?.toLowerCase()
      if (!newRoleName || !["superadmin", "admin", "standard"].includes(newRoleName)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      if (roleName === 'admin' && newRoleName !== 'standard') {
        return NextResponse.json({ error: 'Solo superadmin puede asignar roles de admin/superadmin' }, { status: 403 })
      }
    }

    // Sanitizar inputs
    const dataToUpdate: any = { ...body }
    if (dataToUpdate.nombre) dataToUpdate.nombre = ValidationUtils.sanitizeInput(dataToUpdate.nombre)
    if (dataToUpdate.telefono) dataToUpdate.telefono = ValidationUtils.sanitizeInput(dataToUpdate.telefono)
    if (dataToUpdate.correo) dataToUpdate.correo = dataToUpdate.correo.toLowerCase()

    await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: dataToUpdate,
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
    if (!decoded) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const role = await prisma.tipo_rol.findUnique({ where: { id_rol: decoded.id_rol } })
    const roleName = role?.nombre?.toLowerCase()
    if (!roleName || !["superadmin", "admin"].includes(roleName)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // 🔒 No permitir auto-eliminación
    if (decoded.id_usuario === Number(id)) {
      return NextResponse.json({ 
        error: 'No puede eliminar su propia cuenta',
        detalles: 'Por seguridad, no puede eliminar la cuenta con la que está autenticado'
      }, { status: 403 })
    }

    // Obtener usuario a eliminar
    const target = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
      include: { tipo_rol: true }
    })

    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const targetRoleName = target.tipo_rol.nombre.toLowerCase()

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que no sea el último SuperAdmin o Admin
    if (targetRoleName === 'superadmin') {
      const superAdminRole = await prisma.tipo_rol.findFirst({
        where: { nombre: 'SuperAdmin' }
      })
      
      if (superAdminRole) {
        const totalSuperAdmins = await prisma.usuario.count({
          where: {
            id_rol: superAdminRole.id_rol,
            estado: 'activo'
          }
        })

        if (totalSuperAdmins <= 1) {
          return NextResponse.json({ 
            error: 'No se puede eliminar el último SuperAdmin',
            detalles: 'Debe existir al menos un SuperAdmin activo en el sistema. Cree otro SuperAdmin antes de eliminar este.'
          }, { status: 409 }) // 409 Conflict
        }
      }
    }

    if (targetRoleName === 'admin' || targetRoleName === 'superadmin') {
      const adminRoles = await prisma.tipo_rol.findMany({
        where: {
          nombre: {
            in: ['Admin', 'SuperAdmin']
          }
        }
      })

      const adminRoleIds = adminRoles.map(r => r.id_rol)
      
      const totalAdmins = await prisma.usuario.count({
        where: {
          id_rol: {
            in: adminRoleIds
          },
          estado: 'activo'
        }
      })

      if (totalAdmins <= 1) {
        return NextResponse.json({ 
          error: 'No se puede eliminar el último administrador',
          detalles: 'Debe existir al menos un administrador activo en el sistema. Cree otro administrador antes de eliminar este.'
        }, { status: 409 }) // 409 Conflict
      }

      // Si es Admin, no puede eliminar otros admin/superadmin
      if (roleName === 'admin') {
        return NextResponse.json({ 
          error: 'No puede eliminar cuentas de administrador',
          detalles: 'Solo SuperAdmin puede eliminar cuentas de tipo Admin o SuperAdmin'
        }, { status: 403 })
      }
    }

    // 🔒 SOFT DELETE: Desactivar en lugar de eliminar
    await prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { estado: 'inactivo' }
    })

    return NextResponse.json({ 
      message: "Usuario desactivado correctamente",
      nota: "El usuario ha sido desactivado y ya no puede acceder al sistema. Los datos se mantienen para auditoría."
    })
  } catch (error) {
    console.error("Error en /api/usuarios DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
