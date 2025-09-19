"use client"

// ============================================================================
// CORRECCIONES CRÍTICAS - USUARIOS
// ============================================================================

// ARCHIVO: hooks/use-users.ts
// PROBLEMA: Puede eliminar último administrador
// SOLUCIÓN: Validaciones de seguridad

export const usuariosFixes = {
  // 1. Función deleteUser con validaciones de seguridad
  deleteUserSecure: `
  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      
      const userToDelete = users.find(u => u.id === userId)
      if (!userToDelete) {
        throw new Error("Usuario no encontrado")
      }
      
      // CRÍTICO: Validar que no sea el último administrador
      if (userToDelete.role === 'admin') {
        const adminCount = users.filter(u => u.role === 'admin' && u.status === 'active').length
        if (adminCount <= 1) {
          throw new Error("No se puede eliminar el último administrador del sistema")
        }
      }
      
      // Validar que no sea el usuario actual (si tenemos sesión)
      // if (userToDelete.id === currentUser?.id) {
      //   throw new Error("No puedes eliminar tu propia cuenta")
      // }
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al eliminar usuario")
      throw error
    } finally {
      setLoading(false)
    }
  }, [users])`,

  // 2. Función updateUserRole con validaciones
  updateUserRoleSecure: `
  const updateUserRole = useCallback(async (userId: string, newRole: User['role']) => {
    try {
      setLoading(true)
      
      const userToUpdate = users.find(u => u.id === userId)
      if (!userToUpdate) {
        throw new Error("Usuario no encontrado")
      }
      
      // CRÍTICO: Si está cambiando de admin a otro rol
      if (userToUpdate.role === 'admin' && newRole !== 'admin') {
        const adminCount = users.filter(u => u.role === 'admin' && u.status === 'active').length
        if (adminCount <= 1) {
          throw new Error("No se puede cambiar el rol del último administrador")
        }
      }
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, updatedAt: new Date().toISOString() }
          : user
      ))
      
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar rol")
      throw error
    } finally {
      setLoading(false)
    }
  }, [users])`,
}
