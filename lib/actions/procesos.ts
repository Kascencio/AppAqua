"use server"

interface CreateProcesoData {
  id?: string
  especie: string
  instalacion: string
  fechaInicio: Date
  fechaFin: Date
  notas?: string
  objetivos?: string
}

export async function createProceso(data: CreateProcesoData) {
  try {
    // Generar ID único si no se proporciona
    const procesoId = data.id || `PROC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()

    // Validaciones
    if (!data.especie || !data.instalacion || !data.fechaInicio || !data.fechaFin) {
      throw new Error("Todos los campos obligatorios deben estar completos")
    }

    if (data.fechaFin <= data.fechaInicio) {
      throw new Error("La fecha de fin debe ser posterior a la fecha de inicio")
    }

    // Crear el proceso (aquí iría la lógica de base de datos)
    const nuevoProceso = {
      id: procesoId,
      nombre: `Proceso ${data.especie} - ${procesoId}`,
      especieId: data.especie,
      instalacionId: data.instalacion,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      estado: "planificado" as const,
      notas: data.notas || "",
      objetivos: data.objetivos || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Simular guardado en base de datos
    console.log("Proceso creado:", nuevoProceso)

    return {
      success: true,
      data: nuevoProceso,
      message: `Proceso ${procesoId} creado exitosamente`,
    }
  } catch (error) {
    console.error("Error creating proceso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function updateProceso(id: string, data: Partial<CreateProcesoData>) {
  try {
    // Aquí iría la lógica de actualización en base de datos
    console.log("Actualizando proceso:", id, data)

    return {
      success: true,
      message: "Proceso actualizado exitosamente",
    }
  } catch (error) {
    console.error("Error updating proceso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function deleteProceso(id: string) {
  try {
    // Aquí iría la lógica de eliminación en base de datos
    console.log("Eliminando proceso:", id)

    return {
      success: true,
      message: "Proceso eliminado exitosamente",
    }
  } catch (error) {
    console.error("Error deleting proceso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
