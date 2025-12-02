#!/usr/bin/env ts-node
/**
 * Database Schema Alignment Verification Script
 * Compares the actual database schema with Prisma schema definition
 * Ensures no drift between production DB and application models
 * 
 * Usage: pnpm run verify:db-alignment
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { env } from '../lib/env'

interface SchemaComparisonResult {
  aligned: boolean
  differences: string[]
  warnings: string[]
}

async function verifyDatabaseAlignment(): Promise<SchemaComparisonResult> {
  const result: SchemaComparisonResult = {
    aligned: true,
    differences: [],
    warnings: []
  }

  console.log('🔍 Verificando alineación de esquemas de base de datos...\n')

  try {
    // Step 1: Check if we can connect to the database
    console.log('1. Verificando conexión a la base de datos...')
    
    try {
      execSync('npx prisma db pull --print', { 
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
      })
      console.log('✅ Conexión exitosa\n')
    } catch (error) {
      console.log('❌ Error de conexión a la base de datos')
      result.aligned = false
      result.differences.push('No se puede conectar a la base de datos')
      return result
    }

    // Step 2: Generate schema from database
    console.log('2. Generando esquema desde la base de datos actual...')
    
    const dbSchema = execSync('npx prisma db pull --print', { 
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
    })

    // Step 3: Read current Prisma schema
    console.log('3. Leyendo esquema Prisma actual...')
    
    if (!existsSync('prisma/schema.prisma')) {
      result.aligned = false
      result.differences.push('Archivo prisma/schema.prisma no encontrado')
      return result
    }

    const currentSchema = readFileSync('prisma/schema.prisma', 'utf8')

    // Step 4: Basic comparison (simplified)
    console.log('4. Comparando esquemas...')
    
    // Extract model names from both schemas
    const dbModels = extractModelNames(dbSchema)
    const prismaModels = extractModelNames(currentSchema)

    // Check for missing tables
    const missingInPrisma = dbModels.filter(model => !prismaModels.includes(model))
    const missingInDB = prismaModels.filter(model => !dbModels.includes(model))

    if (missingInPrisma.length > 0) {
      result.aligned = false
      result.differences.push(`Tablas en BD pero no en Prisma: ${missingInPrisma.join(', ')}`)
    }

    if (missingInDB.length > 0) {
      result.aligned = false  
      result.differences.push(`Modelos en Prisma pero no en BD: ${missingInDB.join(', ')}`)
    }

    // Check for specific V4 tables
    const expectedV4Tables = ['organizacion', 'organizacion_sucursal', 'catalogo_especies', 'especies_instaladas']
    const missingV4Tables = expectedV4Tables.filter(table => !dbModels.includes(table))
    
    if (missingV4Tables.length > 0) {
      result.aligned = false
      result.differences.push(`Tablas V4 faltantes en BD: ${missingV4Tables.join(', ')}`)
    }

    // Step 5: Check migration state
    console.log('5. Verificando estado de migraciones...')
    
    try {
      const migrationStatus = execSync('npx prisma migrate status', { 
        encoding: 'utf8',
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
      })
      
      if (migrationStatus.includes('pending')) {
        result.warnings.push('Hay migraciones pendientes por aplicar')
      }
    } catch (error) {
      result.warnings.push('No se pudo verificar el estado de las migraciones')
    }

    console.log('6. Análisis completado\n')

  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
    result.aligned = false
    result.differences.push(`Error de verificación: ${error}`)
  }

  return result
}

function extractModelNames(schema: string): string[] {
  const modelRegex = /model\s+(\w+)\s*{/g
  const models: string[] = []
  let match

  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1])
  }

  return models
}

function printResults(result: SchemaComparisonResult) {
  console.log('📊 RESULTADO DE LA VERIFICACIÓN')
  console.log('================================')

  if (result.aligned) {
    console.log('✅ Los esquemas están ALINEADOS')
    console.log('   La base de datos y Prisma coinciden correctamente')
  } else {
    console.log('❌ Los esquemas NO están alineados')
    console.log('   Se requieren acciones para sincronizar')
  }

  if (result.differences.length > 0) {
    console.log('\n🔧 DIFERENCIAS ENCONTRADAS:')
    result.differences.forEach((diff, index) => {
      console.log(`   ${index + 1}. ${diff}`)
    })
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:')
    result.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`)
    })
  }

  if (!result.aligned) {
    console.log('\n📝 PASOS RECOMENDADOS:')
    console.log('   1. Revisar las diferencias listadas arriba')
    console.log('   2. Aplicar migraciones pendientes: npx prisma migrate deploy')
    console.log('   3. O regenerar Prisma desde BD: npx prisma db pull && npx prisma generate')
    console.log('   4. Ejecutar este script nuevamente para verificar')
    console.log('\n   Para más detalles, consultar: docs/db-alignment.md')
  }

  console.log('\n================================')
}

// Main execution
async function main() {
  try {
    const result = await verifyDatabaseAlignment()
    printResults(result)
    
    // Exit with error code if not aligned (for CI)
    if (!result.aligned) {
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  }
}

// Only run if called directly
if (require.main === module) {
  main()
}

export { verifyDatabaseAlignment }