export interface User {
  id: string
  name: string
  email: string
  role: "superadmin" | "admin" | "standard"
  status: "active" | "inactive" | "pending"
  avatar?: string
  branchAccess: string[] // IDs de las empresas a las que tiene acceso
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
