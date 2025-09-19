import type { Branch, Facility, Sensor, Alert, User } from "@/types"
import type { Especie, Parametro, EspecieParametro } from "@/types"

/**
 * Cliente API para interactuar con el backend
 */
class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  /**
   * Configura el token de autenticación
   */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * Realiza una petición HTTP
   */
  private async request<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

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
  }

  // Métodos para Branches
  async getBranches(): Promise<Branch[]> {
    return this.request<Branch[]>("/branches")
  }

  async getBranch(id: string): Promise<Branch> {
    return this.request<Branch>(`/branches/${id}`)
  }

  async createBranch(branch: Omit<Branch, "id">): Promise<Branch> {
    return this.request<Branch>("/branches", "POST", branch)
  }

  async updateBranch(id: string, branch: Partial<Branch>): Promise<Branch> {
    return this.request<Branch>(`/branches/${id}`, "PUT", branch)
  }

  async deleteBranch(id: string): Promise<void> {
    return this.request<void>(`/branches/${id}`, "DELETE")
  }

  // Métodos para Facilities
  async getFacilities(branchId?: string): Promise<Facility[]> {
    const endpoint = branchId ? `/branches/${branchId}/facilities` : "/facilities"
    return this.request<Facility[]>(endpoint)
  }

  async getFacility(id: string): Promise<Facility> {
    return this.request<Facility>(`/facilities/${id}`)
  }

  async createFacility(facility: Omit<Facility, "id">): Promise<Facility> {
    return this.request<Facility>("/facilities", "POST", facility)
  }

  async updateFacility(id: string, facility: Partial<Facility>): Promise<Facility> {
    return this.request<Facility>(`/facilities/${id}`, "PUT", facility)
  }

  async deleteFacility(id: string): Promise<void> {
    return this.request<void>(`/facilities/${id}`, "DELETE")
  }

  // Métodos para Sensors
  async getSensors(facilityId?: string): Promise<Sensor[]> {
    const endpoint = facilityId ? `/facilities/${facilityId}/sensors` : "/sensors"
    return this.request<Sensor[]>(endpoint)
  }

  async getSensor(id: string): Promise<Sensor> {
    return this.request<Sensor>(`/sensors/${id}`)
  }

  async createSensor(sensor: Omit<Sensor, "id">): Promise<Sensor> {
    return this.request<Sensor>("/sensors", "POST", sensor)
  }

  async updateSensor(id: string, sensor: Partial<Sensor>): Promise<Sensor> {
    return this.request<Sensor>(`/sensors/${id}`, "PUT", sensor)
  }

  async deleteSensor(id: string): Promise<void> {
    return this.request<void>(`/sensors/${id}`, "DELETE")
  }

  // Métodos para Alerts
  async getAlerts(params?: { status?: string; severity?: string }): Promise<Alert[]> {
    const queryParams = params
      ? `?${Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join("&")}`
      : ""

    return this.request<Alert[]>(`/alerts${queryParams}`)
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/acknowledge`, "POST")
  }

  async resolveAlert(id: string, notes?: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/resolve`, "POST", { notes })
  }

  // Métodos para Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/users")
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`)
  }

  async createUser(user: Omit<User, "id">): Promise<User> {
    return this.request<User>("/users", "POST", user)
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, "PUT", user)
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, "DELETE")
  }

  // Métodos para Especies
  async getSpecies(): Promise<Especie[]> {
    return this.request<Especie[]>("/especies")
  }

  async getSpeciesById(id: number): Promise<Especie> {
    return this.request<Especie>(`/especies/${id}`)
  }

  async createSpecies(species: Omit<Especie, "id_especie">): Promise<Especie> {
    return this.request<Especie>("/especies", "POST", species)
  }

  async updateSpecies(id: number, species: Partial<Especie>): Promise<Especie> {
    return this.request<Especie>(`/especies/${id}`, "PUT", species)
  }

  async deleteSpecies(id: number): Promise<void> {
    return this.request<void>(`/especies/${id}`, "DELETE")
  }

  // Métodos para Parámetros
  async getParameters(): Promise<Parametro[]> {
    return this.request<Parametro[]>("/parametros")
  }

  async getParameterById(id: number): Promise<Parametro> {
    return this.request<Parametro>(`/parametros/${id}`)
  }

  async createParameter(parameter: Omit<Parametro, "id_parametro">): Promise<Parametro> {
    return this.request<Parametro>("/parametros", "POST", parameter)
  }

  async updateParameter(id: number, parameter: Partial<Parametro>): Promise<Parametro> {
    return this.request<Parametro>(`/parametros/${id}`, "PUT", parameter)
  }

  async deleteParameter(id: number): Promise<void> {
    return this.request<void>(`/parametros/${id}`, "DELETE")
  }

  // Métodos para Parámetros de Especies
  async getSpeciesParameters(speciesId?: number): Promise<EspecieParametro[]> {
    const endpoint = speciesId ? `/especies/${speciesId}/parametros` : "/especies-parametros"
    return this.request<EspecieParametro[]>(endpoint)
  }

  async getSpeciesParameterById(id: number): Promise<EspecieParametro> {
    return this.request<EspecieParametro>(`/especies-parametros/${id}`)
  }

  async createSpeciesParameter(
    speciesParameter: Omit<EspecieParametro, "id_especie_parametro">,
  ): Promise<EspecieParametro> {
    return this.request<EspecieParametro>("/especies-parametros", "POST", speciesParameter)
  }

  async updateSpeciesParameter(id: number, speciesParameter: Partial<EspecieParametro>): Promise<EspecieParametro> {
    return this.request<EspecieParametro>(`/especies-parametros/${id}`, "PUT", speciesParameter)
  }

  async deleteSpeciesParameter(id: number): Promise<void> {
    return this.request<void>(`/especies-parametros/${id}`, "DELETE")
  }
}

// Exportar una instancia única del cliente API
export const apiClient = new ApiClient()
