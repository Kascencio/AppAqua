/**
 * Cliente API para comunicarse con el backend externo
 * Backend corriendo en puerto 3300 del hosting
 */

const getExternalApiUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.EXTERNAL_API_URL || process.env.NEXT_PUBLIC_EXTERNAL_API_URL || ''
  }
  // Client-side
  return process.env.NEXT_PUBLIC_EXTERNAL_API_URL || ''
}

const getWsUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  const apiUrl = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || ''
  if (apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'ws://') + '/ws'
  }
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace('https://', 'wss://') + '/ws'
  }
  return process.env.NEXT_PUBLIC_WS_URL || ''
}

class ExternalApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = getExternalApiUrl()
  }

  /**
   * Configura el token de autenticación
   */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * Obtiene el token desde cookies o localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return this.token
    
    // Intentar obtener de cookie
    const cookies = document.cookie.split(';')
    const accessTokenCookie = cookies.find(c => c.trim().startsWith('access_token='))
    if (accessTokenCookie) {
      return accessTokenCookie.split('=')[1]
    }
    
    // Intentar obtener de localStorage
    try {
      const stored = localStorage.getItem('access_token')
      if (stored) return stored
    } catch {}
    
    return this.token
  }

  /**
   * Realiza una petición HTTP al backend externo
   */
  private async request<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
    if (!this.baseUrl) {
      throw new Error("EXTERNAL_API_URL no configurada. Verifique las variables de entorno.")
    }

    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const token = this.getAuthToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`)
      }

      // Para peticiones DELETE que no devuelven contenido
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      console.error(`Error en petición a backend externo ${endpoint}:`, error)
      throw error
    }
  }

  // Métodos para Sensores
  async getSensor(sensorId: string | number): Promise<any> {
    return this.request<any>(`/sensors/${sensorId}`)
  }

  async getSensorReadings(sensorId: string | number, params?: {
    from?: string
    to?: string
    limit?: number
  }): Promise<any[]> {
    const queryParams = params
      ? `?${Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join("&")}`
      : ""
    return this.request<any[]>(`/sensors/${sensorId}/readings${queryParams}`)
  }

  async getLatestReading(sensorId: string | number): Promise<any> {
    return this.request<any>(`/sensors/${sensorId}/readings/latest`)
  }

  // Métodos para Instalaciones
  async getInstallationSensors(installationId: string | number): Promise<any[]> {
    return this.request<any[]>(`/installations/${installationId}/sensors`)
  }

  // Métodos para Lecturas en tiempo real
  async getRealTimeReadings(sensorIds: (string | number)[]): Promise<Record<string, any>> {
    return this.request<Record<string, any>>(`/readings/realtime`, "POST", { sensorIds })
  }
}

// Exportar instancia única y función para obtener WebSocket URL
export const externalApiClient = new ExternalApiClient()

export const getWebSocketUrl = () => getWsUrl()

export default externalApiClient

