"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Download, Filter, Activity, Thermometer, Droplets, ArrowDown, ArrowUp, Clock, Wifi, WifiOff, Calendar } from "lucide-react"
import { useAppContext } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { AnalyticsContent } from "@/components/analytics-content"
import { DateRangePicker } from "@/components/date-range-picker"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { backendApi, type Lectura } from "@/lib/backend-client"
import { useRolePermissions } from "@/hooks/use-role-permissions"
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

type OptionWithCount = {
  value: string
  count: number
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  offline: "Desconectado",
  inactive: "Inactivo",
  maintenance: "Mantenimiento",
  alert: "Alerta",
}

const STATUS_ORDER = ["active", "alert", "maintenance", "offline", "inactive"]

function normalizeId(value: unknown): string {
  return String(value ?? "").trim()
}

function escapeCsvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`
}

function buildCsvContent(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\n")
}

function lecturaTimestamp(lectura: Lectura): string {
  const tomadaEn = String(lectura.tomada_en || "").trim()
  if (tomadaEn) return tomadaEn
  const fecha = String(lectura.fecha || "").trim()
  const hora = String(lectura.hora || "").trim()
  if (fecha && hora) return `${fecha}T${hora}`
  return fecha
}

function formatTimestampForExport(rawTimestamp: string): string {
  const d = new Date(rawTimestamp)
  return Number.isFinite(d.getTime()) ? format(d, "dd/MM/yyyy HH:mm:ss", { locale: es }) : rawTimestamp
}

export default function AnalyticsPage() {
  const context = useAppContext()
  const instalaciones = context?.instalaciones ?? []
  const procesos = context?.procesos ?? []
  const alerts = context?.alerts ?? []
  const stats = context?.stats
  const contextLoading = context?.isLoading ?? false

  const { sensors } = useSensors()
  const { user } = useAuth()
  const { hasRestrictedAccess, allowedFacilities, allowedBranches } = useRolePermissions()
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
  const [summaryCoverage, setSummaryCoverage] = useState({ queried: 0, total: 0 })

  const normalizeKey = (value: string) => value.trim().toLowerCase()
  const getTipoMedidaFromSensor = (sensor: any): string => {
    const raw =
      sensor?.tipoMedida ??
      sensor?.tipo_medida ??
      sensor?.catalogo_sensores?.tipo_medida ??
      sensor?.catalogo?.tipo_medida ??
      sensor?.type
    return String(raw || "")
  }

  const getSensorFacilityId = (sensor: any): string => {
    return normalizeId(sensor?.facilityId ?? sensor?.id_instalacion ?? sensor?.idInstalacion)
  }

  const getSensorBranchId = (sensor: any): string => {
    return normalizeId(sensor?.branchId ?? sensor?.id_sucursal ?? sensor?.idSucursal)
  }

  const matchesType = (sensor: any, typeValue: string) => {
    if (typeValue === "all") return true
    return normalizeKey(getTipoMedidaFromSensor(sensor)) === normalizeKey(typeValue)
  }

  const matchesStatus = (sensor: any, statusValue: string) => {
    if (statusValue === "all") return true
    return String(sensor?.status || "") === statusValue
  }

  const matchesInstallation = (sensor: any, installationValue: string) => {
    if (installationValue === "all") return true
    return normalizeKey(String(sensor?.facilityName || "")) === normalizeKey(installationValue)
  }

  const roleScopedSensors = useMemo(() => {
    const source = Array.isArray(sensors) ? sensors : []
    if (!hasRestrictedAccess) return source

    const allowedFacilitiesSet = new Set((allowedFacilities || []).map((id) => normalizeId(id)).filter(Boolean))
    const allowedBranchesSet = new Set((allowedBranches || []).map((id) => normalizeId(id)).filter(Boolean))
    const hasExplicitScope = allowedFacilitiesSet.size > 0 || allowedBranchesSet.size > 0

    if (!hasExplicitScope) {
      // Sin alcance explícito: asumimos que el backend ya entrega datos permitidos.
      return source
    }

    return source.filter((sensor: any) => {
      const sensorFacilityId = getSensorFacilityId(sensor)
      const sensorBranchId = getSensorBranchId(sensor)
      if (sensorFacilityId && allowedFacilitiesSet.has(sensorFacilityId)) return true
      if (sensorBranchId && allowedBranchesSet.has(sensorBranchId)) return true
      return false
    })
  }, [sensors, hasRestrictedAccess, allowedFacilities, allowedBranches])

  const visibleInstallationIds = useMemo(() => {
    const ids = new Set<number>()
    roleScopedSensors.forEach((sensor: any) => {
      const value = Number(sensor?.id_instalacion ?? sensor?.facilityId ?? 0)
      if (Number.isFinite(value) && value > 0) ids.add(value)
    })
    return ids
  }, [roleScopedSensors])

  const visibleFacilities = useMemo(() => {
    if (!hasRestrictedAccess) return instalaciones
    if (visibleInstallationIds.size === 0) return []
    return instalaciones.filter((facility: any) => visibleInstallationIds.has(Number(facility?.id_instalacion || 0)))
  }, [instalaciones, hasRestrictedAccess, visibleInstallationIds])

  const visibleProcesses = useMemo(() => {
    if (!hasRestrictedAccess) return procesos
    if (visibleInstallationIds.size === 0) return []
    return procesos.filter((process: any) => visibleInstallationIds.has(Number(process?.id_instalacion || 0)))
  }, [procesos, hasRestrictedAccess, visibleInstallationIds])

  const sensorsForTypeOptions = useMemo(() => {
    return roleScopedSensors.filter((sensor: any) => {
      return matchesStatus(sensor, selectedStatus) && matchesInstallation(sensor, selectedInstallation)
    })
  }, [roleScopedSensors, selectedStatus, selectedInstallation])

  const sensorsForStatusOptions = useMemo(() => {
    return roleScopedSensors.filter((sensor: any) => {
      return matchesType(sensor, selectedSensorType) && matchesInstallation(sensor, selectedInstallation)
    })
  }, [roleScopedSensors, selectedSensorType, selectedInstallation])

  const sensorsForInstallationOptions = useMemo(() => {
    return roleScopedSensors.filter((sensor: any) => {
      return matchesType(sensor, selectedSensorType) && matchesStatus(sensor, selectedStatus)
    })
  }, [roleScopedSensors, selectedSensorType, selectedStatus])

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

  const formatSensorTypeOption = (rawType: string) => {
    const canonical = detectType("", rawType, "")
    const canonicalLabel = typeLabel(canonical)
    const cleaned = String(rawType || "").trim()
    if (!cleaned) return canonicalLabel
    return canonicalLabel.toLowerCase() === cleaned.toLowerCase()
      ? canonicalLabel
      : `${canonicalLabel} · ${cleaned}`
  }

  const availableTypeOptions = useMemo<OptionWithCount[]>(() => {
    const byType = new Map<string, OptionWithCount>()
    sensorsForTypeOptions.forEach((sensor: any) => {
      const raw = getTipoMedidaFromSensor(sensor)
      const key = normalizeKey(raw)
      if (!key) return
      const prev = byType.get(key)
      if (!prev) {
        byType.set(key, { value: raw, count: 1 })
        return
      }
      prev.count += 1
    })
    return Array.from(byType.values()).sort((a, b) => a.value.localeCompare(b.value, "es"))
  }, [sensorsForTypeOptions])

  const availableStatusOptions = useMemo<OptionWithCount[]>(() => {
    const byStatus = new Map<string, OptionWithCount>()
    sensorsForStatusOptions.forEach((sensor: any) => {
      const status = String(sensor?.status || "")
      if (!status) return
      const prev = byStatus.get(status)
      if (!prev) {
        byStatus.set(status, { value: status, count: 1 })
        return
      }
      prev.count += 1
    })
    return Array.from(byStatus.values()).sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.value)
      const bi = STATUS_ORDER.indexOf(b.value)
      const left = ai === -1 ? Number.MAX_SAFE_INTEGER : ai
      const right = bi === -1 ? Number.MAX_SAFE_INTEGER : bi
      return left - right || a.value.localeCompare(b.value)
    })
  }, [sensorsForStatusOptions])

  const availableInstallationOptions = useMemo<OptionWithCount[]>(() => {
    const byInstallation = new Map<string, OptionWithCount>()
    sensorsForInstallationOptions.forEach((sensor: any) => {
      const facilityName = String(sensor?.facilityName || "").trim()
      if (!facilityName) return
      const key = normalizeKey(facilityName)
      const prev = byInstallation.get(key)
      if (!prev) {
        byInstallation.set(key, { value: facilityName, count: 1 })
        return
      }
      prev.count += 1
    })
    return Array.from(byInstallation.values()).sort((a, b) => a.value.localeCompare(b.value, "es"))
  }, [sensorsForInstallationOptions])

  useEffect(() => {
    if (selectedSensorType === "all") return
    const exists = availableTypeOptions.some((option) => normalizeKey(option.value) === normalizeKey(selectedSensorType))
    if (!exists) setSelectedSensorType("all")
  }, [selectedSensorType, availableTypeOptions])

  useEffect(() => {
    if (selectedStatus === "all") return
    const exists = availableStatusOptions.some((option) => option.value === selectedStatus)
    if (!exists) setSelectedStatus("all")
  }, [selectedStatus, availableStatusOptions])

  useEffect(() => {
    if (selectedInstallation === "all") return
    const exists = availableInstallationOptions.some(
      (option) => normalizeKey(option.value) === normalizeKey(selectedInstallation),
    )
    if (!exists) setSelectedInstallation("all")
  }, [selectedInstallation, availableInstallationOptions])

  const filteredSensors = useMemo(() => {
    return roleScopedSensors.filter((sensor: any) => {
      return (
        matchesType(sensor, selectedSensorType) &&
        matchesStatus(sensor, selectedStatus) &&
        matchesInstallation(sensor, selectedInstallation)
      )
    })
  }, [roleScopedSensors, selectedSensorType, selectedStatus, selectedInstallation])

  const hasActiveFilters = useMemo(() => {
    return selectedSensorType !== "all" || selectedStatus !== "all" || selectedInstallation !== "all"
  }, [selectedSensorType, selectedStatus, selectedInstallation])

  const connectedSensors = useMemo(() => {
    return roleScopedSensors.filter((sensor: any) => sensor.status === "active" || sensor.lastReading !== undefined).length
  }, [roleScopedSensors])

  const hiddenSensorsByPermissions = Math.max(0, sensors.length - roleScopedSensors.length)

  // Función para calcular rango de fechas basado en preset
  const getPresetDateRange = useCallback((preset: TimePreset): DateRange => {
    const now = new Date()
    switch (preset) {
      case "today":
        return { from: startOfToday(), to: endOfToday() }
      case "7d":
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
      case "30d":
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
      case "thisWeek":
        return {
          from: startOfDay(startOfWeek(now, { locale: es })),
          to: endOfDay(endOfWeek(now, { locale: es })),
        }
      case "thisMonth":
        return { from: startOfDay(startOfMonth(now)), to: endOfDay(endOfMonth(now)) }
      default:
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
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
    setDateRange({
      from: range.from ? startOfDay(range.from) : undefined,
      to: range.to ? endOfDay(range.to) : undefined,
    })
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
    if (t.includes('ph') || t.includes('potencial') || t.includes('hidrogeno') || t.includes('hidrógeno')) return 'ph'
    if (t.includes('temp') || t.includes('temperatura')) return 'temperature'
    if (t.includes('ox') || t.includes('oxígeno') || t.includes('oxigeno') || t.includes('oxygen') || t.includes('o2')) return 'oxygen'
    if (t.includes('sal') || t.includes('salinidad')) return 'salinity'
    if (t.includes('turb') || t.includes('turbidez')) return 'turbidity'
    if (t.includes('nitrat') || t.includes('nitrato')) return 'nitrates'
    if (t.includes('amon') || t.includes('ammo') || t.includes('amoniaco') || t.includes('amoníaco')) return 'ammonia'
    if (t.includes('baro') || t.includes('presión') || t.includes('presion')) return 'barometric'
    if (u.includes('ph')) return 'ph'
    if (u.includes('°c') || u.includes('c')) return 'temperature'
    if (u.includes('mg/l') && (name || '').toLowerCase().includes('ox')) return 'oxygen'
    if (u.includes('ppt')) return 'salinity'
    if (u.includes('ntu')) return 'turbidity'
    if (u.includes('hpa')) return 'barometric'
    const n = (name || '').toLowerCase()
    if (n.includes('ph') || n.includes('potencial') || n.includes('hidrogeno') || n.includes('hidrógeno')) return 'ph'
    if (n.includes('temp') || n.includes('temperatura')) return 'temperature'
    if (n.includes('ox') || n.includes('oxígeno') || n.includes('oxigeno') || n.includes('oxygen') || n.includes('o2')) return 'oxygen'
    if (n.includes('sal') || n.includes('salinidad')) return 'salinity'
    if (n.includes('turb') || n.includes('turbidez')) return 'turbidity'
    if (n.includes('nitrat') || n.includes('nitrato')) return 'nitrates'
    if (n.includes('amon') || n.includes('ammo') || n.includes('amoniaco') || n.includes('amoníaco')) return 'ammonia'
    if (n.includes('baro') || n.includes('presión') || n.includes('presion')) return 'barometric'
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
      if (!dateRange.from || !dateRange.to) {
        toast({
          title: "Período incompleto",
          description: "Selecciona una fecha o rango válido antes de exportar.",
          variant: "destructive",
        })
        return
      }

      const desde = dateRange.from?.toISOString()
      const hasta = dateRange.to?.toISOString()

      const sensorsSource = filteredSensors
      if (!sensorsSource || sensorsSource.length === 0) {
        toast({
          title: "Sin sensores",
          description: "No hay sensores para exportar datos.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Preparando exportación",
        description: "Generando el reporte…",
      })

      // Formatear fechas para el nombre del archivo
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      // Obtener lecturas completas SOLO al exportar (por fechas)
      const sensorsToQuery = exportScope === "all" ? sensorsSource : sensorsSource.slice(0, 20)
      const generatedAt = new Date().toISOString()
      const scopeLabel = exportScope === "all" ? "todos" : "top20"
      const filtroTipo = selectedSensorType === "all" ? "todos" : selectedSensorType
      const filtroEstado = selectedStatus === "all" ? "todos" : STATUS_LABELS[selectedStatus] || selectedStatus
      const filtroInstalacion = selectedInstallation === "all" ? "todas" : selectedInstallation
      const userLabel = user?.name || user?.email || "usuario-no-disponible"

      const sensorMetaById = new Map<
        number,
        {
          sensorId: number
          sensorName: string
          sensorTypeRaw: string
          sensorTypeCanonical: string
          sensorStatus: string
          sensorUnit: string
          branchId: string
          branchName: string
          facilityId: string
          facilityName: string
        }
      >(
        sensorsToQuery.map((sensor: any) => {
          const sensorId = Number(sensor?.id_sensor_instalado || 0)
          const sensorTypeRaw = getTipoMedidaFromSensor(sensor)
          return [
            sensorId,
            {
              sensorId,
              sensorName: String(sensor?.name || `Sensor ${sensorId}`),
              sensorTypeRaw,
              sensorTypeCanonical: detectType(String(sensor?.name || ""), sensorTypeRaw, String(sensor?.unit || "")),
              sensorStatus: String(sensor?.status || ""),
              sensorUnit: String(sensor?.unit || ""),
              branchId: normalizeId(sensor?.branchId),
              branchName: String(sensor?.branchName || ""),
              facilityId: normalizeId(sensor?.id_instalacion ?? sensor?.facilityId),
              facilityName: String(sensor?.facilityName || ""),
            },
          ]
        }),
      )

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
        const jsonContent = JSON.stringify(
          {
            meta: {
              desde,
              hasta,
              generadoEn: generatedAt,
              usuario: userLabel,
              totalSensoresConsiderados: sensorsToQuery.length,
              totalLecturas: lecturas.length,
              alcance: scopeLabel,
            },
            filtros: {
              tipo: filtroTipo,
              estado: filtroEstado,
              instalacion: filtroInstalacion,
            },
            sensores: Array.from(sensorMetaById.values()),
            lecturas: lecturas.map((lectura) => {
              const sensorId = Number(lectura.id_sensor_instalado || lectura.sensor_instalado_id || 0)
              const meta = sensorMetaById.get(sensorId)
              const timestamp = lecturaTimestamp(lectura)
              return {
                lecturaId: Number(lectura.id_lectura || 0),
                sensorId,
                sensorName: meta?.sensorName || `Sensor ${sensorId}`,
                instalacion: meta?.facilityName || "",
                tipoMedida: lectura.tipo_medida || meta?.sensorTypeRaw || "",
                tipoCanonico: detectType(
                  String(meta?.sensorName || ""),
                  String(lectura.tipo_medida || meta?.sensorTypeRaw || ""),
                  String(meta?.sensorUnit || ""),
                ),
                valor: lectura.valor,
                unidad: meta?.sensorUnit || "",
                timestamp,
                timestampLocal: formatTimestampForExport(timestamp),
              }
            }),
          },
          null,
          2,
        )

        const blob = new Blob([jsonContent], { type: "application/json" })
        const link = document.createElement("a")
        const href = URL.createObjectURL(blob)
        link.href = href
        link.download = `analytics-${fromDate}_${toDate}.json`
        link.click()
        URL.revokeObjectURL(href)
      } else {
        const headers = [
          "periodo_desde",
          "periodo_hasta",
          "generado_en",
          "usuario",
          "alcance_exportacion",
          "filtro_tipo_sensor",
          "filtro_estado_sensor",
          "filtro_instalacion",
          "sensor_id",
          "sensor",
          "tipo_medida",
          "tipo_canonico",
          "estado_sensor",
          "unidad",
          "sucursal_id",
          "sucursal",
          "instalacion_id",
          "instalacion",
          "lectura_id",
          "timestamp",
          "timestamp_local",
          "valor",
        ]

        const baseColumns = [
          desde || "",
          hasta || "",
          generatedAt,
          userLabel,
          scopeLabel,
          filtroTipo,
          filtroEstado,
          filtroInstalacion,
        ]

        const dataRows =
          lecturas.length > 0
            ? lecturas.map((lectura) => {
                const sensorId = Number(lectura.id_sensor_instalado || lectura.sensor_instalado_id || 0)
                const meta = sensorMetaById.get(sensorId)
                const timestamp = lecturaTimestamp(lectura)
                const sensorTypeRaw = String(lectura.tipo_medida || meta?.sensorTypeRaw || "")
                const canonicalType = detectType(
                  String(meta?.sensorName || ""),
                  sensorTypeRaw,
                  String(meta?.sensorUnit || ""),
                )

                return [
                  ...baseColumns,
                  sensorId,
                  meta?.sensorName || `Sensor ${sensorId}`,
                  sensorTypeRaw,
                  canonicalType,
                  STATUS_LABELS[String(meta?.sensorStatus || "")] || meta?.sensorStatus || "",
                  meta?.sensorUnit || "",
                  meta?.branchId || "",
                  meta?.branchName || "",
                  meta?.facilityId || "",
                  meta?.facilityName || "",
                  Number(lectura.id_lectura || 0),
                  timestamp,
                  formatTimestampForExport(timestamp),
                  Number(lectura.valor ?? 0),
                ]
              })
            : sensorsToQuery.map((sensor: any) => {
                const sensorId = Number(sensor?.id_sensor_instalado || 0)
                const meta = sensorMetaById.get(sensorId)
                return [
                  ...baseColumns,
                  sensorId,
                  meta?.sensorName || `Sensor ${sensorId}`,
                  meta?.sensorTypeRaw || "",
                  meta?.sensorTypeCanonical || "",
                  STATUS_LABELS[String(meta?.sensorStatus || "")] || meta?.sensorStatus || "",
                  meta?.sensorUnit || "",
                  meta?.branchId || "",
                  meta?.branchName || "",
                  meta?.facilityId || "",
                  meta?.facilityName || "",
                  "",
                  "",
                  "",
                  "",
                ]
              })

        const csvContent = buildCsvContent([headers, ...dataRows])
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const href = URL.createObjectURL(blob)
        link.href = href
        link.download = `analytics-${fromDate}_${toDate}.csv`
        link.click()
        URL.revokeObjectURL(href)
      }

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${lecturas.length} lecturas para ${sensorsToQuery.length} sensores en el período ${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}.`,
      })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar los datos. Intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }, [
    dateRange.from,
    dateRange.to,
    filteredSensors,
    exportScope,
    exportFormat,
    selectedSensorType,
    selectedStatus,
    selectedInstallation,
    toast,
    user?.email,
    user?.name,
  ])

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

        const sensorsSource = filteredSensors
        if (!sensorsSource || sensorsSource.length === 0) {
          if (!cancelled) {
            setPrevSummary(summaryRef.current)
            setSummary({ totalLecturas: 0, lecturasHoy: 0, promedioTemperatura: 0, promedioPH: 0, promedioOxigeno: 0 })
            setSummaryCoverage({ queried: 0, total: 0 })
            hasInitialData.current = true
          }
          return
        }

        const MAX_SUMMARY_SENSORS = 24
        const sensorsToQuery = sensorsSource.slice(0, MAX_SUMMARY_SENSORS)
        const coverageFactor = sensorsToQuery.length > 0 ? sensorsSource.length / sensorsToQuery.length : 1
        if (!cancelled) {
          setSummaryCoverage({ queried: sensorsToQuery.length, total: sensorsSource.length })
        }
        const bucketMinutes = computeBucketMinutes(dateRange.from, dateRange.to, 100)
        const today = new Date()
        const todayStart = startOfDay(today)
        const todayEnd = endOfDay(today)
        const rangeIncludesToday = dateRange.from <= todayEnd && dateRange.to >= todayStart
        const todayStartMs = todayStart.getTime()
        const todayEndMs = todayEnd.getTime()

        // Una sola consulta por sensor para resumen, promedios y conteos aproximados de lecturas.
        const promediosBySensor = await mapWithConcurrency(
          sensorsToQuery,
          3,
          async (s: any) => {
            const id = Number(s.id_sensor_instalado)
            const rawTipo = getTipoMedidaFromSensor(s)
            const sensorType = detectType(String(s.name || s.descripcion || ""), rawTipo, s.unit)
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

        let totalLecturasMuestra = 0
        let lecturasHoyMuestra = 0
        for (const item of promediosBySensor) {
          for (const p of item.promedios || []) {
            const muestrasRaw = Number((p as any).muestras)
            const muestras = Number.isFinite(muestrasRaw) && muestrasRaw > 0 ? muestrasRaw : 1
            totalLecturasMuestra += muestras

            if (rangeIncludesToday) {
              const t = new Date((p as any).timestamp).getTime()
              if (Number.isFinite(t) && t >= todayStartMs && t <= todayEndMs) {
                lecturasHoyMuestra += muestras
              }
            }
          }
        }

        const totalLecturas = Math.round(totalLecturasMuestra * coverageFactor)
        const lecturasHoy = rangeIncludesToday ? Math.round(lecturasHoyMuestra * coverageFactor) : 0

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
  }, [dateRange.from, dateRange.to, filteredSensors])

  // Mantener variables por compatibilidad futura; evitamos bloquear UI.
  void contextLoading

  // Calcular métricas de análisis
  const scopedAlertsFromSensors = filteredSensors.filter((sensor: any) => sensor.status === "alert").length
  const analytics = {
    totalLecturas: summary.totalLecturas,
    lecturasHoy: summary.lecturasHoy,
    promedioTemperatura: summary.promedioTemperatura,
    promedioPH: summary.promedioPH,
    promedioOxigeno: summary.promedioOxigeno,
    sensoresSeleccionados: filteredSensors.length,
    alertasActivas: hasRestrictedAccess
      ? scopedAlertsFromSensors
      : typeof stats?.alertas_activas === "number"
        ? stats.alertas_activas
        : Array.isArray(alerts)
          ? alerts.length
          : 0,
    instalacionesTotales: hasRestrictedAccess
      ? visibleFacilities.length
      : typeof stats?.total_instalaciones === "number"
        ? stats.total_instalaciones
        : instalaciones.length,
    instalacionesActivas: hasRestrictedAccess
      ? visibleFacilities.filter((facility: any) => facility.estado_operativo === "activo").length
      : typeof stats?.instalaciones_activas === "number"
        ? stats.instalaciones_activas
        : instalaciones.filter((facility: any) => facility.estado_operativo === "activo").length,
    procesosTotales: Array.isArray(visibleProcesses) ? visibleProcesses.length : 0,
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
                  {connectedSensors}/{roleScopedSensors.length} sensores
                </span>
              </div>
              {hiddenSensorsByPermissions > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Acceso aplicado: {hiddenSensorsByPermissions} sensores ocultos por permisos
                </span>
              )}
              {summaryCoverage.total > 0 && summaryCoverage.total > summaryCoverage.queried && (
                <span className="text-[11px] text-muted-foreground">
                  Resumen rápido: {summaryCoverage.queried}/{summaryCoverage.total} sensores
                </span>
              )}
            </div>
          </div>
          {(isRefreshing || isLoadingSummary) && (
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
            <CardDescription>
              Opciones dinámicas según sensores disponibles para tu usuario y el cruce actual de filtros.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={selectedSensorType} onValueChange={setSelectedSensorType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {availableTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {formatSensorTypeOption(option.value)} ({option.count})
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
                {availableStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {(STATUS_LABELS[option.value] || option.value)} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedInstallation} onValueChange={setSelectedInstallation}>
              <SelectTrigger>
                <SelectValue placeholder="Instalación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las instalaciones</SelectItem>
                {availableInstallationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="md:col-span-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedSensorType("all")
                  setSelectedStatus("all")
                  setSelectedInstallation("all")
                }}
                disabled={!hasActiveFilters}
              >
                Limpiar filtros
              </Button>
              <span className="text-xs text-muted-foreground">
                Sensores visibles: {filteredSensors.length}/{roleScopedSensors.length}
              </span>
            </div>
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
            <CardTitle className="text-sm font-medium">Sensores (selección)</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.sensoresSeleccionados.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Basado en los filtros actuales</p>
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
            <p className="text-xs text-muted-foreground">Promedio en el período</p>
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
            <p className="text-xs text-muted-foreground">Promedio en el período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas activas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.alertasActivas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">En el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalaciones activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.instalacionesActivas.toLocaleString()}
              <span className="text-muted-foreground">/{analytics.instalacionesTotales.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Según instalaciones registradas</p>
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
            <AnalyticsContent
              dateRange={dateRange}
              sensors={filteredSensors}
              processes={visibleProcesses}
              facilities={visibleFacilities}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
