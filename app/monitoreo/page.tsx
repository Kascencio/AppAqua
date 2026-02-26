"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function MonitoreoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    router.replace(query ? `/analytics?${query}` : "/analytics")
  }, [router, searchParams])

  return null
}
