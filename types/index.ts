// ============================================================================
// TIPOS CENTRALIZADOS - AQUAMONITOR SYSTEM (ALINEADOS CON sonda.sql)
// ============================================================================
// Este archivo centraliza todos los tipos del sistema AquaMonitor
// alineados EXACTAMENTE con la estructura real de la base de datos sonda.sql
//
// ✅ VALIDADO CONTRA: sonda.sql
// ✅ TODOS LOS CAMPOS OBLIGATORIOS INCLUIDOS
// ✅ TIPOS Y NOMBRES EXACTOS DE LA BD
// ============================================================================

// ============================================================================
// 1. TIPOS PRINCIPALES DE ENTIDADES (EXACTOS DE sonda.sql)
// ============================================================================

// Tabla: empresa_sucursal
export interface EmpresaSucursal {
  id_empresa_sucursal: number
  id_padre?: number | null // FK opcional a empresa_sucursal
  nombre: string // NOT NULL
  tipo: "empresa" | "sucursal" // ENUM NOT NULL
  telefono?: string | null // VARCHAR(20) NULL
  email?: string | null // VARCHAR(100) NULL
  estado_operativo: "activa" | "inactiva" // ENUM NOT NULL
  fecha_registro: string // DATE NOT NULL (ISO string format)
  id_estado: number // FK NOT NULL
  id_cp: number // FK NOT NULL
  id_colonia: number // FK NOT NULL
  calle: string // VARCHAR(100) NOT NULL
  numero_int_ext?: string | null // VARCHAR(10) NULL
  referencia?: string | null // VARCHAR(100) NULL
}

// Tabla: instalacion
export interface Instalacion {
  id_instalacion: number
  id_empresa_sucursal: number // FK NOT NULL
  nombre_instalacion: string // VARCHAR(100) NOT NULL
  fecha_instalacion: string // DATE NOT NULL (ISO string format)
  estado_operativo: "activo" | "inactivo" // ENUM NOT NULL
  descripcion: string // VARCHAR(200) NOT NULL
  tipo_uso: "acuicultura" | "tratamiento" | "otros" // ENUM NOT NULL
  id_proceso: number // FK NOT NULL
}

// Tabla: especies
export interface Especie {
  id_especie: number
  nombre: string // VARCHAR(100) NOT NULL
}

// Tabla: procesos
export interface Proceso {
  id_proceso: number
  id_especie: number // FK NOT NULL
  id_instalacion: number // FK NOT NULL
  fecha_inicio: string // DATE NOT NULL (ISO string format)
  fecha_final: string // DATE NOT NULL (ISO string format)
}

// Tabla: catalogo_sensores
export interface CatalogoSensor {
  id_sensor: number
  modelo?: string | null // VARCHAR(45) NULL
  marca?: string | null // VARCHAR(45) NULL
  rango_medicion?: string | null // VARCHAR(45) NULL
  unidad_medida?: string | null // VARCHAR(45) NULL
  sensor: string // VARCHAR(45) NOT NULL
  descripcion: string // VARCHAR(500) NOT NULL
}

// Tabla: sensor_instalado
export interface SensorInstalado {
  id_sensor_instalado: number
  id_instalacion: number // FK NOT NULL
  id_sensor: number // FK NOT NULL
  fecha_instalada: string // DATE NOT NULL (ISO string format)
  descripcion: string // VARCHAR(15) NOT NULL
  id_lectura?: number | null // FK NULL
}

// Tabla: lectura
export interface Lectura {
  id_lectura: number
  id_sensor_instalado: number // FK NOT NULL
  valor: number // DECIMAL(10,2) NOT NULL
  fecha: string // DATE NOT NULL (ISO string format)
  hora: string // TIME NOT NULL (HH:MM:SS format)
}

// Tabla: alertas
export interface Alerta {
  id_alertas: number
  id_instalacion: number // FK NOT NULL
  id_sensor_instalado: number // FK NOT NULL
  descripcion: string // VARCHAR(100) NOT NULL
  dato_puntual: number // DECIMAL(10,2) NOT NULL
  // UI fields
  read?: boolean
  fecha?: string
  tipo_alerta?: string
  estado_alerta?: string
  title?: string
  parameter?: string
}

// Tabla: parametros
export interface Parametro {
  id_parametro: number
  nombre_parametro?: string | null // VARCHAR(100) NULL
  unidad_medida?: string | null // VARCHAR(100) NULL
}

// Tabla: especie_parametro
export interface EspecieParametro {
  id_especie_parametro: number
  id_especie: number // FK NOT NULL
  id_parametro: number // FK NOT NULL
  Rmax: number // FLOAT NOT NULL
  Rmin: number // FLOAT NOT NULL
}

// ============================================================================
// 2. TIPOS GEOGRÁFICOS (EXACTOS DE sonda.sql)
// ============================================================================

// Tabla: estados
export interface Estado {
  id_estado: number
  nombre_estado: string // VARCHAR(45) NOT NULL
}

