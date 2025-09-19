/**
 * Utilidades para el almacenamiento y persistencia de datos
 * Simula una capa de base de datos usando localStorage
 */

import type { Branch } from "@/types/branch"
import type { Facility } from "@/types/facility"
import type { User } from "@/types/user"

// Claves para localStorage
const STORAGE_KEYS = {
  BRANCHES: "aquacontrol_branches",
  USERS: "aquacontrol_users",
}

// Función para cargar datos iniciales si no existen en localStorage
const initializeData = () => {
  // Datos iniciales de sucursales
  const initialBranches: Branch[] = [
    {
      id: "1",
      name: "Sucursal Paraíso",
      location: "Paraíso, Tabasco",
      coordinates: [18.3956, -93.2094],
      status: "active",
      facilities: [
        {
          id: "1-1",
          name: "Estanque Principal",
          type: "estanque",
          waterQuality: {
            ph: {
              value: 7.2,
              minValue: 6.5,
              maxValue: 8.0,
              sensorId: "pH-S01",
            },
            temperature: {
              value: 24.5,
              minValue: 22.0,
              maxValue: 28.0,
              sensorId: "Temp-S01",
            },
            oxygen: {
              value: 6.8,
              minValue: 5.0,
              maxValue: 9.0,
              sensorId: "Oxy-S01",
            },
            salinity: {
              value: 12.3,
              minValue: 10.0,
              maxValue: 15.0,
              sensorId: "Sal-S01",
            },
            turbidity: {
              value: 15.7,
              minValue: 5.0,
              maxValue: 25.0,
              sensorId: "Turb-S01",
            },
            nitrates: {
              value: 4.2,
              minValue: 0.5,
              maxValue: 10.0,
              sensorId: "Nit-S01",
            },
          },
          sensors: ["pH-S01", "Temp-S01", "Oxy-S01", "Sal-S01", "Turb-S01", "Nit-S01"],
        },
        {
          id: "1-2",
          name: "Unidad de Purificación",
          type: "purificacion",
          waterQuality: {
            ph: {
              value: 7.0,
              minValue: 6.5,
              maxValue: 7.5,
              sensorId: "pH-S02",
            },
            temperature: {
              value: 22.0,
              minValue: 20.0,
              maxValue: 24.0,
              sensorId: "Temp-S02",
            },
            oxygen: {
              value: 7.2,
              minValue: 6.0,
              maxValue: 8.0,
              sensorId: "Oxy-S02",
            },
          },
          sensors: ["pH-S02", "Temp-S02", "Oxy-S02"],
        },
        {
          id: "1-3",
          name: "Estanque de Reproducción",
          type: "estanque",
          waterQuality: {
            ph: {
              value: 7.3,
              minValue: 6.8,
              maxValue: 7.8,
              sensorId: "pH-S06",
            },
            temperature: {
              value: 25.2,
              minValue: 24.0,
              maxValue: 26.0,
              sensorId: "Temp-S06",
            },
            oxygen: {
              value: 7.0,
              minValue: 6.5,
              maxValue: 8.5,
              sensorId: "Oxy-S06",
            },
            salinity: {
              value: 11.5,
              minValue: 10.0,
              maxValue: 13.0,
              sensorId: "Sal-S04",
            },
          },
          sensors: ["pH-S06", "Temp-S06", "Oxy-S06", "Sal-S04"],
        },
      ],
    },
    {
      id: "2",
      name: "Sucursal Villahermosa",
      location: "Villahermosa, Tabasco",
      coordinates: [17.9892, -92.9281],
      status: "active",
      facilities: [
        {
          id: "2-1",
          name: "Estanque Camarón",
          type: "estanque",
          waterQuality: {
            ph: {
              value: 7.5,
              minValue: 7.0,
              maxValue: 8.0,
              sensorId: "pH-S03",
            },
            temperature: {
              value: 26.0,
              minValue: 24.0,
              maxValue: 28.0,
              sensorId: "Temp-S03",
            },
            oxygen: {
              value: 6.5,
              minValue: 5.5,
              maxValue: 7.5,
              sensorId: "Oxy-S03",
            },
            salinity: {
              value: 10.8,
              minValue: 9.0,
              maxValue: 12.0,
              sensorId: "Sal-S02",
            },
          },
          sensors: ["pH-S03", "Temp-S03", "Oxy-S03", "Sal-S02"],
        },
        {
          id: "2-2",
          name: "Unidad de Tratamiento",
          type: "purificacion",
          waterQuality: {
            ph: {
              value: 7.1,
              minValue: 6.8,
              maxValue: 7.4,
              sensorId: "pH-S07",
            },
            temperature: {
              value: 23.5,
              minValue: 22.0,
              maxValue: 25.0,
              sensorId: "Temp-S07",
            },
            oxygen: {
              value: 7.5,
              minValue: 7.0,
              maxValue: 8.0,
              sensorId: "Oxy-S07",
            },
            turbidity: {
              value: 8.2,
              minValue: 5.0,
              maxValue: 15.0,
              sensorId: "Turb-S03",
            },
          },
          sensors: ["pH-S07", "Temp-S07", "Oxy-S07", "Turb-S03"],
        },
      ],
    },
    {
      id: "3",
      name: "Sucursal Comalcalco",
      location: "Comalcalco, Tabasco",
      coordinates: [18.2647, -93.2236],
      status: "active",
      facilities: [
        {
          id: "3-1",
          name: "Estanque Tilapia",
          type: "estanque",
          waterQuality: {
            ph: {
              value: 6.8,
              minValue: 6.0,
              maxValue: 7.5,
              sensorId: "pH-S04",
            },
            temperature: {
              value: 25.5,
              minValue: 23.0,
              maxValue: 27.0,
              sensorId: "Temp-S04",
            },
            oxygen: {
              value: 5.9,
              minValue: 5.0,
              maxValue: 7.0,
              sensorId: "Oxy-S04",
            },
            salinity: {
              value: 8.5,
              minValue: 7.0,
              maxValue: 10.0,
              sensorId: "Sal-S03",
            },
            turbidity: {
              value: 12.3,
              minValue: 5.0,
              maxValue: 20.0,
              sensorId: "Turb-S02",
            },
            ammonia: {
              value: 0.8,
              minValue: 0.0,
              maxValue: 2.0,
              sensorId: "Amm-S01",
            },
          },
          sensors: ["pH-S04", "Temp-S04", "Oxy-S04", "Sal-S03", "Turb-S02", "Amm-S01"],
        },
        {
          id: "3-2",
          name: "Estanque de Crecimiento",
          type: "estanque",
          waterQuality: {
            ph: {
              value: 7.0,
              minValue: 6.5,
              maxValue: 7.5,
              sensorId: "pH-S08",
            },
            temperature: {
              value: 24.8,
              minValue: 23.0,
              maxValue: 26.0,
              sensorId: "Temp-S08",
            },
            oxygen: {
              value: 6.2,
              minValue: 5.5,
              maxValue: 7.0,
              sensorId: "Oxy-S08",
            },
            nitrates: {
              value: 3.8,
              minValue: 1.0,
              maxValue: 5.0,
              sensorId: "Nit-S03",
            },
          },
          sensors: ["pH-S08", "Temp-S08", "Oxy-S08", "Nit-S03"],
        },
      ],
    },
    {
      id: "4",
      name: "Sucursal Cárdenas",
      location: "Cárdenas, Tabasco",
      coordinates: [18.0014, -93.3761],
      status: "inactive",
      facilities: [
        {
          id: "4-1",
          name: "Estanque Experimental",
          type: "estanque",
          waterQuality: {
            ph: {
              value: 7.1,
              minValue: 6.5,
              maxValue: 7.5,
              sensorId: "pH-S05",
            },
            temperature: {
              value: 23.0,
              minValue: 21.0,
              maxValue: 25.0,
              sensorId: "Temp-S05",
            },
            oxygen: {
              value: 7.0,
              minValue: 6.0,
              maxValue: 8.0,
              sensorId: "Oxy-S05",
            },
            nitrates: {
              value: 3.5,
              minValue: 1.0,
              maxValue: 5.0,
              sensorId: "Nit-S02",
            },
          },
          sensors: ["pH-S05", "Temp-S05", "Oxy-S05", "Nit-S02"],
        },
        {
          id: "4-2",
          name: "Unidad de Investigación",
          type: "purificacion",
          waterQuality: {
            ph: {
              value: 7.2,
              minValue: 6.8,
              maxValue: 7.6,
              sensorId: "pH-S09",
            },
            temperature: {
              value: 22.5,
              minValue: 21.0,
              maxValue: 24.0,
              sensorId: "Temp-S09",
            },
            oxygen: {
              value: 6.8,
              minValue: 6.0,
              maxValue: 7.5,
              sensorId: "Oxy-S09",
            },
            ammonia: {
              value: 0.5,
              minValue: 0.0,
              maxValue: 1.0,
              sensorId: "Amm-S02",
            },
          },
          sensors: ["pH-S09", "Temp-S09", "Oxy-S09", "Amm-S02"],
        },
      ],
    },
  ]

  // Datos iniciales de usuarios
  const initialUsers: User[] = [
    {
      id: "1",
      name: "Administrador",
      email: "admin@aquacontrol.com",
      role: "admin",
      status: "active",
      avatar: "/placeholder.svg?height=40&width=40",
      branchAccess: ["1", "2", "3", "4"], // Acceso a todas las sucursales
      lastLogin: new Date().toISOString(),
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      name: "Gerente Paraíso",
      email: "gerente.paraiso@aquacontrol.com",
      role: "manager",
      status: "active",
      branchAccess: ["1"], // Solo acceso a Sucursal Paraíso
      lastLogin: "2023-05-15T10:30:00.000Z",
      createdAt: "2023-01-15T00:00:00.000Z",
      updatedAt: "2023-01-15T00:00:00.000Z",
    },
    {
      id: "3",
      name: "Operador Villahermosa",
      email: "operador.villahermosa@aquacontrol.com",
      role: "operator",
      status: "active",
      branchAccess: ["2"], // Solo acceso a Sucursal Villahermosa
      lastLogin: "2023-05-14T08:45:00.000Z",
      createdAt: "2023-02-01T00:00:00.000Z",
      updatedAt: "2023-02-01T00:00:00.000Z",
    },
    {
      id: "4",
      name: "Visualizador",
      email: "visualizador@aquacontrol.com",
      role: "viewer",
      status: "active",
      branchAccess: ["1", "2", "3", "4"], // Acceso a todas las sucursales (solo lectura)
      lastLogin: "2023-05-10T14:20:00.000Z",
      createdAt: "2023-03-01T00:00:00.000Z",
      updatedAt: "2023-03-01T00:00:00.000Z",
    },
    {
      id: "5",
      name: "Usuario Pendiente",
      email: "pendiente@aquacontrol.com",
      role: "viewer",
      status: "pending",
      branchAccess: [],
      createdAt: "2023-05-01T00:00:00.000Z",
      updatedAt: "2023-05-01T00:00:00.000Z",
    },
  ]

  // Guardar datos iniciales si no existen
  if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(initialBranches))
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers))
  }
}

