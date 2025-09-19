// API client optimizado para React Query
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  // Sensores
  async getSensoresInstalados(instalacionId?: number) {
    const params = instalacionId ? `?instalacion=${instalacionId}` : ""
    return this.request(`/sensores${params}`)
  }
  async getSensorById(id: number) {
    return this.request(`/sensores/${id}`)
  }
  async getSensorReadings(sensorId: number, dateRange?: { from: Date; to: Date }) {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append("from", dateRange.from.toISOString())
      params.append("to", dateRange.to.toISOString())
    }
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/lecturas?sensor=${sensorId}${queryString}`)
  }
  async createSensor(data: any) {
    return this.request(`/sensores`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
  async updateSensor(id: number, data: any) {
    return this.request(`/sensores/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }
  async deleteSensor(id: number) {
    return this.request(`/sensores/${id}`, {
      method: "DELETE" })
  }

  // Procesos
  async getProcesses() {
    return this.request("/procesos")
  }
  async getProcessById(id: number) {
    return this.request(`/procesos/${id}`)
  }
  async createProcess(data: any) {
    return this.request("/procesos", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
  async updateProcess(id: number, data: any) {
    return this.request(`/procesos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }
  async deleteProcess(id: number) {
    return this.request(`/procesos/${id}`, {
      method: "DELETE" })
  }

  // Instalaciones
  async getFacilities(sucursalId?: number) {
    const params = sucursalId ? `?sucursal=${sucursalId}` : ""
    return this.request(`/instalaciones${params}`)
  }
  async getFacilityById(id: number) {
    return this.request(`/instalaciones/${id}`)
  }
  async createFacility(data: any) {
    return this.request(`/instalaciones`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
  async updateFacility(id: number, data: any) {
    return this.request(`/instalaciones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }
  async deleteFacility(id: number) {
    return this.request(`/instalaciones/${id}`, {
      method: "DELETE" })
  }

  // Especies
  async getSpecies() {
    return this.request("/especies")
  }
  async getSpeciesById(id: number) {
    return this.request(`/especies/${id}`)
  }
  async createSpecies(data: any) {
    return this.request(`/especies`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
  async updateSpecies(id: number, data: any) {
    return this.request(`/especies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }
  async deleteSpecies(id: number) {
    return this.request(`/especies/${id}`, {
      method: "DELETE" })
  }

  // Sucursales
  async getBranches() {
    return this.request("/sucursales")
  }
  async getBranchById(id: number) {
    return this.request(`/sucursales?id=${id}`)
  }
  async createBranch(data: any) {
    return this.request(`/sucursales`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
  async updateBranch(id: number, data: any) {
    return this.request(`/sucursales?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }
  async deleteBranch(id: number) {
    return this.request(`/sucursales?id=${id}`, {
      method: "DELETE" })
  }

  // Alertas
  async getAlerts(status?: string) {
    const params = status ? `?status=${status}` : ""
    return this.request(`/alertas${params}`)
  }
}

export const apiClient = new ApiClient()