// Tabla: municipios
export interface Municipio {
  id_municipio: number
  id_estado: number // FK NOT NULL
  nombre_municipio: string // VARCHAR(45) NOT NULL
}

// Tabla: codigos_postales
export interface CodigoPostal {
  id_cp: number
  id_municipio: number // FK NOT NULL
  codigo_postal: string // VARCHAR(10) NOT NULL
}

// Tabla: colonias
export interface Colonia {
  id_colonia: number
  id_cp: number // FK NOT NULL
  nombre_colonia: string // VARCHAR(100) NOT NULL
}

// ============================================================================
// 3. TIPOS EXTENDIDOS PARA VISTAS (CON JOINS)
// ============================================================================

// Para vistas que requieren datos relacionados
export interface EmpresaSucursalCompleta extends EmpresaSucursal {
  nombre_estado?: string
  nombre_municipio?: string
  codigo_postal?: string
  nombre_colonia?: string
  padre?: string // nombre de la empresa padre
}

export interface InstalacionCompleta extends Instalacion {
  nombre_empresa?: string
  nombre_especie?: string
  nombre_proceso?: string
}

export interface SensorInstaladoCompleto extends SensorInstalado {
  nombre_instalacion?: string
  nombre_sensor?: string
  marca_sensor?: string
  modelo_sensor?: string
  unidad_medida?: string
}

export interface LecturaPorProceso {
  id_lectura: number
  valor: number
  fecha: string
  hora: string
  id_instalacion: number
  nombre_instalacion: string
  nombre_sensor: string
  tipo_sensor: string
}

export interface ParametroMonitoreo {
  id_parametro: number
  nombre_parametro: string
  unidad_medida: string
  valor_actual?: number
  estado?: "normal" | "advertencia" | "critico"
  ultima_lectura?: string
}

// ============================================================================
// 4. TIPOS DE SISTEMA Y UTILIDADES
// ============================================================================

// Para el dashboard
export interface DashboardStats {
  total_empresas: number
  total_sucursales: number
  total_instalaciones: number
  instalaciones_activas: number
  total_especies: number
  procesos_activos: number
  alertas_activas: number
  sensores_instalados: number
  lecturas_hoy: number
}

// Para filtros
export interface FiltroFecha {
  fecha_inicio: string
  fecha_fin: string
}

// Para usuarios (no existe en BD pero se usa en la app)
export interface User {
  id: number
  name: string
  email: string
  role: "superadmin" | "admin" | "standard"
  status: "active" | "inactive" | "suspended"
  branchAccess: number[]
  phone?: string
  department?: string
  notes?: string
}

// ============================================================================
// 5. CONSTANTES Y VALIDADORES (EXACTOS DE sonda.sql)
// ============================================================================

export const TIPOS_EMPRESA = ["empresa", "sucursal"] as const
export const ESTADOS_OPERATIVOS_EMPRESA = ["activa", "inactiva"] as const
export const ESTADOS_OPERATIVOS_INSTALACION = ["activo", "inactivo"] as const
export const TIPOS_USO_INSTALACION = ["acuicultura", "tratamiento", "otros"] as const

// Validadores
export const isValidTipoEmpresa = (tipo: string): tipo is (typeof TIPOS_EMPRESA)[number] => {
  return TIPOS_EMPRESA.includes(tipo as any)
}

export const isValidEstadoOperativoEmpresa = (
  estado: string,
): estado is (typeof ESTADOS_OPERATIVOS_EMPRESA)[number] => {
  return ESTADOS_OPERATIVOS_EMPRESA.includes(estado as any)
}

export const isValidEstadoOperativoInstalacion = (
  estado: string,
): estado is (typeof ESTADOS_OPERATIVOS_INSTALACION)[number] => {
  return ESTADOS_OPERATIVOS_INSTALACION.includes(estado as any)
}

export const isValidTipoUsoInstalacion = (tipo: string): tipo is (typeof TIPOS_USO_INSTALACION)[number] => {
  return TIPOS_USO_INSTALACION.includes(tipo as any)
}

// ============================================================================
// 6. TIPOS LEGACY (COMPATIBILIDAD TEMPORAL - DEPRECATED)
// ============================================================================

/**
 * @deprecated Usar EmpresaSucursal en su lugar
 */
export interface Branch extends EmpresaSucursal { }

/**
 * @deprecated Usar Instalacion en su lugar
 */
export interface Facility extends Instalacion { }

/**
 * @deprecated Usar SensorInstalado en su lugar
 */
export interface Sensor extends SensorInstalado { }

/**
 * @deprecated Usar Especie en su lugar
 */
export interface Species extends Especie { }

/**
 * @deprecated Usar Alerta en su lugar
 */
export interface Alert extends Alerta { }

// ============================================================================
// EXPORTACIONES PRINCIPALES
// ============================================================================
// (Las interfaces ya se exportan directamente en su definición)


export interface ProcesoDetallado extends Proceso {
  nombre_especie?: string
  estado_proceso?: "activo" | "finalizado"
  dias_transcurridos?: number
}
