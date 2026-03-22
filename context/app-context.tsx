"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type {
  EmpresaSucursalCompleta,
  InstalacionCompleta,
  Especie,
  ProcesoDetallado,
  User,
  Alerta,
  DashboardStats,
  CatalogoSensor,
  SensorInstaladoCompleto,
  Lectura
} from "@/types"
import { api } from "@/lib/api"
import { canReadOrganizationDirectory, deriveDirectoryFromInstalaciones } from "@/lib/organization-directory"
import { buildNotificationsWsUrl } from "@/lib/websocket-url"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

interface AppContextType {
  // Datos principales
  empresasSucursales: EmpresaSucursalCompleta[]
  instalaciones: InstalacionCompleta[]
  especies: Especie[]
  procesos: ProcesoDetallado[]
  alerts: Alerta[]
  users: User[]
  stats: DashboardStats
  
  // Datos adicionales
  catalogoSensores: CatalogoSensor[]
  sensoresInstalados: SensorInstaladoCompleto[]

  // Estados
  isLoading: boolean
  error: string | null

  // Funciones
  refreshData: (options?: { silent?: boolean; force?: boolean }) => Promise<void>
  setSelectedEmpresa: (empresaId: number | null) => void
  selectedEmpresa: number | null
}

const AppContext = createContext<AppContextType | null>(null)

const APP_CONTEXT_CACHE_KEY = "aqua:app-context:v1"
const APP_CONTEXT_CACHE_TTL_MS = 60_000
const APP_CONTEXT_MIN_REFETCH_INTERVAL_MS = 20_000
const ALERTS_WS_RECONNECT_MS = 3_000
const ALERTS_WS_TOAST_DEDUP_MS = 8_000

function mapAlertaFromApi(raw: any): Alerta | null {
  const id = Number(raw?.id_alertas ?? raw?.id_alerta ?? raw?.id)
  if (!Number.isFinite(id) || id <= 0) return null

  const sensorInstaladoId = Number(
    raw?.id_sensor_instalado ??
      raw?.sensor_instalado?.id_sensor_instalado ??
      raw?.sensor?.id_sensor_instalado ??
      raw?.sensor?.id,
  )
  const instalacionId = Number(
    raw?.id_instalacion ??
      raw?.sensor_instalado?.id_instalacion ??
      raw?.instalacion?.id_instalacion ??
      0,
  )

  const read = typeof raw?.read === "boolean"
    ? raw.read
    : typeof raw?.leida === "boolean"
      ? raw.leida
      : false

  const parameter =
    raw?.parameter ??
    raw?.sensor_instalado?.catalogo_sensores?.nombre ??
    raw?.sensor_instalado?.catalogo_sensores?.sensor ??
    raw?.sensor?.nombre ??
    raw?.tipo_medida ??
    undefined

  const fecha = raw?.fecha || raw?.fecha_alerta || raw?.fecha_hora_alerta || raw?.fecha_creacion || new Date().toISOString()
  const descripcion = String(raw?.descripcion ?? raw?.mensaje_alerta ?? "").trim()
  const datoPuntual = Number(raw?.dato_puntual ?? raw?.valor_medido ?? 0)

  return {
    ...raw,
    id_alertas: id,
    id_alerta: id,
    id_instalacion: Number.isFinite(instalacionId) ? instalacionId : 0,
    id_sensor_instalado: Number.isFinite(sensorInstaladoId) ? sensorInstaladoId : 0,
    descripcion,
    dato_puntual: Number.isFinite(datoPuntual) ? datoPuntual : 0,
    fecha,
    read,
    leida: read,
    fecha_alerta: raw?.fecha_alerta || fecha,
    fecha_lectura: raw?.fecha_lectura || null,
    tipo_alerta: raw?.tipo_alerta || "critica",
    estado_alerta: raw?.estado_alerta || "activa",
    title: raw?.title || raw?.titulo || "Alerta de sistema",
    parameter: parameter ? String(parameter) : undefined,
  }
}

