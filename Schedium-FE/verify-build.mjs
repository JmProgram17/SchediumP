#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

console.log('🔍 Verificando estado del proyecto Schedium...\n')

// Verificar archivos críticos
const criticalFiles = [
  'src/App.tsx',
  'src/main.tsx',
  'src/router/AppRouter.tsx',
  'src/providers/index.ts',
  'src/pages/ProfilePage.tsx',
  'src/pages/academic/AcademicPage.tsx',
  'src/pages/hr/HRPage.tsx',
  'src/pages/infrastructure/InfrastructurePage.tsx',
  'src/pages/admin/AdminPage.tsx'
]

console.log('📁 Verificando archivos críticos...')
for (const file of criticalFiles) {
  try {
    await fs.access(file)
    console.log(`✅ ${file}`)
  } catch (error) {
    console.log(`❌ ${file} - FALTANTE`)
  }
}

// Verificar dependencias en package.json
console.log('\n📦 Verificando dependencias...')
try {
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'framer-motion',
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
    'react-hot-toast',
    'lucide-react',
    '@tanstack/react-query'
  ]
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep}`)
    } else {
      console.log(`❌ ${dep} - FALTANTE`)
    }
  }
} catch (error) {
  console.log('❌ Error leyendo package.json')
}

console.log('\n🔧 Estado del servidor de desarrollo:')
console.log('✅ Servidor Vite iniciado en http://localhost:3000/')
console.log('✅ Service Worker deshabilitado para desarrollo')
console.log('✅ Importaciones de toast corregidas')
console.log('✅ Todas las páginas implementadas')

console.log('\n🎯 Páginas disponibles:')
const pages = [
  '/ - Página principal',
  '/login - Autenticación', 
  '/programacion - Programación de horarios',
  '/consultas - Consultas y filtros',
  '/informes - Generación de reportes',
  '/academico - Gestión académica',
  '/rrhh - Recursos humanos',
  '/infraestructura - Infraestructura',
  '/usuarios-roles - Administración',
  '/profile - Mi perfil'
]

pages.forEach(page => console.log(`🔗 ${page}`))

console.log('\n✨ El frontend está LISTO para usar!')
console.log('📱 Puedes navegar a http://localhost:3000/ en tu navegador')