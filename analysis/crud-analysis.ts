// ============================================================================
// ANÁLISIS CRUD - REPORTE DE FUNCIONAMIENTO Y ERRORES POTENCIALES
// ============================================================================

interface CRUDAnalysis {
  module: string
  create: OperationAnalysis
  read: OperationAnalysis
  update: OperationAnalysis
  delete: OperationAnalysis
  overallStatus: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL"
  criticalIssues: string[]
  recommendations: string[]
}

interface OperationAnalysis {
  implemented: boolean
  validation: "STRONG" | "BASIC" | "WEAK" | "NONE"
  errorHandling: "EXCELLENT" | "GOOD" | "BASIC" | "POOR"
  userFeedback: "CLEAR" | "ADEQUATE" | "CONFUSING" | "MISSING"
  performance: "OPTIMIZED" | "GOOD" | "SLOW" | "PROBLEMATIC"
  issues: string[]
}

// ============================================================================
// ANÁLISIS POR MÓDULO
// ============================================================================

export const crudAnalysis: CRUDAnalysis[] = [
  {
    module: "ESPECIES",
    create: {
      implemented: true,
      validation: "STRONG",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Falta validación de nombres duplicados",
        "No valida rangos de parámetros (temp_min < temp_max)",
        "Campos opcionales no tienen validación de formato",
      ],
    },
    read: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Sin paginación para listas grandes",
        "Filtros limitados (solo búsqueda de texto)",
        "No hay ordenamiento por columnas",
      ],
    },
    update: {
      implemented: false,
      validation: "NONE",
      errorHandling: "POOR",
      userFeedback: "MISSING",
      performance: "GOOD",
      issues: [
        "CRÍTICO: Funcionalidad de edición no implementada",
        "No hay formulario de edición",
        "Botón de editar no funciona",
      ],
    },
    delete: {
      implemented: false,
      validation: "NONE",
      errorHandling: "POOR",
      userFeedback: "MISSING",
      performance: "GOOD",
      issues: [
        "CRÍTICO: Funcionalidad de eliminación no implementada",
        "No hay confirmación de eliminación",
        "No valida dependencias (especies en procesos activos)",
      ],
    },
    overallStatus: "NEEDS_IMPROVEMENT",
    criticalIssues: [
      "Edición de especies no funciona",
      "Eliminación de especies no funciona",
      "Falta validación de integridad referencial",
    ],
    recommendations: [
      "Implementar EditSpeciesDialog funcional",
      "Agregar DeleteConfirmationDialog",
      "Validar dependencias antes de eliminar",
      "Agregar paginación y filtros avanzados",
    ],
  },

  {
    module: "INSTALACIONES",
    create: {
      implemented: true,
      validation: "STRONG",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Validación de sucursal activa podría ser más estricta",
        "No valida capacidad máxima por tipo de instalación",
      ],
    },
    read: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Sin paginación para muchas instalaciones",
        "Filtros básicos (solo búsqueda de texto)",
        "No hay vista de mapa de instalaciones",
      ],
    },
    update: {
      implemented: true,
      validation: "STRONG",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Cambio de sucursal podría afectar sensores asociados",
        "No valida si hay procesos activos al cambiar tipo",
      ],
    },
    delete: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "ADEQUATE",
      performance: "GOOD",
      issues: ["No valida si hay sensores asociados", "No valida si hay procesos activos", "Confirmación muy simple"],
    },
    overallStatus: "GOOD",
    criticalIssues: ["Eliminación no valida dependencias críticas"],
    recommendations: [
      "Validar sensores y procesos antes de eliminar",
      "Mejorar confirmación de eliminación",
      "Agregar vista de dependencias",
      "Implementar soft delete para instalaciones críticas",
    ],
  },

  {
    module: "PROCESOS",
    create: {
      implemented: true,
      validation: "STRONG",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "No valida disponibilidad de instalación en fechas",
        "No valida compatibilidad especie-instalación",
        "Falta validación de recursos necesarios",
      ],
    },
    read: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Sin filtros por estado o fecha", "No hay vista de calendario", "Sin agrupación por instalación"],
    },
    update: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Cambio de fechas no valida solapamiento",
        "Cambio de instalación no valida disponibilidad",
        "No hay validación de estado de transición",
      ],
    },
    delete: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "ADEQUATE",
      performance: "GOOD",
      issues: [
        "No valida si hay lecturas de sensores",
        "No valida si hay alertas asociadas",
        "Eliminación muy permisiva para procesos activos",
      ],
    },
    overallStatus: "GOOD",
    criticalIssues: ["Falta validación de solapamiento de procesos", "Eliminación de procesos activos muy permisiva"],
    recommendations: [
      "Validar disponibilidad de instalaciones",
      "Implementar calendario de procesos",
      "Agregar validaciones de estado",
      "Mejorar confirmación para procesos activos",
    ],
  },

  {
    module: "SENSORES",
    create: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "No valida duplicación de sensores por instalación",
        "Falta validación de compatibilidad sensor-instalación",
        "No valida límites de sensores por instalación",
      ],
    },
    read: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Sin filtros por estado o tipo", "No hay vista por instalación", "Sin indicadores de conectividad"],
    },
    update: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Cambio de instalación no valida compatibilidad",
        "No hay validación de calibración",
        "Falta historial de cambios",
      ],
    },
    delete: {
      implemented: true,
      validation: "WEAK",
      errorHandling: "BASIC",
      userFeedback: "ADEQUATE",
      performance: "GOOD",
      issues: ["No valida si hay lecturas recientes", "No valida si es sensor crítico", "Eliminación muy permisiva"],
    },
    overallStatus: "GOOD",
    criticalIssues: ["Eliminación de sensores con datos recientes", "Falta validación de sensores críticos"],
    recommendations: [
      "Validar lecturas antes de eliminar",
      "Implementar soft delete para sensores",
      "Agregar indicadores de estado",
      "Mejorar filtros y vistas",
    ],
  },

  {
    module: "USUARIOS",
    create: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Validación de email muy básica", "No valida fortaleza de contraseña", "Falta validación de roles"],
    },
    read: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Sin filtros por rol o estado", "No hay paginación", "Muestra información sensible"],
    },
    update: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: [
        "Cambio de rol sin validación de permisos",
        "No hay confirmación para cambios críticos",
        "Falta auditoría de cambios",
      ],
    },
    delete: {
      implemented: true,
      validation: "WEAK",
      errorHandling: "BASIC",
      userFeedback: "CONFUSING",
      performance: "GOOD",
      issues: [
        "Eliminación de admin sin validación",
        "No valida si usuario tiene sesiones activas",
        "Muy permisivo para usuarios críticos",
      ],
    },
    overallStatus: "NEEDS_IMPROVEMENT",
    criticalIssues: [
      "Eliminación de administradores sin validación",
      "Cambios de rol sin control de permisos",
      "Información sensible expuesta",
    ],
    recommendations: [
      "Implementar validación de roles críticos",
      "Agregar auditoría de cambios",
      "Mejorar validaciones de seguridad",
      "Implementar soft delete para usuarios",
    ],
  },

  {
    module: "SUCURSALES",
    create: {
      implemented: true,
      validation: "STRONG",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Validación de ubicación geográfica básica", "No valida duplicación de nombres por empresa"],
    },
    read: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Sin vista de mapa", "Filtros limitados", "No hay agrupación por empresa"],
    },
    update: {
      implemented: true,
      validation: "STRONG",
      errorHandling: "EXCELLENT",
      userFeedback: "CLEAR",
      performance: "GOOD",
      issues: ["Cambio de empresa podría afectar instalaciones", "No valida impacto en procesos activos"],
    },
    delete: {
      implemented: true,
      validation: "BASIC",
      errorHandling: "GOOD",
      userFeedback: "ADEQUATE",
      performance: "GOOD",
      issues: ["No valida instalaciones asociadas", "No valida procesos activos", "Eliminación muy permisiva"],
    },
    overallStatus: "GOOD",
    criticalIssues: ["Eliminación sin validar instalaciones", "Cambios que afectan procesos activos"],
    recommendations: [
      "Validar dependencias antes de eliminar",
      "Implementar vista de mapa",
      "Mejorar validación de impacto",
      "Agregar confirmación detallada",
    ],
  },
]