function upsertAlertById(previous: Alerta[], incoming: Alerta): Alerta[] {
  const targetId = Number(incoming.id_alertas)
  const index = previous.findIndex((item) => Number(item.id_alertas) === targetId)

  if (index === -1) {
    return [incoming, ...previous].sort((a, b) => Number(b.id_alertas) - Number(a.id_alertas))
  }

  const next = [...previous]
  next[index] = { ...next[index], ...incoming }
  return next.sort((a, b) => Number(b.id_alertas) - Number(a.id_alertas))
}

function shouldEmitLiveToast(cache: Map<string, number>, key: string): boolean {
  const now = Date.now()

  for (const [entryKey, ts] of cache.entries()) {
    if (now - ts > ALERTS_WS_TOAST_DEDUP_MS) {
      cache.delete(entryKey)
    }
  }

  const lastTs = cache.get(key)
  if (lastTs && now - lastTs < ALERTS_WS_TOAST_DEDUP_MS) {
    return false
  }

  cache.set(key, now)
  return true
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [empresasSucursales, setEmpresasSucursales] = useState<EmpresaSucursalCompleta[]>([])
  const [instalaciones, setInstalaciones] = useState<InstalacionCompleta[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])
  const [procesos, setProcesos] = useState<ProcesoDetallado[]>([])
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [catalogoSensores, setCatalogoSensores] = useState<CatalogoSensor[]>([])
  const [sensoresInstalados, setSensoresInstalados] = useState<SensorInstaladoCompleto[]>([])
  
  const [stats, setStats] = useState<DashboardStats>({
    total_empresas: 0,
    total_sucursales: 0,
    total_instalaciones: 0,
    instalaciones_activas: 0,
    total_especies: 0,
    procesos_activos: 0,
    alertas_activas: 0,
    sensores_instalados: 0,
    lecturas_hoy: 0
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const hasHydratedCacheRef = useRef(false)
  const lastFetchedAtRef = useRef(0)
  const liveToastCacheRef = useRef(new Map<string, number>())

  const hydrateFromCache = useCallback((): boolean => {
    if (typeof window === "undefined") return false

    try {
      const raw = sessionStorage.getItem(APP_CONTEXT_CACHE_KEY)
      if (!raw) return false

      const parsed = JSON.parse(raw)
      const ts = Number(parsed?.ts || 0)
      const role = String(parsed?.role || "")
      const currentRole = String(user?.role || "")

      if (!ts || Date.now() - ts > APP_CONTEXT_CACHE_TTL_MS) return false
      if (role !== currentRole) return false

      const data = parsed?.data || {}

      setEmpresasSucursales(Array.isArray(data.empresasSucursales) ? data.empresasSucursales : [])
      setInstalaciones(Array.isArray(data.instalaciones) ? data.instalaciones : [])
      setEspecies(Array.isArray(data.especies) ? data.especies : [])
      setProcesos(Array.isArray(data.procesos) ? data.procesos : [])
      setAlerts(Array.isArray(data.alerts) ? data.alerts : [])
      setUsers(Array.isArray(data.users) ? data.users : [])
      setCatalogoSensores(Array.isArray(data.catalogoSensores) ? data.catalogoSensores : [])
      setSensoresInstalados(Array.isArray(data.sensoresInstalados) ? data.sensoresInstalados : [])
      setStats(data.stats || {
        total_empresas: 0,
        total_sucursales: 0,
        total_instalaciones: 0,
        instalaciones_activas: 0,
        total_especies: 0,
        procesos_activos: 0,
        alertas_activas: 0,
        sensores_instalados: 0,
        lecturas_hoy: 0,
      })

      hasLoadedOnceRef.current = true
      lastFetchedAtRef.current = ts
      setIsLoading(false)
      return true
    } catch {
      return false
    }
  }, [user?.role])

  const persistCache = useCallback((payload: {
    empresasSucursales: EmpresaSucursalCompleta[]
    instalaciones: InstalacionCompleta[]
    especies: Especie[]
    procesos: ProcesoDetallado[]
    alerts: Alerta[]
    users: User[]
    catalogoSensores: CatalogoSensor[]
    sensoresInstalados: SensorInstaladoCompleto[]
    stats: DashboardStats
  }) => {
    if (typeof window === "undefined") return
    try {
      sessionStorage.setItem(
        APP_CONTEXT_CACHE_KEY,
        JSON.stringify({
          ts: Date.now(),
          role: user?.role || "",
          data: payload,
        }),
      )
    } catch {
      // ignore cache write errors
    }
  }, [user?.role])

  const refreshData = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    try {
      const forceFetch = Boolean(options?.force)
      const isSilentRefresh = options?.silent === true
      const elapsedSinceLastFetch = Date.now() - lastFetchedAtRef.current
      if (!forceFetch && isSilentRefresh && hasLoadedOnceRef.current && elapsedSinceLastFetch < APP_CONTEXT_MIN_REFETCH_INTERVAL_MS) {
        return
      }

      const useSilent = Boolean(options?.silent || hasLoadedOnceRef.current)
      if (!useSilent) {
        setIsLoading(true)
      }
      setError(null)

      const role = user?.role
      const canManageUsers = role === "superadmin" || role === "admin"
      const canReadOrgDirectory = canReadOrganizationDirectory(role)

      // Fetch all data in parallel
      const [
        orgsRes, 
        sucursalesRes, 
        instalacionesRes, 
        especiesRes, 
        procesosRes, 
        alertasRes, 
        usuariosRes
      ] = await Promise.all([
        (canReadOrgDirectory ? api.get<any[]>('/organizaciones') : Promise.resolve([] as any[])).catch(() => []),
        (canReadOrgDirectory ? api.get<any[]>('/sucursales') : Promise.resolve([] as any[])).catch(() => []),
        api.get<any[]>('/instalaciones').catch(() => []),
        api.get<any[]>('/catalogo-especies').catch(() => []),
        api.get<any[]>('/procesos').catch(() => []),
        api.get<any[]>('/alertas').catch(() => []),
        (canManageUsers ? api.get<any[]>('/usuarios') : Promise.resolve([] as any[])).catch(() => [])
      ])

      const derivedDirectory = canReadOrgDirectory
        ? null
        : deriveDirectoryFromInstalaciones(instalacionesRes)

      const mappedOrgs: EmpresaSucursalCompleta[] = canReadOrgDirectory
        ? orgsRes.map((org: any) => ({
            id_empresa_sucursal: org.id_organizacion,
            nombre: org.nombre,
            tipo: "empresa",
            estado_operativo: org.estado === "activa" ? "activa" : "inactiva",
            fecha_registro: org.fecha_creacion,
            id_estado: org.id_estado || 0,
            id_cp: 0,
            id_colonia: 0,
            calle: org.direccion || "",
            telefono: org.telefono,
            email: org.correo,
            latitud: org.latitud != null ? Number(org.latitud) : null,
            longitud: org.longitud != null ? Number(org.longitud) : null,
          }))
        : (derivedDirectory?.organizaciones ?? [])

      const orgNameById = new Map<number, string>(
        mappedOrgs.map((org) => [Number(org.id_empresa_sucursal), String(org.nombre || "")]),
      )

      const mappedSucursales: EmpresaSucursalCompleta[] = canReadOrgDirectory
        ? sucursalesRes.map((suc: any) => ({
            id_empresa_sucursal: 10000 + suc.id_organizacion_sucursal,
            id_padre: suc.id_organizacion,
            nombre: suc.nombre_sucursal,
            tipo: "sucursal",
            estado_operativo: suc.estado === "activa" ? "activa" : "inactiva",
            fecha_registro: suc.fecha_creacion,
            id_estado: suc.id_estado || 0,
            id_cp: suc.id_cp || 0,
            id_colonia: suc.id_colonia || 0,
            calle: suc.direccion_sucursal || suc.calle || "",
            numero_int_ext: suc.numero_int_ext || null,
            referencia: suc.referencia || null,
            telefono: suc.telefono_sucursal,
            email: suc.correo_sucursal,
            latitud: suc.latitud != null ? Number(suc.latitud) : null,
            longitud: suc.longitud != null ? Number(suc.longitud) : null,
            padre: orgNameById.get(Number(suc.id_organizacion)),
          }))
        : (derivedDirectory?.sucursales ?? []).map((suc) => ({
            ...suc,
            padre: suc.padre ?? orgNameById.get(Number(suc.id_padre)),
          }))

      const mergedEmpresas = [...mappedOrgs, ...mappedSucursales]
      const empresaNombreById = new Map<number, string>(
        mergedEmpresas.map((empresa) => [Number(empresa.id_empresa_sucursal), String(empresa.nombre || "")]),
      )

      const mappedInstalaciones: InstalacionCompleta[] = instalacionesRes.map((inst: any) => ({
        id_instalacion: inst.id_instalacion,
        id_empresa_sucursal: 10000 + Number(inst.id_organizacion_sucursal || inst.id_empresa_sucursal || inst.id_sucursal || 0),
        nombre_instalacion: inst.nombre_instalacion,
        codigo_instalacion: inst.codigo_instalacion || inst.codigo || undefined,
        fecha_instalacion: inst.fecha_instalacion,
        estado_operativo: inst.estado_operativo === "activo" ? "activo" : "inactivo",
        descripcion: inst.descripcion,
        tipo_uso: inst.tipo_uso,
        ubicacion: inst.ubicacion || undefined,
        latitud: inst.latitud != null ? Number(inst.latitud) : null,
        longitud: inst.longitud != null ? Number(inst.longitud) : null,
        capacidad_maxima: inst.capacidad_maxima != null ? Number(inst.capacidad_maxima) : null,
        capacidad_actual: inst.capacidad_actual != null ? Number(inst.capacidad_actual) : null,
        volumen_agua_m3: inst.volumen_agua_m3 != null ? Number(inst.volumen_agua_m3) : null,
        profundidad_m: inst.profundidad_m != null ? Number(inst.profundidad_m) : null,
        fecha_ultima_inspeccion: inst.fecha_ultima_inspeccion || null,
        responsable_operativo: inst.responsable_operativo || null,
        contacto_emergencia: inst.contacto_emergencia || null,
        id_proceso: inst.id_proceso,
        nombre_empresa:
          inst.nombre_organizacion ||
          empresaNombreById.get(Number(inst.id_organizacion || 0)) ||
          inst.nombre_empresa ||
          inst.sucursal_nombre ||
          empresaNombreById.get(10000 + Number(inst.id_organizacion_sucursal || inst.id_empresa_sucursal || inst.id_sucursal || 0))
      }))

      const mappedEspecies: Especie[] = especiesRes.map((e: any) => ({
        id_especie: e.id_especie,
        nombre: e.nombre ?? e.nombre_comun ?? `Especie ${e.id_especie}`,
        nombre_comun: e.nombre_comun ?? e.nombre ?? undefined,
        nombre_cientifico: e.nombre_cientifico ?? undefined,
        descripcion: e.descripcion ?? undefined,
      }))
      const especieNombreById = new Map<number, string>(
        mappedEspecies.map((e) => [Number(e.id_especie), String(e.nombre || "")]),
      )
      const now = Date.now()
      const mappedProcesos: ProcesoDetallado[] = procesosRes.map((p: any) => {
        const fechaInicio = new Date(p.fecha_inicio).getTime()
        const fechaFinalRaw = p.fecha_fin_esperada || p.fecha_final || p.fecha_fin_real || p.updated_at || p.fecha_inicio
        const fechaFinal = new Date(fechaFinalRaw)
        const diasTranscurridos = Number.isFinite(fechaInicio)
          ? Math.max(0, Math.floor((now - fechaInicio) / (1000 * 3600 * 24)))
          : 0
        return {
          id_proceso: p.id_proceso,
          id_especie: p.id_especie,
          id_instalacion: p.id_instalacion || 0,
          fecha_inicio: p.fecha_inicio || new Date(now).toISOString(),
          fecha_final: fechaFinalRaw,
          nombre_proceso: p.nombre_proceso || p.nombre,
          descripcion: p.descripcion,
          nombre_especie: especieNombreById.get(Number(p.id_especie)),
          estado_proceso: p.estado || (fechaFinal.getTime() > now ? "activo" : "finalizado"),
          dias_transcurridos: diasTranscurridos,
        }
      })

      const mappedAlerts: Alerta[] = alertasRes
        .map((a: any) => mapAlertaFromApi(a))
        .filter((a): a is Alerta => Boolean(a))

      const toUserRole = (u: any) => {
        const rawRole = String(u.role || u.tipo_rol?.nombre || "").toLowerCase()
        if (rawRole.includes("superadmin")) return "superadmin" as const
        if (rawRole.includes("admin")) return "admin" as const
        return "standard" as const
      }

      const mappedUsers = usuariosRes.map((u: any) => ({
        role: toUserRole(u),
        id: Number(u.id_usuario),
        name: u.nombre_completo,
        email: u.correo,
        status: (() => {
          const rawStatus = String(u.status || u.estado || "").toLowerCase()
          if (rawStatus === "active" || rawStatus === "activo") return "active" as const
          if (rawStatus === "suspended" || rawStatus === "suspendido") return "suspended" as const
          return "inactive" as const
        })(),
        branchAccess: Array.isArray(u.branchAccess) ? u.branchAccess : [],
        facilityAccess: Array.isArray(u.facilityAccess) ? u.facilityAccess : [],
      }))

      setEmpresasSucursales(mergedEmpresas)
      setInstalaciones(mappedInstalaciones)
      setEspecies(mappedEspecies)
      setProcesos(mappedProcesos)
      setAlerts(mappedAlerts)
      setUsers(mappedUsers)

      // Catálogos de sensores globales no se usan en AppContext por ahora.
      // Evitamos dos requests pesadas en cada carga global.
      setCatalogoSensores([])
      setSensoresInstalados([])

      // Calculate Stats
      const nextStats = {
        total_empresas: mappedOrgs.length,
        total_sucursales: mappedSucursales.length,
        total_instalaciones: mappedInstalaciones.length,
        instalaciones_activas: mappedInstalaciones.filter(i => i.estado_operativo === "activo").length,
        total_especies: especiesRes.length,
        procesos_activos: procesosRes.length, // Filter by active if needed
        alertas_activas: alertasRes.length,
        sensores_instalados: 0,
        lecturas_hoy: 0 // TODO: Fetch from readings endpoint if available
      }
      setStats(nextStats)

      persistCache({
        empresasSucursales: mergedEmpresas,
        instalaciones: mappedInstalaciones,
        especies: mappedEspecies,
        procesos: mappedProcesos,
        alerts: mappedAlerts,
        users: mappedUsers as User[],
        catalogoSensores: [],
        sensoresInstalados: [],
        stats: nextStats,
      })
      hasLoadedOnceRef.current = true
      lastFetchedAtRef.current = Date.now()

    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Error al cargar datos")
      if (err?.status !== 401) {
        toast({
          title: "Error",
          description: "Error al cargar datos del sistema",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [persistCache, user?.role])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return

    const wsUrl = buildNotificationsWsUrl()
    if (!wsUrl) return

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) return
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, ALERTS_WS_RECONNECT_MS)
    }

    const emitLiveToast = (key: string, payload: { title: string; description: string; variant?: "default" | "destructive" }) => {
      if (!shouldEmitLiveToast(liveToastCacheRef.current, key)) return
      toast(payload)
    }

    const connect = () => {
      if (disposed) return

      try {
        socket = new WebSocket(wsUrl)
      } catch {
        scheduleReconnect()
        return
      }

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          if (!parsed?.type) return

          if (parsed.type === "alerta.deleted") {
            const deletedId = Number(parsed?.data?.id_alertas ?? parsed?.data?.id_alerta)
            if (!Number.isFinite(deletedId) || deletedId <= 0) return

            setAlerts((prev) => prev.filter((item) => Number(item.id_alertas) !== deletedId))
            emitLiveToast(`alerta.deleted:${deletedId}`, {
              title: "Notificación eliminada",
              description: `La alerta #${deletedId} fue eliminada del sistema.`,
            })
            return
          }

          if (parsed.type === "alertas.deleted.bulk") {
            const ids = Array.isArray(parsed?.data?.ids)
              ? parsed.data.ids.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
              : []
            if (ids.length === 0) return
            const idsSet = new Set(ids)
            setAlerts((prev) => prev.filter((item) => !idsSet.has(Number(item.id_alertas))))
            emitLiveToast(`alertas.deleted.bulk:${ids.join(",")}`, {
              title: "Notificaciones eliminadas",
              description: `Se eliminaron ${ids.length} notificación(es) en bloque.`,
            })
            return
          }

          if (parsed.type === "alertas.read-all") {
            const ids = Array.isArray(parsed?.data?.ids)
              ? parsed.data.ids.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
              : []
            if (ids.length === 0) return
            const idsSet = new Set(ids)
            const read = Boolean(parsed?.data?.read)
            const fechaLectura = read ? (parsed?.data?.fecha_lectura || new Date().toISOString()) : null
            setAlerts((prev) =>
              prev.map((item) =>
                idsSet.has(Number(item.id_alertas))
                  ? { ...item, read, leida: read, fecha_lectura: fechaLectura }
                  : item,
              ),
            )
            emitLiveToast(`alertas.read-all:${ids.join(",")}:${read ? "1" : "0"}`, {
              title: read ? "Notificaciones leídas" : "Notificaciones actualizadas",
              description: `${ids.length} notificación(es) cambiaron su estado.`,
            })
            return
          }

          if (parsed.type !== "alerta.created" && parsed.type !== "alerta.updated") return

          const mappedAlert = mapAlertaFromApi(parsed.data)
          if (!mappedAlert) return

          setAlerts((prev) => upsertAlertById(prev, mappedAlert))
          emitLiveToast(`${parsed.type}:${mappedAlert.id_alertas}`, {
            title: parsed.type === "alerta.created" ? "Nueva notificación" : "Notificación actualizada",
            description:
              mappedAlert.descripcion ||
              mappedAlert.title ||
              `Alerta #${mappedAlert.id_alertas} actualizada desde monitoreo en vivo.`,
            variant: parsed.type === "alerta.created" ? "destructive" : "default",
          })
        } catch {
          // Ignore malformed WS payloads
        }
      }

      socket.onclose = () => {
        socket = null
        if (!disposed) scheduleReconnect()
      }

      socket.onerror = () => {
        try {
          socket?.close()
        } catch {
          // no-op
        }
      }
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close()
      }
    }
  }, [isAuthenticated, isAuthLoading])

  // Initial load
  useEffect(() => {
    if (isAuthLoading) return

    if (isAuthenticated) {
      let hydrated = false
      if (!hasHydratedCacheRef.current) {
        hydrated = hydrateFromCache()
        hasHydratedCacheRef.current = true
      }
      refreshData({ silent: hydrated })
    } else {
      setEmpresasSucursales([])
      setInstalaciones([])
      setEspecies([])
      setProcesos([])
      setAlerts([])
      setUsers([])
      setCatalogoSensores([])
      setSensoresInstalados([])
      setIsLoading(false)
      hasLoadedOnceRef.current = false
      hasHydratedCacheRef.current = false
      lastFetchedAtRef.current = 0
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(APP_CONTEXT_CACHE_KEY)
      }
    }
  }, [hydrateFromCache, isAuthenticated, isAuthLoading, refreshData])

  return (
    <AppContext.Provider value={{
      empresasSucursales,
      instalaciones,
      especies,
      procesos,
      alerts,
      users,
      stats,
      catalogoSensores,
      sensoresInstalados,
      isLoading,
      error,
      refreshData,
      selectedEmpresa,
      setSelectedEmpresa
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}
