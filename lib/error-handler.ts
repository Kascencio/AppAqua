/**
 * Error Handler Utility
 * 
 * Provides consistent error handling, retry logic, and user-friendly messages
 * for backend API calls throughout the application.
 */

import { BackendApiError } from "./backend-client"

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: any, attempt: number) => boolean
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1s
  maxDelay: 10000, // 10s
  shouldRetry: (error: any, attempt: number) => {
    // Retry on network errors or 5xx server errors
    if (error instanceof BackendApiError) {
      const statusCode = error.statusCode || 0
      return statusCode === 0 || (statusCode >= 500 && statusCode < 600)
    }
    return false
  },
}

/**
 * Exponential backoff delay calculation
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 0.3 * exponentialDelay // Add 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt < opts.maxRetries && opts.shouldRetry(error, attempt)) {
        const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay)
        console.warn(
          `[Error Handler] Attempt ${attempt}/${opts.maxRetries} failed. Retrying in ${Math.round(delay)}ms...`,
          error
        )
        await sleep(delay)
        continue
      }

      // No more retries or shouldn't retry this error
      break
    }
  }

  // All retries exhausted
  throw lastError
}

/**
 * Get user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof BackendApiError) {
    // Use backend error message if available
    return error.message || "Error en el servidor"
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes("fetch")) {
      return "Error de conexión. Verifica tu conexión a internet."
    }
    if (error.message.includes("timeout")) {
      return "La solicitud ha tardado demasiado. Intenta de nuevo."
    }
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Ha ocurrido un error inesperado"
}

/**
 * Format error for logging/debugging
 */
export function formatErrorForLogging(error: unknown): Record<string, any> {
  if (error instanceof BackendApiError) {
    return {
      type: "BackendApiError",
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    type: "Unknown",
    value: String(error),
  }
}

/**
 * Handle API errors with consistent logging and user feedback
 */
export async function handleApiCall<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    retry?: RetryOptions
    onError?: (error: unknown) => void
    silent?: boolean
  }
): Promise<T> {
  try {
    // Apply retry logic if specified
    if (options?.retry) {
      return await withRetry(fn, options.retry)
    }
    return await fn()
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    const errorDetails = formatErrorForLogging(error)

    // Log error
    if (!options?.silent) {
      console.error(`[Error Handler] ${operation} failed:`, errorDetails)
    }

    // Call custom error handler if provided
    if (options?.onError) {
      options.onError(error)
    }

    // Re-throw with user-friendly message
    throw new Error(errorMessage)
  }
}

/**
 * Categorize errors by type for better handling
 */
export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  SERVER = "server",
  UNKNOWN = "unknown",
}

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof BackendApiError) {
    const statusCode = error.statusCode || 0

    if (statusCode === 0) return ErrorCategory.NETWORK
    if (statusCode === 401) return ErrorCategory.AUTHENTICATION
    if (statusCode === 403) return ErrorCategory.AUTHORIZATION
    if (statusCode === 404) return ErrorCategory.NOT_FOUND
    if (statusCode >= 400 && statusCode < 500) return ErrorCategory.VALIDATION
    if (statusCode >= 500) return ErrorCategory.SERVER
  }

  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return ErrorCategory.NETWORK
    }
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Get recommended action message based on error category
 */
export function getErrorAction(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return "Verifica tu conexión a internet e intenta de nuevo."
    case ErrorCategory.AUTHENTICATION:
      return "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
    case ErrorCategory.AUTHORIZATION:
      return "No tienes permisos para realizar esta acción."
    case ErrorCategory.VALIDATION:
      return "Por favor, verifica los datos ingresados."
    case ErrorCategory.NOT_FOUND:
      return "El recurso solicitado no existe."
    case ErrorCategory.SERVER:
      return "Error en el servidor. Intenta de nuevo más tarde."
    case ErrorCategory.UNKNOWN:
    default:
      return "Por favor, intenta de nuevo. Si el problema persiste, contacta a soporte."
  }
}
