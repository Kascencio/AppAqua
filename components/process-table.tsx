"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Calendar, Fish, MapPin, Target } from "lucide-react"
import type { Proceso } from "@/types/proceso"
import type { Instalacion } from "@/types/instalacion"
import type { Especie } from "@/types/especie"

interface ProcessTableProps {
  procesos: Proceso[]
  instalaciones: Instalacion[]
  especies: Especie[]
  onVerMonitoreo: (id_proceso: number) => void
}

export function ProcessTable({ procesos, instalaciones, especies, onVerMonitoreo }: ProcessTableProps) {
  const getInstalacionNombre = (id_proceso: number) => {
    const instalacion = instalaciones.find((i) => i.id_proceso === id_proceso)
    return instalacion ? instalacion.nombre_instalacion : "—"
  }

  const getEspecieNombre = (id_especie: number) => {
    const especie = especies.find((e) => e.id_especie === id_especie)
    return especie ? especie.nombre_comun : "—"
  }

  const getEstadoBadgeVariant = (estado?: string) => {
    switch (estado) {
      case "activo":
        return "default"
      case "completado":
        return "secondary"
      case "pausado":
        return "outline"
      case "cancelado":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (procesos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Fish className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay procesos registrados</h3>
              <p className="text-gray-600 dark:text-gray-300">Crea tu primer proceso para comenzar el monitoreo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Procesos Registrados ({procesos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proceso</TableHead>
              <TableHead>Instalación</TableHead>
              <TableHead>Especie</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {procesos.map((proceso) => (
              <TableRow key={proceso.id_proceso}>
                <TableCell>
                  <div>
                    <p className="font-medium">{proceso.nombre_proceso || `Proceso #${proceso.id_proceso}`}</p>
                    {proceso.descripcion && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{proceso.descripcion}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{getInstalacionNombre(proceso.id_proceso)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4 text-muted-foreground" />
                    <span>{getEspecieNombre(proceso.id_especie)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>{proceso.fecha_inicio}</p>
                      <p className="text-muted-foreground">a {proceso.fecha_final}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getEstadoBadgeVariant(proceso.estado)}>{proceso.estado || "planificado"}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerMonitoreo(proceso.id_proceso)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Monitoreo
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
