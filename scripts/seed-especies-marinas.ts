/**
 * Script para poblar la BD con especies marinas usando Prisma directamente
 * 
 * Ejecutar con: npx tsx scripts/seed-especies-marinas.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface EspecieMarina {
  nombre: string
  nombre_cientifico?: string
  descripcion?: string
}

const especiesMarinas: EspecieMarina[] = [
  {
    nombre: "Camarón Blanco del Pacífico",
    nombre_cientifico: "Litopenaeus vannamei",
    descripcion: "Principal especie de camarón cultivado. Agua salada, temp 26-32°C, salinidad 15-25 ppt",
  },
  {
    nombre: "Ostión Japonés",
    nombre_cientifico: "Crassostrea gigas",
    descripcion: "Molusco bivalvo de cultivo en zonas costeras. Filtra agua, temp 15-25°C",
  },
  {
    nombre: "Tilapia del Nilo",
    nombre_cientifico: "Oreochromis niloticus",
    descripcion: "Pez de agua dulce muy cultivado. Temp 22-30°C, pH 6.5-8.5, O2 >4mg/L",
  },
  {
    nombre: "Trucha Arcoíris",
    nombre_cientifico: "Oncorhynchus mykiss",
    descripcion: "Pez de aguas frías. Temp 10-18°C, O2 >6mg/L, pH 6.5-8.0",
  },
  {
    nombre: "Salmón del Atlántico",
    nombre_cientifico: "Salmo salar",
    descripcion: "Cultivo en jaulas marinas. Temp 8-14°C, salinidad 32-35 ppt",
  },
  {
    nombre: "Lubina Europea",
    nombre_cientifico: "Dicentrarchus labrax",
    descripcion: "Pez marino de alto valor comercial. Temp 18-24°C, salinidad 30-40 ppt",
  },
  {
    nombre: "Dorada",
    nombre_cientifico: "Sparus aurata",
    descripcion: "Cultivo mediterráneo. Temp 18-26°C, salinidad 25-40 ppt, pH 7.5-8.5",
  },
  {
    nombre: "Langostino Tigre",
    nombre_cientifico: "Penaeus monodon",
    descripcion: "Crustáceo de gran tamaño. Temp 25-30°C, salinidad 15-25 ppt",
  },
  {
    nombre: "Mejillón Chileno",
    nombre_cientifico: "Mytilus chilensis",
    descripcion: "Molusco bivalvo de cultivo en cuerdas. Temp 10-18°C, filtrador",
  },
  {
    nombre: "Corvina",
    nombre_cientifico: "Argyrosomus regius",
    descripcion: "Pez marino de rápido crecimiento. Temp 17-24°C, salinidad 30-38 ppt",
  },
  {
    nombre: "Robalo",
    nombre_cientifico: "Centropomus undecimalis",
    descripcion: "Pez eurihalino de alto valor. Temp 22-28°C, tolera agua dulce y salada",
  },
  {
    nombre: "Pargo Rojo",
    nombre_cientifico: "Lutjanus campechanus",
    descripcion: "Pez marino tropical. Temp 24-28°C, salinidad 30-36 ppt",
  },
]

async function seedEspecies() {
  console.log("🐟 Iniciando seed de especies marinas...\n")

  let exitosas = 0
  let fallidas = 0
  let omitidas = 0

  for (const especie of especiesMarinas) {
    try {
      // Verificar si ya existe
      const existente = await prisma.especies.findFirst({
        where: { nombre: especie.nombre }
      })

      if (existente) {
        console.log(`⏭️  ${especie.nombre} - Ya existe (ID: ${existente.id_especie})`)
        omitidas++
        continue
      }

      // Crear especie (nota: la tabla solo tiene id_especie y nombre según el schema)
      const created = await prisma.especies.create({
        data: {
          nombre: especie.nombre
        }
      })
      
      console.log(`✅ ${especie.nombre} (${especie.nombre_cientifico}) - ID: ${created.id_especie}`)
      exitosas++
    } catch (error) {
      console.log(`❌ ${especie.nombre}: Error - ${(error as Error).message}`)
      fallidas++
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log(`📊 Resumen: ${exitosas} creadas, ${omitidas} omitidas (existentes), ${fallidas} fallidas de ${especiesMarinas.length} total`)
  console.log("=".repeat(50))
  
  await prisma.$disconnect()
}

// Ejecutar
seedEspecies().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
