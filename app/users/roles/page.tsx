"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Trash2, Shield, Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/page-header"
import { useToast } from "@/hooks/use-toast"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ROLE_PERMISSIONS, USER_ROLES } from "@/lib/auth-utils"

interface TipoRol {
  id_rol: number
  nombre: string
  _count?: {
    usuario: number
  }
}

interface PermissionGroup {
  category: string
  label: string
  permissions: {
    key: string
    label: string
    description: string
  }[]
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: "users",
    label: "Usuarios",
    permissions: [
      { key: "users:create", label: "Crear usuarios", description: "Permite crear nuevos usuarios" },
      { key: "users:read", label: "Ver usuarios", description: "Permite ver la lista de usuarios" },
      { key: "users:update", label: "Editar usuarios", description: "Permite modificar información de usuarios" },
      { key: "users:delete", label: "Eliminar usuarios", description: "Permite desactivar o eliminar usuarios" },
    ],
  },
  {
    category: "branches",
    label: "Sucursales",
    permissions: [
      { key: "branches:create", label: "Crear sucursales", description: "Permite crear nuevas sucursales" },
      { key: "branches:read", label: "Ver sucursales", description: "Permite ver la lista de sucursales" },
      { key: "branches:update", label: "Editar sucursales", description: "Permite modificar información de sucursales" },
      { key: "branches:delete", label: "Eliminar sucursales", description: "Permite eliminar sucursales" },
    ],
  },
  {
    category: "facilities",
    label: "Instalaciones",
    permissions: [
      { key: "facilities:create", label: "Crear instalaciones", description: "Permite crear nuevas instalaciones" },
      { key: "facilities:read", label: "Ver instalaciones", description: "Permite ver la lista de instalaciones" },
      { key: "facilities:update", label: "Editar instalaciones", description: "Permite modificar información de instalaciones" },
      { key: "facilities:delete", label: "Eliminar instalaciones", description: "Permite eliminar instalaciones" },
    ],
  },
  {
    category: "sensors",
    label: "Sensores",
    permissions: [
      { key: "sensors:create", label: "Crear sensores", description: "Permite crear nuevos sensores" },
      { key: "sensors:read", label: "Ver sensores", description: "Permite ver la lista de sensores" },
      { key: "sensors:update", label: "Editar sensores", description: "Permite modificar información de sensores" },
      { key: "sensors:delete", label: "Eliminar sensores", description: "Permite eliminar sensores" },
    ],
  },
  {
    category: "species",
    label: "Especies",
    permissions: [
      { key: "species:create", label: "Crear especies", description: "Permite crear nuevas especies" },
      { key: "species:read", label: "Ver especies", description: "Permite ver la lista de especies" },
      { key: "species:update", label: "Editar especies", description: "Permite modificar información de especies" },
      { key: "species:delete", label: "Eliminar especies", description: "Permite eliminar especies" },
    ],
  },
  {
    category: "processes",
    label: "Procesos",
    permissions: [
      { key: "processes:create", label: "Crear procesos", description: "Permite crear nuevos procesos" },
      { key: "processes:read", label: "Ver procesos", description: "Permite ver la lista de procesos" },
      { key: "processes:update", label: "Editar procesos", description: "Permite modificar información de procesos" },
      { key: "processes:delete", label: "Eliminar procesos", description: "Permite eliminar procesos" },
    ],
  },
  {
    category: "reports",
    label: "Reportes",
    permissions: [
      { key: "reports:read", label: "Ver reportes", description: "Permite ver reportes y análisis" },
      { key: "reports:export", label: "Exportar reportes", description: "Permite exportar reportes en diferentes formatos" },
    ],
  },
  {
    category: "system",
    label: "Sistema",
    permissions: [
      { key: "system:settings", label: "Configuración del sistema", description: "Permite acceder a la configuración del sistema" },
    ],
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<TipoRol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<TipoRol | null>(null)
  const [roleName, setRoleName] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('access_token='))
        ?.split('=')[1] || localStorage.getItem('access_token')

      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autenticado')
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para ver roles')
        }
        throw new Error('Error al cargar roles')
      }

      const data = await response.json()
      setRoles(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar roles')
      toast({
        title: "Error",
        description: err.message || 'Error al cargar roles',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleAddRole = () => {
    setRoleName("")
    setSelectedPermissions(new Set())
    setSelectedRole(null)
    setIsAddDialogOpen(true)
  }

  const handleEditRole = (role: TipoRol) => {
    setSelectedRole(role)
    setRoleName(role.nombre)
    // Los permisos no se pueden editar desde aquí (se manejan en el código)
    setSelectedPermissions(new Set())
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (role: TipoRol) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rol es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('access_token='))
        ?.split('=')[1] || localStorage.getItem('access_token')

      if (selectedRole) {
        // Editar rol
        const response = await fetch(`/api/roles?id=${selectedRole.id_rol}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre: roleName }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al actualizar rol')
        }

        toast({
          title: "Rol actualizado",
          description: `El rol "${roleName}" ha sido actualizado exitosamente.`,
        })
        setIsEditDialogOpen(false)
      } else {
        // Crear rol
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre: roleName }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al crear rol')
        }

        toast({
          title: "Rol creado",
          description: `El rol "${roleName}" ha sido creado exitosamente.`,
        })
        setIsAddDialogOpen(false)
      }

      await fetchRoles()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Error al guardar rol',
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRole) return

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('access_token='))
        ?.split('=')[1] || localStorage.getItem('access_token')

      const response = await fetch(`/api/roles?id=${selectedRole.id_rol}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar rol')
      }

      toast({
        title: "Rol eliminado",
        description: `El rol "${selectedRole.nombre}" ha sido eliminado exitosamente.`,
      })
      setIsDeleteDialogOpen(false)
      await fetchRoles()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Error al eliminar rol',
        variant: "destructive",
      })
    }
  }

  const getRolePermissions = (roleId: number): string[] => {
    const rolePermissions = ROLE_PERMISSIONS[roleId as keyof typeof ROLE_PERMISSIONS]
    return rolePermissions || []
  }

  const isSystemRole = (nombre: string): boolean => {
    return ['superadmin', 'admin', 'standard'].includes(nombre.toLowerCase())
  }

  const getRoleColor = (nombre: string): string => {
    const lower = nombre.toLowerCase()
    if (lower === 'superadmin') return 'bg-purple-100 text-purple-800 border-purple-200'
    if (lower === 'admin') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (lower === 'standard') return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Tipos de Usuarios"
        description="Gestiona los tipos de usuarios y sus permisos de acceso"
        icon={Shield}
        actions={
          <Button onClick={handleAddRole}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Tipo de Usuario
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const permissions = getRolePermissions(role.id_rol)
          const isSystem = isSystemRole(role.nombre)
          const userCount = role._count?.usuario || 0

          return (
            <Card key={role.id_rol} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.nombre}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {isSystem ? (
                        <Badge variant="outline" className={getRoleColor(role.nombre)}>
                          Rol del Sistema
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                          Rol Personalizado
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{userCount} usuario{userCount !== 1 ? 's' : ''} asignado{userCount !== 1 ? 's' : ''}</span>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Permisos ({permissions.length})</div>
                  <div className="text-xs text-muted-foreground line-clamp-3">
                    {permissions.length > 0 ? (
                      permissions.slice(0, 3).map(p => p.split(':')[0]).join(', ') + 
                      (permissions.length > 3 ? ` +${permissions.length - 3} más` : '')
                    ) : (
                      'Sin permisos asignados'
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {!isSystem && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(role)}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={userCount > 0}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </>
                  )}
                  {isSystem && (
                    <div className="flex-1 text-xs text-muted-foreground italic">
                      Los roles del sistema no pueden ser editados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog para crear/editar rol */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setRoleName("")
          setSelectedRole(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedRole ? 'Editar Tipo de Usuario' : 'Crear Tipo de Usuario'}</DialogTitle>
            <DialogDescription>
              {selectedRole 
                ? 'Modifica el nombre del tipo de usuario. Los permisos se configuran en el código del sistema.'
                : 'Crea un nuevo tipo de usuario. Los permisos se configuran en el código del sistema.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nombre del Tipo de Usuario</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Ej: Supervisor, Operador, etc."
              />
              <p className="text-xs text-muted-foreground">
                El nombre debe ser único y descriptivo del tipo de acceso.
              </p>
            </div>

            {selectedRole && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Nota:</strong> Los permisos se gestionan en el código del sistema. 
                  Para modificar los permisos de este rol, contacta al administrador del sistema.
                </AlertDescription>
              </Alert>
            )}

            {!selectedRole && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Después de crear el tipo de usuario, 
                  los permisos deben ser configurados en el código del sistema en el archivo 
                  <code className="text-xs bg-gray-100 px-1 rounded">lib/auth-utils.ts</code>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setIsEditDialogOpen(false)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole}>
              {selectedRole ? 'Guardar Cambios' : 'Crear Tipo de Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Eliminar Tipo de Usuario"
        description={
          selectedRole
            ? `¿Está seguro que desea eliminar el tipo de usuario "${selectedRole.nombre}"? ${
                selectedRole._count && selectedRole._count.usuario > 0
                  ? `Hay ${selectedRole._count.usuario} usuario(s) asignado(s) a este tipo. Debe reasignarlos antes de eliminar.`
                  : 'Esta acción no se puede deshacer.'
              }`
            : ''
        }
      />
    </div>
  )
}



