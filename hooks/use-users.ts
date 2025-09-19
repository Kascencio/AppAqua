"use client"

import { useState, useEffect, useCallback } from "react"
import type { User } from "@/types/user"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/usuarios")
      if (!response.ok) throw new Error("Error al cargar usuarios")
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return {
    users,
    loading,
    error,
    loadUsers,
  }
}
