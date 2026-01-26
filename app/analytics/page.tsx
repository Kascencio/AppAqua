"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Filter, FileText, Activity, Thermometer, Droplets, ArrowDown, ArrowUp, Clock, Wifi, WifiOff, Calendar } from "lucide-react"
import { useAppContext } from "@/context/app-context"
import { AnalyticsContent } from "@/components/analytics-content"
import { DateRangePicker } from "@/components/date-range-picker"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { backendApi, type Lectura } from "@/lib/backend-client"
import { useSensors } from "@/hooks/use-sensors"
import { useToast } from "@/hooks/use-toast"
import { SensorAveragesChart } from "@/components/sensor-averages-chart"
import type { DateRange } from "react-day-picker"
import { format, subDays, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { AnimatedNumber } from "@/components/animated-number"
import { ParameterTrendChart } from "@/components/parameter-trend-chart"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TimePreset = "today" | "7d" | "30d" | "thisWeek" | "thisMonth" | "custom"

export default function AnalyticsPage() {
  const context = useAppContext()
  const instalaciones = context?.instalaciones ?? []
  const procesos = context?.procesos ?? []
  const alerts = context?.alerts ?? []
  const contextLoading = context?.isLoading ?? false

  const { sensors } = useSensors()
  const { toast } = useToast()
  const [summary, setSummary] = useState({
    totalLecturas: 0,
    lecturasHoy: 0,
    promedioTemperatura: 0,
    promedioPH: 0,
    promedioOxigeno: 0,
  })
  const [prevSummary, setPrevSummary] = useState(summary)
  const summaryRef = useRef(summary)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportScope, setExportScope] = useState<"all" | "top20">("top20")
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 })
  const hasInitialData = useRef(false)
  const [timePreset, setTimePreset] = useState<TimePreset>("30d")
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSensorType, setSelectedSensorType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedInstallation, setSelectedInstallation] = useState("all")

  // Calcular sensores conectados (con lecturas recientes)
  const activeSensors = useMemo(() => {
    return sensors.filter((s: any) => s.status === "active")
  }, [sensors])

  const typeLabel = (type: string) => {
    switch (type) {
      case "ph":
        return "pH"
      case "temperature":
        return "Temperatura"
      case "oxygen":
        return "Oxígeno"
      case "salinity":
        return "Salinidad"
      case "turbidity":
        return "Turbidez"
      case "nitrates":
        return "Nitratos"
      case "ammonia":
        return "Amonio"
      case "barometric":
        return "Presión Atmosférica"
      default:
        return "Otro"
    }
  }

  const availableTypes = useMemo(() => {
    const set = new Set<string>()
    sensors.forEach((s: any) => {
      const t = detectType(String(s.name || s.descripcion || ""), s.type, s.unit)
      if (t) set.add(t)
    })
    return Array.from(set)
  }, [sensors])

  const availableInstallations = useMemo(() => {
    return Array.from(new Set(sensors.map((s: any) => s.facilityName).filter(Boolean))).sort()
  }, [sensors])

  const filteredSensors = useMemo(() => {
    return sensors.filter((s: any) => {
      const t = detectType(String(s.name || s.descripcion || ""), s.type, s.unit)
      if (selectedSensorType !== "all" && t !== selectedSensorType) return false
      if (selectedStatus !== "all" && s.status !== selectedStatus) return false
      if (selectedInstallation !== "all" && s.facilityName !== selectedInstallation) return false
      return true
    })
  }, [sensors, selectedSensorType, selectedStatus, selectedInstallation])

  const connectedSensors = useMemo(() => {
    return sensors.filter((s: any) => s.status === "active" || s.lastReading !== undefined).length
  }, [sensors])

  // Función para calcular rango de fechas basado en preset
  const getPresetDateRange = useCallback((preset: TimePreset): DateRange => {
    const now = new Date()
    switch (preset) {
      case "today":
        return { from: startOfToday(), to: endOfToday() }
      case "7d":
        return { from: subDays(now, 7), to: now }
      case "30d":
        return { from: subDays(now, 30), to: now }
      case "thisWeek":
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) }
      case "thisMonth":
        return { from: startOfMonth(now), to: endOfMonth(now) }
      default:
        return { from: subDays(now, 30), to: now }
    }
  }, [])

  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange("30d"))

  // Handler para cambiar preset
  const handlePresetChange = useCallback((preset: TimePreset) => {
    setTimePreset(preset)
    if (preset !== "custom") {
      setDateRange(getPresetDateRange(preset))
    }
  }, [getPresetDateRange])

  // Handler para cambiar rango personalizado
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range)
    setTimePreset("custom")
  }, [])

  const fromLabel = dateRange.from ? format(dateRange.from, "dd MMM yyyy", { locale: es }) : "-"
  const toLabel = dateRange.to ? format(dateRange.to, "dd MMM yyyy", { locale: es }) : "-"

  function computeBucketMinutes(from: Date, to: Date, targetPoints = 200): number {
    const totalMinutes = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000))
    const bucket = Math.ceil(totalMinutes / targetPoints)
    return Math.max(5, bucket)
  }

  function startOfDay(d: Date): Date {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }

  function endOfDay(d: Date): Date {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
  }

  // Detectar tipo de sensor por nombre
  function detectType(name: string, type?: string, unit?: string): string {
    const t = String(type || '').toLowerCase()
    const u = String(unit || '').toLowerCase()
    if (t.includes('ph')) return 'ph'
    if (t.includes('temp')) return 'temperature'
    if (t.includes('ox') || t.includes('oxígeno') || t.includes('oxygen')) return 'oxygen'
    if (t.includes('sal')) return 'salinity'
    if (t.includes('turb')) return 'turbidity'
    if (t.includes('nitrat')) return 'nitrates'
    if (t.includes('amon') || t.includes('ammo')) return 'ammonia'
    if (t.includes('baro') || t.includes('presión')) return 'barometric'
    if (u.includes('ph')) return 'ph'
    if (u.includes('°c') || u.includes('c')) return 'temperature'
    if (u.includes('mg/l') && (name || '').toLowerCase().includes('ox')) return 'oxygen'
    if (u.includes('ppt')) return 'salinity'
    if (u.includes('ntu')) return 'turbidity'
    if (u.includes('hpa')) return 'barometric'
    const n = (name || '').toLowerCase()
    if (n.includes('ph')) return 'ph'
    if (n.includes('temp')) return 'temperature'
    if (n.includes('ox') || n.includes('oxígeno') || n.includes('oxygen')) return 'oxygen'
    if (n.includes('sal')) return 'salinity'
    if (n.includes('turb')) return 'turbidity'
    if (n.includes('nitrat')) return 'nitrates'
    if (n.includes('amon') || n.includes('ammo')) return 'ammonia'
    if (n.includes('baro') || n.includes('presión')) return 'barometric'
    return 'other'
  }

  async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length) as any
    let idx = 0

    const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
      while (idx < items.length) {
        const current = idx++
        results[current] = await fn(items[current])
      }
    })

    await Promise.all(workers)
    return results
  }

  async function fetchAllLecturasForSensor(
    sensorInstaladoId: number,
    desde?: string,
    hasta?: string,
  ): Promise<Lectura[]> {
    const limit = 1000
    let page = 1
    const all: Lectura[] = []

    while (true) {
      const resp = await backendApi.getLecturas({
        sensorInstaladoId,
        page,
        limit,
        desde,
        hasta,
      })

      const payload: any = resp
      const rows: Lectura[] = Array.isArray(payload) ? payload : payload?.data || []
      const pagination = Array.isArray(payload) ? null : payload?.pagination

      all.push(...rows)

      if (!pagination) break
      if (page >= Number(pagination.totalPages || 1)) break
      page += 1
    }

    return all
  }

  async function mapWithConcurrencyProgress<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
    onProgress: (done: number, total: number) => void,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length) as any
    let idx = 0
    let done = 0
    const total = items.length

    onProgress(0, total)

    const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
      while (idx < items.length) {
        const current = idx++
        results[current] = await fn(items[current])
        done += 1
        onProgress(done, total)
      }
    })

    await Promise.all(workers)
    return results
  }

  // Handler para exportar datos a CSV
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportProgress({ done: 0, total: 0 })
    try {
      const desde = dateRange.from?.toISOString()
      const hasta = dateRange.to?.toISOString()

      const sensorsSource = filteredSensors.length ? filteredSensors : sensors
      if (!sensorsSource || sensorsSource.length === 0) {
        toast({
          title: "Sin sensores",
          description: "No hay sensores para exportar datos.",
          variant: "destructive",
        })
        setIsExporting(false)
        return
      }

      toast({
        title: "Preparando exportación",
        description: "Generando el reporte…",
      })

      // Formatear fechas para el nombre del archivo
      const fromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : 'inicio'
      const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : 'fin'

      const sensorMetaById = new Map<number, { name: string; unit: string; facilityName: string }>(
        (sensorsSource || []).map((s: any) => [
          Number(s.id_sensor_instalado),
          {
            name: String(s.name || `Sensor ${s.id_sensor_instalado}`),
            unit: String(s.unit || ""),
            facilityName: String(s.facilityName || ""),
          },
        ]),
      )

      // Obtener lecturas completas SOLO al exportar (por fechas)
      const sensorsToQuery = exportScope === "all" ? sensorsSource : sensorsSource.slice(0, 20)

      const allBySensor = await mapWithConcurrencyProgress(
        sensorsToQuery,
        3,
        async (s: any) => {
          const id = Number(s.id_sensor_instalado)
          if (!id) return [] as Lectura[]
          try {
            return await fetchAllLecturasForSensor(id, desde, hasta)
          } catch (e) {
            console.warn(`[Export] Error fetching lecturas for sensor ${id}:`, e)
            return [] as Lectura[]
          }
        },
        (done, total) => {
          setExportProgress({ done, total })
        },
      )

      const lecturas = allBySensor.flat()

      // Generar contenido según formato
      if (exportFormat === "json") {
        const jsonContent = JSON.stringify({
          meta: {
            desde: dateRange.from?.toISOString(),
            hasta: dateRange.to?.toISOString(),
            totalLecturas: lecturas.length,
            generado: new Date().toISOString(),
          },
          lecturas: lecturas.map((l) => {
            const sid = Number(l.id_sensor_instalado || l.sensor_instalado_id || 0)
            const meta = sensorMetaById.get(sid)
            return {
              sensorId: sid,
              sensorName: meta?.name || "",
              instalacion: meta?.facilityName || "",
              tipoMedida: l.tipo_medida || "",
              valor: l.valor,
              unidad: meta?.unit || "",
              timestamp: l.tomada_en || `${l.fecha} ${l.hora}` || "",
            }
          }),
        }, null, 2)
        
        const blob = new Blob([jsonContent], { type: "application/json" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `analytics-${fromDate}_${toDate}.json`
        link.click()
      } else {
        // Generar CSV de las lecturas
        const headers = ['Sensor ID', 'Sensor', 'Instalación', 'Tipo Medida', 'Valor', 'Unidad', 'Fecha/Hora']
        const rows = lecturas.map((l) => {
          const sid = Number(l.id_sensor_instalado || l.sensor_instalado_id || 0)
          const meta = sensorMetaById.get(sid)
          return [
            sid || '',
            meta?.name || '',
            meta?.facilityName || '',
            l.tipo_medida || '',
            l.valor,
            meta?.unit || '',
            l.tomada_en || `${l.fecha} ${l.hora}` || '',
          ]
        })
        
        const csvContent = [
          `# Reporte de Análisis - ${format(dateRange.from || new Date(), 'dd/MM/yyyy', { locale: es })} al ${format(dateRange.to || new Date(), 'dd/MM/yyyy', { locale: es })}`,
          `# Total de lecturas: ${lecturas.length}`,
          '',
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `analytics-${fromDate}_${toDate}.csv`
        link.click()
      }
      
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${lecturas.length} registros del período ${format(dateRange.from || new Date(), 'dd/MM/yyyy', { locale: es })} - ${format(dateRange.to || new Date(), 'dd/MM/yyyy', { locale: es })}.`,
      })
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar los datos. Intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }, [toast, dateRange, sensors, activeSensors, exportScope, exportFormat])

  useEffect(() => {
    let cancelled = false

    const fetchSummary = async () => {
      try {
        if (!dateRange.from || !dateRange.to) return

        if (!hasInitialData.current) {
          setIsLoadingSummary(true)
        } else {
          setIsRefreshing(true)
        }

        const desde = dateRange.from.toISOString()
        const hasta = dateRange.to.toISOString()

        const sensorsSource = filteredSensors.length ? filteredSensors : sensors
        if (!sensorsSource || sensorsSource.length === 0) {
          if (!cancelled) {
            setPrevSummary(summary)
            setSummary({ totalLecturas: 0, lecturasHoy: 0, promedioTemperatura: 0, promedioPH: 0, promedioOxigeno: 0 })
            hasInitialData.current = true
          }
          return
        }

        const sensorsToQuery = sensorsSource
        const bucketMinutes = computeBucketMinutes(dateRange.from, dateRange.to, 100)

        // 1) Totales usando pagination.total (rápido) - reducir concurrencia a 3
        const totals = await mapWithConcurrency(
          sensorsToQuery,
          3,
          async (s: any) => {
            const id = Number(s.id_sensor_instalado)
            if (!id) return 0
            try {
              const resp = await backendApi.getLecturas({ sensorInstaladoId: id, page: 1, limit: 1, desde, hasta })
              const payload: any = resp
              return Number(payload?.pagination?.total || 0)
            } catch {
              return 0
            }
          },
        )
        const totalLecturas = totals.reduce((a, b) => a + b, 0)

        // 2) Lecturas de hoy (solo si el rango incluye hoy)
        const today = new Date()
        const todayStart = startOfDay(today)
        const todayEnd = endOfDay(today)
        const rangeIncludesToday = dateRange.from <= todayEnd && dateRange.to >= todayStart
        let lecturasHoy = 0
        if (rangeIncludesToday) {
          const desdeHoy = todayStart.toISOString()
          const hastaHoy = todayEnd.toISOString()
          const todays = await mapWithConcurrency(
            sensorsToQuery,
            3,
            async (s: any) => {
              const id = Number(s.id_sensor_instalado)
              if (!id) return 0
              try {
                const resp = await backendApi.getLecturas({ sensorInstaladoId: id, page: 1, limit: 1, desde: desdeHoy, hasta: hastaHoy })
                const payload: any = resp
                return Number(payload?.pagination?.total || 0)
              } catch {
                return 0
              }
            },
          )
          lecturasHoy = todays.reduce((a, b) => a + b, 0)
        }

        // 3) Promedios por tipo (usando /promedios por sensor) - reducir concurrencia
        const promediosBySensor = await mapWithConcurrency(
          sensorsToQuery,
          3,
          async (s: any) => {
            const id = Number(s.id_sensor_instalado)
            const sensorType = detectType(String(s.name || s.descripcion || ""), s.type, s.unit)
            if (!id) return { type: sensorType, promedios: [] as any[] }
            try {
              const resp = await backendApi
                .getPromedios({
                  sensorInstaladoId: id,
                  bucketMinutes,
                  desde,
                  hasta,
                })
                .catch(() => [] as any[])

              const arr = Array.isArray(resp) ? resp : []
              const filtered = arr.filter((p: any) => {
                const t = new Date(p?.timestamp).getTime()
                return Number.isFinite(t) && t >= dateRange.from!.getTime() && t <= dateRange.to!.getTime()
              })

              return { type: sensorType, promedios: filtered }
            } catch {
              return { type: sensorType, promedios: [] as any[] }
            }
          },
        )

        const weighted = (arr: any[]): { avg: number; muestras: number } => {
          const rows = (arr || []).filter(Boolean)
          const withM = rows.filter((p: any) => typeof p.muestras === "number" && Number(p.muestras) > 0)
          if (withM.length) {
            const sumW = withM.reduce((acc: number, p: any) => acc + Number(p.muestras || 0), 0)
            const sumWV = withM.reduce((acc: number, p: any) => acc + Number(p.promedio || 0) * Number(p.muestras || 0), 0)
            return { avg: sumW > 0 ? sumWV / sumW : 0, muestras: sumW }
          }
          const sum = rows.reduce((acc: number, p: any) => acc + Number(p.promedio || 0), 0)
          return { avg: rows.length ? sum / rows.length : 0, muestras: rows.length }
        }

        const temp = weighted(promediosBySensor.filter((x) => x.type === "temperature").flatMap((x) => x.promedios))
        const ph = weighted(promediosBySensor.filter((x) => x.type === "ph").flatMap((x) => x.promedios))
        const ox = weighted(promediosBySensor.filter((x) => x.type === "oxygen").flatMap((x) => x.promedios))

        if (!cancelled) {
          const nextSummary = {
            totalLecturas,
            lecturasHoy,
            promedioTemperatura: Number.isFinite(temp.avg) ? temp.avg : 0,
            promedioPH: Number.isFinite(ph.avg) ? ph.avg : 0,
            promedioOxigeno: Number.isFinite(ox.avg) ? ox.avg : 0,
          }
          setPrevSummary(summaryRef.current)
          summaryRef.current = nextSummary
          setSummary(nextSummary)
          hasInitialData.current = true
        }
      } catch (e) {
        console.error("[AnalyticsPage] Error fetching summary:", e)
        if (!cancelled) {
          hasInitialData.current = true
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummary(false)
          setIsRefreshing(false)
        }
      }
    }

    // Debounce para evitar múltiples requests al cambiar fechas rápido
    const id = setTimeout(fetchSummary, 250)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to, sensors, activeSensors])

  // Mantener variables por compatibilidad futura; evitamos bloquear UI.
  void contextLoading

  // Calcular métricas de análisis
  const analytics = {
    totalLecturas: summary.totalLecturas,
    lecturasHoy: summary.lecturasHoy,
    promedioTemperatura: summary.promedioTemperatura,
    promedioPH: summary.promedioPH,
    promedioOxigeno: summary.promedioOxigeno,
    alertasUltimaSemana: Array.isArray(alerts) ? alerts.length : 0,
    eficienciaOperativa:
      (instalaciones.filter((i: any) => i.estado_operativo === "activo").length / Math.max(instalaciones.length, 1)) * 100,
    procesosCompletados: procesos.filter((p: any) => p.estado === "finalizado" || p.estado === "completado" || (p.fecha_final && new Date(p.fecha_final) < new Date())).length,
  }

  const delta = {
    totalLecturas: analytics.totalLecturas - prevSummary.totalLecturas,
    temp: analytics.promedioTemperatura - prevSummary.promedioTemperatura,
    ph: analytics.promedioPH - prevSummary.promedioPH,
    ox: analytics.promedioOxigeno - prevSummary.promedioOxigeno,
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Análisis y Reportes</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">Período: {fromLabel} — {toLabel}</p>
              <div className="flex items-center gap-1.5">
                {connectedSensors > 0 ? (
                  <Wifi className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                )}
                <span className="text-xs text-muted-foreground">
                  {connectedSensors}/{sensors.length} sensores
                </span>
              </div>
            </div>
          </div>
          {isRefreshing && (
            <span className="text-sm text-muted-foreground animate-pulse">Actualizando...</span>
          )}
        </div>
      </div>

      {/* Selector de tiempo rápido */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Período:
        </div>
        <Tabs value={timePreset} onValueChange={(v) => handlePresetChange(v as TimePreset)} className="w-auto">
          <TabsList className="h-8">
            <TabsTrigger value="today" className="text-xs px-2 h-7">Hoy</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs px-2 h-7">7 días</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2 h-7">30 días</TabsTrigger>
            <TabsTrigger value="thisWeek" className="text-xs px-2 h-7">Esta semana</TabsTrigger>
            <TabsTrigger value="thisMonth" className="text-xs px-2 h-7">Este mes</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs px-2 h-7">
              <Calendar className="h-3 w-3 mr-1" />
              Otro
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Opciones de exportación */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={exportScope} onValueChange={(v) => setExportScope(v as any)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Alcance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top20">Top 20 sensores</SelectItem>
            <SelectItem value="all">Todos los sensores</SelectItem>
          </SelectContent>
        </Select>
        <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          size="sm"
          variant="outline"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="mr-1 h-3 w-3" />
          Filtros
        </Button>
        <Button 
          size="sm"
          onClick={handleExport} 
          disabled={isExporting || !dateRange.from || !dateRange.to}
        >
          <Download className="mr-1 h-3 w-3" />
          {isExporting ? 'Exportando...' : `Exportar ${exportFormat.toUpperCase()}`}
        </Button>
      </div>

      {showFilters && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros avanzados</CardTitle>
            <CardDescription>Filtra por tipo, estado e instalación según los sensores actuales.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={selectedSensorType} onValueChange={setSelectedSensorType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {typeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="offline">Desconectado</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="alert">Alerta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedInstallation} onValueChange={setSelectedInstallation}>
              <SelectTrigger>
                <SelectValue placeholder="Instalación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las instalaciones</SelectItem>
                {availableInstallations.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {isExporting && exportProgress.total > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exportación en progreso</span>
            <span className="font-medium">
              {exportProgress.done}/{exportProgress.total}
            </span>
          </div>
          <div className="mt-2">
            <Progress value={Math.round((exportProgress.done / exportProgress.total) * 100)} />
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecturas Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={analytics.totalLecturas}
                format={(v) => Math.round(v).toLocaleString()}
                className="text-2xl font-bold"
              />
              {delta.totalLecturas !== 0 && (
                <span className={delta.totalLecturas > 0 ? "text-xs text-green-600" : "text-xs text-red-600"}>
                  {delta.totalLecturas > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                  {Math.abs(delta.totalLecturas).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{analytics.lecturasHoy.toLocaleString()} hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{typeLabel("temperature")} Promedio</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={analytics.promedioTemperatura}
                format={(v) => `${v.toFixed(1)}°C`}
                className="text-2xl font-bold"
              />
              {delta.temp !== 0 && (
                <span className={delta.temp > 0 ? "text-xs text-green-600" : "text-xs text-red-600"}>
                  {delta.temp > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                  {Math.abs(delta.temp).toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{typeLabel("ph")} Promedio</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={analytics.promedioPH}
                format={(v) => v.toFixed(1)}
                className="text-2xl font-bold"
              />
              {delta.ph !== 0 && (
                <span className={delta.ph > 0 ? "text-xs text-green-600" : "text-xs text-red-600"}>
                  {delta.ph > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                  {Math.abs(delta.ph).toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Rango óptimo: 6.5-8.5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia Operativa</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber
              value={analytics.eficienciaOperativa}
              format={(v) => `${v.toFixed(1)}%`}
              className="text-2xl font-bold"
            />
            <p className="text-xs text-muted-foreground">Instalaciones activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas secundarias */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{typeLabel("oxygen")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={analytics.promedioOxigeno}
                format={(v) => `${v.toFixed(1)} mg/L`}
                className="text-2xl font-bold"
              />
              {delta.ox !== 0 && (
                <span className={delta.ox > 0 ? "text-xs text-green-600" : "text-xs text-red-600"}>
                  {delta.ox > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                  {Math.abs(delta.ox).toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Nivel óptimo {">"} 4.0 mg/L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas (7 días)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.alertasUltimaSemana}</div>
            <p className="text-xs text-muted-foreground">Última semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Completados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.procesosCompletados}</div>
            <p className="text-xs text-muted-foreground">Periodo seleccionado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <SensorAveragesChart dateRange={dateRange} sensors={filteredSensors} />
      </div>

      <div className="grid gap-4">
        <ParameterTrendChart dateRange={dateRange} sensors={filteredSensors} />
      </div>

      {/* Contenido principal de análisis */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Análisis Detallado</CardTitle>
            <CardDescription>Gráficos y tendencias de los parámetros de calidad del agua</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsContent dateRange={dateRange} sensors={filteredSensors} />
          </CardContent>
        </Card>
      </div>

      {/* Reportes disponibles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reporte Diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Resumen diario de parámetros y alertas</p>
            <Badge variant="secondary">Disponible</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Tendencias y comparativas semanales</p>
            <Badge variant="secondary">Disponible</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reporte Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Análisis completo mensual con recomendaciones</p>
            <Badge variant="secondary">Disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
