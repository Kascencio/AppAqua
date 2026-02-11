"use client"

import { useEffect, useState } from "react"
import { useUsers } from "@/hooks/use-users"
import { useRolePermissions } from "@/hooks/use-role-permissions"
import { AdminOnly } from "@/components/role-based-wrapper"
import { branchService, facilityService } from "@/lib/storage"
import type { User } from "@/types/user"
import type { Branch } from "@/types/branch"
import type { Facility } from "@/types/facility"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import {
  Loader2,
  Search,
  UserPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Building2,
  Factory,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Phone,
  Mail,
  Key,
  Copy,
  ShieldX,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UsersPage() {
  const permissions = useRolePermissions()

  // Check if user has permission to access this page
  if (!permissions.canManageUsers) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a la gestión de usuarios. Esta funcionalidad está restringida a
            administradores.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { users, loading, loadUsers, createUser, updateUser, deleteUser, sendPasswordReset } = useUsers()
  const { toast } = useToast()

  const [branches, setBranches] = useState<(Branch | { id: string | number; name: string; status?: string })[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para diálogos
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Estados para formulario - Alineado con tipos reales
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "standard" as User["role"],
    status: "active" as User["status"],
    branchAccess: [] as (string | number)[],
    facilityAccess: [] as (string | number)[],
    phone: "",
    department: "",
    notes: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    setBranches(branchService.getAll())
    setFacilities(facilityService.getAll())
  }, [])

  // Función auxiliar para obtener acceso a sucursales de forma segura
  const getBranchAccess = (user: User): (string | number)[] => {
    return user.branchAccess && Array.isArray(user.branchAccess) ? user.branchAccess : []
  }

  // Obtener empresas asignadas al usuario
  const getUserCompanies = (user: User): string => {
    const userBranchAccess = getBranchAccess(user)
    if (userBranchAccess.length === 0) return "Sin asignar"

    const assignedBranches = branches.filter((b) => userBranchAccess.includes(String(b.id)) || userBranchAccess.includes(b.id))
    if (assignedBranches.length === 0) return "Empresas no encontradas"

    if (assignedBranches.length === 1) return assignedBranches[0].name
    return `${assignedBranches[0].name} (+${assignedBranches.length - 1} más)`
  }

  // Obtener instalaciones disponibles para un usuario según sus empresas
  const getAvailableFacilities = (branchIds: (string | number)[]): Facility[] => {
    return facilities.filter((facility) => {
      const facilityWithBranch = facility as Facility & { branchId: string | number }
      return branchIds.includes(String(facilityWithBranch.branchId)) || branchIds.includes(facilityWithBranch.branchId)
    })
  }

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (user.name ? user.name.toLowerCase().includes(term) : false) ||
      (user.email ? user.email.toLowerCase().includes(term) : false) ||
      (user.role ? user.role.toLowerCase().includes(term) : false) ||
      (user.department ? user.department.toLowerCase().includes(term) : false) ||
      getUserCompanies(user).toLowerCase().includes(term)
    )
  })

  // Validar formulario
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "El nombre es obligatorio"
    }

    if (!formData.email.trim()) {
      errors.email = "El correo electrónico es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "El correo electrónico no es válido"
    }

    // Verificar si el correo ya existe (solo para nuevos usuarios)
    if (!selectedUser && users.some((user) => user.email === formData.email)) {
      errors.email = "Este correo electrónico ya está registrado"
    }

    // Validar teléfono si se proporciona
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = "El formato del teléfono no es válido"
    }

    // Validar asignaciones según el rol
    if (formData.role === "superadmin" || formData.role === "admin") {
      // Acceso total: empresas opcionales
    } else if (formData.role === "standard") {
      if (formData.branchAccess.length === 0) {
        errors.branchAccess = "Debe asignar al menos una empresa"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Si cambia el rol, resetear asignaciones
      if (field === "role") {
        newData.branchAccess = []
      }

      // Si cambian las empresas
      if (field === "branchAccess") {
        // no-op
      }

      return newData
    })

    // Limpiar error del campo cuando el usuario lo modifica
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Manejar cambios en el acceso a sucursales
  const handleBranchAccessChange = (branchId: string | number, checked: boolean) => {
    setFormData((prev) => {
      const currentBranchAccess = prev.branchAccess || []
      let newBranchAccess: (string | number)[]

      if (checked) {
        newBranchAccess = [...currentBranchAccess, branchId]
      } else {
        newBranchAccess = currentBranchAccess.filter((id) => id !== branchId)
      }

      return {
        ...prev,
        branchAccess: newBranchAccess,
      }
    })
  }

  // Manejar cambios en el acceso a instalaciones
  const handleFacilityAccessChange = (facilityId: string | number, checked: boolean) => {
    setFormData((prev) => {
      const currentFacilityAccess = prev.facilityAccess || []
      if (checked) {
        return { ...prev, facilityAccess: [...currentFacilityAccess, facilityId] }
      } else {
        return {
          ...prev,
          facilityAccess: currentFacilityAccess.filter((id) => id !== facilityId),
        }
      }
    })
  }

  // Crear nuevo usuario
  const handleCreateUser = async () => {
    if (!validateForm()) return

    try {
      const userData = {
        ...formData,
        // Solo incluir facilityAccess si es operador
        // ...(formData.role === "operator" && { facilityAccess: formData.facilityAccess }), // Removed as per edit hint
      }

      await createUser(userData)
      setAddUserOpen(false)
      resetForm()
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el usuario. Inténtelo de nuevo.",
      })
    }
  }

  // Actualizar usuario existente
  const handleUpdateUser = async () => {
    if (!selectedUser || !validateForm()) return

    try {
      const userData = {
        ...selectedUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        branchAccess: formData.branchAccess,
        phone: formData.phone,
        department: formData.department,
        notes: formData.notes,
        // Solo incluir facilityAccess si es operador
        // ...(formData.role === "operator" && { facilityAccess: formData.facilityAccess }), // Removed as per edit hint
      }

      await updateUser(userData)
      setEditUserOpen(false)
      setSelectedUser(null)
      resetForm()
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el usuario. Inténtelo de nuevo.",
      })
    }
  }

  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await deleteUser(selectedUser.id)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario. Inténtelo de nuevo.",
      })
    }
  }

  // Abrir diálogo de edición
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      branchAccess: getBranchAccess(user),
      facilityAccess: user.facilityAccess || [],
      phone: user.phone || "",
      department: user.department || "",
      notes: user.notes || "",
    })
    setFormErrors({})
    setEditUserOpen(true)
  }

  // Abrir diálogo de eliminación
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "standard",
      status: "active",
      branchAccess: [],
      facilityAccess: [],
      phone: "",
      department: "",
      notes: "",
    })
    setFormErrors({})
  }

  // Obtener texto de rol en español
  const getRoleText = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Superadmin"
      case "admin":
        return "Administrador"
      case "standard":
        return "Estandar"
      case "operator":
        return "Operador"
      default:
        return role
    }
  }

  // Obtener descripción del rol
  const getRoleDescription = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Acceso total (sistema)"
      case "admin":
        return "Acceso completo"
      case "standard":
        return "Acceso básico a su área"
      case "operator":
        return "Acceso a operaciones"
      default:
        return ""
    }
  }

  // Obtener texto de estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  // Obtener color de badge según rol
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "standard":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "operator":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
    }
  }

  // Obtener color de badge según estado
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
    }
  }

  // Obtener ícono según rol
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <ShieldAlert className="h-4 w-4 mr-1" />
      case "admin":
        return <ShieldCheck className="h-4 w-4 mr-1" />
      case "standard":
        return <Shield className="h-4 w-4 mr-1" />
      case "operator":
        return <Factory className="h-4 w-4 mr-1" />
      default:
        return <Eye className="h-4 w-4 mr-1" />
    }
  }

  // Obtener ícono según estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case "inactive":
        return <XCircle className="h-4 w-4 mr-1" />
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  // Obtener iniciales para avatar
  const getInitials = (name?: string) => {
    const safe = (name || "").trim()
    if (safe.length === 0) return "US"
    const parts = safe.split(/\s+/)
    const initials = (parts[0]?.[0] || "U") + (parts[1]?.[0] || "")
    return initials.toUpperCase()
  }

  // Cambiar estado del usuario
  const handleToggleUserStatus = async (userId: string | number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    try {
      const user = users.find((u) => u.id === userId || String(u.id) === String(userId))
      if (!user) return

      await updateUser({
        ...user,
        status: newStatus as "active" | "inactive" | "pending",
      })

      toast({
        title: "Estado actualizado",
        description: `Usuario ${newStatus === "active" ? "activado" : "desactivado"} exitosamente`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
      })
    }
  }

  // Cambiar rol del usuario rápidamente
  const handleQuickRoleChange = async (userId: string | number, newRole: string) => {
    try {
      const user = users.find((u) => u.id === userId || String(u.id) === String(userId))
      if (!user) return

      await updateUser({
        ...user,
        role: newRole as "superadmin" | "admin" | "standard",
      })

      toast({
        title: "Rol actualizado",
        description: `Rol cambiado a ${getRoleText(newRole)} exitosamente`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el rol del usuario",
      })
    }
  }

  // Duplicar usuario
  const handleDuplicateUser = (user: User) => {
    setFormData({
      name: `${user.name} (Copia)`,
      email: "",
      role: user.role,
      status: "pending",
      branchAccess: getBranchAccess(user),
      facilityAccess: user.facilityAccess || [],
      phone: user.phone || "",
      department: user.department || "",
      notes: user.notes || "",
    })
    setFormErrors({})
    setAddUserOpen(true)
  }

  // Enviar invitación por email
  const handleSendInvitation = async (userId: string | number) => {
    try {
      const user = users.find((u) => u.id === userId || String(u.id) === String(userId))
      if (!user) return

      // Simular envío de invitación
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${user.email}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la invitación",
      })
    }
  }

  // Resetear contraseña
  const handleResetPassword = async (userId: string | number) => {
    try {
      const user = users.find((u) => u.id === userId || String(u.id) === String(userId))
      if (!user) return

      // Usar el hook para enviar email de reset real
      await sendPasswordReset(user)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo restablecer la contraseña",
      })
    }
  }

  // Ver detalles del usuario
  const handleViewUserDetails = (user: User) => {
    const userBranchAccess = getBranchAccess(user)
    const assignedBranches = branches.filter((b) => userBranchAccess.includes(String(b.id)) || userBranchAccess.includes(b.id))

    const details = [
      `Email: ${user.email}`,
      `Rol: ${getRoleText(user.role)}`,
      `Estado: ${getStatusText(user.status)}`,
      `Teléfono: ${user.phone || "No especificado"}`,
      `Departamento: ${user.department || "No especificado"}`,
      `Empresas: ${assignedBranches.length > 0 ? assignedBranches.map((b) => b.name).join(", ") : "Ninguna"}`,
      ...(user.notes ? [`Notas: ${user.notes}`] : []),
    ]

    alert(`Detalles de ${user.name}\n\n${details.join("\n")}`)
  }

  return (
    <AdminOnly>
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Gestión de Usuarios"
          description="Administre los usuarios del sistema y sus asignaciones"
          icon={Users}
          actions={
            <Button
              onClick={() => {
                resetForm()
                setAddUserOpen(true)
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          }
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{users.filter((u) => u.role === "admin").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estandar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{users.filter((u) => u.role === "standard").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.role === "operator").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No se encontraron usuarios</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Asignaciones</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar || "/placeholder.svg?height=40&width=40"} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.department || "Sin departamento"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(user.role)} flex items-center w-fit`}>
                          {getRoleIcon(user.role)}
                          {getRoleText(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadgeColor(user.status)} flex items-center w-fit`}>
                          {getStatusIcon(user.status)}
                          {getStatusText(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {getUserCompanies(user)}
                          </div>
                          {user.role === "operator" && (user as any).facilityAccess?.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <Factory className="h-3 w-3 inline mr-1" />
                              {(user as any).facilityAccess.length} instalación(es)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewUserDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateUser(user)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar usuario
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.status)}>
                              {user.status === "active" ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            {user.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleSendInvitation(user.id)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar invitación
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Restablecer contraseña
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleQuickRoleChange(user.id, "superadmin")}>
                              <ShieldAlert className="h-4 w-4 mr-2" />
                              Cambiar a Superadmin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickRoleChange(user.id, "admin")}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Cambiar a Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickRoleChange(user.id, "standard")}>
                              <Eye className="h-4 w-4 mr-2" />
                              Cambiar a Estandar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar usuario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Diálogo para añadir usuario */}
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Añadir nuevo usuario</DialogTitle>
              <DialogDescription>Completa los datos para crear un nuevo usuario en el sistema.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Información básica */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Nombre completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder="Nombre del usuario"
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Correo electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      placeholder="+52 999 123 4567"
                      className={formErrors.phone ? "border-red-500" : ""}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleFormChange("department", e.target.value)}
                      placeholder="Ej: Operaciones, Calidad, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">
                      Rol <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        handleFormChange("role", value as "superadmin" | "admin" | "standard")
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superadmin">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            <div>
                              <div>Superadmin</div>
                              <div className="text-xs text-muted-foreground">Acceso total</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                            <div>
                              <div>Admin</div>
                              <div className="text-xs text-muted-foreground">Acceso completo</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="standard">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <div>
                              <div>Estandar</div>
                              <div className="text-xs text-muted-foreground">Acceso básico</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleFormChange("status", value as "active" | "inactive" | "pending")}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Activo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-500" />
                            <span>Inactivo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span>Pendiente</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    placeholder="Notas adicionales sobre el usuario..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Asignaciones según el rol */}
              {formData.role !== "superadmin" && (
                <div className="grid gap-4 border-t pt-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Empresas asignadas {formData.role !== "admin" && <span className="text-red-500">*</span>}
                    </Label>
                    <ScrollArea className="h-[120px] border rounded-md p-2">
                      {branches.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">No hay empresas disponibles</p>
                      ) : (
                        branches.map((branch) => (
                          <div key={String(branch.id)} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={`branch-${branch.id}`}
                              checked={formData.branchAccess.some(id => String(id) === String(branch.id))}
                              onCheckedChange={(checked) => handleBranchAccessChange(branch.id, checked as boolean)}
                            />
                            <Label htmlFor={`branch-${branch.id}`} className="text-sm font-normal cursor-pointer">
                              {branch.name}
                              {branch.status === "inactive" && (
                                <span className="text-muted-foreground"> (Inactiva)</span>
                              )}
                            </Label>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                    {formErrors.branchAccess && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.branchAccess}
                      </p>
                    )}
                  </div>

                  {/* Instalaciones específicas para operadores */}
                  {formData.role === "operator" && formData.branchAccess.length > 0 && (
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1">
                        <Factory className="h-4 w-4" />
                        Instalaciones específicas (opcional)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Si no selecciona instalaciones, tendrá acceso a todas las instalaciones de las empresas
                        asignadas.
                      </p>
                      <ScrollArea className="h-[100px] border rounded-md p-2">
                        {getAvailableFacilities(formData.branchAccess).map((facility) => (
                          <div key={String(facility.id)} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={`facility-${facility.id}`}
                              checked={formData.facilityAccess.some(id => String(id) === String(facility.id))}
                              onCheckedChange={(checked) => handleFacilityAccessChange(facility.id as string | number, checked as boolean)}
                            />
                            <Label htmlFor={`facility-${facility.id}`} className="text-sm font-normal cursor-pointer">
                              {facility.name}
                              <span className="text-muted-foreground text-xs ml-1">
                                ({branches.find((b) => String(b.id) === String((facility as any).branchId))?.name})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              {formData.role === "superadmin" && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-sm font-medium">Superadmin del Sistema</span>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    Los superadmins tienen acceso completo a todo el sistema sin restricciones.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>Crear Usuario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar usuario */}
        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>Modifica los datos del usuario seleccionado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Información básica */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name" className="flex items-center gap-1">
                      Nombre completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-email" className="flex items-center gap-1">
                      Correo electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-phone">Teléfono</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      placeholder="+52 999 123 4567"
                      className={formErrors.phone ? "border-red-500" : ""}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-department">Departamento</Label>
                    <Input
                      id="edit-department"
                      value={formData.department}
                      onChange={(e) => handleFormChange("department", e.target.value)}
                      placeholder="Ej: Operaciones, Calidad, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-role">
                      Rol <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        handleFormChange("role", value as "superadmin" | "admin" | "standard")
                      }
                    >
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superadmin">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            <div>
                              <div>Superadmin</div>
                              <div className="text-xs text-muted-foreground">Acceso total</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                            <div>
                              <div>Admin</div>
                              <div className="text-xs text-muted-foreground">Acceso completo</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="standard">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <div>
                              <div>Estandar</div>
                              <div className="text-xs text-muted-foreground">Acceso básico</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleFormChange("status", value as "active" | "inactive" | "pending")}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Activo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-500" />
                            <span>Inactivo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span>Pendiente</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notas</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    placeholder="Notas adicionales sobre el usuario..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Asignaciones según el rol */}
              {formData.role !== "superadmin" && (
                <div className="grid gap-4 border-t pt-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Empresas asignadas {formData.role !== "admin" && <span className="text-red-500">*</span>}
                    </Label>
                    <ScrollArea className="h-[120px] border rounded-md p-2">
                      {branches.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">No hay empresas disponibles</p>
                      ) : (
                        branches.map((branch) => (
                          <div key={String(branch.id)} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={`edit-branch-${branch.id}`}
                              checked={formData.branchAccess.some(id => String(id) === String(branch.id))}
                              onCheckedChange={(checked) => handleBranchAccessChange(branch.id, checked as boolean)}
                            />
                            <Label htmlFor={`edit-branch-${branch.id}`} className="text-sm font-normal cursor-pointer">
                              {branch.name}
                              {branch.status === "inactive" && (
                                <span className="text-muted-foreground"> (Inactiva)</span>
                              )}
                            </Label>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                    {formErrors.branchAccess && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.branchAccess}
                      </p>
                    )}
                  </div>

                  {/* Instalaciones específicas para operadores */}
                  {formData.role === "operator" && formData.branchAccess.length > 0 && (
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1">
                        <Factory className="h-4 w-4" />
                        Instalaciones específicas (opcional)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Si no selecciona instalaciones, tendrá acceso a todas las instalaciones de las empresas
                        asignadas.
                      </p>
                      <ScrollArea className="h-[100px] border rounded-md p-2">
                        {getAvailableFacilities(formData.branchAccess).map((facility) => (
                          <div key={String(facility.id)} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={`edit-facility-${facility.id}`}
                              checked={formData.facilityAccess.some(id => String(id) === String(facility.id))}
                              onCheckedChange={(checked) => handleFacilityAccessChange(facility.id as string | number, checked as boolean)}
                            />
                            <Label
                              htmlFor={`edit-facility-${facility.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {facility.name}
                              <span className="text-muted-foreground text-xs ml-1">
                                ({branches.find((b) => String(b.id) === String((facility as any).branchId))?.name})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              {formData.role === "superadmin" && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-sm font-medium">Superadmin del Sistema</span>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    Los superadmins tienen acceso completo a todo el sistema sin restricciones.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteUser}
          title="¿Eliminar usuario?"
          description={`¿Estás seguro de que deseas eliminar al usuario ${
            selectedUser?.name || ""
          }? Esta acción no se puede deshacer.`}
        />
      </div>
    </AdminOnly>
  )
}
