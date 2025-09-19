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
  const { branches, loading, createBranch, updateBranch, deleteBranch, toggleBranchStatus } = useBranches()

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

  const toggleBranch = (branchId: string) => {
    setExpandedBranch(expandedBranch === branchId ? null : branchId)
    setExpandedFacility(null)
  }

  const toggleFacility = (facilityId: string) => {
    setExpandedFacility(expandedFacility === facilityId ? null : facilityId)
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
    toggleBranchStatus(branch.id)
  }

  const filteredBranches = branches.filter((branch) => {
    // Filter by search term
    const matchesSearch =
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.facilities.some((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by region
    const matchesRegion = regionFilter === "todas" || branch.location.toLowerCase().includes(regionFilter.toLowerCase())

    // Filter by status
    const matchesStatus = statusFilter === "todos" || branch.status === statusFilter

    // Filter by facility type
    const matchesType = typeFilter === "todos" || branch.facilities.some((f) => f.type === typeFilter)

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
            // Filter facilities based on typeFilter
            const filteredFacilities =
              typeFilter === "todos" ? branch.facilities : branch.facilities.filter((f) => f.type === typeFilter)

            if (typeFilter !== "todos" && filteredFacilities.length === 0) {
              return null
            }

            return (
              <Card key={branch.id} className="overflow-hidden">
                <CardHeader className={`py-4 ${branch.status === "inactive" ? "bg-muted" : "bg-primary/5"}`}>
                  <div className="flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => toggleBranch(branch.id)}>
                      <CardTitle className="text-xl flex items-center">
                        {branch.name}
                        <Badge variant={branch.status === "active" ? "default" : "outline"} className="ml-2">
                          {branch.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" /> {branch.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {branch.facilities.length} instalaciones
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
                      <div className="cursor-pointer" onClick={() => toggleBranch(branch.id)}>
                        {expandedBranch === branch.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {expandedBranch === branch.id && (
                  <CardContent className="pt-4">
                    <h3 className="text-lg font-medium mb-4">Instalaciones</h3>
                    <div className="space-y-4">
                      {filteredFacilities.map((facility) => (
                        <Card key={facility.id} className="overflow-hidden">
                          <CardHeader
                            className="p-4 bg-muted/50 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleFacility(facility.id)}
                          >
                            <div>
                              <h4 className="text-base font-medium">{facility.name}</h4>
                              <p className="text-sm text-muted-foreground">Tipo: {facility.type}</p>
                            </div>
                            <div className="flex items-center space-x-4 flex-wrap">
                              <div className="flex items-center text-sm">
                                <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                                <span>{facility.waterQuality.ph.value} pH</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Thermometer className="h-4 w-4 mr-1 text-red-500" />
                                <span>{facility.waterQuality.temperature.value}°C</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Activity className="h-4 w-4 mr-1 text-green-500" />
                                <span>{facility.waterQuality.oxygen.value} mg/L</span>
                              </div>
                              {expandedFacility === facility.id ? (
                                <ChevronUp className="h-5 w-5 ml-2" />
                              ) : (
                                <ChevronDown className="h-5 w-5 ml-2" />
                              )}
                            </div>
                          </CardHeader>

                          {expandedFacility === facility.id && (
                            <FacilityDetails facility={facility} branchId={branch.id} />
                          )}
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      <AddBranchDialog open={addBranchOpen} onOpenChange={setAddBranchOpen} onAddBranch={createBranch} />

      <EditBranchDialog
        open={editBranchOpen}
        onOpenChange={setEditBranchOpen}
        onUpdateBranch={updateBranch}
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
