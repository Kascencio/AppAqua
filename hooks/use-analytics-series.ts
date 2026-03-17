"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import { backendApi, type PromediosBatchResponse } from "@/lib/backend-client"

const MAX_ANALYTICS_SENSORS = 30
const ANALYTICS_TARGET_POINTS = 96

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

export function useAnalyticsSeries(dateRange: DateRange, sensors?: any[]) {
  const deferredSensors = useDeferredValue(Array.isArray(sensors) ? sensors : [])
  const [data, setData] = useState<PromediosBatchResponse>(emptyResponse())
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasLoadedOnceRef = useRef(false)

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

  useEffect(() => {
    let cancelled = false

    async function fetchSeries() {
      if (!dateRange.from || !dateRange.to || sensorIds.length === 0) {
        setData(emptyResponse(bucketMinutes))
        hasLoadedOnceRef.current = false
        setLoading(false)
        setIsRefreshing(false)
        return
      }

      if (!hasLoadedOnceRef.current) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const response = await backendApi.getPromediosBatch({
          sensorInstaladoIds: sensorIds,
          bucketMinutes,
          desde: dateRange.from.toISOString(),
          hasta: dateRange.to.toISOString(),
        })

        if (cancelled) return
        setData(response)
        hasLoadedOnceRef.current = true
      } catch {
        if (cancelled) return
        setData(emptyResponse(bucketMinutes))
        hasLoadedOnceRef.current = true
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    void fetchSeries()

    return () => {
      cancelled = true
    }
  }, [bucketMinutes, dateRange.from, dateRange.to, sensorKey, sensorIds])

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
  }
}
