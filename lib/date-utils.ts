/**
 * Utilidades para manejo de fechas con Prisma @db.Date / @db.DateTime
 * 
 * Prisma espera objetos Date válidos para campos DateTime.
 * Las cadenas en formato YYYY-MM-DD pueden causar problemas de parsing por timezone.
 * Esta utilidad asegura que las fechas se parseen correctamente en UTC.
 */

/**
 * Parsea una fecha string (YYYY-MM-DD o ISO-8601) a objeto Date para Prisma
 * @param dateStr - String de fecha o Date object
 * @returns Date object válido o undefined si no se puede parsear
 */
export function parseDateForPrisma(dateStr: string | Date | null | undefined): Date | undefined {
  if (dateStr === null || dateStr === undefined) return undefined
  
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? undefined : dateStr
  }
  
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim()
    if (!trimmed) return undefined
    
    // Si es formato YYYY-MM-DD, agregar componente de tiempo UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(trimmed + 'T00:00:00.000Z')
      return isNaN(d.getTime()) ? undefined : d
    }
    
    // Si ya tiene componente de tiempo, parsear directamente
    const d = new Date(trimmed)
    return isNaN(d.getTime()) ? undefined : d
  }
  
  return undefined
}

/**
 * Parsea fecha con fallback - para campos requeridos donde la fecha debe existir
 * @throws Error si no se puede parsear la fecha
 */
export function parseDateRequired(dateStr: string | Date | null | undefined, fieldName: string): Date {
  const result = parseDateForPrisma(dateStr)
  if (!result) {
    throw new Error(`Fecha inválida para ${fieldName}: ${dateStr}`)
  }
  return result
}

/**
 * Convierte fecha a string ISO para responses JSON
 */
export function formatDateForResponse(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toISOString()
}

/**
 * Convierte fecha a formato YYYY-MM-DD para inputs de tipo date
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}
