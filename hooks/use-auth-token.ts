"use client"

import { useEffect, useState } from 'react'

interface AuthToken {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export function useAuthToken() {
  const [authToken, setAuthToken] = useState<AuthToken>({
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  })

  useEffect(() => {
    // Verificar si hay tokens en localStorage (para desarrollo)
    // En producción, los tokens se manejan con cookies httpOnly
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (accessToken && refreshToken) {
      setAuthToken({
        accessToken,
        refreshToken,
        isAuthenticated: true
      })
    }
  }, [])

  const setTokens = (accessToken: string, refreshToken: string) => {
    // Guardar en localStorage para desarrollo
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    
    setAuthToken({
      accessToken,
      refreshToken,
      isAuthenticated: true
    })
  }

  const clearTokens = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    setAuthToken({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    })
  }

  const getAuthHeaders = () => {
    if (!authToken.accessToken) {
      return {}
    }

    return {
      'Authorization': `Bearer ${authToken.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  return {
    ...authToken,
    setTokens,
    clearTokens,
    getAuthHeaders
  }
}
