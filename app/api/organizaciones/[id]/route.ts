import { NextRequest, NextResponse } from 'next/server'
import prisma, { handlePrismaError } from '@/lib/prisma'
import { 
  organizacionUpdateSchema,
  validateRequestBody,
  idSchema 
} from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/organizaciones/[id]
 * Get a specific organization by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number(params.id)
    
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de organización inválido' },
        { status: 400 }
      )
    }

    const organizacion = await prisma.organizacion.findUnique({
      where: { id_organizacion: id },
      include: {
        estados: true,
        municipios: true,
        colonias: true,
        organizacion_sucursal: {
          include: {
            estados: true,
            municipios: true,
            colonias: true,
          }
        }
      }
    })

    if (!organizacion) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: organizacion,
    })

  } catch (error) {
    console.error('Error fetching organizacion:', error)
    const prismaError = handlePrismaError(error)
    
    return NextResponse.json(
      { success: false, error: prismaError.message },
      { status: prismaError.status }
    )
  }
}

/**
 * PATCH /api/organizaciones/[id]
 * Update a specific organization
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number(params.id)
    
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de organización inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = validateRequestBody(
      organizacionUpdateSchema.omit({ id_organizacion: true }), 
      body
    )

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

    const updateData = validation.data

    // Check if organization exists
    const existingOrg = await prisma.organizacion.findUnique({
      where: { id_organizacion: id }
    })

    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    // Check if updating name and it conflicts with another organization
    if (updateData.nombre && updateData.nombre !== existingOrg.nombre) {
      const conflictingOrg = await prisma.organizacion.findFirst({
        where: { 
          nombre: updateData.nombre,
          id_organizacion: { not: id }
        }
      })

      if (conflictingOrg) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ya existe otra organización con ese nombre' 
          },
          { status: 409 }
        )
      }
    }

    // Update organization
    const organizacion = await prisma.organizacion.update({
      where: { id_organizacion: id },
      data: updateData,
      include: {
        estados: true,
        municipios: true,
        colonias: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: organizacion,
      message: 'Organización actualizada exitosamente',
    })

  } catch (error) {
    console.error('Error updating organizacion:', error)
    const prismaError = handlePrismaError(error)
    
    return NextResponse.json(
      { success: false, error: prismaError.message },
      { status: prismaError.status }
    )
  }
}

/**
 * DELETE /api/organizaciones/[id]
 * Delete a specific organization
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number(params.id)
    
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de organización inválido' },
        { status: 400 }
      )
    }

    // Check if organization exists
    const existingOrg = await prisma.organizacion.findUnique({
      where: { id_organizacion: id },
      include: {
        organizacion_sucursal: {
          select: { id_organizacion_sucursal: true }
        }
      }
    })

    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    // Check if organization has active sucursales
    if (existingOrg.organizacion_sucursal.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar la organización porque tiene sucursales asociadas' 
        },
        { status: 409 }
      )
    }

    // Delete organization
    await prisma.organizacion.delete({
      where: { id_organizacion: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Organización eliminada exitosamente',
    })

  } catch (error) {
    console.error('Error deleting organizacion:', error)
    const prismaError = handlePrismaError(error)
    
    return NextResponse.json(
      { success: false, error: prismaError.message },
      { status: prismaError.status }
    )
  }
}