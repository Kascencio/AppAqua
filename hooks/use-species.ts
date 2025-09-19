"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type { Especie, EspecieConParametros } from "@/types/especie"
import type { Parametro } from "@/types/parametro"
import type { EspecieParametro } from "@/types/especie-parametro"

/**
 * Hook para manejar el CRUD de especies y sus parámetros
 */
export function useSpecies() {
  // Estados principales
  const [species, setSpecies] = useState<EspecieConParametros[]>([])
  const [parameters, setParameters] = useState<Parametro[]>([])
  const [speciesParameters, setSpeciesParameters] = useState<EspecieParametro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Cargar todas las especies con sus parámetros
   */
  const loadSpecies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar especies, parámetros y relaciones en paralelo
      const [especiesRes, parametrosRes, especieParametrosRes] = await Promise.all([
        fetch("/api/especies"),
        fetch("/api/parametros"),
        fetch("/api/especie-parametros"),
      ])

      if (!especiesRes.ok) throw new Error("Error al cargar especies")
      if (!parametrosRes.ok) throw new Error("Error al cargar parámetros")
      if (!especieParametrosRes.ok) throw new Error("Error al cargar configuración de parámetros")

      const especiesData: Especie[] = await especiesRes.json()
      const parametrosData: Parametro[] = await parametrosRes.json()
      const especieParametrosData: EspecieParametro[] = await especieParametrosRes.json()

      // Combinar datos
      const especiesConParametros: EspecieConParametros[] = especiesData.map((especie) => ({
        ...especie,
        parametros: especieParametrosData
          .filter((ep) => ep.id_especie === especie.id_especie)
          .map((ep) => {
            const parametro = parametrosData.find((p) => p.id_parametro === ep.id_parametro)
            return {
              ...ep,
              parametro: parametro || null,
            }
          }),
      }))

      setSpecies(especiesConParametros)
      setParameters(parametrosData)
      setSpeciesParameters(especieParametrosData)
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

        // Crear especie
        const especieRes = await fetch("/api/especies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: data.nombre,
            nombre_cientifico: data.nombre_cientifico,
            tipo_cultivo: data.tipo_cultivo,
            estado: data.estado || "activa",
          }),
        })

        if (!especieRes.ok) {
          const errorData = await especieRes.json()
          throw new Error(errorData.error || "Error al crear especie")
        }

        const nuevaEspecie: Especie = await especieRes.json()

        // Crear parámetros si se proporcionaron
        if (data.parametros && data.parametros.length > 0) {
          const parametrosPromises = data.parametros.map((param) =>
            fetch("/api/especie-parametros", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_especie: nuevaEspecie.id_especie,
                id_parametro: param.id_parametro,
                Rmin: param.rango_min,
                Rmax: param.rango_max,
              }),
            }),
          )

          await Promise.all(parametrosPromises)
        }

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

        // Actualizar especie
        const especieRes = await fetch(`/api/especies/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: data.nombre,
            nombre_cientifico: data.nombre_cientifico,
            tipo_cultivo: data.tipo_cultivo,
            estado: data.estado,
          }),
        })

        if (!especieRes.ok) {
          const errorData = await especieRes.json()
          throw new Error(errorData.error || "Error al actualizar especie")
        }

        // Eliminar parámetros existentes
        await fetch(`/api/especie-parametros?id_especie=${id}`, {
          method: "DELETE",
        })

        // Crear nuevos parámetros
        if (data.parametros && data.parametros.length > 0) {
          const parametrosPromises = data.parametros.map((param) =>
            fetch("/api/especie-parametros", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_especie: id,
                id_parametro: param.id_parametro,
                Rmin: param.rango_min,
                Rmax: param.rango_max,
              }),
            }),
          )

          await Promise.all(parametrosPromises)
        }

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

        const response = await fetch(`/api/especies/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al eliminar especie")
        }

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
