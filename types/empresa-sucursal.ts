export type EmpresaSucursalTipo = "empresa" | "sucursal"
export type EmpresaSucursalEstado = "activa" | "inactiva"

export interface EmpresaSucursal {
  id_empresa_sucursal: number
  id_padre?: number | null
  nombre: string
  tipo: "empresa" | "sucursal"
  telefono?: string | null
  email?: string | null
  estado_operativo: "activa" | "inactiva"
  fecha_registro: string
  id_estado: number
  id_cp: number
  id_colonia: number
  calle: string
  numero_int_ext?: string | null
  referencia?: string | null
}

export interface EmpresaSucursalCompleta extends EmpresaSucursal {
  nombre_estado?: string
  nombre_municipio?: string
  codigo_postal?: string
  nombre_colonia?: string
  padre?: string
}

// Legacy compatibility
export interface Branch extends EmpresaSucursal {
  // Mapeo de campos legacy a nuevos
  id: number
  name: string
  parentId?: number | null
  type: "company" | "branch"
  phone?: string | null
  email?: string | null
  status: "active" | "inactive"
  registrationDate: string
  address: {
    street: string
    number?: string | null
    reference?: string | null
    stateId: number
    postalCodeId: number
    neighborhoodId: number
  }
  location?: {
    lat: number
    lng: number
  }
}

// Función para convertir EmpresaSucursal a Branch (legacy)
export function empresaSucursalToBranch(empresa: EmpresaSucursal): Branch {
  return {
    ...empresa,
    id: empresa.id_empresa_sucursal,
    name: empresa.nombre,
    parentId: empresa.id_padre,
    type: empresa.tipo === "empresa" ? "company" : "branch",
    phone: empresa.telefono,
    email: empresa.email,
    status: empresa.estado_operativo === "activa" ? "active" : "inactive",
    registrationDate: empresa.fecha_registro,
    address: {
      street: empresa.calle,
      number: empresa.numero_int_ext,
      reference: empresa.referencia,
      stateId: empresa.id_estado,
      postalCodeId: empresa.id_cp,
      neighborhoodId: empresa.id_colonia,
    },
  }
}
