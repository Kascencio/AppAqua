import { env } from './env'

/**
 * Prisma Client Configuration for AppAqua
 * - Connection pooling optimized for MySQL 5.7
 * - Logging enabled in development
 * - Query timeout and connection limits configured
 */

// Import PrismaClient dynamically to handle generation
let PrismaClient: any
try {
  const prismaModule = require('./generated/prisma')
  PrismaClient = prismaModule.PrismaClient
} catch (error) {
  console.warn('Prisma client not generated yet. Run "npm run db:generate" first.')
  // Create a mock for build-time
  PrismaClient = class MockPrismaClient {
    constructor() {
      throw new Error('Prisma client not available. Run "npm run db:generate" first.')
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined
}

const createPrismaClient = () => {
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
const prisma = globalThis.__prisma || createPrismaClient()

if (env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

export default prisma

/**
 * Helper function to handle Prisma errors and convert them to appropriate HTTP responses
 */
export function handlePrismaError(error: any): { status: number; message: string } {
  console.error('Prisma error:', error)

  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    return {
      status: 409,
      message: `Ya existe un registro con estos datos. Campo duplicado: ${error.meta?.target?.[0] || 'campo único'}`
    }
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return {
      status: 404,
      message: 'Registro no encontrado'
    }
  }

  // P2003: Foreign key constraint violation
  if (error.code === 'P2003') {
    return {
      status: 400,
      message: 'No se puede completar la operación debido a referencias existentes'
    }
  }

  // P2014: Relation violation
  if (error.code === 'P2014') {
    return {
      status: 400,
      message: 'La operación viola una relación requerida en la base de datos'
    }
  }

  // Connection errors
  if (error.code === 'P1001' || error.code === 'P1008') {
    return {
      status: 503,
      message: 'Error de conexión a la base de datos. Intente nuevamente.'
    }
  }

  // Timeout
  if (error.code === 'P1008') {
    return {
      status: 504,
      message: 'Tiempo de espera agotado en la consulta a la base de datos'
    }
  }

  // Generic error
  return {
    status: 500,
    message: env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
  }
}

/**
 * Transaction helper with retry logic
 */
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx: any) => {
        return await operation(tx)
      })
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on validation errors (4xx)
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any
        if (prismaError.code?.startsWith('P2002') || prismaError.code?.startsWith('P2025')) {
          throw error
        }
      }

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}