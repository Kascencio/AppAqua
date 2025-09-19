"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Search, MapPin, Edit, Trash2 } from "lucide-react"
import { useBranches } from "@/hooks/use-branches"
import { useRolePermissions, canAccessBranch } from "@/hooks/use-role-permissions"
import { ManagerOrAdmin, EditableContent, DeletableContent } from "@/components/role-based-wrapper"
import AddBranchDialog from "@/components/add-branch-dialog"
import EditBranchDialog from "@/components/edit-branch-dialog"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import type { EmpresaSucursal } from "@/types/empresa-sucursal"
import { PageHeader } from "@/components/page-header"

export default function SucursalesPage() {
  const { branches, loading, addBranch, updateBranch, deleteBranch } = useBranches()
  const permissions = useRolePermissions()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<EmpresaSucursal | null>(null)

  // Filter branches based on user permissions and search term
  const filteredBranches = Array.isArray(branches)
    ? branches.filter((branch) => {
        // First check if user can access this branch
        if (!canAccessBranch(permissions, branch.id_empresa_sucursal.toString())) {
          return false
        }

        // Then apply search filter
        if (!searchTerm) return true

        const searchLower = searchTerm.toLowerCase()
        const nombre = branch.nombre || ""
        const telefono = branch.telefono || ""
        const email = branch.email || ""

        return (
          nombre.toLowerCase().includes(searchLower) ||
          telefono.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower)
        )
      })
    : []

  const handleAddBranch = (newBranch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro">) => {
    addBranch(newBranch)
  }

  const handleEditBranch = (updatedBranch: EmpresaSucursal) => {
    updateBranch(updatedBranch.id_empresa_sucursal, updatedBranch)
    setSelectedBranch(null)
  }

  const handleDeleteBranch = () => {
    if (selectedBranch) {
      deleteBranch(selectedBranch.id_empresa_sucursal)
      setSelectedBranch(null)
    }
  }

  const openEditDialog = (branch: EmpresaSucursal) => {
    setSelectedBranch(branch)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (branch: EmpresaSucursal) => {
    setSelectedBranch(branch)
    setIsDeleteDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activa":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactiva":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "activa":
        return "Activa"
      case "inactiva":
        return "Inactiva"
      default:
        return "Desconocido"
    }
  }

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case "empresa":
        return "Empresa"
      case "sucursal":
        return "Sucursal"
      default:
        return "No definido"
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "empresa":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "sucursal":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando sucursales...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-3 sm:py-6 px-2 sm:px-4">
      <PageHeader
        title="Empresas y Sucursales"
        description={
          permissions.hasRestrictedAccess
            ? `Gestión de empresas y sucursales asignadas (${permissions.allowedBranches.length} asignadas)`
            : "Gestión de empresas y sucursales del sistema"
        }
        icon={Building2}
        actions={
          <ManagerOrAdmin>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Sucursal
            </Button>
          </ManagerOrAdmin>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {permissions.hasRestrictedAccess ? "Asignadas" : "Total"}
                </p>
                <p className="text-2xl font-bold">{filteredBranches.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredBranches.filter((b) => b.tipo === "empresa").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sucursales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredBranches.filter((b) => b.tipo === "sucursal").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredBranches.filter((b) => b.estado_operativo === "activa").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque por nombre, teléfono o email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar empresas y sucursales..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access restriction notice */}
      {permissions.hasRestrictedAccess && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                Mostrando solo las empresas y sucursales a las que tienes acceso ({permissions.allowedBranches.length}{" "}
                asignadas)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <Card key={branch.id_empresa_sucursal} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{branch.nombre}</CardTitle>
                    <Badge className={getTipoColor(branch.tipo)}>{getTipoText(branch.tipo)}</Badge>
                  </div>
                  <CardDescription className="space-y-1">
                    {branch.telefono && (
                      <div className="flex items-center">
                        <span className="text-xs">📞 {branch.telefono}</span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center">
                        <span className="text-xs">✉️ {branch.email}</span>
                      </div>
                    )}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <EditableContent>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => openEditDialog(branch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </EditableContent>
                  <DeletableContent>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => openDeleteDialog(branch)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DeletableContent>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge className={getStatusColor(branch.estado_operativo)}>
                  {getStatusText(branch.estado_operativo)}
                </Badge>
              </div>

              {branch.calle && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Dirección:</span>
                  <br />
                  <span className="text-xs">
                    {branch.calle}
                    {branch.numero_int_ext && ` ${branch.numero_int_ext}`}
                  </span>
                </div>
              )}

              {branch.referencia && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Referencia:</span>
                  <br />
                  <span className="text-xs">{branch.referencia}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Registro:</span> {new Date(branch.fecha_registro).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBranches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No se encontraron resultados</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Intente con otros términos de búsqueda"
                : permissions.hasRestrictedAccess
                  ? "No tienes empresas o sucursales asignadas"
                  : "Agregue la primera empresa o sucursal"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ManagerOrAdmin>
        <AddBranchDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddBranch={handleAddBranch} />

        <EditBranchDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onEditBranch={handleEditBranch}
          branch={selectedBranch}
        />

        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteBranch}
          title="Eliminar Registro"
          description={`¿Está seguro de que desea eliminar "${selectedBranch?.nombre || ""}"? Esta acción no se puede deshacer.`}
        />
      </ManagerOrAdmin>
    </div>
  )
}
