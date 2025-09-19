import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertRole(name: string): Promise<number> {
  const role = await prisma.tipo_rol.upsert({
    where: { nombre: name },
    update: {},
    create: { nombre: name },
    select: { id_rol: true },
  })
  return role.id_rol
}

async function ensureUser(
  nombre: string,
  correo: string,
  password: string,
  idRol: number,
  telefono?: string | null,
) {
  const existing = await prisma.usuario.findUnique({ where: { correo: correo.toLowerCase() }, select: { id_usuario: true } })
  if (existing) {
    console.log(`Usuario ya existe: ${correo}`)
    return existing.id_usuario
  }
  const hash = await bcrypt.hash(password, 12)
  const created = await prisma.usuario.create({
    data: {
      id_rol: idRol,
      nombre_completo: nombre,
      correo: correo.toLowerCase(),
      telefono: telefono ?? null,
      password_hash: hash,
      estado: 'activo',
    },
    select: { id_usuario: true }
  })
  console.log(`Usuario creado: ${correo}`)
  return created.id_usuario
}

async function main() {
  try {
    const superadminRoleId = await upsertRole('superadmin')
    const adminRoleId = await upsertRole('admin')
    const standardRoleId = await upsertRole('standard')

    console.log('Roles asegurados:', { superadminRoleId, adminRoleId, standardRoleId })

    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@aqua.local'
    const superadminPass = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!'
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aqua.local'
    const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMe123!'

    await ensureUser('Super Administrador', superadminEmail, superadminPass, superadminRoleId)
    await ensureUser('Administrador', adminEmail, adminPass, adminRoleId)

    console.log('Seed completado. Credenciales:')
    console.log(`- Superadmin: ${superadminEmail} / ${superadminPass}`)
    console.log(`- Admin:      ${adminEmail} / ${adminPass}`)
  } catch (error) {
    console.error('Error en seed:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()


