"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { backendApi, type Especie as BackendEspecie } from "@/lib/backend-client"
import type { Especie, EspecieConParametros } from "@/types/especie"
import type { Parametro } from "@/types/parametro"
import type { EspecieParametro } from "@/types/especie-parametro"

/**
 * Hook para manejar el CRUD de especies y sus parámetros usando el backend externo
 */
export function useSpecies() {
  // Estados principales
  const [species, setSpecies] = useState<EspecieConParametros[]>([])
  const [parameters, setParameters] = useState<Parametro[]>([])
  const [speciesParameters, setSpeciesParameters] = useState<EspecieParametro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Cargar todas las especies con sus parámetros desde backend externo
   */
  const loadSpecies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar especies desde backend externo
      const especiesResp = await backendApi.getEspecies({ page: 1, limit: 1000 }).catch(() => ({ data: [] }))
      const especiesData: BackendEspecie[] = especiesResp.data || []

      // Map backend schema to frontend shape
      // Backend Especie already includes optimal ranges (ph_optimo_min/max, temperatura_optima_min/max, etc)
      // Frontend expects parametros array — we synthesize it from the optimal fields
      const especiesConParametros: EspecieConParametros[] = especiesData.map((e) => {
        const parametros: any[] = []
        
        if (e.temperatura_optima_min != null && e.temperatura_optima_max != null) {
          parametros.push({
            id_especie_parametro: 0,
            id_parametro: 1, // Assuming 1=temperature
            nombre_parametro: 'Temperatura',
            unidad_medida: '°C',
            Rmin: e.temperatura_optima_min,
            Rmax: e.temperatura_optima_max,
          })
        }
        
        if (e.ph_optimo_min != null && e.ph_optimo_max != null) {
          parametros.push({
            id_especie_parametro: 0,
            id_parametro: 2, // Assuming 2=pH
            nombre_parametro: 'pH',
            unidad_medida: 'pH',
            Rmin: e.ph_optimo_min,
            Rmax: e.ph_optimo_max,
          })
        }
        
        if (e.oxigeno_optimo_min != null && e.oxigeno_optimo_max != null) {
          parametros.push({
            id_especie_parametro: 0,
            id_parametro: 3, // Assuming 3=oxygen
            nombre_parametro: 'Oxígeno Disuelto',
            unidad_medida: 'mg/L',
            Rmin: e.oxigeno_optimo_min,
            Rmax: e.oxigeno_optimo_max,
          })
        }
        
        return {
          id_especie: e.id_especie,
          nombre: e.nombre_comun || e.nombre_cientifico || `Especie ${e.id_especie}`,
          fecha_creacion: e.created_at,
          estado: (e.activo ? 'activa' : 'inactiva') as 'activa' | 'inactiva',
          parametros,
        }
      })

      setSpecies(especiesConParametros)
      setParameters([]) // No longer fetching separate parameters
      setSpeciesParameters([]) // No longer fetching separate especie_parametros
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Crear nueva especie
   */
  const createSpecies = useCallback(
    async (data: {
      nombre: string
      nombre_cientifico?: string
      tipo_cultivo?: string
      estado?: string
      parametros?: Array<{
        id_parametro: number
        rango_min: number
        rango_max: number
        valor_optimo?: number
      }>
    }) => {
      try {
        setLoading(true)

        // Map parametros to backend optimal fields
        const payload: any = {
          nombre_comun: data.nombre,
          nombre_cientifico: data.nombre_cientifico,
          descripcion: data.tipo_cultivo,
          activo: data.estado !== 'inactiva',
        }
        
        if (data.parametros) {
          for (const p of data.parametros) {
            if (p.id_parametro === 1) { // temperature
              payload.temperatura_optima_min = p.rango_min
              payload.temperatura_optima_max = p.rango_max
            } else if (p.id_parametro === 2) { // pH
              payload.ph_optimo_min = p.rango_min
              payload.ph_optimo_max = p.rango_max
            } else if (p.id_parametro === 3) { // oxygen
              payload.oxigeno_optimo_min = p.rango_min
              payload.oxigeno_optimo_max = p.rango_max
            }
          }
        }
        
        await backendApi.createEspecie(payload)

        toast({
          title: "Éxito",
          description: "Especie creada correctamente",
        })

        // Recargar datos
        await loadSpecies()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al crear especie"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadSpecies],
  )

  /**
   * Actualizar especie existente
   */
  const updateSpecies = useCallback(
    async (
      id: number,
      data: {
        nombre: string
        nombre_cientifico?: string
        tipo_cultivo?: string
        estado?: string
        parametros?: Array<{
          id_parametro: number
          rango_min: number
          rango_max: number
          valor_optimo?: number
        }>
      },
    ) => {
      try {
        setLoading(true)

        const payload: any = {
          nombre_comun: data.nombre,
          nombre_cientifico: data.nombre_cientifico,
          descripcion: data.tipo_cultivo,
          activo: data.estado !== 'inactiva',
        }
        
        if (data.parametros) {
          for (const p of data.parametros) {
            if (p.id_parametro === 1) {
              payload.temperatura_optima_min = p.rango_min
              payload.temperatura_optima_max = p.rango_max
            } else if (p.id_parametro === 2) {
              payload.ph_optimo_min = p.rango_min
              payload.ph_optimo_max = p.rango_max
            } else if (p.id_parametro === 3) {
              payload.oxigeno_optimo_min = p.rango_min
              payload.oxigeno_optimo_max = p.rango_max
            }
          }
        }
        
        await backendApi.updateEspecie(id, payload)

        toast({
          title: "Éxito",
          description: "Especie actualizada correctamente",
        })

        // Recargar datos
        await loadSpecies()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al actualizar especie"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadSpecies],
  )

  /**
   * Eliminar especie
   */
  const deleteSpecies = useCallback(
    async (id: number) => {
      try {
        setLoading(true)

        await backendApi.deleteEspecie(id)

        toast({
          title: "Éxito",
          description: "Especie eliminada correctamente",
        })

        // Recargar datos
        await loadSpecies()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al eliminar especie"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadSpecies],
  )

  /**
   * Obtener especie por ID
   */
  const getSpeciesById = useCallback(
    (id: number): EspecieConParametros | undefined => {
      return species.find((especie) => especie.id_especie === id)
    },
    [species],
  )

  /**
   * Cargar datos al montar el componente
   */
  useEffect(() => {
    loadSpecies()
  }, [loadSpecies])

  return {
    // Estados
    species,
    parameters,
    speciesParameters,
    loading,
    error,

    // Acciones
    loadSpecies,
    createSpecies,
    updateSpecies,
    deleteSpecies,
    getSpeciesById,
  }
}
