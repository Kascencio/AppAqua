# 🚀 Roadmap de Implementación - Backend Integration

## 📅 Semana 1: WebSocket y APIs Críticas

### Día 1-2: WebSocket Manager (8-12 horas)

#### ✅ Tarea 1: Crear WebSocket Manager
**Archivo**: `/lib/websocket-manager.ts`

```typescript
// Estructura propuesta
class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()
  
  /**
   * Obtener o crear conexión para una instalación
   * Múltiples componentes pueden escuchar la misma conexión
   */
  getOrCreateConnection(instalacionId: number): WebSocketConnection {
    const key = `instalacion-${instalacionId}`
    
    if (!this.connections.has(key)) {
      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}?instalacionId=${instalacionId}`
      )
      
      const connection = {
        socket: ws,
        instalacionId,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectDelay: 3000
      }
      
      this.setupEventHandlers(connection, key)
      this.connections.set(key, connection)
    }
    
    return this.connections.get(key)!
  }
  
  /**
   * Suscribirse a eventos de lecturas de una instalación
   */
  subscribe(instalacionId: number, callback: (data: any) => void) {
    const key = `instalacion-${instalacionId}`
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    
    this.subscribers.get(key)!.add(callback)
    
    // Asegurar que la conexión existe
    this.getOrCreateConnection(instalacionId)
    
    // Devolver función de cleanup
    return () => {
      this.subscribers.get(key)?.delete(callback)
    }
  }
  
  private setupEventHandlers(connection: WebSocketConnection, key: string) {
    const { socket, instalacionId } = connection
    
    socket.onopen = () => {
      console.log(`[WS] Conectado a instalación ${instalacionId}`)
      connection.reconnectAttempts = 0
    }
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        // Formato del backend: { type: 'lectura.created', data: {...} }
        if (message.type === 'lectura.created') {
          // Notificar a todos los suscriptores
          this.subscribers.get(key)?.forEach(callback => {
            callback(message.data)
          })
        }
      } catch (error) {
        console.error('[WS] Error parsing message:', error)
      }
    }
    
    socket.onerror = (error) => {
      console.error(`[WS] Error en instalación ${instalacionId}:`, error)
    }
    
    socket.onclose = () => {
      console.log(`[WS] Desconectado de instalación ${instalacionId}`)
      this.connections.delete(key)
      
      // Intentar reconectar con backoff exponencial
      if (connection.reconnectAttempts < connection.maxReconnectAttempts) {
        const delay = connection.reconnectDelay * Math.pow(2, connection.reconnectAttempts)
        connection.reconnectAttempts++
        
        console.log(`[WS] Reconectando en ${delay}ms...`)
        setTimeout(() => {
          this.getOrCreateConnection(instalacionId)
        }, delay)
      }
    }
  }
}

