"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import {
  backendApi,
  type Especie as BackendEspecie,
  type ParametroCatalogo as BackendParametroCatalogo,
  type EspecieParametro as BackendEspecieParametro,
} from "@/lib/backend-client"
import type { EspecieConParametros, EspecieParametroDetalle } from "@/types/especie"
import type { Parametro } from "@/types/parametro"
import type { EspecieParametro } from "@/types/especie-parametro"

type MetricKey = "temperature" | "ph" | "oxygen" | "salinity"

type SpeciesRangeInput = {
  id_parametro: number
  rango_min: number
  rango_max: number
  valor_optimo?: number
}

type SpeciesFormPayload = {
  nombre: string
  nombre_cientifico?: string
  tipo_cultivo?: string
  descripcion?: string
  estado?: string
  parametros?: SpeciesRangeInput[]
}

const FALLBACK_PARAMETER_CATALOG: Record<MetricKey, Parametro> = {
  temperature: { id_parametro: 9001, nombre_parametro: "Temperatura", unidad_medida: "°C" },
  ph: { id_parametro: 9002, nombre_parametro: "pH", unidad_medida: "pH" },
  oxygen: { id_parametro: 9003, nombre_parametro: "Oxígeno Disuelto", unidad_medida: "mg/L" },
  salinity: { id_parametro: 9004, nombre_parametro: "Salinidad", unidad_medida: "ppt" },
}

const FALLBACK_METRIC_BY_ID: Record<number, MetricKey> = {
  1: "ph",
  2: "temperature",
  3: "oxygen",
  4: "salinity",
  9001: "temperature",
  9002: "ph",
  9003: "oxygen",
  9004: "salinity",
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object" && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[]
  }
  return []
}

function getMetricFromParameterName(name?: string | null): MetricKey | null {
  if (!name) return null
  const normalized = normalizeText(name)

  if (normalized.includes("temperatura") || normalized.includes("temp")) return "temperature"
  if (normalized === "ph" || normalized.includes("potencial hidrogeno") || normalized.includes("hidrogeno")) {
    return "ph"
  }
  if (normalized.includes("oxigeno") || normalized.includes("oxygen") || normalized.includes("o2")) {
    return "oxygen"
  }
  if (normalized.includes("salinidad") || normalized.includes("salinity") || normalized.includes("sal")) {
    return "salinity"
  }

  return null
}

function toParametro(item: BackendParametroCatalogo): Parametro | null {
  const idParametro = Number(item.id_parametro)
  if (!Number.isFinite(idParametro)) return null

  const nombre = String(item.nombre_parametro ?? item.nombre ?? `Parámetro ${idParametro}`).trim()
  const unidad = String(item.unidad_medida ?? item.unidad ?? "").trim()

  return {
    id_parametro: idParametro,
    nombre_parametro: nombre || `Parámetro ${idParametro}`,
    unidad_medida: unidad,
  }
}

function toEspecieParametro(item: BackendEspecieParametro): EspecieParametro | null {
  const idEspecieParametro = Number(item.id_especie_parametro)
  const idEspecie = Number(item.id_especie)
  const idParametro = Number(item.id_parametro)
  const rmin = parseNumber(item.Rmin)
  const rmax = parseNumber(item.Rmax)

  if (!Number.isFinite(idEspecieParametro) || !Number.isFinite(idEspecie) || !Number.isFinite(idParametro)) {
    return null
  }
  if (rmin === null || rmax === null) return null

  return {
    id_especie_parametro: idEspecieParametro,
    id_especie: idEspecie,
    id_parametro: idParametro,
    Rmin: rmin,
    Rmax: rmax,
  }
}

function buildRangesPayload(parametros: SpeciesRangeInput[] | undefined, catalog: Parametro[], clearMissing: boolean) {
  const payload: Record<string, number | null> = {}
  if (!parametros || parametros.length === 0) return payload

  const parameterById = new Map<number, Parametro>(catalog.map((item) => [item.id_parametro, item]))
  const configuredMetrics = new Set<MetricKey>()

  for (const item of parametros) {
    const definition = parameterById.get(item.id_parametro)
    const metricKey = getMetricFromParameterName(definition?.nombre_parametro) ?? FALLBACK_METRIC_BY_ID[item.id_parametro]
    const min = parseNumber(item.rango_min)
    const max = parseNumber(item.rango_max)

    if (!metricKey || min === null || max === null) continue
    configuredMetrics.add(metricKey)

    if (metricKey === "temperature") {
      payload.temperatura_optima_min = min
      payload.temperatura_optima_max = max
    } else if (metricKey === "ph") {
      payload.ph_optimo_min = min
      payload.ph_optimo_max = max
    } else if (metricKey === "oxygen") {
      payload.oxigeno_optimo_min = min
      payload.oxigeno_optimo_max = max
    } else if (metricKey === "salinity") {
      payload.salinidad_optima_min = min
      payload.salinidad_optima_max = max
    }
  }

  if (clearMissing) {
    if (!configuredMetrics.has("temperature")) {
      payload.temperatura_optima_min = null
      payload.temperatura_optima_max = null
    }
    if (!configuredMetrics.has("ph")) {
      payload.ph_optimo_min = null
      payload.ph_optimo_max = null
    }
    if (!configuredMetrics.has("oxygen")) {
      payload.oxigeno_optimo_min = null
      payload.oxigeno_optimo_max = null
    }
    if (!configuredMetrics.has("salinity")) {
      payload.salinidad_optima_min = null
      payload.salinidad_optima_max = null
    }
  }

  return payload
}

