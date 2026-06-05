"use client"

import { useDeferredValue, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import { backendApi, type PromediosBatchResponse } from "@/lib/backend-client"

const MAX_ANALYTICS_SENSORS = 30
const ANALYTICS_TARGET_POINTS = 96
// Auto-refresh cada 60s cuando el rango incluye "ahora" (últimas 24h)
const LIVE_REFRESH_INTERVAL_MS = 60_000

function computeBucketMinutes(from: Date, to: Date, targetPoints = ANALYTICS_TARGET_POINTS): number {
  const totalMinutes = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000))
  const bucket = Math.ceil(totalMinutes / targetPoints)
  return Math.max(15, bucket)
}

function emptyResponse(bucketMinutes = 15): PromediosBatchResponse {
  return {
    bucket_minutes: bucketMinutes,
    total_sensores: 0,
    sensores: [],
  }
}

function isLiveRange(to: Date | undefined): boolean {
  if (!to) return false
  // Si el extremo superior del rango es dentro de las últimas 24h → modo live
  return Date.now() - to.getTime() < 24 * 60 * 60 * 1000
}

export function useAnalyticsSeries(dateRange: DateRange, sensors?: any[]) {
  const deferredSensors = useDeferredValue(Array.isArray(sensors) ? sensors : [])
  const [data, setData] = useState<PromediosBatchResponse>(emptyResponse())
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasLoadedOnceRef = useRef(false)
  const fetchingRef = useRef(false)

  const sensorsToQuery = useMemo(() => {
    return deferredSensors
      .filter((sensor: any) => Number.isFinite(Number(sensor?.id_sensor_instalado)) && Number(sensor?.id_sensor_instalado) > 0)
      .slice(0, MAX_ANALYTICS_SENSORS)
  }, [deferredSensors])

  const sensorIds = useMemo(
    () => [...new Set(sensorsToQuery.map((sensor: any) => Number(sensor.id_sensor_instalado)))].filter((id) => id > 0),
    [sensorsToQuery],
  )

  const sensorKey = useMemo(() => sensorIds.join(","), [sensorIds])
  const bucketMinutes = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 15
    return computeBucketMinutes(dateRange.from, dateRange.to)
  }, [dateRange.from, dateRange.to])

  const fetchSeries = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (fetchingRef.current) return
    if (!dateRange.from || !dateRange.to || sensorIds.length === 0) {
      setData(emptyResponse(bucketMinutes))
      hasLoadedOnceRef.current = false
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    fetchingRef.current = true

    if (!hasLoadedOnceRef.current && !opts.silent) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }

    // Para rangos live, expandimos "hasta" a ahora mismo para incluir lecturas recientes
    const hasta = isLiveRange(dateRange.to)
      ? new Date().toISOString()
      : dateRange.to.toISOString()

    try {
      const response = await backendApi.getPromediosBatch({
        sensorInstaladoIds: sensorIds,
        bucketMinutes,
        desde: dateRange.from.toISOString(),
        hasta,
      })

      setData(response)
      hasLoadedOnceRef.current = true
    } catch {
      if (!hasLoadedOnceRef.current) {
        setData(emptyResponse(bucketMinutes))
        hasLoadedOnceRef.current = true
      }
    } finally {
      fetchingRef.current = false
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [bucketMinutes, dateRange.from, dateRange.to, sensorIds])

  // Fetch inicial y cuando cambian dependencias clave
  useEffect(() => {
    hasLoadedOnceRef.current = false
    void fetchSeries()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketMinutes, dateRange.from, dateRange.to, sensorKey])

  // Auto-refresh en intervalos cuando el rango incluye "ahora"
  useEffect(() => {
    if (!isLiveRange(dateRange.to)) return

    const timer = setInterval(() => {
      void fetchSeries({ silent: true })
    }, LIVE_REFRESH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [dateRange.to, fetchSeries])

  const seriesBySensor = useMemo(() => {
    const map = new Map<number, PromediosBatchResponse["sensores"][number]["puntos"]>()
    for (const sensor of data.sensores ?? []) {
      map.set(Number(sensor.id_sensor_instalado), Array.isArray(sensor.puntos) ? sensor.puntos : [])
    }
    return map
  }, [data.sensores])

  return {
    data,
    seriesBySensor,
    sensorsToQuery,
    bucketMinutes,
    coverage: {
      queried: sensorIds.length,
      total: deferredSensors.length,
    },
    loading,
    isRefreshing,
    refresh: fetchSeries,
  }
}