// Singleton global
export const wsManager = new WebSocketManager()
```

**Validación**:
- [ ] Manager creado y exportado
- [ ] Funciona con múltiples instalaciones simultáneas
- [ ] Reconexión automática funciona
- [ ] Múltiples componentes pueden suscribirse a la misma instalación

---

#### ✅ Tarea 2: Actualizar Hook useWebSocket
**Archivo**: `/hooks/use-websocket.ts`

**Cambios Clave**:
1. Eliminar lógica de suscripción dinámica
2. Usar `wsManager.subscribe(instalacionId, callback)`
3. Parsear eventos `lectura.created` del backend
4. Mapear campos del backend al formato esperado

```typescript
export function useWebSocket(options: {
  instalacionId?: number
  sensorId?: number
  onMessage?: (data: any) => void
  enabled?: boolean
}) {
  const { instalacionId, sensorId, onMessage, enabled = true } = options
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  
  useEffect(() => {
    if (!enabled || !instalacionId) return
    
    // Suscribirse usando el manager global
    const unsubscribe = wsManager.subscribe(instalacionId, (data) => {
      // Formato del backend:
      // {
      //   id_lectura: 123,
      //   sensor_instalado_id: 1,
      //   instalacion_id: 5,
      //   tipo_medida: "temperatura",
      //   tomada_en: "2024-01-01T10:00:00Z",
      //   valor: 25.5
      // }
      
      // Filtrar por sensor específico si se proporciona
      if (sensorId && data.sensor_instalado_id !== sensorId) {
        return
      }
      
      // Mapear al formato esperado por los componentes
      const mappedData = {
        type: 'reading_update',
        sensorId: data.sensor_instalado_id,
        value: data.valor,
        timestamp: data.tomada_en,
        parameter: data.tipo_medida,
        status: 'normal' // TODO: determinar status basado en umbrales
      }
      
      setLastMessage(mappedData)
      onMessage?.(mappedData)
    })
    
    setIsConnected(true)
    
    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [instalacionId, sensorId, enabled, onMessage])
  
  return { isConnected, lastMessage }
}
```

**Validación**:
- [ ] Hook actualizado y compila
- [ ] Parsing de eventos funciona correctamente
- [ ] Filtrado por sensor funciona
- [ ] Cleanup funciona al desmontar componente

---

### Día 3: Componentes de Sensores (6-8 horas)

#### ✅ Tarea 3: Actualizar sensor-monitoring-card.tsx

**Cambios**:
```typescript
// Antes (incorrecto):
const { isConnected, lastMessage } = useWebSocket({
  sensorId: sensorId,
  enabled: realTime
})

// Después (correcto):
const { isConnected, lastMessage } = useWebSocket({
  instalacionId: sensor.instalacionId, // Pasar instalación, no sensor
  sensorId: sensorId, // Filtrar por sensor específico
  enabled: realTime,
  onMessage: (message) => {
    if (message.sensorId === String(sensorId)) {
      // Actualizar solo esta card
      setRealtimeData({
        value: message.value,
        timestamp: message.timestamp,
        status: message.status
      })
    }
  }
})
```

**Optimizaciones**:
- Usar `React.memo` para evitar rerenders innecesarios
- Usar `useMemo` para cálculos pesados
- Validar que solo la card se actualiza (usar React DevTools)

**Validación**:
- [ ] Card se actualiza en tiempo real
- [ ] Solo la card afectada se renderiza (no toda la página)
- [ ] Timestamp se muestra correctamente
- [ ] Gráfico se actualiza suavemente

---

#### ✅ Tarea 4: Optimizar app/sensors/page.tsx

**Problema Actual**: Si hay 50 sensores en la página, se crearían 50 conexiones WebSocket.

**Solución**: Context Provider que agrupa sensores por instalación.

```typescript
// /contexts/sensor-websocket-context.tsx
const SensorWebSocketContext = createContext<{
  subscribeToSensor: (sensorId: number, instalacionId: number, callback: (data: any) => void) => () => void
}>({
  subscribeToSensor: () => () => {}
})

export function SensorWebSocketProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Map<number, Set<{sensorId: number, callback: (data: any) => void}>>>(new Map())
  
  // Agrupar sensores por instalación
  const subscribeToSensor = useCallback((sensorId: number, instalacionId: number, callback: (data: any) => void) => {
    // Crear suscripción al WebSocket de la instalación si no existe
    if (!subscriptions.has(instalacionId)) {
      const unsubscribe = wsManager.subscribe(instalacionId, (data) => {
        // Distribuir evento a todos los sensores de esta instalación
        subscriptions.get(instalacionId)?.forEach(({ sensorId: subSensorId, callback: subCallback }) => {
          if (data.sensor_instalado_id === subSensorId) {
            subCallback(data)
          }
        })
      })
      
      // Guardar cleanup
      subscriptions.set(instalacionId, new Set())
    }
    
    // Añadir callback del sensor
    subscriptions.get(instalacionId)?.add({ sensorId, callback })
    
    // Devolver función de cleanup
    return () => {
      subscriptions.get(instalacionId)?.delete({ sensorId, callback })
    }
  }, [subscriptions])
  
  return (
    <SensorWebSocketContext.Provider value={{ subscribeToSensor }}>
      {children}
    </SensorWebSocketContext.Provider>
  )
}

