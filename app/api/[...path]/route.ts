import { type NextRequest, NextResponse } from "next/server"

// Lee la URL del backend en cada request (runtime, no build-time)
function getBackendBase(): string {
  const raw = (process.env.EXTERNAL_API_URL || "").trim().replace(/\/$/, "")
  if (!raw) return "http://localhost:3100"
  return raw
}

const SKIP_HEADERS = new Set([
  "host",
  "connection",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
])

async function proxy(req: NextRequest): Promise<NextResponse> {
  const backendBase = getBackendBase()

  // Reconstruir la ruta completa: /api/auth/login → backendBase/api/auth/login
  const url = new URL(req.url)
  const targetUrl = `${backendBase}${url.pathname}${url.search}`

  // Copiar headers de la petición original, omitiendo los hop-by-hop
  const outgoingHeaders = new Headers()
  req.headers.forEach((value, key) => {
    if (!SKIP_HEADERS.has(key.toLowerCase())) {
      outgoingHeaders.set(key, value)
    }
  })
  // Fijar Host al del backend para que Fastify lo acepte
  outgoingHeaders.set("host", new URL(backendBase).host)

  let body: BodyInit | undefined
  const method = req.method.toUpperCase()
  if (!["GET", "HEAD"].includes(method)) {
    body = await req.blob()
  }

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method,
      headers: outgoingHeaders,
      body,
      // @ts-ignore – Node.js fetch extension to disable redirect following in proxy
      redirect: "manual",
    })
  } catch (err) {
    console.error(`[proxy] No se pudo conectar al backend (${backendBase}):`, err)
    return NextResponse.json(
      { error: "Backend no disponible", target: targetUrl },
      { status: 502 }
    )
  }

  // Reenviar respuesta al cliente
  const responseHeaders = new Headers()
  response.headers.forEach((value, key) => {
    if (!SKIP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value)
    }
  })

  const responseBody = await response.arrayBuffer()
  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
export const HEAD = proxy
