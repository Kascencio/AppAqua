/**
 * Backend API Client
 * 
 * Cliente unificado para comunicarse con el backend externo en Fastify.
 * Proporciona métodos tipo-seguros para todos los endpoints REST disponibles.
 */

// En navegador y servidor de Next: usar route handlers locales en /api/*.
// Si se ejecuta en scripts Node fuera de Next, el baseUrl puede apuntar directo al backend externo.
const EXTERNAL_BACKEND_URL =
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL ||
  process.env.EXTERNAL_API_URL ||
  'http://195.35.11.179:3300'

const IS_SERVER = typeof window === 'undefined'
const API_BASE_URL = IS_SERVER ? EXTERNAL_BACKEND_URL : ''
const API_PREFIX = '/api'

// ============================================
// Types & Interfaces
// ============================================

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Organizacion {
  id_organizacion: number
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Empresa {
  id_empresa: number
  id_organizacion: number
  nombre: string
  descripcion?: string
  ruc?: string
  direccion?: string
  telefono?: string
  email?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Sucursal {
  id_sucursal: number
  id_empresa: number
  nombre: string
  direccion_completa?: string
  latitud?: number
  longitud?: number
  direccion_sucursal?: string
  numero_int_ext?: string
  referencia?: string
  id_cp?: number
  id_colonia?: number
  ciudad?: string
  pais?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Instalacion {
  id_instalacion: number
  id_organizacion?: number | null
  id_sucursal?: number
  nombre?: string
  descripcion?: string
  tipo?: string
  capacidad?: number
  codigo_instalacion?: string
  ubicacion?: string
  latitud?: number
  longitud?: number
  capacidad_maxima?: number
  capacidad_actual?: number
  volumen_agua_m3?: number
  profundidad_m?: number
  fecha_ultima_inspeccion?: string
  responsable_operativo?: string
  contacto_emergencia?: string
  activo?: boolean
  created_at?: string
  updated_at?: string
  // Extended properties for UI compatibility
  id_empresa_sucursal?: number
  nombre_instalacion?: string
  sucursal_nombre?: string
  nombre_organizacion?: string | null
  nombre_proceso?: string | null
  nombre_especie?: string | null
  tipo_uso?: string
  [key: string]: unknown
}

export interface SensorInstalado {
  id_sensor_instalado: number
  id_instalacion?: number | null
  tipo_medida: string
  unidad_medida: string
  ubicacion?: string
  activo: boolean
  estado_operativo?: "activo" | "inactivo" | "mantenimiento"
  estado_visual?: "activo" | "inactivo" | "mantenimiento"
  status?: "active" | "inactive" | "maintenance"
  tiene_instalacion?: boolean
  requiere_asignacion_instalacion?: boolean
  instalacion_nombre?: string | null
  ultima_lectura_at?: string | null
  dias_sin_datos?: number | null
  dias_en_mantenimiento?: number | null
  created_at: string
  updated_at: string
}

export interface Lectura {
  id_lectura: number
  // El backend usa id_sensor_instalado (camelCase en query param, snake/camel en payload según versión)
  id_sensor_instalado?: number
  sensor_instalado_id?: number
  instalacion_id?: number
  tipo_medida?: string
  valor: number
  tomada_en?: string
  fecha?: string
  hora?: string
  created_at?: string
}

export interface Promedio {
  id_sensor_instalado: number
  timestamp: string
  promedio: number
  muestras?: number
}

export interface PromediosBatchSensor {
  id_sensor_instalado: number
  bucket_minutes: number
  puntos: Promedio[]
}

export interface PromediosBatchResponse {
  bucket_minutes: number
  total_sensores: number
  sensores: PromediosBatchSensor[]
}

export interface Especie {
  id_especie: number
  // En el backend actual el catálogo suele exponer solo { id_especie, nombre }
  nombre?: string
  nombre_comun?: string
  nombre_cientifico?: string
  descripcion?: string
  temperatura_optima_min?: number
  temperatura_optima_max?: number
  ph_optimo_min?: number
  ph_optimo_max?: number
  oxigeno_optimo_min?: number
  oxigeno_optimo_max?: number
  salinidad_optima_min?: number
  salinidad_optima_max?: number
  activo?: boolean
  estado?: 'activa' | 'inactiva'
  created_at?: string
  updated_at?: string
}

export interface ParametroCatalogo {
  id_parametro: number
  nombre_parametro?: string
  unidad_medida?: string
  nombre?: string
  unidad?: string
  [key: string]: unknown
}

export interface EspecieParametro {
  id_especie_parametro: number
  id_especie: number
  id_parametro: number
  Rmin: number
  Rmax: number
  nombre_parametro?: string
  unidad_medida?: string
  nombre_especie?: string
  [key: string]: unknown
}

export interface CrecimientoOstionMedicion {
  id_crecimiento_ostion_medicion?: number
  lote_numero: number
  valor: number
  unidad: "cm" | "kg"
  observaciones?: string | null
  fecha_creacion?: string
  ultima_modificacion?: string
}

export interface CrecimientoOstionCaptura {
  id_crecimiento_ostion_captura?: number
  numero_captura: number
  fecha_programada: string | null
  fecha_real?: string | null
  estado: "pendiente" | "parcial" | "completada"
  es_extra?: boolean
  observaciones?: string | null
  total_mediciones?: number
  mediciones?: CrecimientoOstionMedicion[]
  fecha_creacion?: string
  ultima_modificacion?: string
}

export interface CrecimientoOstionConfig {
  id_crecimiento_ostion_config?: number
  id_proceso?: number
  capturas_requeridas: number
  lotes_por_captura: number
  calendario_modo?: "automatico" | "manual"
  total_capturas?: number
  capturas_completadas?: number
  capturas?: CrecimientoOstionCaptura[]
  fecha_creacion?: string
  ultima_modificacion?: string
}

export interface Proceso {
  id_proceso: number
  id_instalacion: number
  id_especie?: number
  nombre: string
  nombre_proceso?: string
  descripcion?: string
  objetivos?: string
  fecha_inicio: string
  fecha_fin_esperada?: string
  fecha_fin_real?: string
  porcentaje_avance?: number
  estado: 'planificado' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado'
  created_at: string
  updated_at: string
  crecimiento_ostion?: CrecimientoOstionConfig | null
}

export interface Usuario {
  id_usuario: number
  // Campos reales del backend
  nombre_completo?: string
  correo?: string
  telefono?: string
  estado?: string
  id_rol?: number
  tipo_rol?: { id_rol: number; nombre: string }
  // Campos legacy esperados por algunas UI
  nombre?: string
  email?: string
  rol?: 'admin' | 'gerente' | 'tecnico' | 'viewer'
  id_organizacion?: number
  activo?: boolean
  created_at?: string
  updated_at?: string
}

// ============================================
// Error Handling
// ============================================

export class BackendApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'BackendApiError'
  }
}

// ============================================
// HTTP Client
// ============================================

class HttpClient {
  private baseUrl: string
  private responseCache = new Map<string, { expiresAt: number; data: unknown }>()
  private inflightRequests = new Map<string, Promise<unknown>>()
  private readonly DEFAULT_CACHE_TTL_MS = 15_000
  private readonly SHORT_CACHE_TTL_MS = 5_000

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private cloneData<T>(value: T): T {
    if (typeof structuredClone === 'function') {
      return structuredClone(value)
    }
    return JSON.parse(JSON.stringify(value))
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    const lsToken = window.localStorage?.getItem('token')
    if (lsToken) return lsToken
    const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : null
  }

  private buildCacheKey(method: string, endpoint: string): string {
    return `${method.toUpperCase()}::${this.baseUrl}${endpoint}::${this.getToken() || ''}`
  }

  private getCacheTtl(endpoint: string): number {
    if (
      endpoint.includes('/lecturas') ||
      endpoint.includes('/promedios') ||
      endpoint.includes('/notifications') ||
      endpoint.includes('/alertas')
    ) {
      return this.SHORT_CACHE_TTL_MS
    }
    return this.DEFAULT_CACHE_TTL_MS
  }

  invalidateCache() {
    this.responseCache.clear()
    this.inflightRequests.clear()
  }

  private mapExternalToLocalEndpoint(endpoint: string): string {
    // Compatibilidad con despliegues legacy que aún usan /external-api/*
    if (endpoint === '/external-api/login' || endpoint === '/api/login') return '/api/auth/login'
    if (endpoint === '/external-api/logout' || endpoint === '/api/logout') return '/api/auth/logout'
    if (endpoint === '/external-api/me' || endpoint === '/api/me') return '/api/auth/me'
    if (endpoint === '/external-api/refresh' || endpoint === '/api/refresh') return '/api/auth/refresh'
    if (endpoint === '/external-api/register' || endpoint === '/api/register') return '/api/auth/register'
    if (endpoint.startsWith('/external-api/')) return endpoint.replace('/external-api/', '/api/')

    return endpoint
  }

  private async doFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const token = this.getToken()

    const body = (options as any).body
    const hasBody = body !== undefined && body !== null
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

    const mergedHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as any),
    }

    if (hasBody && !isFormData) {
      const hasContentType = Object.keys(mergedHeaders).some((h) => h.toLowerCase() === 'content-type')
      if (!hasContentType) mergedHeaders['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...mergedHeaders,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new BackendApiError(
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = (options.method || 'GET').toUpperCase()
    const cacheKey = this.buildCacheKey(method, endpoint)

    try {
      if (method === 'GET') {
        const cached = this.responseCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
          return this.cloneData(cached.data as T)
        }

        const inflight = this.inflightRequests.get(cacheKey)
        if (inflight) {
          return this.cloneData((await inflight) as T)
        }
      }

      const requestPromise = this.doFetch<T>(endpoint, options)

      if (method === 'GET') {
        this.inflightRequests.set(cacheKey, requestPromise as Promise<unknown>)
      }

      const data = await requestPromise

      if (method === 'GET') {
        this.responseCache.set(cacheKey, {
          expiresAt: Date.now() + this.getCacheTtl(endpoint),
          data,
        })
      } else {
        this.invalidateCache()
      }

      return this.cloneData(data)
    } catch (error) {
      // Fallback en navegador: si falla un endpoint legacy /external-api, remapear a /api/*
      const isBrowser = typeof window !== 'undefined'
      const canFallback = endpoint.startsWith('/external-api/')
      const isProxyDown =
        error instanceof BackendApiError && (error.statusCode === 502 || error.statusCode === 0)

      if (isBrowser && canFallback && isProxyDown) {
        const localEndpoint = this.mapExternalToLocalEndpoint(endpoint)
        return this.doFetch<T>(localEndpoint, options)
      }

      if (error instanceof BackendApiError) {
        throw error
      }
      
      console.error(`[Backend API] Request failed: ${endpoint}`, error)
      throw new BackendApiError(
        'Network error or server unavailable',
        0,
        error
      )
    } finally {
      if (method === 'GET') {
        this.inflightRequests.delete(cacheKey)
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const searchParams = new URLSearchParams()
    if (params) {
      for (const [key, rawValue] of Object.entries(params)) {
        if (rawValue === undefined || rawValue === null) continue

        if (typeof rawValue === 'string') {
          const trimmed = rawValue.trim()
          if (!trimmed) continue
          searchParams.append(key, trimmed)
          continue
        }

        if (Array.isArray(rawValue)) {
          for (const value of rawValue) {
            if (value === undefined || value === null) continue
            searchParams.append(key, String(value))
          }
          continue
        }

        searchParams.append(key, String(rawValue))
      }
    }

    const serializedQuery = searchParams.toString()
    const queryString = serializedQuery ? `?${serializedQuery}` : ''
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// ============================================
// Backend API Client
// ============================================

export class BackendApiClient {
  private http: HttpClient

  constructor(baseUrl: string = API_BASE_URL) {
    this.http = new HttpClient(baseUrl)
  }

  // ========================================
  // ORGANIZACIONES
  // ========================================

  async getOrganizaciones(params?: { page?: number; limit?: number; activo?: boolean }) {
    return this.http.get<PaginatedResponse<Organizacion>>(`${API_PREFIX}/organizaciones`, params)
  }

  async getOrganizacion(id: number) {
    return this.http.get<ApiResponse<Organizacion>>(`${API_PREFIX}/organizaciones/${id}`)
  }

  async createOrganizacion(data: Omit<Organizacion, 'id_organizacion' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Organizacion>>(`${API_PREFIX}/organizaciones`, data)
  }

  async updateOrganizacion(id: number, data: Partial<Organizacion>) {
    return this.http.put<ApiResponse<Organizacion>>(`${API_PREFIX}/organizaciones/${id}`, data)
  }

  async deleteOrganizacion(id: number) {
    return this.http.delete<ApiResponse<{ id_organizacion: number }>>(`${API_PREFIX}/organizaciones/${id}`)
  }

  // ========================================
  // EMPRESAS
  // ========================================

  async getEmpresas(params?: { page?: number; limit?: number; id_organizacion?: number; activo?: boolean }) {
    return this.http.get<PaginatedResponse<Empresa>>(`${API_PREFIX}/empresas`, params)
  }

  async getEmpresa(id: number) {
    return this.http.get<ApiResponse<Empresa>>(`${API_PREFIX}/empresas/${id}`)
  }

  async createEmpresa(data: Omit<Empresa, 'id_empresa' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Empresa>>(`${API_PREFIX}/empresas`, data)
  }

  async updateEmpresa(id: number, data: Partial<Empresa>) {
    return this.http.put<ApiResponse<Empresa>>(`${API_PREFIX}/empresas/${id}`, data)
  }

  async deleteEmpresa(id: number) {
    return this.http.delete<ApiResponse<{ id_empresa: number }>>(`${API_PREFIX}/empresas/${id}`)
  }

  // ========================================
  // SUCURSALES
  // ========================================

  async getSucursales(params?: { page?: number; limit?: number; id_empresa?: number; activo?: boolean }) {
    return this.http.get<PaginatedResponse<Sucursal>>(`${API_PREFIX}/sucursales`, params)
  }

  async getSucursal(id: number) {
    return this.http.get<ApiResponse<Sucursal>>(`${API_PREFIX}/sucursales/${id}`)
  }

  async createSucursal(data: Omit<Sucursal, 'id_sucursal' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Sucursal>>(`${API_PREFIX}/sucursales`, data)
  }

  async updateSucursal(id: number, data: Partial<Sucursal>) {
    return this.http.put<ApiResponse<Sucursal>>(`${API_PREFIX}/sucursales/${id}`, data)
  }

  async deleteSucursal(id: number) {
    return this.http.delete<ApiResponse<{ id_sucursal: number }>>(`${API_PREFIX}/sucursales/${id}`)
  }

  // ========================================
  // INSTALACIONES
  // ========================================

  async getInstalaciones(params?: { page?: number; limit?: number; id_sucursal?: number; activo?: boolean }) {
    return this.http.get<PaginatedResponse<Instalacion>>(`${API_PREFIX}/instalaciones`, params)
  }

  async getInstalacion(id: number) {
    return this.http.get<ApiResponse<Instalacion>>(`${API_PREFIX}/instalaciones/${id}`)
  }

  async createInstalacion(data: Omit<Instalacion, 'id_instalacion' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Instalacion>>(`${API_PREFIX}/instalaciones`, data)
  }

  async updateInstalacion(id: number, data: Partial<Instalacion>) {
    return this.http.put<ApiResponse<Instalacion>>(`${API_PREFIX}/instalaciones/${id}`, data)
  }

  async deleteInstalacion(id: number) {
    return this.http.delete<ApiResponse<{ id_instalacion: number }>>(`${API_PREFIX}/instalaciones/${id}`)
  }

  // ========================================
  // SENSORES INSTALADOS
  // ========================================

  async getSensoresInstalados(params?: { page?: number; limit?: number; id_instalacion?: number; activo?: boolean }) {
    return this.http.get<PaginatedResponse<SensorInstalado>>(`${API_PREFIX}/sensores-instalados`, params)
  }

  async getSensorInstalado(id: number) {
    return this.http.get<ApiResponse<SensorInstalado>>(`${API_PREFIX}/sensores-instalados/${id}`)
  }

  async createSensorInstalado(data: Omit<SensorInstalado, 'id_sensor_instalado' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<SensorInstalado>>(`${API_PREFIX}/sensores-instalados`, data)
  }

  async updateSensorInstalado(id: number, data: Partial<SensorInstalado>) {
    return this.http.put<ApiResponse<SensorInstalado>>(`${API_PREFIX}/sensores-instalados/${id}`, data)
  }

  async deleteSensorInstalado(id: number) {
    return this.http.delete<ApiResponse<{ id_sensor_instalado: number }>>(`${API_PREFIX}/sensores-instalados/${id}`)
  }

  // ========================================
  // LECTURAS
  // ========================================

  async getLecturas(params: { 
    sensorInstaladoId: number // OBLIGATORIO (en camelCase como espera el backend)
    page?: number
    limit?: number
    instalacionId?: number
    tipoMedida?: string
    desde?: string // ISO date string
    hasta?: string // ISO date string
  }) {
    return this.http.get<PaginatedResponse<Lectura>>(`${API_PREFIX}/lecturas`, params)
  }

  async getPromedios(params: {
    sensorInstaladoId: number
    granularity?: "15min" | "hour"
    bucketMinutes?: number
    desde?: string // ISO date string
    hasta?: string // ISO date string
  }) {
    return this.http.get<Promedio[]>(`${API_PREFIX}/promedios`, params)
  }

  async getPromediosBatch(params: {
    sensorInstaladoIds: number[]
    bucketMinutes: number
    desde?: string
    hasta?: string
  }) {
    return this.http.get<PromediosBatchResponse>(`${API_PREFIX}/promedios-batch`, params)
  }

  async getLectura(id: number) {
    return this.http.get<ApiResponse<Lectura>>(`${API_PREFIX}/lecturas/${id}`)
  }

  async createLectura(data: Omit<Lectura, 'id_lectura' | 'created_at'>) {
    return this.http.post<ApiResponse<Lectura>>(`${API_PREFIX}/lecturas`, data)
  }

  // ========================================
  // ESPECIES (CATÁLOGO)
  // ========================================

  async getEspecies(params?: { page?: number; limit?: number; activo?: boolean }) {
    return this.http.get<PaginatedResponse<Especie>>(`${API_PREFIX}/catalogo-especies`, params)
  }

  async getEspecie(id: number) {
    return this.http.get<ApiResponse<Especie>>(`${API_PREFIX}/catalogo-especies/${id}`)
  }

  async createEspecie(data: Omit<Especie, 'id_especie' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Especie>>(`${API_PREFIX}/catalogo-especies`, data)
  }

  async updateEspecie(id: number, data: Partial<Especie>) {
    return this.http.put<ApiResponse<Especie>>(`${API_PREFIX}/catalogo-especies/${id}`, data)
  }

  async deleteEspecie(id: number) {
    return this.http.delete<ApiResponse<{ id_especie: number }>>(`${API_PREFIX}/catalogo-especies/${id}`)
  }

  // ========================================
  // PARÁMETROS Y ESPECIE-PARÁMETROS
  // ========================================

  async getParametros() {
    return this.http.get<ParametroCatalogo[] | PaginatedResponse<ParametroCatalogo>>(`${API_PREFIX}/parametros`)
  }

  async getEspecieParametros() {
    return this.http.get<EspecieParametro[] | PaginatedResponse<EspecieParametro>>(`${API_PREFIX}/especie-parametros`)
  }

  async createEspecieParametro(
    data: Omit<EspecieParametro, 'id_especie_parametro' | 'nombre_parametro' | 'unidad_medida' | 'nombre_especie'>
  ) {
    return this.http.post<ApiResponse<EspecieParametro>>(`${API_PREFIX}/especie-parametros`, data)
  }

  async deleteEspecieParametro(id: number) {
    return this.http.delete<ApiResponse<{ id_especie_parametro: number }>>(`${API_PREFIX}/especie-parametros/${id}`)
  }

  // ========================================
  // PROCESOS
  // ========================================

  async getProcesos(params?: { 
    page?: number
    limit?: number
    id_instalacion?: number
    id_especie?: number
    estado?: string
  }) {
    return this.http.get<PaginatedResponse<Proceso>>(`${API_PREFIX}/procesos`, params)
  }

  async getProceso(id: number) {
    return this.http.get<ApiResponse<Proceso>>(`${API_PREFIX}/procesos/${id}`)
  }

  async createProceso(data: Omit<Proceso, 'id_proceso' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Proceso>>(`${API_PREFIX}/procesos`, data)
  }

  async updateProceso(id: number, data: Partial<Proceso>) {
    return this.http.put<ApiResponse<Proceso>>(`${API_PREFIX}/procesos/${id}`, data)
  }

  async deleteProceso(id: number) {
    return this.http.delete<ApiResponse<{ id_proceso: number }>>(`${API_PREFIX}/procesos/${id}`)
  }

  async getProcesoCrecimientoOstion(id: number) {
    return this.http.get<CrecimientoOstionConfig | null>(`${API_PREFIX}/procesos/${id}/crecimiento-ostion`)
  }

  async updateProcesoCrecimientoOstion(id: number, data: CrecimientoOstionConfig) {
    return this.http.put<CrecimientoOstionConfig>(`${API_PREFIX}/procesos/${id}/crecimiento-ostion`, data)
  }

  async createProcesoCrecimientoOstionCaptura(
    id: number,
    data: {
      fecha_programada: string
      fecha_real?: string | null
      estado?: "pendiente" | "parcial" | "completada"
      observaciones?: string
    },
  ) {
    return this.http.post<CrecimientoOstionConfig>(`${API_PREFIX}/procesos/${id}/crecimiento-ostion/capturas`, data)
  }

  async updateProcesoCrecimientoOstionCaptura(
    id: number,
    capturaId: number,
    data: {
      fecha_programada?: string
      fecha_real?: string | null
      estado?: "pendiente" | "parcial" | "completada"
      observaciones?: string
    },
  ) {
    return this.http.put<CrecimientoOstionConfig>(
      `${API_PREFIX}/procesos/${id}/crecimiento-ostion/capturas/${capturaId}`,
      data,
    )
  }

  async saveProcesoCrecimientoOstionMediciones(
    id: number,
    capturaId: number,
    data: {
      fecha_real?: string | null
      observaciones?: string
      mediciones: Array<{
        lote_numero: number
        valor: number
        unidad: "cm" | "kg"
        observaciones?: string
      }>
    },
  ) {
    return this.http.post<CrecimientoOstionConfig>(
      `${API_PREFIX}/procesos/${id}/crecimiento-ostion/capturas/${capturaId}/mediciones`,
      data,
    )
  }

  // ========================================
  // USUARIOS
  // ========================================

  async getUsuarios(params?: { page?: number; limit?: number; rol?: string; activo?: boolean }) {
    return this.http.get<PaginatedResponse<Usuario>>(`${API_PREFIX}/usuarios`, params)
  }

  async getUsuario(id: number) {
    return this.http.get<ApiResponse<Usuario>>(`${API_PREFIX}/usuarios/${id}`)
  }

  async createUsuario(data: Omit<Usuario, 'id_usuario' | 'created_at' | 'updated_at'>) {
    return this.http.post<ApiResponse<Usuario>>(`${API_PREFIX}/usuarios`, data)
  }

  async updateUsuario(id: number, data: Partial<Usuario>) {
    return this.http.put<ApiResponse<Usuario>>(`${API_PREFIX}/usuarios/${id}`, data)
  }

  async deleteUsuario(id: number) {
    return this.http.delete<ApiResponse<{ id_usuario: number }>>(`${API_PREFIX}/usuarios/${id}`)
  }

  // ========================================
  // AUTHENTICATION
  // ========================================

  async login(email: string, password: string) {
    const payload = { correo: email, password }
    try {
      // Flujo principal via route handlers locales /api/*
      return await this.http.post<any>(`${API_PREFIX}/login`, payload)
    } catch (error) {
      // Fallback defensivo (mantiene compatibilidad con path de auth explícito)
      const isBrowser = typeof window !== 'undefined'
      const isGatewayError =
        error instanceof BackendApiError && (error.statusCode === 502 || error.statusCode === 0)
      if (isBrowser && isGatewayError) {
        return this.http.post<any>('/api/auth/login', payload)
      }
      throw error
    }
  }

  async register(data: { nombre: string; email: string; password: string; rol?: string }) {
    return this.http.post<ApiResponse<{ token: string; usuario: Usuario }>>(`${API_PREFIX}/auth/register`, data)
  }

  async refreshToken(token: string) {
    return this.http.post<ApiResponse<{ token: string }>>(`${API_PREFIX}/auth/refresh`, { token })
  }
}

// ============================================
// Singleton Instance
// ============================================

export const backendApi = new BackendApiClient()
