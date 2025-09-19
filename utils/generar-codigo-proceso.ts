/**
 * Genera un código único para un proceso basado en la fecha de inicio y la especie
 * Formato: YYYYMM + 3 primeras letras de la especie + letra de secuencia (A, B, C...)
 *
 * @param nombreEspecie - Nombre de la especie
 * @param fechaInicio - Fecha de inicio en formato ISO string
 * @param secuencia - Número de secuencia (1 = A, 2 = B, etc.)
 * @returns Código del proceso (ej: "202501OstA")
 */
export function generarCodigoProceso(nombreEspecie: string, fechaInicio: string, secuencia = 1): string {
  const fecha = new Date(fechaInicio)
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")

  // Obtener las primeras 3 letras de la especie, limpiando caracteres especiales
  const especieCode = nombreEspecie
    .normalize("NFD") // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-zA-Z]/g, "") // Remover caracteres no alfabéticos
    .substring(0, 3)
    .toUpperCase()

  // Generar letra de secuencia (A, B, C, etc.)
  const letraSecuencia = String.fromCharCode(64 + secuencia) // A=65, B=66, etc.

  return `${año}${mes}${especieCode}${letraSecuencia}`
}

/**
 * Extrae información del código de proceso
 * @param codigo - Código del proceso (ej: "202501OstA")
 * @returns Objeto con información extraída del código
 */
export function parsearCodigoProceso(codigo: string) {
  if (!codigo || codigo.length < 8) {
    return null
  }

  const año = Number.parseInt(codigo.substring(0, 4))
  const mes = Number.parseInt(codigo.substring(4, 6))
  const especieCode = codigo.substring(6, 9)
  const secuencia = codigo.substring(9)

  return {
    año,
    mes,
    especieCode,
    secuencia,
    fechaEstimada: new Date(año, mes - 1, 1), // Primer día del mes
  }
}
