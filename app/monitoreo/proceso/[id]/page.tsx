"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function MonitoreoProcesoRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const procesoId = Number(params.id)

  useEffect(() => {
    if (Number.isFinite(procesoId) && procesoId > 0) {
      router.replace(`/analytics?proceso=${procesoId}`)
      return
    }
    router.replace("/analytics")
  }, [router, procesoId])

  return null
}