// Funciones para operaciones CRUD de sucursales
export const branchService = {
  // Obtener todas las sucursales
  getAll: (): Branch[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCHES)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error al obtener sucursales:", error)
      return []
    }
  },

  // Obtener una sucursal por ID
  getById: (id: string): Branch | null => {
    try {
      const branches = branchService.getAll()
      return branches.find((branch) => branch.id === id) || null
    } catch (error) {
      console.error(`Error al obtener sucursal con ID ${id}:`, error)
      return null
    }
  },

  // Crear una nueva sucursal
  create: (branch: Branch): Branch => {
    try {
      const branches = branchService.getAll()
      const newBranches = [...branches, branch]
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(newBranches))
      return branch
    } catch (error) {
      console.error("Error al crear sucursal:", error)
      throw error
    }
  },

  // Actualizar una sucursal existente
  update: (updatedBranch: Branch): Branch => {
    try {
      const branches = branchService.getAll()
      const index = branches.findIndex((branch) => branch.id === updatedBranch.id)

      if (index === -1) {
        throw new Error(`No se encontró la sucursal con ID ${updatedBranch.id}`)
      }

      branches[index] = updatedBranch
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches))
      return updatedBranch
    } catch (error) {
      console.error(`Error al actualizar sucursal con ID ${updatedBranch.id}:`, error)
      throw error
    }
  },

  // Eliminar una sucursal
  delete: (id: string): boolean => {
    try {
      const branches = branchService.getAll()
      const newBranches = branches.filter((branch) => branch.id !== id)

      if (branches.length === newBranches.length) {
        return false // No se encontró la sucursal
      }

      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(newBranches))
      return true
    } catch (error) {
      console.error(`Error al eliminar sucursal con ID ${id}:`, error)
      return false
    }
  },

  // Actualizar el estado de una sucursal
  updateStatus: (id: string, status: "active" | "inactive"): boolean => {
    try {
      const branch = branchService.getById(id)
      if (!branch) return false

      branch.status = status
      branchService.update(branch)
      return true
    } catch (error) {
      console.error(`Error al actualizar estado de sucursal con ID ${id}:`, error)
      return false
    }
  },
}

