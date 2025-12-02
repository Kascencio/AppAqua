"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapComponent } from "@/components/map-component"
import { useAppContext } from "@/context/app-context"
import type { EmpresaSucursalCompleta } from "@/types"
import {
  Building2,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"

export default function MapPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<"all" | "empresa" | "sucursal">("all")
  const [filterEstado, setFilterEstado] = useState<"all" | "activa" | "inactiva">("all")
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaSucursalCompleta | null>(null)
  const [showInactivas, setShowInactivas] = useState(true)

  // Usar AppContext
  const { empresasSucursales, isLoading, error, refreshData } = useAppContext()
  
  // Calcular porEstado
  const porEstado = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of empresasSucursales) {
      const key = e.nombre_estado || "Desconocido"
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [empresasSucursales])
  
  // Calcular estadísticas manualmente
  const stats = {
    totalEmpresas: empresasSucursales.filter((e) => e.tipo === "empresa").length,
    totalSucursales: empresasSucursales.filter((e) => e.tipo === "sucursal").length,
    empresasActivas: empresasSucursales.filter((e) => e.estado_operativo === "activa").length,
    sucursalesActivas: empresasSucursales.filter((e) => e.tipo === "sucursal" && e.estado_operativo === "activa").length,
    porEstado,
  }

  // Filtrado de datos
  const filteredEmpresas = useMemo(() => {
    return empresasSucursales.filter((empresa) => {
      const matchesSearch =
        empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (empresa.nombre_estado?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (empresa.nombre_colonia?.toLowerCase() || "").includes(searchTerm.toLowerCase())

      const matchesTipo = filterTipo === "all" || empresa.tipo === filterTipo
      const matchesEstado = filterEstado === "all" || empresa.estado_operativo === filterEstado
      const matchesVisibility = showInactivas || empresa.estado_operativo === "activa"

      return matchesSearch && matchesTipo && matchesEstado && matchesVisibility
    })
  }, [empresasSucursales, searchTerm, filterTipo, filterEstado, showInactivas])

  // Preparar datos para el mapa
  const mapData = useMemo(() => {
    return filteredEmpresas.map((empresa, index) => {
      // Mock coordinates based on index/id to spread them out
      // Base center: 17.9869, -92.9303 (Villahermosa roughly)
      const lat = 17.9869 + (Math.random() - 0.5) * 0.1
      const lng = -92.9303 + (Math.random() - 0.5) * 0.1
      
      return {
        id: empresa.id_empresa_sucursal.toString(),
        name: empresa.nombre,
        type: empresa.tipo,
        status: empresa.estado_operativo,
        coordinates: { lat, lng },
        address: `${empresa.calle} ${empresa.numero_int_ext || ""}, ${empresa.nombre_colonia || ""}, ${empresa.nombre_estado || ""}`,
        phone: empresa.telefono,
        email: empresa.email,
      }
    })
  }, [filteredEmpresas])

  const handleEmpresaSelect = (empresa: EmpresaSucursalCompleta) => {
    setSelectedEmpresa(empresa)
  }

  const clearSelection = () => {
    setSelectedEmpresa(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar los datos del mapa: {error}
            <Button variant="outline" size="sm" onClick={() => refreshData()} className="ml-2">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Ubicaciones</h1>
        <p className="text-muted-foreground">
          Visualización geográfica de empresas y sucursales del sistema de monitoreo acuícola
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmpresas}</div>
              <p className="text-xs text-muted-foreground">{stats.empresasActivas} activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sucursales</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSucursales}</div>
              <p className="text-xs text-muted-foreground">{stats.sucursalesActivas} activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ubicaciones Activas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empresasActivas + stats.sucursalesActivas}</div>
              <p className="text-xs text-muted-foreground">En operación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estados</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.porEstado || {}).length}</div>
              <p className="text-xs text-muted-foreground">Cobertura geográfica</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, estado o colonia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterTipo} onValueChange={(value: any) => setFilterTipo(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="empresa">Solo empresas</SelectItem>
                <SelectItem value="sucursal">Solo sucursales</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={(value: any) => setFilterEstado(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activa">Solo activas</SelectItem>
                <SelectItem value="inactiva">Solo inactivas</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowInactivas(!showInactivas)}
              className="flex items-center gap-2"
            >
              {showInactivas ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showInactivas ? "Ocultar inactivas" : "Mostrar inactivas"}
            </Button>

            <Button
              variant="outline"
              onClick={() => refreshData()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Mostrando {filteredEmpresas.length} de {empresasSucursales.length} ubicaciones
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mapa Interactivo</CardTitle>
              <CardDescription>Haz clic en los marcadores para ver detalles de cada ubicación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapComponent
                  branches={mapData}
                  onBranchSelect={(branchId) => {
                    const empresa = empresasSucursales.find((e) => e.id_empresa_sucursal.toString() === branchId)
                    if (empresa) handleEmpresaSelect(empresa)
                  }}
                  selectedBranchId={selectedEmpresa?.id_empresa_sucursal.toString()}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Location Details */}
          {selectedEmpresa ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {selectedEmpresa.tipo === "empresa" ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                    Detalles
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedEmpresa.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedEmpresa.tipo === "empresa" ? "default" : "secondary"}>
                      {selectedEmpresa.tipo === "empresa" ? "Empresa" : "Sucursal"}
                    </Badge>
                    <Badge variant={selectedEmpresa.estado_operativo === "activa" ? "default" : "destructive"}>
                      {selectedEmpresa.estado_operativo === "activa" ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedEmpresa.calle} {selectedEmpresa.numero_int_ext}, {selectedEmpresa.nombre_colonia}, {selectedEmpresa.nombre_estado}
                    </span>
                  </div>

                  {selectedEmpresa.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmpresa.telefono}</span>
                    </div>
                  )}

                  {selectedEmpresa.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmpresa.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Registrada: {new Date(selectedEmpresa.fecha_registro).toLocaleDateString()}</span>
                  </div>

                  {selectedEmpresa.padre && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Empresa matriz: {selectedEmpresa.padre}</span>
                    </div>
                  )}

                  {selectedEmpresa.referencia && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Referencia:</strong> {selectedEmpresa.referencia}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Selecciona una ubicación en el mapa para ver sus detalles.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista Rápida</CardTitle>
              <CardDescription>Ubicaciones filtradas ({filteredEmpresas.length})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredEmpresas.map((empresa) => (
                  <div
                    key={empresa.id_empresa_sucursal}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                      selectedEmpresa?.id_empresa_sucursal === empresa.id_empresa_sucursal
                        ? "bg-muted border-primary"
                        : ""
                    }`}
                    onClick={() => handleEmpresaSelect(empresa)}
                  >
                    <div className="flex items-center gap-2">
                      {empresa.tipo === "empresa" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Store className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{empresa.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {empresa.nombre_colonia}, {empresa.nombre_estado}
                        </p>
                      </div>
                      <Badge
                        variant={empresa.estado_operativo === "activa" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {empresa.estado_operativo === "activa" ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                ))}

                {filteredEmpresas.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No se encontraron ubicaciones con los filtros aplicados.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
