"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type {
  EmpresaSucursalCompleta,
  InstalacionCompleta,
  EspecieDetallada,
  ProcesoDetallado,
  User,
  Alerta,
  DashboardStats,
} from "@/types"
import { getEmpresasCompletas, getInstalacionesCompletas, getDashboardStats } from "@/lib/mock-data"
import { useEspecies } from "@/hooks/use-especies"
import { useProcesses } from "@/hooks/use-processes"

// ============================================================================
// CONTEXTO PRINCIPAL DE LA APLICACIÓN - LISTO PARA MIGRACIÓN
// ============================================================================
// TODO: Este contexto ya está alineado a las interfaces oficiales.
// Cambiar a fetch real al pasar a producción.
// ============================================================================

interface AppContextType {
  // Datos principales
  empresasSucursales: EmpresaSucursalCompleta[]
  instalaciones: InstalacionCompleta[]
  especies: EspecieDetallada[]
  procesos: ProcesoDetallado[]
  alerts: Alerta[]
  users: User[]
  stats: DashboardStats

  // Estados
  isLoading: boolean
  error: string | null

  // Funciones
  refreshData: () => Promise<void>
  setSelectedEmpresa: (empresaId: number | null) => void
  selectedEmpresa: number | null
}

const AppContext = createContext<any>(null)

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Implementar aquí la lógica real de estado global si se requiere
  // Por ahora, solo un placeholder limpio
  const [loading, setLoading] = useState(false)

  // Proveer todos los campos esperados por el dashboard
  const contextValue = {
    empresasSucursales: [],
    instalaciones: [],
    especies: [],
    procesos: [],
    alerts: [],
    users: [],
    isLoading: loading,
    // Puedes agregar los métodos si los necesitas
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}

// ============================================================================
// MIGRACIÓN A PRODUCCIÓN - GUÍA RÁPIDA
// ============================================================================
/*
PASOS PARA MIGRAR A APIs REALES:

1. Crear endpoints en /api/:
   - GET /api/empresas
   - GET /api/instalaciones  
   - GET /api/alertas
   - GET /api/usuarios
   - GET /api/stats

2. Reemplazar en refreshData():
   const empresasResponse = await fetch('/api/empresas')
   const empresasData = await empresasResponse.json()
   
3. Manejar errores de red:
   if (!empresasResponse.ok) {
     throw new Error('Error al cargar empresas')
   }

4. Configurar variables de entorno:
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
*/
