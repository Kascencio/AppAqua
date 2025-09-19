"use client"

// ============================================================================
// CORRECCIONES ALTO - SENSORES
// ============================================================================

// ARCHIVO: hooks/use-sensors.ts
// PROBLEMA: deleteSensor sin validar lecturas recientes
// SOLUCIÓN: Validar datos importantes antes de eliminar

export const sensoresFixes = {
  deleteSensorSecure: `
  const deleteSensor = useCallback(async (id: number) => {
    try {
      setLoading(true)
      
      const sensor = sensors.find(s => s.id_sensor_instalado === id)
      if (!sensor) {
        throw new Error("Sensor no encontrado")
      }
      
      // Validar lecturas recientes (últimas 24 horas)
      const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const tienelecturasRecientes = sensor.lastUpdated && sensor.lastUpdated > hace24Horas
      
      if (tienelecturasRecientes) {
        throw new Error("No se puede eliminar: sensor tiene lecturas recientes (últimas 24h)")
      }
      
      // Validar si es sensor crítico (por ejemplo, pH u oxígeno)
      const tiposCriticos = ['ph', 'oxygen', 'temperature']
      if (tiposCriticos.includes(sensor.type)) {
        // Verificar si es el único sensor de este tipo en la instalación
        const sensoresMismoTipo = sensors.filter(s => 
          s.id_instalacion === sensor.id_instalacion && 
          s.type === sensor.type &&
          s.id_sensor_instalado !== id
        )
        
        if (sensoresMismoTipo.length === 0) {
          throw new Error(\`No se puede eliminar: es el único sensor de \${sensor.type} en esta instalación\`)
        }
      }
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSensors(prev => prev.filter(sensor => sensor.id_sensor_instalado !== id))
      
      return true
    } catch (error) {
      console.error("Error deleting sensor:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [sensors])`,
}
