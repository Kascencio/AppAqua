const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/external-api").replace(/\/$/, "")

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

class ApiClient {
  private getTokenFromCookie(): string | null {
    if (typeof document === "undefined") return null

    const cookies = document.cookie.split(";").map((c) => c.trim())
    const tokenCookie = cookies.find((c) => c.startsWith("access_token="))
    if (!tokenCookie) return null

    const [, value] = tokenCookie.split("=")
    return value ? decodeURIComponent(value) : null
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token") || this.getTokenFromCookie()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }
    return headers
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`
    const headers: Record<string, string> = { ...this.getHeaders(), ...(options.headers ?? {}) }
    const body = (options as any).body
    const hasBody = body !== undefined && body !== null
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData

    if (hasBody && !isFormData) {
      const hasContentType = Object.keys(headers).some((h) => h.toLowerCase() === "content-type")
      if (!hasContentType) headers["Content-Type"] = "application/json"
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials ?? "include",
      })

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
