/**
 * Backend API Client
 * 
 * Cliente unificado para comunicarse con el backend externo en Fastify.
 * Proporciona métodos tipo-seguros para todos los endpoints REST disponibles.
 */

// En el navegador: usar proxy same-origin para evitar CORS y evitar conflictos con route handlers locales en /api/*.
// En Node (scripts): llamar directo al backend externo.
const EXTERNAL_BACKEND_URL =
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL ||
  process.env.EXTERNAL_API_URL ||
  'http://195.35.11.179:3300'

const IS_SERVER = typeof window === 'undefined'
const API_BASE_URL = IS_SERVER ? EXTERNAL_BACKEND_URL : ''
const API_PREFIX = IS_SERVER ? '/api' : '/external-api'

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
  ciudad?: string
  pais?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Instalacion {
  id_instalacion: number
  id_sucursal: number
  nombre: string
  descripcion?: string
  tipo?: string
  capacidad?: number
  activo: boolean
  created_at: string
  updated_at: string
  // Extended properties for UI compatibility
  id_empresa_sucursal?: number
  nombre_instalacion?: string
  tipo_uso?: string
  [key: string]: unknown
}

export interface SensorInstalado {
  id_sensor_instalado: number
  id_instalacion: number
  tipo_medida: string
  unidad_medida: string
  ubicacion?: string
  activo: boolean
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
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface Proceso {
  id_proceso: number
  id_instalacion: number
  id_especie?: number
  nombre: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin_esperada?: string
  fecha_fin_real?: string
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado'
  created_at: string
  updated_at: string
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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const getToken = (): string | null => {
      if (typeof window === 'undefined') return null
      // Prefer localStorage token (lo seteamos en AuthContext)
      const lsToken = window.localStorage?.getItem('token')
      if (lsToken) return lsToken

      // Fallback a cookie access_token (middleware usa esta cookie)
      const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
      return match ? decodeURIComponent(match[1]) : null
    }
    
    try {
      const token = getToken()

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
    } catch (error) {
      if (error instanceof BackendApiError) {
        throw error
      }
      
      console.error(`[Backend API] Request failed: ${endpoint}`, error)
      throw new BackendApiError(
        'Network error or server unavailable',
        0,
        error
      )
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
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
    // Usa /api/login que se proxea al backend externo
    return this.http.post<any>(`${API_PREFIX}/login`, {
      correo: email,
      password,
    })
  }

  async register(data: { nombre: string; email: string; password: string; rol?: string }) {
    return this.http.post<ApiResponse<{ token: string; usuario: Usuario }>>('/auth/register', data)
  }

  async refreshToken(token: string) {
    return this.http.post<ApiResponse<{ token: string }>>('/auth/refresh', { token })
  }
}

// ============================================
// Singleton Instance
// ============================================

export const backendApi = new BackendApiClient()
