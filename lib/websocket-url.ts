/**
 * WebSocket URL builder
 *
 * Prioridad:
 * 1. NEXT_PUBLIC_WS_URL (explícita, build-time)
 * 2. NEXT_PUBLIC_EXTERNAL_API_URL + "/ws/lecturas" (build-time)
 * 3. Runtime: deriva la API URL desde window.location
 *    - Si el frontend es appacua.X.com → api es apiacua.X.com
 *    - Cualquier otro caso → mismo host con puerto 3100
 */

function shouldUseSecureWebSockets(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:"
}

export function normalizeWebSocketUrl(rawUrl: string | null | undefined): string | null {
  if (typeof rawUrl !== "string") return null

  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  const secure = shouldUseSecureWebSockets()

  if (trimmed.startsWith("wss://")) return trimmed
  if (trimmed.startsWith("ws://")) {
    return `${secure ? "wss" : "ws"}://${trimmed.slice("ws://".length)}`
  }
  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length)}`
  }
  if (trimmed.startsWith("http://")) {
    return `${secure ? "wss" : "ws"}://${trimmed.slice("http://".length)}`
  }

  return trimmed
}

/**
 * Deriva la URL base del API a partir del hostname del frontend en runtime.
 * Convención: frontend "appacua.dominio.com" → api "apiacua.dominio.com"
 */
function deriveApiBaseUrlFromWindow(): string | null {
  if (typeof window === "undefined") return null

  const hostname = window.location.hostname

  // Si estamos en localhost, no intentar derivar
  if (hostname === "localhost" || hostname === "127.0.0.1") return null

  // Convención: appacua.X → apiacua.X
  if (hostname.startsWith("appacua.")) {
    const domain = hostname.slice("appacua.".length)
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    return `${protocol}://${"apiacua." + domain}`
  }

  // Convención genérica: app.X → api.X
  if (hostname.startsWith("app.")) {
    const domain = hostname.slice("app.".length)
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    return `${protocol}://${"api." + domain}`
  }

  return null
}

export function buildLecturasWsUrl(): string {
  // 1. Variable explícita de WS
  const explicit = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_WS_URL)
  if (explicit) return explicit

  // 2. Derivar de la URL de la API externa
  const external = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_EXTERNAL_API_URL)
  if (external) {
    return `${external.replace(/\/$/, "")}/ws/lecturas`
  }

  // 3. Runtime: derivar desde window.location
  const derived = deriveApiBaseUrlFromWindow()
  if (derived) {
    return `${derived.replace(/\/$/, "")}/ws/lecturas`
  }

  // 4. Fallback local (solo desarrollo)
  return normalizeWebSocketUrl("ws://localhost:3100/ws/lecturas") || "ws://localhost:3100/ws/lecturas"
}

export function buildNotificationsWsUrl(): string | null {
  const explicit = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_WS_NOTIFICATIONS_URL)
  if (explicit) return explicit

  const lecturasUrl = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_WS_URL)
  if (lecturasUrl) {
    return lecturasUrl.includes("/ws/lecturas")
      ? lecturasUrl.replace("/ws/lecturas", "/ws/notificaciones")
      : `${lecturasUrl.replace(/\/$/, "")}/ws/notificaciones`
  }

  const external = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_EXTERNAL_API_URL)
  if (external) {
    return `${external.replace(/\/$/, "")}/ws/notificaciones`
  }

  // Runtime: derivar desde window.location
  const derived = deriveApiBaseUrlFromWindow()
  if (derived) {
    return `${derived.replace(/\/$/, "")}/ws/notificaciones`
  }

  return null
}
