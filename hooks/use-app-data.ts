"use client"

import { useEffect, useState, useCallback } from "react"

export function useAppData() {
  const [branches, setBranches] = useState([])
  const [facilities, setFacilities] = useState([])
  const [sensors, setSensors] = useState([])
  const [alerts, setAlerts] = useState([])
  const [species, setSpecies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [branchesRes, facilitiesRes, sensorsRes, alertsRes, speciesRes] = await Promise.all([
        fetch("/api/sucursales"),
        fetch("/api/instalaciones"),
        fetch("/api/sensores"),
        fetch("/api/alertas"),
        fetch("/api/especies"),
      ])
      if (!branchesRes.ok || !facilitiesRes.ok || !sensorsRes.ok || !alertsRes.ok || !speciesRes.ok) {
        throw new Error("Error al cargar datos de la app")
      }
      setBranches(await branchesRes.json())
      setFacilities(await facilitiesRes.json())
      setSensors(await sensorsRes.json())
      setAlerts(await alertsRes.json())
      setSpecies(await speciesRes.json())
    } catch (err) {
      setError("Error al cargar datos de la app")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAllData()
  }, [refreshAllData])

  return {
    branches,
    facilities,
    sensors,
    alerts,
    species,
    isLoading: loading,
    error,
    refreshAllData,
  }
}