// Funciones para operaciones CRUD de instalaciones
export const facilityService = {
  // Obtener todas las instalaciones de todas las sucursales
  getAll: (): (Facility & { branchId: string })[] => {
    try {
      const branches = branchService.getAll()
      const allFacilities: (Facility & { branchId: string })[] = []

      branches.forEach((branch) => {
        branch.facilities.forEach((facility) => {
          allFacilities.push({
            ...facility,
            branchId: branch.id,
          })
        })
      })

      return allFacilities
    } catch (error) {
      console.error("Error al obtener todas las instalaciones:", error)
      return []
    }
  },

  // Obtener todas las instalaciones de una sucursal
  getAllByBranchId: (branchId: string): Facility[] => {
    try {
      const branch = branchService.getById(branchId)
      return branch ? branch.facilities : []
    } catch (error) {
      console.error(`Error al obtener instalaciones de la sucursal ${branchId}:`, error)
      return []
    }
  },

  // Obtener una instalación específica
  getById: (branchId: string, facilityId: string): Facility | null => {
    try {
      const facilities = facilityService.getAllByBranchId(branchId)
      return facilities.find((facility) => facility.id === facilityId) || null
    } catch (error) {
      console.error(`Error al obtener instalación ${facilityId}:`, error)
      return null
    }
  },

  // Crear una nueva instalación
  create: (branchId: string, facility: Facility): Facility => {
    try {
      const branch = branchService.getById(branchId)
      if (!branch) throw new Error(`No se encontró la sucursal con ID ${branchId}`)

      branch.facilities.push(facility)
      branchService.update(branch)
      return facility
    } catch (error) {
      console.error(`Error al crear instalación en sucursal ${branchId}:`, error)
      throw error
    }
  },

  // Actualizar una instalación existente
  update: (branchId: string, updatedFacility: Facility): Facility => {
    try {
      const branch = branchService.getById(branchId)
      if (!branch) throw new Error(`No se encontró la sucursal con ID ${branchId}`)

      const index = branch.facilities.findIndex((facility) => facility.id === updatedFacility.id)
      if (index === -1) {
        throw new Error(`No se encontró la instalación con ID ${updatedFacility.id}`)
      }

      branch.facilities[index] = updatedFacility
      branchService.update(branch)
      return updatedFacility
    } catch (error) {
      console.error(`Error al actualizar instalación ${updatedFacility.id}:`, error)
      throw error
    }
  },

  // Eliminar una instalación
  delete: (branchId: string, facilityId: string): boolean => {
    try {
      const branch = branchService.getById(branchId)
      if (!branch) return false

      const initialLength = branch.facilities.length
      branch.facilities = branch.facilities.filter((facility) => facility.id !== facilityId)

      if (initialLength === branch.facilities.length) {
        return false // No se encontró la instalación
      }

      branchService.update(branch)
      return true
    } catch (error) {
      console.error(`Error al eliminar instalación ${facilityId}:`, error)
      return false
    }
  },
}

