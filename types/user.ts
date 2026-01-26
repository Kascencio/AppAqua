export interface User {
  id: number | string
  name: string
  email: string
  role: "superadmin" | "admin" | "standard" | "operator" | "manager" | "viewer"
  status: "active" | "inactive" | "pending" | "suspended"
  avatar?: string
  branchAccess: (string | number)[] // IDs de las empresas a las que tiene acceso
  facilityAccess?: (string | number)[] // IDs de las instalaciones a las que tiene acceso (para operadores)
  lastLogin?: string
  createdAt: string
  updatedAt?: string
  phone?: string
  department?: string
  notes?: string
}

export interface UserPermissions {
  canViewDashboard: boolean
  canManageUsers: boolean
  canManageBranches: boolean
  canManageFacilities: boolean
  canManageSensors: boolean
  canViewReports: boolean
  canExportData: boolean
  canManageAlerts: boolean
}

export interface UserActivity {
  id: string
  userId: string
  action: string
  description: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export interface UserInvitation {
  id: string
  email: string
  role: User["role"]
  branchAccess: string[]
  facilityAccess?: string[]
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: "pending" | "accepted" | "expired"
  token: string
}
