"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Loader2,
  Shield,
  Clock,
  Database,
  Plus,
  Edit,
  Trash2,
  Users,
  Save,
  X,
  Eye,
  EyeOff,
  UserPlus
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import { ROLE_PERMISSIONS, USER_ROLES } from "@/lib/auth-utils"

interface TipoRol {
  id_rol: number
  nombre: string
  _count?: {
    usuario: number
  }
}

export default function TempPage() {
  const [status, setStatus] = useState<{
    api: 'loading' | 'success' | 'error'
    db: 'loading' | 'success' | 'error'
  }>({
    api: 'loading',
    db: 'loading'
  })
  const [apiInfo, setApiInfo] = useState<any>(null)
  const [dbInfo, setDbInfo] = useState<any>(null)
  
  // Estados para gestión de roles
  const [roles, setRoles] = useState<TipoRol[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<TipoRol | null>(null)
  const [roleName, setRoleName] = useState("")
  
  // Estados para gestión de usuarios
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [userFormData, setUserFormData] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    id_rol: "",
    estado: "activo"
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({})
  
  const { toast } = useToast()

  useEffect(() => {
    // Verificar estado de API
    checkApiStatus()
    // Verificar estado de DB
    checkDbStatus()
    // Cargar roles
    fetchRoles()
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true)
      // Desde la página temp, podemos obtener roles sin autenticación
      const response = await fetch('/api/roles?fromTemp=true', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        // Si falla, intentar con lista vacía
        setRoles([])
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
      setRoles([])
    } finally {
      setLoadingRoles(false)
    }
  }, [])

  const handleAddRole = () => {
    setRoleName("")
    setSelectedRole(null)
    setIsAddDialogOpen(true)
  }

  const handleEditRole = (role: TipoRol) => {
    setSelectedRole(role)
    setRoleName(role.nombre)
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
      if (selectedRole) {
        // Editar rol - SIN autenticación (solo desde página temp)
        const response = await fetch(`/api/roles?id=${selectedRole.id_rol}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            nombre: roleName,
            fromTemp: true // Indicar que viene de página temp
          }),
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
        // Crear rol - SIN autenticación (solo desde página temp)
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            nombre: roleName,
            fromTemp: true // Indicar que viene de página temp
          }),
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
      const response = await fetch(`/api/roles?id=${selectedRole.id_rol}&fromTemp=true`, {
        method: 'DELETE',
        headers: {
          'x-from-temp': 'true',
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

  // Funciones para crear usuarios
  const validateUserForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!userFormData.nombre_completo.trim()) {
      errors.nombre_completo = "El nombre completo es obligatorio"
    }

    if (!userFormData.correo.trim()) {
      errors.correo = "El correo electrónico es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(userFormData.correo)) {
      errors.correo = "El correo electrónico no es válido"
    }

    if (!userFormData.password) {
      errors.password = "La contraseña es obligatoria"
    } else if (userFormData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres"
    } else if (!/[A-Z]/.test(userFormData.password)) {
      errors.password = "La contraseña debe contener al menos una mayúscula"
    } else if (!/[a-z]/.test(userFormData.password)) {
      errors.password = "La contraseña debe contener al menos una minúscula"
    } else if (!/\d/.test(userFormData.password)) {
      errors.password = "La contraseña debe contener al menos un número"
    }

    if (userFormData.password !== userFormData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (!userFormData.id_rol) {
      errors.id_rol = "Debes seleccionar un tipo de usuario"
    }

    if (userFormData.telefono && !/^\+?[\d\s\-()]+$/.test(userFormData.telefono)) {
      errors.telefono = "El formato del teléfono no es válido"
    }

    setUserFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async () => {
    if (!validateUserForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_completo: userFormData.nombre_completo.trim(),
          correo: userFormData.correo.trim().toLowerCase(),
          telefono: userFormData.telefono.trim() || null,
          password: userFormData.password,
          id_rol: Number(userFormData.id_rol),
          estado: userFormData.estado,
          fromTemp: true, // Indicar que viene de página temp
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.detalles || 'Error al crear usuario')
      }

      toast({
        title: "Usuario creado",
        description: `El usuario "${userFormData.nombre_completo}" ha sido creado exitosamente.`,
      })

      // Resetear formulario
      setUserFormData({
        nombre_completo: "",
        correo: "",
        telefono: "",
        password: "",
        confirmPassword: "",
        id_rol: "",
        estado: "activo"
      })
      setUserFormErrors({})
      setIsAddUserDialogOpen(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Error al crear usuario',
        variant: "destructive",
      })
    }
  }

  const handleUserFormChange = (field: string, value: any) => {
    setUserFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando se modifica
    if (userFormErrors[field]) {
      setUserFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const getRolePermissions = (roleId: number): string[] => {
    const rolePermissions = ROLE_PERMISSIONS[roleId as keyof typeof ROLE_PERMISSIONS]
    return rolePermissions ? Array.from(rolePermissions) : []
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

  const checkApiStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, api: 'loading' }))
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiInfo({
          status: response.status,
          authenticated: !!data.user,
          user: data.user || null
        })
        setStatus(prev => ({ ...prev, api: 'success' }))
      } else {
        setApiInfo({
          status: response.status,
          error: 'No autenticado (esperado en página pública)'
        })
        setStatus(prev => ({ ...prev, api: 'success' }))
      }
    } catch (error: any) {
      setApiInfo({
        error: error.message || 'Error al conectar con la API'
      })
      setStatus(prev => ({ ...prev, api: 'error' }))
    }
  }

  const checkDbStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, db: 'loading' }))
      // Intentar una petición simple que no requiera autenticación
      const response = await fetch('/api/roles', {
        method: 'GET',
        credentials: 'include'
      })
      
      // Esperamos un 401 o 403, eso significa que la BD está funcionando
      if (response.status === 401 || response.status === 403 || response.status === 200) {
        setDbInfo({
          status: response.status,
          message: 'Base de datos accesible',
          requiresAuth: response.status === 401 || response.status === 403
        })
        setStatus(prev => ({ ...prev, db: 'success' }))
      } else {
        setDbInfo({
          status: response.status,
          error: 'Respuesta inesperada'
        })
        setStatus(prev => ({ ...prev, db: 'error' }))
      }
    } catch (error: any) {
      setDbInfo({
        error: error.message || 'Error al conectar con la base de datos'
      })
      setStatus(prev => ({ ...prev, db: 'error' }))
    }
  }

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Verificando...</Badge>
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Operativo</Badge>
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Error</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-blue-950 dark:via-cyan-950 dark:to-indigo-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Página Temporal
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Página accesible sin autenticación - Solo acceso directo por URL
          </p>
          <Badge variant="outline" className="mt-2">
            Ruta: /temp
          </Badge>
        </div>

        {/* Información de Acceso */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta es una página temporal que no aparece en la navegación. 
            Cualquier persona puede acceder a ella sin necesidad de iniciar sesión.
          </AlertDescription>
        </Alert>

        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
            <CardDescription>
              Verificación de conectividad y servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estado de API */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(status.api)}
                <div>
                  <div className="font-medium">API de Autenticación</div>
                  <div className="text-sm text-muted-foreground">
                    Endpoint: /api/auth/me
                  </div>
                </div>
              </div>
              {getStatusBadge(status.api)}
            </div>

            {apiInfo && (
              <div className="ml-7 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
                {apiInfo.authenticated ? (
                  <div className="space-y-1">
                    <div className="font-medium text-green-700 dark:text-green-400">
                      Usuario autenticado
                    </div>
                    <div className="text-muted-foreground">
                      {apiInfo.user?.name} ({apiInfo.user?.email})
                    </div>
                    <div className="text-muted-foreground">
                      Rol: {apiInfo.user?.role}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {apiInfo.error || 'No autenticado (esperado en página pública)'}
                  </div>
                )}
              </div>
            )}

            {/* Estado de Base de Datos */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(status.db)}
                <div>
                  <div className="font-medium">Base de Datos</div>
                  <div className="text-sm text-muted-foreground">
                    Conexión y accesibilidad
                  </div>
                </div>
              </div>
              {getStatusBadge(status.db)}
            </div>

            {dbInfo && (
              <div className="ml-7 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
                {dbInfo.error ? (
                  <div className="text-red-700 dark:text-red-400">
                    {dbInfo.error}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium text-green-700 dark:text-green-400">
                      {dbInfo.message}
                    </div>
                    {dbInfo.requiresAuth && (
                      <div className="text-muted-foreground">
                        El endpoint requiere autenticación (comportamiento esperado)
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Status HTTP: {dbInfo.status}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de la Página */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Página</CardTitle>
            <CardDescription>
              Detalles sobre esta página temporal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div className="font-medium">Acceso</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Público - No requiere autenticación
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <div className="font-medium">URL</div>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  /temp
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div className="font-medium">Temporal</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Esta página es temporal y puede ser eliminada
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div className="font-medium">No Visible</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  No aparece en navegación ni sidebar
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para Tipos de Usuario y Usuarios */}
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles">Tipos de Usuario</TabsTrigger>
            <TabsTrigger value="users">Crear Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            {/* Gestión de Tipos de Usuario */}
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gestión de Tipos de Usuario
                </CardTitle>
                <CardDescription>
                  Crear, editar y eliminar tipos de usuarios
                </CardDescription>
              </div>
              <Button onClick={handleAddRole} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear Tipo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Página Temporal:</strong> Puedes crear, editar y eliminar tipos de usuario sin autenticación.
              </AlertDescription>
            </Alert>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay tipos de usuario registrados
              </div>
            ) : (
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
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Shield className="h-4 w-4" />
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
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="users">
            {/* Crear Usuarios */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Crear Usuario
                    </CardTitle>
                    <CardDescription>
                      Crea usuarios completos con contraseña y asigna tipo de usuario sin autenticación
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddUserDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Página Temporal:</strong> Puedes crear usuarios completos sin autenticación.
                    Asigna contraseñas y tipos de usuario directamente desde aquí.
                  </AlertDescription>
                </Alert>
                
                <div className="text-center py-8 text-muted-foreground">
                  Usa el botón "Crear Usuario" para agregar nuevos usuarios al sistema.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Notas */}
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota:</strong> Esta página es accesible sin autenticación y no aparece 
            en ningún menú o navegación. Solo se puede acceder directamente escribiendo la URL 
            en el navegador: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/temp</code>
          </AlertDescription>
        </Alert>
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
        <DialogContent className="max-w-2xl">
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

            {!selectedRole && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Página Temporal:</strong> Puedes crear tipos de usuario sin autenticación.
                  {!apiInfo?.authenticated && (
                    <>
                      <br />
                      <span className="text-sm text-muted-foreground mt-1 block">
                        Para editar roles, necesitas iniciar sesión como SuperAdmin.
                      </span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            

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
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveRole}>
              <Save className="h-4 w-4 mr-2" />
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

      {/* Dialog para crear usuario */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddUserDialogOpen(false)
          setUserFormData({
            nombre_completo: "",
            correo: "",
            telefono: "",
            password: "",
            confirmPassword: "",
            id_rol: "",
            estado: "activo"
          })
          setUserFormErrors({})
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario con contraseña y asigna un tipo de usuario. Sin autenticación requerida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre Completo */}
            <div className="space-y-2">
              <Label htmlFor="nombre-completo">Nombre Completo *</Label>
              <Input
                id="nombre-completo"
                value={userFormData.nombre_completo}
                onChange={(e) => handleUserFormChange('nombre_completo', e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
              {userFormErrors.nombre_completo && (
                <p className="text-xs text-red-600">{userFormErrors.nombre_completo}</p>
              )}
            </div>

            {/* Correo */}
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico *</Label>
              <Input
                id="correo"
                type="email"
                value={userFormData.correo}
                onChange={(e) => handleUserFormChange('correo', e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
              {userFormErrors.correo && (
                <p className="text-xs text-red-600">{userFormErrors.correo}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (Opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                value={userFormData.telefono}
                onChange={(e) => handleUserFormChange('telefono', e.target.value)}
                placeholder="5512345678"
              />
              {userFormErrors.telefono && (
                <p className="text-xs text-red-600">{userFormErrors.telefono}</p>
              )}
            </div>

            {/* Tipo de Usuario */}
            <div className="space-y-2">
              <Label htmlFor="tipo-usuario">Tipo de Usuario *</Label>
              <Select
                value={userFormData.id_rol}
                onValueChange={(value) => handleUserFormChange('id_rol', value)}
              >
                <SelectTrigger id="tipo-usuario">
                  <SelectValue placeholder="Selecciona un tipo de usuario" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id_rol} value={role.id_rol.toString()}>
                      {role.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userFormErrors.id_rol && (
                <p className="text-xs text-red-600">{userFormErrors.id_rol}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={userFormData.password}
                  onChange={(e) => handleUserFormChange('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {userFormErrors.password && (
                <p className="text-xs text-red-600">{userFormErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
              </p>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={userFormData.confirmPassword}
                  onChange={(e) => handleUserFormChange('confirmPassword', e.target.value)}
                  placeholder="Repite la contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {userFormErrors.confirmPassword && (
                <p className="text-xs text-red-600">{userFormErrors.confirmPassword}</p>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={userFormData.estado}
                onValueChange={(value) => handleUserFormChange('estado', value)}
              >
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Página Temporal:</strong> Puedes crear usuarios sin autenticación.
                El usuario podrá iniciar sesión inmediatamente después de ser creado.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddUserDialogOpen(false)
              setUserFormData({
                nombre_completo: "",
                correo: "",
                telefono: "",
                password: "",
                confirmPassword: "",
                id_rol: "",
                estado: "activo"
              })
              setUserFormErrors({})
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

