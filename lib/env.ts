import { z } from 'zod'

/**
 * Environment Variables Validation
 * Ensures all critical environment variables are present and valid
 * Fails fast with descriptive error messages if any are missing or invalid
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // NextAuth/Authentication
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  
  // Email (for password recovery)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, "SMTP_PORT must be a number").optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Sentry (observability)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // File Upload (if using cloud storage)
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  
  // Redis (for caching, if needed)
  REDIS_URL: z.string().optional(),
  
  // External Backend API (for sensor data integration)
  NEXT_PUBLIC_EXTERNAL_API_URL: z.string().url("NEXT_PUBLIC_EXTERNAL_API_URL must be a valid URL").optional(),
  EXTERNAL_API_URL: z.string().url("EXTERNAL_API_URL must be a valid URL").optional(),
  
  // WebSocket Configuration
  NEXT_PUBLIC_WS_URL: z.string().url("NEXT_PUBLIC_WS_URL must be a valid WebSocket URL").optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate and parse environment variables
 * Call this at app startup to ensure all required vars are present
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`
      }).join('\n')
      
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
      )
    }
    throw error
  }
}

// Validate environment on import (fail-fast)
export const env = validateEnv()

// Export individual environment variables for convenience
export const {
  DATABASE_URL,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  JWT_SECRET,
  NODE_ENV,
  NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = env

// External API URLs (optional, for backend integration)
export const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || process.env.NEXT_PUBLIC_EXTERNAL_API_URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_EXTERNAL_API_URL?.replace('http://', 'ws://').replace('https://', 'wss://'))

export default env