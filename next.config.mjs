import path from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
function normalizeExternalBackendUrl(rawUrl) {
  const fallback = "http://195.35.11.179:3100"
  const raw = (rawUrl || fallback).trim().replace(/^['"]|['"]$/g, "")
  if (!raw) return fallback
  if (/^\d+$/.test(raw)) return `http://127.0.0.1:${raw}`
  if (!/^https?:\/\//i.test(raw)) return `http://${raw}`
  return raw.replace(/\/$/, "")
}

const EXTERNAL_BACKEND_URL = normalizeExternalBackendUrl(
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL || process.env.EXTERNAL_API_URL
)
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/health',
          destination: `${EXTERNAL_BACKEND_URL}/health`,
        },
        {
          source: '/external-health',
          destination: `${EXTERNAL_BACKEND_URL}/health`,
        },
      ],
    }
  },
}

export default nextConfig
