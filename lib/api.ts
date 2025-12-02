import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300/api"

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }
    return headers
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`
    const headers = { ...this.getHeaders(), ...options.headers }

    try {
      const response = await fetch(url, { ...options, headers })

      if (!response.ok) {
        // Handle 401 Unauthorized globally if needed
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            // Optional: Redirect to login or clear token
            // localStorage.removeItem("token")
            // window.location.href = "/login"
          }
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      // Some endpoints might return empty body (e.g. 204 No Content)
      if (response.status === 204) {
        return {} as T
      }

      return response.json()
    } catch (error: any) {
      console.error(`API Request failed for ${url}:`, error)
      throw error
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  async post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

export const api = new ApiClient()
