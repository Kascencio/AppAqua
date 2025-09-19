"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Droplets,
  Plus,
  Building2,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Edit,
  Trash2,
  MapPin,
  Users,
  Gauge,
} from "lucide-react"
import type { Facility } from "@/types/facility"
import { Progress } from "@/components/ui/progress"
import AddFacilityDialog from "@/components/add-facility-dialog"
import EditFacilityDialog from "@/components/edit-facility-dialog"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { useBranches } from "@/hooks/use-branches"
import { useSpecies } from "@/hooks/use-species"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

// Tipo para almacenar la información de una instalación con su sucursal
interface FacilityWithBranch extends Facility {
  branchId: string
  branchName: string
  branchLocation: string
  capacity?: number
  description?: string
  speciesId?: number // Cambiado a number para alinearse con id_especie
}

export default function FacilitiesPage() {
  const { branches, loading } = useBranches()
  const { species: speciesList } = useSpecies()
  const { toast } = useToast()

  const [facilities, setFacilities] = useState<FacilityWithBranch[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [branchFilter, setBranchFilter] = useState("todas")
  const [statusFilter, setStatusFilter] = useState("todas")
  const [activeTab, setActiveTab] = useState("todas")
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null)

  // Diálogos
  const [addFacilityOpen, setAddFacilityOpen] = useState(false)
  const [editFacilityOpen, setEditFacilityOpen] = useState(false)
  const [deleteFacilityOpen, setDeleteFacilityOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithBranch | null>(null)

  // Extraer todas las instalaciones con información de su sucursal
  useEffect(() => {
    const facilitiesWithBranch: FacilityWithBranch[] = []

    branches.forEach((branch) => {
      branch.facilities.forEach((facility) => {
        // Enrich facility data with additional properties
        facilitiesWithBranch.push({
          ...facility,
          branchId: branch.id,
          branchName: branch.name,
          branchLocation: branch.location,
          capacity: facility.capacity || Math.floor(Math.random() * 5000) + 500, // Mock capacity if not present
          description: facility.description || `Instalación de tipo ${facility.type} en ${branch.name}`,
          speciesId: facility.speciesId ? Number(facility.speciesId) : undefined, // Convertir a number
        })
      })
    })

    // Ordenar instalaciones por sucursal y luego por nombre
    facilitiesWithBranch.sort((a, b) => {
      if (a.branchName !== b.branchName) {
        return a.branchName.localeCompare(b.branchName)
      }
      return a.name.localeCompare(b.name)
    })

    setFacilities(facilitiesWithBranch)
  }, [branches])

  const handleAddFacility = async (facilityData: Omit<Facility, "id" | "sensors" | "waterQuality">) => {
    try {
      // Generate new facility ID
      const newId = `facility-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Find the selected branch
      const selectedBranch = branches.find((b) => b.id === facilityData.branchId)
      if (!selectedBranch) {
        toast({
          title: "Error",
          description: "No se pudo encontrar la sucursal seleccionada.",
          variant: "destructive",
        })
        return
      }

      // Create new facility with mock water quality data
      const newFacility: FacilityWithBranch = {
        id: newId,
        name: facilityData.name,
        type: facilityData.type,
        branchId: facilityData.branchId,
        branchName: selectedBranch.name,
        branchLocation: selectedBranch.location,
        capacity: facilityData.capacity || 1000,
        description: facilityData.description || "",
        speciesId: facilityData.speciesId ? Number(facilityData.speciesId) : undefined,
        sensors: [], // Start with no sensors
        waterQuality: {
          // Mock initial water quality parameters
          ph: { value: 7.2, minValue: 6.5, maxValue: 8.5 },
          temperature: { value: 24.5, minValue: 20, maxValue: 28 },
          oxygen: { value: 6.8, minValue: 5.0, maxValue: 10.0 },
          salinity: { value: 35.2, minValue: 30, maxValue: 40 },
          turbidity: { value: 2.1, minValue: 0, maxValue: 5 },
          nitrates: { value: 0.8, minValue: 0, maxValue: 2.0 },
          ammonia: { value: 0.1, minValue: 0, maxValue: 0.5 },
        },
      }

      setFacilities((prev) => [...prev, newFacility])

      toast({
        title: "Instalación creada",
        description: `La instalación "${facilityData.name}" ha sido creada exitosamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la instalación",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleEditFacility = (facility: FacilityWithBranch) => {
    setSelectedFacility(facility)
    setEditFacilityOpen(true)
  }

  const handleUpdateFacility = (updatedFacility: FacilityWithBranch) => {
    setFacilities((prev) => prev.map((facility) => (facility.id === updatedFacility.id ? updatedFacility : facility)))

    toast({
      title: "Instalación actualizada",
      description: `La instalación "${updatedFacility.name}" ha sido actualizada exitosamente.`,
    })
  }

  const handleDeleteFacility = (facility: FacilityWithBranch) => {
    setSelectedFacility(facility)
    setDeleteFacilityOpen(true)
  }

  const confirmDeleteFacility = () => {
    if (selectedFacility) {
      setFacilities((prev) => prev.filter((facility) => facility.id !== selectedFacility.id))

      toast({
        title: "Instalación eliminada",
        description: `La instalación "${selectedFacility.name}" ha sido eliminada exitosamente.`,
      })

      setDeleteFacilityOpen(false)
      setSelectedFacility(null)
    }
  }

  // Manejar la expansión de una instalación
  const toggleFacility = (facilityId: string) => {
    setExpandedFacility(expandedFacility === facilityId ? null : facilityId)
  }

  // Filtrar instalaciones según los criterios seleccionados
  const filteredFacilities = facilities.filter((facility) => {
    // Filtrar por término de búsqueda
    const matchesSearch =
      searchTerm === "" ||
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.type.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtrar por tipo de instalación
    const matchesType = typeFilter === "todos" || facility.type === typeFilter

    // Filtrar por sucursal
    const matchesBranch = branchFilter === "todas" || facility.branchName === branchFilter

    // Filtrar por estado de la sucursal
    const branch = branches.find((b) => b.id === facility.branchId)
    const branchStatus = branch ? branch.status : "inactive"
    const matchesStatus = statusFilter === "todas" || branchStatus === statusFilter

    // Filtrar por pestaña activa
    const matchesTab =
      activeTab === "todas" ||
      (activeTab === "estanques" && facility.type === "estanque") ||
      (activeTab === "purificacion" && facility.type === "purificacion") ||
      (activeTab === "otros" && facility.type !== "estanque" && facility.type !== "purificacion")

    return matchesSearch && matchesType && matchesBranch && matchesStatus && matchesTab
  })

  // Obtener lista de sucursales para el filtro
  const branchOptions = [
    { value: "todas", label: "Todas las sucursales" },
    ...branches.map((branch) => ({
      value: branch.name,
      label: branch.name,
    })),
  ]

  // Obtener lista de tipos de instalaciones para el filtro
  const typeOptions = [
    { value: "todos", label: "Todos los tipos" },
    ...Array.from(new Set(facilities.map((f) => f.type))).map((type) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    })),
  ]

  // Contar instalaciones por tipo
  const estanqueCount = facilities.filter((f) => f.type === "estanque").length
  const purificacionCount = facilities.filter((f) => f.type === "purificacion").length
  const otrosCount = facilities.filter((f) => f.type !== "estanque" && f.type !== "purificacion").length

  // Contar sensores totales
  const totalSensors = facilities.reduce((acc, facility) => acc + facility.sensors.length, 0)

  // Contar alertas (parámetros fuera de rango)
  const alertCount = facilities.reduce((acc, facility) => {
    let facilityAlerts = 0
    Object.entries(facility.waterQuality).forEach(([key, param]) => {
      if (param.value < (param.minValue || 0) || param.value > (param.maxValue || 100)) {
        facilityAlerts++
      }
    })
    return acc + facilityAlerts
  }, 0)

  // Función para verificar si una instalación tiene alertas
  const hasAlerts = (facility: FacilityWithBranch): boolean => {
    return Object.entries(facility.waterQuality).some(
      ([_, param]) => param.value < (param.minValue || 0) || param.value > (param.maxValue || 100),
    )
  }

  // Función para obtener el color de estado de una instalación
  const getFacilityStatusColor = (facility: FacilityWithBranch): string => {
    const branch = branches.find((b) => b.id === facility.branchId)
    if (!branch || branch.status === "inactive") return "bg-gray-100 dark:bg-gray-800"

    return hasAlerts(facility) ? "bg-amber-50 dark:bg-amber-900/20" : "bg-green-50 dark:bg-green-900/20"
  }

  // Función para obtener el ícono según el tipo de instalación
  const getFacilityIcon = (type: string) => {
    switch (type) {
      case "estanque":
        return <Droplets className="h-5 w-5 text-blue-500" />
      case "purificacion":
        return <Activity className="h-5 w-5 text-green-500" />
      case "criadero":
        return <Droplets className="h-5 w-5 text-purple-500" />
      case "laboratorio":
        return <Building2 className="h-5 w-5 text-orange-500" />
      case "almacen":
        return <Building2 className="h-5 w-5 text-gray-500" />
      default:
        return <Droplets className="h-5 w-5 text-purple-500" />
    }
  }

  // Get species name by ID - Actualizado para usar tipos reales
  const getSpeciesName = (speciesId?: number) => {
    if (!speciesId) return "Sin especie asignada"
    const species = speciesList.find((s) => s.id_especie === speciesId)
    return species ? species.nombre_comun : "Especie no encontrada"
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center">
          <Droplets className="h-6 w-6 mr-2" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Instalaciones</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              {estanqueCount} Estanques
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
              {purificacionCount} Purificación
            </Badge>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
            >
              {otrosCount} Otros
            </Badge>
          </div>
          <Button onClick={() => setAddFacilityOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Añadir Instalación
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Instalaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities.length}</div>
            <Progress className="mt-2" value={100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sensores Conectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSensors}</div>
            <Progress className="mt-2" value={(totalSensors / (facilities.length * 6)) * 100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{alertCount}</div>
            <Progress className="mt-2" value={(alertCount / facilities.length) * 100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilities.reduce((acc, f) => acc + (f.capacity || 0), 0).toLocaleString()} m³
            </div>
            <Progress className="mt-2" value={85} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra las instalaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar instalaciones..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Instalación" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full mb-4">
          <TabsTrigger value="todas">Todas ({facilities.length})</TabsTrigger>
          <TabsTrigger value="estanques">Estanques ({estanqueCount})</TabsTrigger>
          <TabsTrigger value="purificacion">Purificación ({purificacionCount})</TabsTrigger>
          <TabsTrigger value="otros">Otros ({otrosCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="space-y-4">
            {loading ? (
              // Esqueletos de carga
              Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={`skeleton-${index}`} className="overflow-hidden">
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Skeleton className="h-6 w-24 mr-2" />
                          <Skeleton className="h-6 w-6" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
            ) : filteredFacilities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No se encontraron instalaciones</h3>
                <p>No hay instalaciones que coincidan con los filtros actuales.</p>
                {facilities.length === 0 && (
                  <Button className="mt-4" onClick={() => setAddFacilityOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera instalación
                  </Button>
                )}
              </div>
            ) : (
              filteredFacilities.map((facility) => {
                const branch = branches.find((b) => b.id === facility.branchId)
                const branchStatus = branch ? branch.status : "inactive"
                const hasAlert = hasAlerts(facility)

                return (
                  <Card key={facility.id} className="overflow-hidden">
                    <CardHeader className={`py-4 ${getFacilityStatusColor(facility)}`}>
                      <div className="flex justify-between items-center">
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => toggleFacility(facility.id)}
                        >
                          {getFacilityIcon(facility.type)}
                          <div className="flex-1">
                            <CardTitle className="text-xl flex items-center">
                              {facility.name}
                              {hasAlert && <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />}
                            </CardTitle>
                            <CardDescription className="flex items-center mt-1 gap-4">
                              <span>Tipo: {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</span>
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {facility.capacity?.toLocaleString()} m³
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {getSpeciesName(facility.speciesId)}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex flex-col items-end mr-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{facility.branchName}</span>
                            </div>
                            <Badge variant={branchStatus === "active" ? "default" : "outline"} className="mt-1">
                              {branchStatus === "active" ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          <div className="flex space-x-2 mr-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditFacility(facility)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDeleteFacility(facility)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="cursor-pointer" onClick={() => toggleFacility(facility.id)}>
                            {expandedFacility === facility.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedFacility === facility.id && (
                      <>
                        <CardContent className="pt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h3 className="text-lg font-medium mb-2">Información General</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Nombre:</span>
                                  <span className="font-medium">{facility.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Tipo:</span>
                                  <span className="font-medium">
                                    {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Sucursal:</span>
                                  <span className="font-medium">{facility.branchName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Ubicación:</span>
                                  <span className="font-medium">{facility.branchLocation}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Capacidad:</span>
                                  <span className="font-medium">{facility.capacity?.toLocaleString()} m³</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Sensores:</span>
                                  <span className="font-medium">{facility.sensors.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Especie:</span>
                                  <span className="font-medium">{getSpeciesName(facility.speciesId)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium mb-2">Parámetros Actuales</h3>
                              <div className="space-y-2">
                                {Object.entries(facility.waterQuality).map(([key, param]) => {
                                  const isOutOfRange =
                                    param.value < (param.minValue || 0) || param.value > (param.maxValue || 100)

                                  return (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                                      </span>
                                      <span className={`font-medium ${isOutOfRange ? "text-amber-600" : ""}`}>
                                        {param.value.toFixed(1)}
                                        {key === "temperature"
                                          ? "°C"
                                          : key === "oxygen" || key === "nitrates" || key === "ammonia"
                                            ? " mg/L"
                                            : key === "salinity"
                                              ? " ppt"
                                              : key === "turbidity"
                                                ? " NTU"
                                                : ""}
                                        {isOutOfRange && (
                                          <AlertTriangle className="h-3 w-3 ml-1 inline text-amber-500" />
                                        )}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                          {facility.description && (
                            <div className="mt-4">
                              <h3 className="text-lg font-medium mb-2">Descripción</h3>
                              <p className="text-sm text-muted-foreground">{facility.description}</p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-0 pb-4">
                          <Button variant="outline" size="sm">
                            Ver Sensores
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditFacility(facility)}>
                            Editar
                          </Button>
                          <Button size="sm">Ver Detalles Completos</Button>
                        </CardFooter>
                      </>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddFacilityDialog
        open={addFacilityOpen}
        onOpenChange={setAddFacilityOpen}
        onAddFacility={handleAddFacility}
        branches={branches}
      />

      <EditFacilityDialog
        open={editFacilityOpen}
        onOpenChange={setEditFacilityOpen}
        onUpdateFacility={handleUpdateFacility}
        facility={selectedFacility}
        branches={branches}
      />

      <DeleteConfirmationDialog
        open={deleteFacilityOpen}
        onOpenChange={setDeleteFacilityOpen}
        onConfirm={confirmDeleteFacility}
        title="Eliminar Instalación"
        description={`¿Está seguro que desea eliminar la instalación "${selectedFacility?.name}"? Esta acción no se puede deshacer y también eliminará todos los sensores asociados.`}
      />
    </div>
  )
}