// ============================================================================
// ERRORES CRÍTICOS CONSOLIDADOS
// ============================================================================

export const criticalErrors = [
  {
    severity: "CRITICAL",
    module: "ESPECIES",
    issue: "Edición y eliminación no implementadas",
    impact: "Funcionalidad CRUD incompleta",
    solution: "Implementar EditSpeciesDialog y DeleteConfirmationDialog",
  },
  {
    severity: "HIGH",
    module: "USUARIOS",
    issue: "Eliminación de administradores sin validación",
    impact: "Riesgo de seguridad y acceso",
    solution: "Validar roles críticos antes de eliminar",
  },
  {
    severity: "HIGH",
    module: "INSTALACIONES",
    issue: "Eliminación sin validar dependencias",
    impact: "Pérdida de integridad de datos",
    solution: "Validar sensores y procesos antes de eliminar",
  },
  {
    severity: "MEDIUM",
    module: "PROCESOS",
    issue: "Sin validación de solapamiento",
    impact: "Conflictos de recursos",
    solution: "Implementar validación de disponibilidad",
  },
  {
    severity: "MEDIUM",
    module: "SENSORES",
    issue: "Eliminación de sensores con datos recientes",
    impact: "Pérdida de datos de monitoreo",
    solution: "Implementar soft delete y validaciones",
  },
  {
    severity: "LOW",
    module: "GENERAL",
    issue: "Sin paginación en listas grandes",
    impact: "Performance degradada",
    solution: "Implementar paginación y filtros avanzados",
  },
]

// ============================================================================
// RECOMENDACIONES GENERALES
// ============================================================================

export const generalRecommendations = [
  "Implementar validación de integridad referencial en todos los módulos",
  "Agregar confirmaciones detalladas para operaciones críticas",
  "Implementar soft delete para entidades con dependencias",
  "Agregar auditoría de cambios para operaciones sensibles",
  "Mejorar filtros y paginación en todas las listas",
  "Implementar validaciones de negocio específicas",
  "Agregar indicadores de estado y conectividad",
  "Mejorar feedback visual para operaciones asíncronas",
]
