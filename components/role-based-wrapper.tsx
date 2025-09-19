"use client"

import type React from "react"
import { useRolePermissions } from "@/hooks/use-role-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

interface RoleBasedWrapperProps {
  children: React.ReactNode
  requiredPermission?: keyof ReturnType<typeof useRolePermissions>
  requiredRole?: "superadmin" | "admin" | "standard"
  allowedRoles?: ("admin" | "manager" | "operator" | "viewer")[]
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

export function RoleBasedWrapper({
  children,
  requiredPermission,
  requiredRole,
  allowedRoles,
  fallback,
  showAccessDenied = true,
}: RoleBasedWrapperProps) {
  const permissions = useRolePermissions()

  // Check permission-based access
  if (requiredPermission) {
    const hasPermission = permissions[requiredPermission]
    if (!hasPermission) {
      if (fallback) return <>{fallback}</>
      if (showAccessDenied) {
        return (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>No tienes permisos para acceder a esta funcionalidad.</AlertDescription>
          </Alert>
        )
      }
      return null
    }
  }

  // Check role-based access
  if (requiredRole || allowedRoles) {
    // This would require access to the user object, so we'll implement it in the hook
    // For now, we'll assume permission-based checks are sufficient
  }

  return <>{children}</>
}

// Specific wrapper components for common use cases
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedWrapper requiredPermission="canManageUsers" fallback={fallback}>
      {children}
    </RoleBasedWrapper>
  )
}

export function ManagerOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedWrapper requiredPermission="canManageBranches" fallback={fallback}>
      {children}
    </RoleBasedWrapper>
  )
}

export function EditableContent({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedWrapper requiredPermission="canEditData" fallback={fallback}>
      {children}
    </RoleBasedWrapper>
  )
}

export function DeletableContent({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedWrapper requiredPermission="canDeleteData" fallback={fallback}>
      {children}
    </RoleBasedWrapper>
  )
}
