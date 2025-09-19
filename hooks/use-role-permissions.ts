"use client"

import { useAuth } from "@/context/auth-context"
import type { User } from "@/types/user"

export interface RolePermissions {
  // Navigation permissions
  canViewDashboard: boolean
  canManageBranches: boolean
  canManageInstallations: boolean
  canViewSensors: boolean
  canViewSpecies: boolean
  canViewProcesses: boolean
  canManageUsers: boolean
  canAccessSettings: boolean
  canAccessSystemSettings: boolean

  // Data permissions
  canCreateData: boolean
  canEditData: boolean
  canDeleteData: boolean
  canExportData: boolean

  // Monitoring permissions
  canViewRealTimeData: boolean
  canManageAlerts: boolean
  canViewReports: boolean

  // Branch/Facility specific permissions
  hasRestrictedAccess: boolean
  allowedBranches: string[]
  allowedFacilities: string[]
}

export function useRolePermissions(): RolePermissions {
  const { user } = useAuth()

  if (!user) {
    return {
      canViewDashboard: false,
      canManageBranches: false,
      canManageInstallations: false,
      canViewSensors: false,
      canViewSpecies: false,
      canViewProcesses: false,
      canManageUsers: false,
      canAccessSettings: false,
      canAccessSystemSettings: false,
      canCreateData: false,
      canEditData: false,
      canDeleteData: false,
      canExportData: false,
      canViewRealTimeData: false,
      canManageAlerts: false,
      canViewReports: false,
      hasRestrictedAccess: true,
      allowedBranches: [],
      allowedFacilities: [],
    }
  }

  const getBranchAccess = (user: User): string[] => {
    return user.branchAccess && Array.isArray(user.branchAccess) ? user.branchAccess : []
  }

  const getFacilityAccess = (user: User): string[] => {
    return (user as any).facilityAccess && Array.isArray((user as any).facilityAccess)
      ? (user as any).facilityAccess
      : []
  }

  switch (user.role) {
    case "superadmin":
      return {
        canViewDashboard: true,
        canManageBranches: true,
        canManageInstallations: true,
        canViewSensors: true,
        canViewSpecies: true,
        canViewProcesses: true,
        canManageUsers: true,
        canAccessSettings: true,
        canAccessSystemSettings: true,
        canCreateData: true,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
        canViewRealTimeData: true,
        canManageAlerts: true,
        canViewReports: true,
        hasRestrictedAccess: false,
        allowedBranches: [], // Empty means all branches
        allowedFacilities: [], // Empty means all facilities
      }
    case "admin":
      return {
        canViewDashboard: true,
        canManageBranches: true,
        canManageInstallations: true,
        canViewSensors: true,
        canViewSpecies: true,
        canViewProcesses: true,
        canManageUsers: true,
        canAccessSettings: true,
        canAccessSystemSettings: false,
        canCreateData: true,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
        canViewRealTimeData: true,
        canManageAlerts: true,
        canViewReports: true,
        hasRestrictedAccess: false,
        allowedBranches: [],
        allowedFacilities: [],
      }

    case "standard":
      return {
        canViewDashboard: true,
        canManageBranches: false,
        canManageInstallations: false,
        canViewSensors: true,
        canViewSpecies: true,
        canViewProcesses: true,
        canManageUsers: false,
        canAccessSettings: true,
        canAccessSystemSettings: false,
        canCreateData: false,
        canEditData: false,
        canDeleteData: false,
        canExportData: true,
        canViewRealTimeData: true,
        canManageAlerts: false,
        canViewReports: true,
        hasRestrictedAccess: true,
        allowedBranches: getBranchAccess(user),
        allowedFacilities: getFacilityAccess(user),
      }

    default:
      return {
        canViewDashboard: false,
        canManageBranches: false,
        canManageInstallations: false,
        canViewSensors: false,
        canViewSpecies: false,
        canViewProcesses: false,
        canManageUsers: false,
        canAccessSettings: false,
        canAccessSystemSettings: false,
        canCreateData: false,
        canEditData: false,
        canDeleteData: false,
        canExportData: false,
        canViewRealTimeData: false,
        canManageAlerts: false,
        canViewReports: false,
        hasRestrictedAccess: true,
        allowedBranches: [],
        allowedFacilities: [],
      }
  }
}

// Helper function to check if user can access specific branch
export function canAccessBranch(permissions: RolePermissions, branchId: string): boolean {
  if (!permissions.hasRestrictedAccess) return true // Admin has access to all
  return permissions.allowedBranches.includes(branchId)
}

// Helper function to check if user can access specific facility
export function canAccessFacility(permissions: RolePermissions, facilityId: string, branchId?: string): boolean {
  if (!permissions.hasRestrictedAccess) return true // Admin has access to all

  // If user has specific facility access, check that
  if (permissions.allowedFacilities.length > 0) {
    return permissions.allowedFacilities.includes(facilityId)
  }

  // Otherwise, check if they have access to the branch
  if (branchId) {
    return permissions.allowedBranches.includes(branchId)
  }

  return false
}
