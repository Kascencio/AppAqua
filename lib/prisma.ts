import { PrismaClient } from '@prisma/client'
import { env } from './env'

/**
 * Prisma Client Configuration for AppAqua
 * - Connection pooling optimized for MySQL 5.7
 * - Logging enabled in development
 * - Query timeout and connection limits configured
 */

const createPrismaClient = () => {
  console.log('🔌 Initializing Prisma Client with DATABASE_URL:', env.DATABASE_URL ? 'Set' : 'Unset')
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  })
}

// Singleton pattern for Prisma Client
// Prevents multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { __prisma: PrismaClient }
const prisma = globalForPrisma.__prisma || createPrismaClient()

if (env.NODE_ENV === 'development') {
  globalForPrisma.__prisma = prisma
}

export type PrismaError = {
  message: string
  status: number
}

export const handlePrismaError = (error: any): PrismaError => {
  if (error.code === 'P2002') {
    return { message: 'Ya existe un registro con estos datos únicos', status: 409 }
  }
  if (error.code === 'P2025') {
    return { message: 'Registro no encontrado', status: 404 }
  }
  if (error.code === 'P2003') {
    return { message: 'Error de integridad referencial', status: 400 }
  }

  console.error('Prisma Error:', error)
  return { message: 'Error interno del servidor', status: 500 }
}

export { prisma }
export default prisma