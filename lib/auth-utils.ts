import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'aquamonitor-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

// Configuración de hash
const SALT_ROUNDS = 12

// Tipos para autenticación
export interface AuthUser {
  id_usuario: number
  id_rol: number
  nombre_completo: string
  correo: string
  telefono?: string
  estado: 'activo' | 'inactivo'
  fecha_creacion: string
}

export interface JWTPayload {
  id_usuario: number
  id_rol: number
  correo: string
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Utilidades de hash de contraseñas
export class PasswordUtils {
  /**
   * Genera hash seguro de contraseña
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS)
  }

  /**
   * Verifica contraseña contra hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Valida fortaleza de contraseña
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

// Utilidades de JWT
export class JWTUtils {
  /**
   * Genera token de acceso
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'aquamonitor',
      audience: 'aquamonitor-users'
    })
  }

  /**
   * Genera token de refresh
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'aquamonitor',
      audience: 'aquamonitor-refresh'
    })
  }

  /**
   * Genera ambos tokens
   */
  static generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
    const accessToken = this.generateAccessToken(payload)
    const refreshToken = this.generateRefreshToken(payload)
    
    // Calcular tiempo de expiración en segundos
    const expiresIn = 24 * 60 * 60 // 24 horas en segundos

    return {
      accessToken,
      refreshToken,
      expiresIn
    }
  }

  /**
   * Verifica y decodifica token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
      return decoded
    } catch (error) {
      console.error('Error verificando token:', error)
      return null
    }
  }

  /**
   * Extrae token del header Authorization
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }
}

// Utilidades de tokens de recuperación
export class RecoveryTokenUtils {
  /**
   * Genera token seguro para recuperación de contraseña
   */
  static generateRecoveryToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Genera código de verificación de 6 dígitos
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Calcula fecha de expiración (1 hora desde ahora)
   */
  static getExpirationDate(): Date {
    const expiration = new Date()
    expiration.setHours(expiration.getHours() + 1)
    return expiration
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

  /**
   * Valida datos de usuario
   */
  static validateUserData(userData: {
    nombre_completo: string
    correo: string
    telefono?: string
    password: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar nombre
    if (!userData.nombre_completo || userData.nombre_completo.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres')
    }

    // Validar email
    if (!this.isValidEmail(userData.correo)) {
      errors.push('El formato del email no es válido')
    }

    // Validar teléfono si se proporciona
    if (userData.telefono && !this.isValidPhone(userData.telefono)) {
      errors.push('El formato del teléfono no es válido')
    }

    // Validar contraseña
    const passwordValidation = PasswordUtils.validatePasswordStrength(userData.password)
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Utilidades de rate limiting
export class RateLimitUtils {
  private static attempts: Map<string, { count: number; lastAttempt: Date }> = new Map()

  /**
   * Verifica si una IP ha excedido el límite de intentos
   */
  static checkRateLimit(ip: string, maxAttempts: number = 5, windowMinutes: number = 15): boolean {
    const now = new Date()
    const key = ip
    const attempt = this.attempts.get(key)

    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now })
      return true
    }

    // Resetear contador si ha pasado el tiempo de ventana
    const timeDiff = now.getTime() - attempt.lastAttempt.getTime()
    if (timeDiff > windowMinutes * 60 * 1000) {
      this.attempts.set(key, { count: 1, lastAttempt: now })
      return true
    }

    // Verificar si ha excedido el límite
    if (attempt.count >= maxAttempts) {
      return false
    }

    // Incrementar contador
    attempt.count++
    attempt.lastAttempt = now
    this.attempts.set(key, attempt)

    return true
  }

  /**
   * Limpia intentos antiguos
   */
  static cleanupOldAttempts(): void {
    const now = new Date()
    const windowMinutes = 15

    for (const [key, attempt] of this.attempts.entries()) {
      const timeDiff = now.getTime() - attempt.lastAttempt.getTime()
      if (timeDiff > windowMinutes * 60 * 1000) {
        this.attempts.delete(key)
      }
    }
  }
}

// Utilidades de logging de seguridad
export class SecurityLogger {
  /**
   * Registra intento de login fallido
   */
  static logFailedLogin(ip: string, email: string, reason: string): void {
    console.warn(`[SECURITY] Failed login attempt from ${ip} for ${email}: ${reason}`)
  }

  /**
   * Registra login exitoso
   */
  static logSuccessfulLogin(ip: string, email: string, userId: number): void {
    console.info(`[SECURITY] Successful login from ${ip} for ${email} (user: ${userId})`)
  }

  /**
   * Registra intento de acceso no autorizado
   */
  static logUnauthorizedAccess(ip: string, endpoint: string, reason: string): void {
    console.warn(`[SECURITY] Unauthorized access attempt from ${ip} to ${endpoint}: ${reason}`)
  }

  /**
   * Registra cambio de contraseña
   */
  static logPasswordChange(userId: number, ip: string): void {
    console.info(`[SECURITY] Password changed for user ${userId} from ${ip}`)
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
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]
  return permissions ? permissions.includes(permission) : false
}

/**
 * Verifica si un usuario puede acceder a un recurso específico
 */
export function canAccessResource(userRole: number, resource: string, action: string): boolean {
  const permission = `${resource}:${action}`
  return hasPermission(userRole, permission)
}
