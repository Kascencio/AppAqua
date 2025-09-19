"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Eye,
  Edit,
  Trash,
  Search,
  Fish,
  Building2,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ProcessHistoryTableProps {
  processes: any[]
  facilities: any[]
  species: any[]
  loading?: boolean
  onViewProcess: (process: any) => void
  onEditProcess: (process: any) => void
  onDeleteProcess: (process: any) => void
}

export function ProcessHistoryTable({
  processes,
  facilities,
  species,
  loading = false,
  onViewProcess,
  onEditProcess,
  onDeleteProcess,
}: ProcessHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<string>("fechaInicio")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [localSearch, setLocalSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filtrar procesos
  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.nombre?.toLowerCase().includes(localSearch.toLowerCase()) ||
      process.id?.toLowerCase().includes(localSearch.toLowerCase())
    const matchesStatus = statusFilter === "all" || process.estado === statusFilter
    return matchesSearch && matchesStatus
  })

  // Ordenar procesos
  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    // Convertir fechas para comparación
    if (sortField === "fechaInicio" || sortField === "fechaFin") {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Paginación
  const totalPages = Math.ceil(sortedProcesses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProcesses = sortedProcesses.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500"
      case "planificado":
        return "bg-blue-500"
      case "pausado":
        return "bg-yellow-500"
      case "completado":
        return "bg-gray-500"
      case "cancelado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "activo":
        return "Activo"
      case "planificado":
        return "Planificado"
      case "pausado":
        return "Pausado"
      case "completado":
        return "Completado"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  const getSpeciesName = (especieId: number) => {
    const especie = species.find((s) => s.id_especie === especieId)
    return especie?.nombre || `Especie ${especieId}`
  }

  const getFacilityInfo = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId)
    return facility || { name: `Instalación ${facilityId}`, branch: "N/A" }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles de filtrado y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o ID del proceso..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="planificado">Planificado</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(Number.parseInt(value))
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 por página</SelectItem>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("id")} className="h-auto p-0 font-semibold">
                  ID del Proceso
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("especieId")} className="h-auto p-0 font-semibold">
                  Especie
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("instalacionId")}
                  className="h-auto p-0 font-semibold"
                >
                  Instalación
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("fechaInicio")} className="h-auto p-0 font-semibold">
                  Fechas
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("estado")} className="h-auto p-0 font-semibold">
                  Estado
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProcesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {localSearch || statusFilter !== "all"
                      ? "No se encontraron procesos con los filtros aplicados"
                      : "No hay procesos registrados"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProcesses.map((process) => {
                const facilityInfo = getFacilityInfo(process.instalacionId)
                return (
                  <TableRow key={process.id}>
                    <TableCell className="font-mono text-sm">{process.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Fish className="h-4 w-4 text-green-600" />
                        {getSpeciesName(process.especieId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{facilityInfo.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {facilityInfo.branch}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(process.fechaInicio), "dd/MM/yyyy", { locale: es })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          hasta {format(new Date(process.fechaFin), "dd/MM/yyyy", { locale: es })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusColor(process.estado)} text-white`}>
                        {getStatusLabel(process.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewProcess(process)}
                          title="Ver monitoreo"
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="h-4 w-4" />
                          Ver monitoreo
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEditProcess(process)} title="Editar proceso">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteProcess(process)}
                          title="Eliminar proceso"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedProcesses.length)} de{" "}
            {sortedProcesses.length} procesos
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