// Funciones para operaciones CRUD de sensores
export const sensorService = {
  // Añadir un sensor a una instalación
  addSensor: (branchId: string, facilityId: string, sensorId: string): boolean => {
    try {
      const facility = facilityService.getById(branchId, facilityId)
      if (!facility) return false

      if (!facility.sensors.includes(sensorId)) {
        facility.sensors.push(sensorId)
        facilityService.update(branchId, facility)
      }

      return true
    } catch (error) {
      console.error(`Error al añadir sensor ${sensorId}:`, error)
      return false
    }
  },

  // Eliminar un sensor de una instalación
  removeSensor: (branchId: string, facilityId: string, sensorId: string): boolean => {
    try {
      const facility = facilityService.getById(branchId, facilityId)
      if (!facility) return false

      const initialLength = facility.sensors.length
      facility.sensors = facility.sensors.filter((id) => id !== sensorId)

      if (initialLength === facility.sensors.length) {
        return false // No se encontró el sensor
      }

      // También eliminar referencias en waterQuality
      Object.entries(facility.waterQuality).forEach(([param, config]) => {
        if (config.sensorId === sensorId) {
          config.sensorId = undefined
        }
      })

      facilityService.update(branchId, facility)
      return true
    } catch (error) {
      console.error(`Error al eliminar sensor ${sensorId}:`, error)
      return false
    }
  },

  // Actualizar parámetro de calidad del agua
  updateWaterQualityParameter: (
    branchId: string,
    facilityId: string,
    paramName: string,
    paramConfig: {
      value: number
      minValue?: number
      maxValue?: number
      sensorId?: string
    },
  ): boolean => {
    try {
      const facility = facilityService.getById(branchId, facilityId)
      if (!facility) return false

      facility.waterQuality[paramName] = paramConfig
      facilityService.update(branchId, facility)
      return true
    } catch (error) {
      console.error(`Error al actualizar parámetro ${paramName}:`, error)
      return false
    }
  },
}

