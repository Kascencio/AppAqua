"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, RefreshCw, Activity } from "lucide-react"
import { useOrganizaciones } from "@/hooks/use-organizaciones"
import { useSucursales } from "@/hooks/use-sucursales"
import { useInstalaciones } from "@/hooks/use-instalaciones"
import { useSensors } from "@/hooks/use-sensors"
import { useProcesos } from "@/hooks/use-procesos"

export default function ApiTestPage() {
  const [testTime, setTestTime] = useState<Date | null>(null)

  // Hooks de datos
  const organizaciones = useOrganizaciones({ auto: true, limit: 5 })
  const sucursales = useSucursales({ auto: true, limit: 5 })
  const instalaciones = useInstalaciones({ auto: true })
  const sensors = useSensors()
  const procesos = useProcesos({ auto: true, limit: 5 })

  const tests = [
    {
      name: "Organizaciones",
      hook: organizaciones,
      data: organizaciones.organizaciones,
      icon: "🏢",
    },
    {
      name: "Sucursales",
      hook: sucursales,
      data: sucursales.sucursales,
      icon: "🏪",
    },
    {
      name: "Instalaciones",
      hook: instalaciones,
      data: instalaciones.instalaciones,
      icon: "🏊",
    },
    {
      name: "Sensores",
      hook: sensors,
      data: sensors.sensors,
      icon: "📡",
    },
    {
      name: "Procesos",
      hook: procesos,
      data: procesos.procesos,
      icon: "⚙️",
    },
  ]

  const handleRefreshAll = () => {
    setTestTime(new Date())
    organizaciones.refresh?.()
    sucursales.refresh?.()
    instalaciones.refresh?.()
    sensors.refetch?.()
    procesos.refresh?.()
  }

  const passedTests = tests.filter(t => !t.hook.loading && !t.hook.error && t.data && t.data.length > 0).length
  const totalTests = tests.length
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pruebas de API</h1>
          <p className="text-muted-foreground">
            Verificación de endpoints del backend y hooks de React
          </p>
        </div>
        <Button onClick={handleRefreshAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refrescar Todo
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pruebas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">Módulos de datos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exitosas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            <p className="text-xs text-muted-foreground">Conexiones activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <Badge variant={parseFloat(successRate) >= 75 ? "default" : "destructive"}>
              {successRate}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Operacional</p>
          </CardContent>
        </Card>
      </div>

      {/* Hora de la prueba */}
      {testTime && (
        <div className="text-sm text-muted-foreground text-center">
          Última actualización: {testTime.toLocaleTimeString()}
        </div>
      )}

      {/* Resultados de pruebas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => {
          const isLoading = test.hook.loading
          const hasError = test.hook.error
          const hasData = test.data && test.data.length > 0
          const dataCount = test.data?.length || 0

          let status: "success" | "error" | "loading" = "loading"
          if (!isLoading) {
            status = hasError ? "error" : hasData ? "success" : "error"
          }

          return (
            <Card key={test.name} className={`transition-all ${
              status === "success" ? "border-green-500/50" : 
              status === "error" ? "border-red-500/50" : ""
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{test.icon}</span>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                  </div>
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  ) : hasError ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : hasData ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <CardDescription>
                  {isLoading ? "Cargando..." : hasError ? "Error" : "Conectado"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant={
                      status === "success" ? "default" :
                      status === "error" ? "destructive" : "secondary"
                    }>
                      {isLoading ? "Cargando" : hasError ? "Error" : hasData ? "Exitoso" : "Sin datos"}
                    </Badge>
                  </div>

                  {!isLoading && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Registros:</span>
                        <span className="font-bold">{dataCount}</span>
                      </div>

                      {"total" in test.hook && test.hook.total !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total en BD:</span>
                          <span className="font-bold">{test.hook.total}</span>
                        </div>
                      )}

                      {hasError && (
                        <div className="text-xs text-red-500 mt-2">
                          {test.hook.error}
                        </div>
                      )}

                      {hasData && test.data[0] && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                          <div className="font-semibold mb-1">Primer registro:</div>
                          <div className="truncate">
                            {JSON.stringify(test.data[0]).substring(0, 100)}...
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Información de configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Backend</CardTitle>
          <CardDescription>Variables de entorno y configuración de API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backend URL:</span>
              <span className="font-bold">{process.env.NEXT_PUBLIC_EXTERNAL_API_URL || "No configurado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WebSocket URL:</span>
              <span className="font-bold">{process.env.NEXT_PUBLIC_WS_URL || "No configurado"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
