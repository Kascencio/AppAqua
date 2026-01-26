"use client"

import { useState } from "react"
import {
  Building2,
  Search,
  Plus,
  MapPin,
  ChevronDown,
  ChevronUp,
  Droplets,
  Thermometer,
  Activity,
  Edit,
  Trash2,
  Power,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Branch } from "@/types/branch"
import FacilityDetails from "@/components/facility-details"
import AddBranchDialog from "@/components/add-branch-dialog"
import EditBranchDialog from "@/components/edit-branch-dialog"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { useBranches } from "@/hooks/use-branches"
import { Skeleton } from "@/components/ui/skeleton"

export default function BranchesPage() {
  const { branches, loading, addBranch, updateBranch, deleteBranch } = useBranches()

  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("todas")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null)

  // Diálogos
  const [addBranchOpen, setAddBranchOpen] = useState(false)
  const [editBranchOpen, setEditBranchOpen] = useState(false)
  const [deleteBranchOpen, setDeleteBranchOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

  // Helper to get location as string
  const getLocationString = (branch: Branch): string => {
    if (typeof branch.location === 'string') return branch.location
    if (branch.location && typeof branch.location === 'object') {
      return `${branch.location.lat}, ${branch.location.lng}`
    }
    return branch.address?.street || branch.calle || ''
  }

  // Helper to get facilities safely
  const getFacilities = (branch: Branch) => branch.facilities || []

  const toggleBranch = (branchId: string | number) => {
    const id = String(branchId)
    setExpandedBranch(expandedBranch === id ? null : id)
    setExpandedFacility(null)
  }

  const toggleFacility = (facilityId: string | number) => {
    const id = String(facilityId)
    setExpandedFacility(expandedFacility === id ? null : id)
  }

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setEditBranchOpen(true)
  }

  const handleDeleteBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setDeleteBranchOpen(true)
  }

  const confirmDeleteBranch = () => {
    if (selectedBranch) {
      deleteBranch(selectedBranch.id)
      setDeleteBranchOpen(false)
      setSelectedBranch(null)
    }
  }

  const handleToggleStatus = (branch: Branch) => {
    // Toggle status via updateBranch
    const newStatus = branch.estado_operativo === "activa" ? "inactiva" : "activa"
    updateBranch(branch.id, { estado_operativo: newStatus })
  }

  const filteredBranches = branches.filter((branch) => {
    const locationStr = getLocationString(branch).toLowerCase()
    const facilities = getFacilities(branch)
    
    // Filter by search term
    const matchesSearch =
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationStr.includes(searchTerm.toLowerCase()) ||
      facilities.some((f) => f.name?.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by region
    const matchesRegion = regionFilter === "todas" || locationStr.includes(regionFilter.toLowerCase())

    // Filter by status
    const matchesStatus = statusFilter === "todos" || branch.status === statusFilter

    // Filter by facility type
    const matchesType = typeFilter === "todos" || facilities.some((f) => f.type === typeFilter)

    return matchesSearch && matchesRegion && matchesStatus && matchesType
  })

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center">
          <Building2 className="h-6 w-6 mr-2" />
          <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
        </div>
        <Button onClick={() => setAddBranchOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Agregar Sucursal
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra las sucursales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar sucursales..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las regiones</SelectItem>
                <SelectItem value="paraíso">Paraíso</SelectItem>
                <SelectItem value="villahermosa">Villahermosa</SelectItem>
                <SelectItem value="comalcalco">Comalcalco</SelectItem>
                <SelectItem value="cárdenas">Cárdenas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Instalación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="estanque">Estanques</SelectItem>
                <SelectItem value="purificacion">Purificación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          // Esqueletos de carga
          Array(3)
            .fill(0)
            .map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-6 w-24 mr-2" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron sucursales con los filtros actuales
          </div>
        ) : (
          filteredBranches.map((branch) => {
            const facilities = getFacilities(branch)
            // Filter facilities based on typeFilter
            const filteredFacilities =
              typeFilter === "todos" ? facilities : facilities.filter((f) => f.type === typeFilter)

            if (typeFilter !== "todos" && filteredFacilities.length === 0) {
              return null
            }

            const branchIdStr = String(branch.id)
            const locationDisplay = getLocationString(branch)

            return (
              <Card key={branch.id} className="overflow-hidden">
                <CardHeader className={`py-4 ${branch.status === "inactive" ? "bg-muted" : "bg-primary/5"}`}>
                  <div className="flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => toggleBranch(branchIdStr)}>
                      <CardTitle className="text-xl flex items-center">
                        {branch.name}
                        <Badge variant={branch.status === "active" ? "default" : "outline"} className="ml-2">
                          {branch.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" /> {locationDisplay}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {facilities.length} instalaciones
                      </Badge>
                      <div className="flex space-x-2 mr-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditBranch(branch)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteBranch(branch)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleStatus(branch)}
                          className={branch.status === "active" ? "text-amber-500" : "text-green-500"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="cursor-pointer" onClick={() => toggleBranch(branchIdStr)}>
                        {expandedBranch === branchIdStr ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {expandedBranch === branchIdStr && (
                  <CardContent className="pt-4">
                    <h3 className="text-lg font-medium mb-4">Instalaciones</h3>
                    <div className="space-y-4">
                      {filteredFacilities.map((facility) => {
                        const facilityIdStr = String(facility.id)
                        const wq = facility.waterQuality as Record<string, { value?: number }> | undefined
                        const phValue = wq?.ph?.value ?? '-'
                        const tempValue = wq?.temperature?.value ?? '-'
                        const oxygenValue = wq?.oxygen?.value ?? '-'
                        
                        return (
                          <Card key={facility.id} className="overflow-hidden">
                            <CardHeader
                              className="p-4 bg-muted/50 flex justify-between items-center cursor-pointer"
                              onClick={() => toggleFacility(facilityIdStr)}
                            >
                              <div>
                                <h4 className="text-base font-medium">{facility.name}</h4>
                                <p className="text-sm text-muted-foreground">Tipo: {facility.type}</p>
                              </div>
                              <div className="flex items-center space-x-4 flex-wrap">
                                <div className="flex items-center text-sm">
                                  <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                                  <span>{phValue} pH</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Thermometer className="h-4 w-4 mr-1 text-red-500" />
                                  <span>{tempValue}°C</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Activity className="h-4 w-4 mr-1 text-green-500" />
                                  <span>{oxygenValue} mg/L</span>
                                </div>
                                {expandedFacility === facilityIdStr ? (
                                  <ChevronUp className="h-5 w-5 ml-2" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 ml-2" />
                                )}
                              </div>
                            </CardHeader>

                            {expandedFacility === facilityIdStr && (
                              <FacilityDetails 
                                name={facility.name}
                                address={String(facility.description ?? 'N/A')}
                                city=""
                                state=""
                                zip=""
                                phoneNumber=""
                              />
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      <AddBranchDialog open={addBranchOpen} onOpenChange={setAddBranchOpen} onAddBranch={addBranch} />

      <EditBranchDialog
        open={editBranchOpen}
        onOpenChange={setEditBranchOpen}
        onEditBranch={(updated) => {
          updateBranch(updated.id_empresa_sucursal, updated)
          setEditBranchOpen(false)
        }}
        branch={selectedBranch}
      />

      <DeleteConfirmationDialog
        open={deleteBranchOpen}
        onOpenChange={setDeleteBranchOpen}
        onConfirm={confirmDeleteBranch}
        title="Eliminar Sucursal"
        description={`¿Está seguro que desea eliminar la sucursal "${selectedBranch?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
