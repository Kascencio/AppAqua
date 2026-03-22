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

export function buildLecturasWsUrl(): string {
  const explicit = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_WS_URL)
  if (explicit) return explicit

  const external = normalizeWebSocketUrl(process.env.NEXT_PUBLIC_EXTERNAL_API_URL)
  if (external) {
    return `${external.replace(/\/$/, "")}/ws/lecturas`
  }

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

  return null
}
