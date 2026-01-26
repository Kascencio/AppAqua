import { NextRequest, NextResponse } from 'next/server'
import prisma, { handlePrismaError } from '@/lib/prisma'
import {
  organizacionCreateSchema,
  organizacionQuerySchema,
  validateRequestBody,
  validateQueryParams
} from '@/lib/validations'

/**
 * GET /api/organizaciones
 * List organizations with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const rawParams = Object.fromEntries(url.searchParams.entries())

    // Convert string numbers to actual numbers for validation
    const queryParams = {
      ...rawParams,
      page: rawParams.page ? Number(rawParams.page) : undefined,
      pageSize: rawParams.pageSize ? Number(rawParams.pageSize) : undefined,
      id_estado: rawParams.id_estado ? Number(rawParams.id_estado) : undefined,
    }

    const {
      search,
      estado,
      id_estado,
      page = 1,
      pageSize = 10
    } = validateQueryParams(organizacionQuerySchema, queryParams)

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { razon_social: { contains: search } },
        { rfc: { contains: search } },
        { correo: { contains: search } }
      ]
    }

    if (estado) {
      where.estado = estado
    }

    if (id_estado) {
      where.id_estado = id_estado
    }

    // Get total count for pagination
    const total = await prisma.organizacion.count({ where })

    // Get paginated results
    const organizaciones = await prisma.organizacion.findMany({
      where,
      include: {
        estados: true,
        municipios: true,
        organizacion_sucursal: {
          select: {
            id_organizacion_sucursal: true,
            nombre_sucursal: true,
            estado: true
          }
        }
      },
      orderBy: { fecha_creacion: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        items: organizaciones,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
    })

  } catch (error) {
    console.error('Error fetching organizaciones:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de consulta inválidos' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizaciones
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateRequestBody(organizacionCreateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      )
    }

    const organizacionData = validation.data

    // Check if organization with same name already exists
    const existingOrg = await prisma.organizacion.findFirst({
      where: {
        nombre: organizacionData.nombre
      }
    })

    if (existingOrg) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe una organización con ese nombre'
        },
        { status: 409 }
      )
    }

    // Create organization
    const organizacion = await prisma.organizacion.create({
      data: organizacionData,
      include: {
        estados: true,
        municipios: true,
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: organizacion,
        message: 'Organización creada exitosamente',
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating organizacion:', error)
    const prismaError = handlePrismaError(error)

    return NextResponse.json(
      { success: false, error: prismaError.message },
      { status: prismaError.status }
    )
  }
}