// Funciones para operaciones CRUD de usuarios
export const userService = {
  // Obtener todos los usuarios
  getAll: (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      return []
    }
  },

  // Obtener un usuario por ID
  getById: (id: string): User | null => {
    try {
      const users = userService.getAll()
      return users.find((user) => user.id === id) || null
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error)
      return null
    }
  },

  // Crear un nuevo usuario
  create: (user: User): User => {
    try {
      const users = userService.getAll()

      // Verificar si ya existe un usuario con el mismo email
      const existingUser = users.find((u) => u.email === user.email)
      if (existingUser) {
        throw new Error(`Ya existe un usuario con el email ${user.email}`)
      }

      const newUsers = [...users, user]
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers))
      return user
    } catch (error) {
      console.error("Error al crear usuario:", error)
      throw error
    }
  },

  // Actualizar un usuario existente
  update: (updatedUser: User): User => {
    try {
      const users = userService.getAll()
      const index = users.findIndex((user) => user.id === updatedUser.id)

      if (index === -1) {
        throw new Error(`No se encontró el usuario con ID ${updatedUser.id}`)
      }

      // Verificar si ya existe otro usuario con el mismo email
      const existingUserWithEmail = users.find((u) => u.email === updatedUser.email && u.id !== updatedUser.id)
      if (existingUserWithEmail) {
        throw new Error(`Ya existe un usuario con el email ${updatedUser.email}`)
      }

      users[index] = updatedUser
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
      return updatedUser
    } catch (error) {
      console.error(`Error al actualizar usuario con ID ${updatedUser.id}:`, error)
      throw error
    }
  },

  // Eliminar un usuario
  delete: (id: string): boolean => {
    try {
      const users = userService.getAll()
      const newUsers = users.filter((user) => user.id !== id)

      if (users.length === newUsers.length) {
        return false // No se encontró el usuario
      }

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers))
      return true
    } catch (error) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error)
      return false
    }
  },

  // Actualizar el estado de un usuario
  updateStatus: (id: string, status: "active" | "inactive" | "pending"): boolean => {
    try {
      const user = userService.getById(id)
      if (!user) return false

      user.status = status
      user.updatedAt = new Date().toISOString()
      userService.update(user)
      return true
    } catch (error) {
      console.error(`Error al actualizar estado de usuario con ID ${id}:`, error)
      return false
    }
  },

  // Actualizar el rol de un usuario
  updateRole: (id: string, role: "admin" | "manager" | "operator" | "viewer"): boolean => {
    try {
      const user = userService.getById(id)
      if (!user) return false

      user.role = role
      user.updatedAt = new Date().toISOString()
      userService.update(user)
      return true
    } catch (error) {
      console.error(`Error al actualizar rol de usuario con ID ${id}:`, error)
      return false
    }
  },

  // Actualizar el acceso a sucursales de un usuario
  updateBranchAccess: (id: string, branchAccess: string[]): boolean => {
    try {
      const user = userService.getById(id)
      if (!user) return false

      user.branchAccess = branchAccess
      user.updatedAt = new Date().toISOString()
      userService.update(user)
      return true
    } catch (error) {
      console.error(`Error al actualizar acceso a sucursales de usuario con ID ${id}:`, error)
      return false
    }
  },

  // Registrar inicio de sesión
  recordLogin: (id: string): boolean => {
    try {
      const user = userService.getById(id)
      if (!user) return false

      user.lastLogin = new Date().toISOString()
      userService.update(user)
      return true
    } catch (error) {
      console.error(`Error al registrar inicio de sesión de usuario con ID ${id}:`, error)
      return false
    }
  },
}

// Inicializar datos al cargar el módulo
if (typeof window !== "undefined") {
  initializeData()
}