// Hook para usar en components
export function useSensorWebSocket(sensorId: number, instalacionId: number) {
  const { subscribeToSensor } = useContext(SensorWebSocketContext)
  const [lastReading, setLastReading] = useState(null)
  
  useEffect(() => {
    const unsubscribe = subscribeToSensor(sensorId, instalacionId, (data) => {
      setLastReading(data)
    })
    return unsubscribe
  }, [sensorId, instalacionId, subscribeToSensor])
  
  return { lastReading }
}
```

**Usar en page.tsx**:
```typescript
export default function SensorsPage() {
  return (
    <SensorWebSocketProvider>
      {/* Render de sensores aquí */}
      <HierarchicalOrganization
        organizedData={organizedSensors}
        viewMode={viewMode}
        // ...
      />
    </SensorWebSocketProvider>
  )
}
```

**Validación**:
- [ ] Con 50 sensores en 5 instalaciones → máximo 5 conexiones WS
- [ ] Performance mejorado (medir con React DevTools Profiler)
- [ ] No hay memory leaks (usar Chrome Memory Profiler)

---

### Día 4-5: API Client y Migración de Hooks (8-10 horas)

#### ✅ Tarea 5: Cliente API Centralizado
**Archivo**: `/lib/backend-client.ts`

```typescript
class BackendApiClient {
  private baseURL: string
  private token: string | null = null
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'http://localhost:3300'
  }
  
  setToken(token: string) {
    this.token = token
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    // Inyectar token JWT si existe
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      console.error(`[API] Error en ${endpoint}:`, error)
      throw error
    }
  }
  
  // Organizaciones
  async getOrganizaciones() {
    return this.request('/api/organizaciones')
  }
  
  async getOrganizacion(id: number) {
    return this.request(`/api/organizaciones/${id}`)
  }
  
  async createOrganizacion(data: any) {
    return this.request('/api/organizaciones', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async updateOrganizacion(id: number, data: any) {
    return this.request(`/api/organizaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
  
  async deleteOrganizacion(id: number) {
    return this.request(`/api/organizaciones/${id}`, {
      method: 'DELETE'
    })
  }
  
  // Sensores Instalados
  async getSensoresInstalados() {
    return this.request('/api/sensores-instalados')
  }
  
  async getSensorInstalado(id: number) {
    return this.request(`/api/sensores-instalados/${id}`)
  }
  
  async createSensorInstalado(data: any) {
    return this.request('/api/sensores-instalados', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // Lecturas
  async getLecturas(params: {
    sensorInstaladoId?: number
    instalacionId?: number
    from?: string
    to?: string
    limit?: number
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
    ).toString()
    
    return this.request(`/api/lecturas?${queryString}`)
  }
  
  // Promedios
  async getPromedios(params: {
    granularity: '15min' | 'hour'
    sensorInstaladoId: number
    from?: string
    to?: string
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params) as [string, string][]
    ).toString()
    
    return this.request(`/api/promedios?${queryString}`)
  }
  
  // Resumen Horario
  async getResumenHorario(params: {
    sensorInstaladoId: number
    from?: string
    to?: string
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
    ).toString()
    
    return this.request(`/api/resumen-horario?${queryString}`)
  }
  
  // ... Implementar resto de endpoints según API_DOCUMENTATION.md
}

export const backendClient = new BackendApiClient()
```

**Validación**:
- [ ] Cliente creado y exportado
- [ ] Interceptor de JWT funciona
- [ ] Manejo de errores correcto
- [ ] Todos los endpoints principales implementados

---

#### ✅ Tareas 6-8: Migrar Hooks

**use-organizaciones.ts** (NUEVO):
```typescript
export function useOrganizaciones() {
  const [organizaciones, setOrganizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const fetchOrganizaciones = useCallback(async () => {
    try {
      setLoading(true)
      const data = await backendClient.getOrganizaciones()
      setOrganizaciones(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])
  
  const createOrganizacion = useCallback(async (data) => {
    const newOrg = await backendClient.createOrganizacion(data)
    setOrganizaciones(prev => [...prev, newOrg])
    return newOrg
  }, [])
  
  useEffect(() => {
    fetchOrganizaciones()
  }, [fetchOrganizaciones])
  
  return {
    organizaciones,
    loading,
    error,
    createOrganizacion,
    updateOrganizacion: async (id, data) => { /* ... */ },
    deleteOrganizacion: async (id) => { /* ... */ }
  }
}
```

**use-sensors.ts** (MIGRAR):
- Cambiar `/api/catalogo-sensores` para tipos de sensores
- Cambiar `/api/sensores-instalados` para sensores en uso
- Adaptar estructura de respuesta

**use-species.ts** (MIGRAR):
- Cambiar a `/api/catalogo-especies`

**Validación**:
- [ ] Todos los hooks migrados
- [ ] Tests unitarios pasan
- [ ] Componentes siguen funcionando

---

## 📅 Semana 2: CRUD y Funcionalidades

### Día 6-7: CRUD Organizaciones (8 horas)

#### Archivos a Crear:
- `/app/organizaciones/page.tsx`
- `/components/add-organizacion-dialog.tsx`
- `/components/edit-organizacion-dialog.tsx`

**Diseño**: Copiar estructura de `/app/empresas/` pero adaptado al modelo `organizacion`.

**Campos del Formulario**:
- Nombre (requerido)
- Razón Social
- RFC
- Correo
- Teléfono
- Descripción
- Estado (select de estados de la BD)
- Municipio (select dependiente de estado)
- Estado de la Organización (activa/inactiva)

**Validación**:
- [ ] CRUD completo funciona
- [ ] Validaciones de formulario correctas
- [ ] Diseño consistente con el resto de la app

---

### Día 8: Actualizar Sucursales (4 horas)

**Cambios en**:
- `/app/sucursales/page.tsx`
- `/components/add-branch-dialog.tsx`
- `/components/edit-branch-dialog.tsx`

**Específicamente**:
- Cambiar `id_empresa` → `id_organizacion`
- Select de organizaciones (no empresas)
- Validar foreign keys

---

### Día 9-10: Funcionalidades MEDIO (8 horas)

#### Promedios y Resumen
- Crear `/hooks/use-promedios.ts`
- Crear `/hooks/use-resumen-horario.ts`
- Crear `/components/promedios-chart.tsx`
- Integrar en dashboard

#### Alertas
- Crear `/app/alertas/page.tsx`
- Filtros avanzados
- Notificaciones toast

#### Reportes
- Crear `/app/reportes/page.tsx`
- Descarga de XML

**Validación**:
- [ ] Todas las funcionalidades MEDIO implementadas
- [ ] Tests manuales pasan
- [ ] Performance aceptable

---

## 📅 Semana 3: Optimizaciones y Testing

### Día 11-12: React Query y Caché (6 horas)

```typescript
// /lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

// Invalidación al recibir WebSocket
wsManager.subscribe(instalacionId, (data) => {
  // Invalidar queries relacionadas
  queryClient.invalidateQueries(['lecturas', data.sensor_instalado_id])
  queryClient.invalidateQueries(['instalacion', data.instalacion_id])
})
```

**Migrar hooks a React Query**:
```typescript
export function useOrganizaciones() {
  return useQuery({
    queryKey: ['organizaciones'],
    queryFn: () => backendClient.getOrganizaciones()
  })
}

export function useCreateOrganizacion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => backendClient.createOrganizacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizaciones'])
    }
  })
}
```

---

### Día 13: UX Improvements (4 horas)

- Skeleton loaders
- Error boundaries
- Página 404 personalizada

---

### Día 14-15: Testing y Ajustes (8 horas)

- Tests unitarios de hooks críticos
- Tests de integración de WebSocket
- Tests E2E con Playwright
- Ajustes de bugs encontrados

---

## ✅ Checklist de Validación Final

### WebSocket
- [ ] Latencia < 500ms
- [ ] Solo cards se actualizan
- [ ] Reconexión automática funciona
- [ ] 50 sensores = máx 10 conexiones

### API
- [ ] Todos los endpoints funcionan
- [ ] Tiempo de respuesta < 200ms
- [ ] Manejo de errores correcto

### UX
- [ ] Diseño preservado 100%
- [ ] Lighthouse Score > 85
- [ ] FCP < 1.5s

### Funcionalidades
- [ ] Organizaciones CRUD completo
- [ ] Sucursales actualizadas
- [ ] Sensores en tiempo real
- [ ] Alertas funcionando
- [ ] Reportes generándose

---

## 📊 Métricas de Progreso

| Fase | Tareas | Completadas | Progreso |
|------|--------|-------------|----------|
| WebSocket | 4 | 0 | ░░░░░░░░░░ 0% |
| API Client | 6 | 0 | ░░░░░░░░░░ 0% |
| CRUD | 5 | 0 | ░░░░░░░░░░ 0% |
| Funcionalidades | 5 | 0 | ░░░░░░░░░░ 0% |
| Optimizaciones | 5 | 0 | ░░░░░░░░░░ 0% |
| **TOTAL** | **20** | **0** | **░░░░░░░░░░ 0%** |

---

## 🎯 Próximos Pasos Inmediatos

1. **HOY**: Revisar documentación generada
2. **MAÑANA**: Empezar Tarea 1 (WebSocket Manager)
3. **Esta Semana**: Completar Fase 1 (CRÍTICO)

