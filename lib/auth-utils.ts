// =====================================================
// Auth Utilities — Client-Side Only
// =====================================================
// Este archivo contiene SOLO utilidades de validación y
// constantes de roles que se usan en el frontend.
// La autenticación real se gestiona mediante cookies
// httpOnly emitidas por el backend.
// =====================================================

// Utilidades de validación de contraseñas
export class PasswordUtils {
  /**
   * Valida fortaleza de contraseña (client-side, para formularios)
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula')
    }

    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Utilidades de validación
export class ValidationUtils {
  /**
   * Valida formato de email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Valida formato de teléfono mexicano
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+52\s?)?(\d{2,3}\s?)?\d{3,4}\s?\d{3,4}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  /**
   * Sanitiza entrada de usuario
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '')
  }
}

// Configuración de roles
export const USER_ROLES = {
  SUPERADMIN: 1,
  ADMIN: 2,
  STANDARD: 3,
} as const

export const ROLE_PERMISSIONS = {
  // Superadmin: acceso total, incluida configuración del sistema
  [USER_ROLES.SUPERADMIN]: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'branches:create', 'branches:read', 'branches:update', 'branches:delete',
    'facilities:create', 'facilities:read', 'facilities:update', 'facilities:delete',
    'sensors:create', 'sensors:read', 'sensors:update', 'sensors:delete',
    'species:create', 'species:read', 'species:update', 'species:delete',
    'processes:create', 'processes:read', 'processes:update', 'processes:delete',
    'reports:read', 'reports:export',
    'system:settings'
  ],
  // Admin: gestión completa operativa, pero sin configuración de sistema
  [USER_ROLES.ADMIN]: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'branches:create', 'branches:read', 'branches:update', 'branches:delete',
    'facilities:create', 'facilities:read', 'facilities:update', 'facilities:delete',
    'sensors:create', 'sensors:read', 'sensors:update', 'sensors:delete',
    'species:create', 'species:read', 'species:update', 'species:delete',
    'processes:create', 'processes:read', 'processes:update', 'processes:delete',
    'reports:read', 'reports:export'
  ],
  // Standard: acceso básico a su área (solo lectura general)
  [USER_ROLES.STANDARD]: [
    'branches:read',
    'facilities:read',
    'sensors:read',
    'species:read',
    'processes:read',
    'reports:read'
  ],
} as const

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(userRole: number, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] as readonly string[] | undefined
  return permissions ? permissions.includes(permission) : false
}

/**
 * Verifica si un usuario puede acceder a un recurso específico
 */
export function canAccessResource(userRole: number, resource: string, action: string): boolean {
  const permission = `${resource}:${action}`
  return hasPermission(userRole, permission)
}
