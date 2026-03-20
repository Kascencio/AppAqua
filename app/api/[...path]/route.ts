import { NextRequest, NextResponse } from "next/server"

const RAW_BACKEND_URL =
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL ||
  process.env.EXTERNAL_API_URL ||
  "http://195.35.11.179:3100"

function normalizeBackendUrl(rawUrl: string): string {
  const raw = rawUrl.trim().replace(/^['"]|['"]$/g, "")
  if (!raw) return "http://195.35.11.179:3100"
  if (/^\d+$/.test(raw)) return `http://127.0.0.1:${raw}`
  if (!/^https?:\/\//i.test(raw)) return `http://${raw}`
  return raw.replace(/\/$/, "")
}

const BACKEND_URL = normalizeBackendUrl(RAW_BACKEND_URL)
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"])

function mapApiPath(pathname: string): string {
  const localPath = pathname.startsWith("/api/") ? pathname.slice(4) : pathname

  if (localPath === "/auth/login") return "/login"
  if (localPath === "/facilities") return "/instalaciones"

  return localPath
}

function buildTargetUrl(request: NextRequest, mappedPath: string): string {
  const target = new URL(`${BACKEND_URL}/api${mappedPath}`)
  target.search = request.nextUrl.search
  return target.toString()
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers()
  const hopByHopHeaders = new Set([
    "connection",
    "host",
    "content-length",
    "transfer-encoding",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
  ])

  request.headers.forEach((value, key) => {
    if (hopByHopHeaders.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  return headers
}

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const mappedPath = mapApiPath(request.nextUrl.pathname)
    const targetUrl = buildTargetUrl(request, mappedPath)

    const init: RequestInit = {
      method: request.method,
      headers: buildForwardHeaders(request),
      redirect: "manual",
      cache: "no-store",
    }

    if (METHODS_WITH_BODY.has(request.method.toUpperCase())) {
      const bodyText = await request.text()
      if (bodyText) init.body = bodyText
    }

    const upstream = await fetch(targetUrl, init)
    if (!upstream.ok && upstream.status >= 500) {
      const upstreamBody = await upstream
        .clone()
        .text()
        .catch(() => "")

      console.error("[API proxy] Upstream error", {
        method: request.method,
        targetUrl,
        status: upstream.status,
        body: upstreamBody.slice(0, 1000),
      })
    }
    const responseHeaders = new Headers(upstream.headers)

    responseHeaders.delete("connection")
    responseHeaders.delete("transfer-encoding")
    responseHeaders.delete("keep-alive")

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "No se pudo conectar con el backend",
        details: error?.message || "Error desconocido",
      },
      { status: 502 }
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  return proxyRequest(request)
}

export async function POST(request: NextRequest) {
  return proxyRequest(request)
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request)
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request)
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request)
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request)
}

export async function HEAD(request: NextRequest) {
  return proxyRequest(request)
}
