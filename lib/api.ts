// Rutas relativas siempre; Next.js rewrite (/api/*) las envía al backend real.
const API_URL = ""

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

export class ApiHttpError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown) {
    super(message)
    this.name = "ApiHttpError"
    this.status = status
    this.details = details
  }
}

class ApiClient {
  private lastUnauthorizedDispatch = 0
  private responseCache = new Map<string, { expiresAt: number; data: unknown }>()
  private inflightRequests = new Map<string, Promise<unknown>>()
  private readonly DEFAULT_CACHE_TTL_MS = 15_000
  private readonly SHORT_CACHE_TTL_MS = 5_000

  private cloneData<T>(value: T): T {
    if (typeof structuredClone === "function") {
      return structuredClone(value)
    }
    return JSON.parse(JSON.stringify(value))
  }

  private buildCacheKey(method: string, url: string, headers: Record<string, string>): string {
    const auth = headers.Authorization || headers.authorization || ""
    return `${method.toUpperCase()}::${url}::${auth}`
  }

  private getCacheTtl(url: string): number {
    if (
      url.includes("/lecturas") ||
      url.includes("/promedios") ||
      url.includes("/notifications") ||
      url.includes("/alertas")
    ) {
      return this.SHORT_CACHE_TTL_MS
    }
    return this.DEFAULT_CACHE_TTL_MS
  }

  private invalidateCache() {
    this.responseCache.clear()
    this.inflightRequests.clear()
  }

  private getHeaders(): Record<string, string> {
    // Con cookies httpOnly, el navegador envía el token automáticamente.
    // No necesitamos setear Authorization manualmente.
    return {}
  }

  private handleUnauthorized() {
    if (typeof window === "undefined") return

    localStorage.removeItem("user_data")

    const now = Date.now()
    if (now - this.lastUnauthorizedDispatch > 1000) {
      window.dispatchEvent(new Event("aqua:auth-unauthorized"))
      this.lastUnauthorizedDispatch = now
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`
    const headers: Record<string, string> = { ...this.getHeaders(), ...(options.headers ?? {}) }
    const method = (options.method || "GET").toUpperCase()
    const cacheKey = this.buildCacheKey(method, url, headers)
    const body = (options as any).body
    const hasBody = body !== undefined && body !== null
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData

    if (hasBody && !isFormData) {
      const hasContentType = Object.keys(headers).some((h) => h.toLowerCase() === "content-type")
      if (!hasContentType) headers["Content-Type"] = "application/json"
    }

    try {
      const isGet = method === "GET"
      if (isGet) {
        const cached = this.responseCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
          return this.cloneData(cached.data as T)
        }

        const inflight = this.inflightRequests.get(cacheKey)
        if (inflight) {
          return this.cloneData((await inflight) as T)
        }
      }

      const requestPromise = (async () => {
        const response = await fetch(url, {
          ...options,
          headers,
          credentials: options.credentials ?? "include",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage =
            errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`

          if (response.status === 401) {
            this.handleUnauthorized()
          }

          throw new ApiHttpError(errorMessage, response.status, errorData)
        }

        // Some endpoints might return empty body (e.g. 204 No Content)
        if (response.status === 204) {
          return {} as T
        }

        return response.json() as Promise<T>
      })()

      if (method === "GET") {
        this.inflightRequests.set(cacheKey, requestPromise as Promise<unknown>)
      }

      const data = await requestPromise

      if (method === "GET") {
        this.responseCache.set(cacheKey, {
          expiresAt: Date.now() + this.getCacheTtl(url),
          data,
        })
      } else {
        this.invalidateCache()
      }

      return this.cloneData(data)
    } catch (error: any) {
      if (!isAbortError(error) && !(error instanceof ApiHttpError && (error.status === 401 || error.status === 403))) {
        console.error(`API Request failed for ${url}:`, error)
      }
      throw error
    } finally {
      if (method === "GET") {
        this.inflightRequests.delete(cacheKey)
      }
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