/**
 * Hook para manejar el CRUD de especies y sus parámetros usando el backend externo.
 * Incluye relleno robusto de parámetros para que la UI de especies y sus conexiones
 * (procesos/monitoreo) no queden incompletas cuando falta información relacional.
 */
export function useSpecies() {
  const [species, setSpecies] = useState<EspecieConParametros[]>([])
  const [parameters, setParameters] = useState<Parametro[]>([])
  const [speciesParameters, setSpeciesParameters] = useState<EspecieParametro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSpecies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [especiesResp, parametrosResp, especieParametrosResp] = await Promise.all([
        backendApi.getEspecies({ page: 1, limit: 1000 }).catch(() => []),
        backendApi.getParametros().catch(() => []),
        backendApi.getEspecieParametros().catch(() => []),
      ])

      const especiesData = extractArray<BackendEspecie>(especiesResp)
      const parametrosData = extractArray<BackendParametroCatalogo>(parametrosResp)
      const especieParametrosData = extractArray<BackendEspecieParametro>(especieParametrosResp)

      const mappedParameters = parametrosData.map(toParametro).filter((item): item is Parametro => Boolean(item))
      const metricInCatalog = new Set<MetricKey>(
        mappedParameters
          .map((item) => getMetricFromParameterName(item.nombre_parametro))
          .filter((item): item is MetricKey => Boolean(item)),
      )

      const normalizedParameters = [...mappedParameters]
      for (const [metricKey, fallbackDefinition] of Object.entries(FALLBACK_PARAMETER_CATALOG) as Array<
        [MetricKey, Parametro]
      >) {
        if (!metricInCatalog.has(metricKey)) {
          normalizedParameters.push(fallbackDefinition)
        }
      }

      normalizedParameters.sort((a, b) => a.id_parametro - b.id_parametro)

      const parameterById = new Map<number, Parametro>(normalizedParameters.map((item) => [item.id_parametro, item]))
      const parameterByMetric = new Map<MetricKey, Parametro>()
      for (const item of normalizedParameters) {
        const metricKey = getMetricFromParameterName(item.nombre_parametro)
        if (metricKey && !parameterByMetric.has(metricKey)) {
          parameterByMetric.set(metricKey, item)
        }
      }

      const normalizedSpeciesParameters = especieParametrosData
        .map(toEspecieParametro)
        .filter((item): item is EspecieParametro => Boolean(item))

      const speciesParametersBySpecies = normalizedSpeciesParameters.reduce<Map<number, EspecieParametro[]>>((acc, row) => {
        const current = acc.get(row.id_especie) ?? []
        current.push(row)
        acc.set(row.id_especie, current)
        return acc
      }, new Map())

      const especiesConParametros: EspecieConParametros[] = especiesData.map((especie) => {
        const explicitRows = speciesParametersBySpecies.get(especie.id_especie) ?? []
        const explicitDetails: EspecieParametroDetalle[] = explicitRows.map((row) => {
          const definition = parameterById.get(row.id_parametro)
          return {
            id_especie_parametro: row.id_especie_parametro,
            id_parametro: row.id_parametro,
            nombre_parametro: definition?.nombre_parametro ?? `Parámetro ${row.id_parametro}`,
            unidad_medida: definition?.unidad_medida ?? "",
            Rmin: row.Rmin,
            Rmax: row.Rmax,
          }
        })

        const usedParameterIds = new Set<number>(explicitDetails.map((item) => item.id_parametro))
        const usedMetricKeys = new Set<MetricKey>()
        explicitDetails.forEach((item) => {
          const metricKey =
            getMetricFromParameterName(item.nombre_parametro) ??
            getMetricFromParameterName(parameterById.get(item.id_parametro)?.nombre_parametro)
          if (metricKey) usedMetricKeys.add(metricKey)
        })

        let syntheticCounter = 1
        const nextSyntheticId = () => -1 * (especie.id_especie * 100 + syntheticCounter++)

        const syntheticDetails: EspecieParametroDetalle[] = []
        const pushFromOptimal = (metricKey: MetricKey, minValue: unknown, maxValue: unknown) => {
          const min = parseNumber(minValue)
          const max = parseNumber(maxValue)
          if (min === null || max === null) return

          const definition = parameterByMetric.get(metricKey) ?? FALLBACK_PARAMETER_CATALOG[metricKey]
          if (usedParameterIds.has(definition.id_parametro) || usedMetricKeys.has(metricKey)) return

          usedParameterIds.add(definition.id_parametro)
          usedMetricKeys.add(metricKey)

          syntheticDetails.push({
            id_especie_parametro: nextSyntheticId(),
            id_parametro: definition.id_parametro,
            nombre_parametro: definition.nombre_parametro,
            unidad_medida: definition.unidad_medida,
            Rmin: min,
            Rmax: max,
          })
        }

        pushFromOptimal("temperature", especie.temperatura_optima_min, especie.temperatura_optima_max)
        pushFromOptimal("ph", especie.ph_optimo_min, especie.ph_optimo_max)
        pushFromOptimal("oxygen", especie.oxigeno_optimo_min, especie.oxigeno_optimo_max)
        pushFromOptimal("salinity", especie.salinidad_optima_min, especie.salinidad_optima_max)

        const nombreBase = especie.nombre ?? especie.nombre_comun ?? especie.nombre_cientifico ?? `Especie ${especie.id_especie}`
        const estado = (especie.estado ?? (especie.activo === false ? "inactiva" : "activa")) as "activa" | "inactiva"

        return {
          id_especie: especie.id_especie,
          nombre: nombreBase,
          nombre_comun: especie.nombre_comun ?? nombreBase,
          nombre_cientifico: especie.nombre_cientifico ?? undefined,
          descripcion: especie.descripcion ?? undefined,
          tipo_cultivo: (especie as any).tipo_cultivo ?? undefined,
          fecha_creacion: especie.created_at,
          estado,
          parametros: [...explicitDetails, ...syntheticDetails],
        }
      })

      const flattenedSpeciesParameters: EspecieParametro[] = especiesConParametros.flatMap((especie) =>
        especie.parametros.map((parametro) => ({
          id_especie_parametro: parametro.id_especie_parametro,
          id_especie: especie.id_especie,
          id_parametro: parametro.id_parametro,
          Rmin: parametro.Rmin,
          Rmax: parametro.Rmax,
        })),
      )

      setSpecies(especiesConParametros)
      setParameters(normalizedParameters)
      setSpeciesParameters(flattenedSpeciesParameters)
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

  const createSpecies = useCallback(
    async (data: SpeciesFormPayload) => {
      try {
        setLoading(true)

        const payload: any = {
          nombre: data.nombre?.trim(),
          nombre_comun: data.nombre?.trim(),
          nombre_cientifico: data.nombre_cientifico?.trim() || undefined,
          descripcion: data.descripcion ?? data.tipo_cultivo,
          estado: data.estado === "inactiva" ? "inactiva" : "activa",
          activo: data.estado !== "inactiva",
        }

        if (Array.isArray(data.parametros) && data.parametros.length > 0) {
          payload.parametros = data.parametros.map((item) => ({
            id_parametro: item.id_parametro,
            Rmin: item.rango_min,
            Rmax: item.rango_max,
            rango_min: item.rango_min,
            rango_max: item.rango_max,
          }))
        }

        Object.assign(payload, buildRangesPayload(data.parametros, parameters, false))

        await backendApi.createEspecie(payload)

        toast({
          title: "Éxito",
          description: "Especie creada correctamente",
        })

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
    [loadSpecies, parameters],
  )

  const updateSpecies = useCallback(
    async (id: number, data: SpeciesFormPayload) => {
      try {
        setLoading(true)

        const payload: any = {}
        if (data.nombre !== undefined) {
          payload.nombre = data.nombre.trim()
          payload.nombre_comun = data.nombre.trim()
        }
        if (data.nombre_cientifico !== undefined) {
          payload.nombre_cientifico = data.nombre_cientifico ? data.nombre_cientifico.trim() : null
        }
        if (data.descripcion !== undefined || data.tipo_cultivo !== undefined) {
          payload.descripcion = data.descripcion ?? data.tipo_cultivo ?? null
        }
        if (data.estado !== undefined) {
          payload.estado = data.estado === "inactiva" ? "inactiva" : "activa"
          payload.activo = data.estado !== "inactiva"
        }
        if (data.parametros !== undefined) {
          payload.parametros = data.parametros.map((item) => ({
            id_parametro: item.id_parametro,
            Rmin: item.rango_min,
            Rmax: item.rango_max,
            rango_min: item.rango_min,
            rango_max: item.rango_max,
          }))
          Object.assign(payload, buildRangesPayload(data.parametros, parameters, true))
        }

        await backendApi.updateEspecie(id, payload)

        toast({
          title: "Éxito",
          description: "Especie actualizada correctamente",
        })

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
    [loadSpecies, parameters],
  )

  const deleteSpecies = useCallback(
    async (id: number) => {
      try {
        setLoading(true)

        await backendApi.deleteEspecie(id)

        toast({
          title: "Éxito",
          description: "Especie eliminada correctamente",
        })

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

  const getSpeciesById = useCallback(
    (id: number): EspecieConParametros | undefined => {
      return species.find((especie) => especie.id_especie === id)
    },
    [species],
  )

  useEffect(() => {
    loadSpecies()
  }, [loadSpecies])

  return {
    species,
    parameters,
    speciesParameters,
    loading,
    error,
    loadSpecies,
    createSpecies,
    updateSpecies,
    deleteSpecies,
    getSpeciesById,
  }
}
