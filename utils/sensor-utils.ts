// Counters for sensor IDs
const sensorCounters: Record<string, number> = {
  ph: 10, // Start from 10 since we already have pH-S01 to pH-S09
  temperature: 10,
  oxygen: 10,
  salinity: 5,
  turbidity: 4,
  nitrates: 4,
  ammonia: 3,
  barometric: 1,
}

// Get the next available sensor ID for a given type
export function getNextSensorId(type: string): string {
  // Normalize type
  const normalizedType = type.toLowerCase()

  // Get prefix based on type
  let prefix = ""
  switch (normalizedType) {
    case "ph":
      prefix = "pH-S"
      break
    case "temperatura":
    case "temperature":
      prefix = "Temp-S"
      break
    case "oxígeno":
    case "oxygen":
      prefix = "Oxy-S"
      break
    case "salinidad":
    case "salinity":
      prefix = "Sal-S"
      break
    case "turbidez":
    case "turbidity":
      prefix = "Turb-S"
      break
    case "nitratos":
    case "nitrates":
      prefix = "Nit-S"
      break
    case "amonio":
    case "ammonia":
      prefix = "Amm-S"
      break
    case "barométrico":
    case "barometric":
    case "presión":
    case "pressure":
      prefix = "Baro-S"
      break
    default:
      prefix = "Sens-S"
  }

  // Get counter for this type
  const counter = sensorCounters[normalizedType] || 1

  // Increment counter
  sensorCounters[normalizedType] = counter + 1

  // Format counter with leading zeros
  const formattedCounter = counter.toString().padStart(2, "0")

  // Return ID
  return `${prefix}${formattedCounter}`
}
