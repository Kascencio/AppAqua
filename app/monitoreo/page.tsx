"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, ArrowRight, Fish, MapPin } from "lucide-react"

export default function MonitoreoPage() {
  const router = useRouter()
  const ctx = useAppContext()

  if (!ctx) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Alert>
          <AlertDescription>
            No se pudo cargar el contexto de la app. Verifica que el layout esté envolviendo con `AppProvider`.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { procesos, instalaciones, especies, isLoading, error } = ctx

  const procesosEnriquecidos = useMemo(() => {
    const instalacionesByProceso = new Map<number, any>()
    instalaciones.forEach((i: any) => {
      if (typeof i.id_proceso === "number") instalacionesByProceso.set(i.id_proceso, i)
    })

    const especieById = new Map<number, any>()
    especies.forEach((e: any) => {
      if (typeof e.id_especie === "number") especieById.set(e.id_especie, e)
    })

    return (procesos || []).map((p: any) => {
      const inst = instalacionesByProceso.get(p.id_proceso)
      const esp = especieById.get(p.id_especie)
      return {
        ...p,
        __instalacionNombre: inst?.nombre_instalacion || "—",
        __instalacionId: inst?.id_instalacion,
        __especieNombre: p.nombre_especie || esp?.nombre || "—",
      }
    })
  }, [procesos, instalaciones, especies])

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertDescription>Error al cargar monitoreo: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!procesosEnriquecidos.length) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fish className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay procesos para monitorear</h3>
            <p className="text-muted-foreground text-center">
              Crea un proceso en la sección de Procesos para ver sus gráficas y sensores.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monitoreo</h1>
          <p className="text-muted-foreground">Selecciona un proceso para ver gráficas y sensores</p>
        </div>
        <Activity className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {procesosEnriquecidos.map((p: any) => (
          <Card key={p.id_proceso} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Proceso #{p.id_proceso}</span>
                <span className="text-sm font-normal text-muted-foreground">{p.estado_proceso || "—"}</span>
              </CardTitle>
              <CardDescription>
                <span className="font-medium">Especie:</span> {p.__especieNombre}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{p.__instalacionNombre}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Rango:</span> {p.fecha_inicio} → {p.fecha_final}
              </div>

              <Button
                className="w-full"
                onClick={() => router.push(`/monitoreo/proceso/${p.id_proceso}`)}
              >
                Ver monitoreo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
