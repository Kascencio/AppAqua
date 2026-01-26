"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
import { toast } from "sonner"

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
  refreshData: () => Promise<void>
  setSelectedEmpresa: (empresaId: number | null) => void
  selectedEmpresa: number | null
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
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

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [
        orgsRes, 
        sucursalesRes, 
        instalacionesRes, 
        especiesRes, 
        procesosRes, 
        alertasRes, 
        usuariosRes,
        sensoresCatRes,
        sensoresInstRes
      ] = await Promise.all([
        api.get<any[]>('/organizaciones').catch(() => []),
        api.get<any[]>('/sucursales').catch(() => []),
        api.get<any[]>('/instalaciones').catch(() => []),
        api.get<any[]>('/catalogo-especies').catch(() => []),
        api.get<any[]>('/procesos').catch(() => []),
        api.get<any[]>('/alertas').catch(() => []),
        api.get<any[]>('/usuarios').catch(() => []),
        api.get<any[]>('/catalogo-sensores').catch(() => []),
        api.get<any[]>('/sensores-instalados').catch(() => [])
      ])

      // Map Organizations and Branches to EmpresaSucursalCompleta
      // Strategy: Use ID offset for branches to avoid collision if necessary, 
      // but ideally we should have unique IDs. 
      // Since we are mapping to a legacy type, we'll try to keep it simple.
      
      const mappedOrgs: EmpresaSucursalCompleta[] = orgsRes.map((org: any) => ({
        id_empresa_sucursal: org.id_organizacion,
        nombre: org.nombre,
        tipo: "empresa",
        estado_operativo: org.estado === "activa" ? "activa" : "inactiva",
        fecha_registro: org.fecha_creacion,
        id_estado: org.id_estado || 0,
        id_cp: 0, // Placeholder
        id_colonia: 0, // Placeholder
        calle: org.direccion || "",
        telefono: org.telefono,
        email: org.correo
      }))

      const mappedSucursales: EmpresaSucursalCompleta[] = sucursalesRes.map((suc: any) => ({
        id_empresa_sucursal: 10000 + suc.id_organizacion_sucursal, // Offset to avoid collision
        id_padre: suc.id_organizacion,
        nombre: suc.nombre_sucursal,
        tipo: "sucursal",
        estado_operativo: suc.estado === "activa" ? "activa" : "inactiva",
        fecha_registro: suc.fecha_creacion,
        id_estado: suc.id_estado || 0,
        id_cp: 0,
        id_colonia: 0,
        calle: suc.direccion_sucursal || "",
        telefono: suc.telefono_sucursal,
        email: suc.correo_sucursal,
        padre: mappedOrgs.find(o => o.id_empresa_sucursal === suc.id_organizacion)?.nombre
      }))

      setEmpresasSucursales([...mappedOrgs, ...mappedSucursales])

      // Map Instalaciones
      const mappedInstalaciones: InstalacionCompleta[] = instalacionesRes.map((inst: any) => ({
        id_instalacion: inst.id_instalacion,
        id_empresa_sucursal: inst.id_empresa_sucursal || inst.id_organizacion_sucursal || 0, // Handle potential field name mismatch
        nombre_instalacion: inst.nombre_instalacion,
        fecha_instalacion: inst.fecha_instalacion,
        estado_operativo: inst.estado_operativo === "activo" ? "activo" : "inactivo",
        descripcion: inst.descripcion,
        tipo_uso: inst.tipo_uso,
        id_proceso: inst.id_proceso,
        // Helper fields
        nombre_empresa: [...mappedOrgs, ...mappedSucursales].find(e => e.id_empresa_sucursal === (inst.id_empresa_sucursal || inst.id_organizacion_sucursal))?.nombre
      }))
      setInstalaciones(mappedInstalaciones)

      // Map Especies
      setEspecies(especiesRes.map((e: any) => ({
        id_especie: e.id_especie,
        nombre: e.nombre
      })))

      // Map Procesos
      setProcesos(procesosRes.map((p: any) => ({
        id_proceso: p.id_proceso,
        id_especie: p.id_especie,
        id_instalacion: p.id_instalacion || 0,
        fecha_inicio: p.fecha_inicio,
        fecha_final: p.fecha_final,
        // Add extra fields if ProcesoDetallado requires them
        nombre_especie: especiesRes.find((e: any) => e.id_especie === p.id_especie)?.nombre,
        estado_proceso: new Date(p.fecha_final) > new Date() ? "activo" : "finalizado",
        dias_transcurridos: Math.floor((new Date().getTime() - new Date(p.fecha_inicio).getTime()) / (1000 * 3600 * 24))
      })))

      // Map Alertas
      setAlerts(alertasRes.map((a: any) => ({
        id_alertas: a.id_alertas,
        id_instalacion: a.id_instalacion,
        id_sensor_instalado: a.id_sensor_instalado,
        descripcion: a.descripcion,
        dato_puntual: a.dato_puntual,
        // Extra fields for UI
        fecha: new Date().toISOString(), // Backend might not send date for alerts table?
        tipo_alerta: "critica", // Default
        estado_alerta: "activa"
      })))

      // Map Users
      setUsers(usuariosRes.map((u: any) => ({
        id: Number(u.id_usuario),
        name: u.nombre_completo,
        email: u.correo,
        role: u.id_rol === 1 ? "admin" : "standard",
        status: u.estado === "activo" ? "active" : "inactive",
        branchAccess: []
      })))

      // Map Sensores
      setCatalogoSensores(sensoresCatRes)
      setSensoresInstalados(sensoresInstRes)

      // Calculate Stats
      setStats({
        total_empresas: mappedOrgs.length,
        total_sucursales: mappedSucursales.length,
        total_instalaciones: mappedInstalaciones.length,
        instalaciones_activas: mappedInstalaciones.filter(i => i.estado_operativo === "activo").length,
        total_especies: especiesRes.length,
        procesos_activos: procesosRes.length, // Filter by active if needed
        alertas_activas: alertasRes.length,
        sensores_instalados: sensoresInstRes.length,
        lecturas_hoy: 0 // TODO: Fetch from readings endpoint if available
      })

    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Error al cargar datos")
      toast.error("Error al cargar datos del sistema")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      refreshData()
    } else {
      setIsLoading(false)
    }
  }, [refreshData])

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
