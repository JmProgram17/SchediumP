#!/usr/bin/env node

/**
 * CRUD Module Generator for Schedium
 * 
 * This script generates complete CRUD modules with:
 * - TypeScript types
 * - Service layer with API integration
 * - Custom hooks with React Query
 * - Complete components (List, Create, Edit, View)
 * - Unit tests with high coverage
 * - Integration tests
 * - Storybook stories
 * 
 * Usage: npm run generate:crud <moduleName>
 * Example: npm run generate:crud student
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

/**
 * Configuration for SENA academic modules
 */
const SENA_MODULES = {
  student: {
    displayName: 'Estudiante',
    pluralName: 'Estudiantes',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'documentType', type: 'DocumentType', required: true, label: 'Tipo de Documento' },
      { name: 'documentNumber', type: 'string', required: true, label: 'Número de Documento' },
      { name: 'firstName', type: 'string', required: true, label: 'Nombres' },
      { name: 'lastName', type: 'string', required: true, label: 'Apellidos' },
      { name: 'email', type: 'string', required: true, label: 'Correo Electrónico' },
      { name: 'phone', type: 'string', required: false, label: 'Teléfono' },
      { name: 'program', type: 'string', required: true, label: 'Programa Académico' },
      { name: 'semester', type: 'number', required: true, label: 'Semestre' },
      { name: 'status', type: 'StudentStatus', required: true, label: 'Estado' },
      { name: 'enrollmentDate', type: 'string', required: true, label: 'Fecha de Matrícula' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/students',
      get: '/api/students/:id',
      create: '/api/students',
      update: '/api/students/:id',
      delete: '/api/students/:id'
    }
  },
  instructor: {
    displayName: 'Instructor',
    pluralName: 'Instructores',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'documentType', type: 'DocumentType', required: true, label: 'Tipo de Documento' },
      { name: 'documentNumber', type: 'string', required: true, label: 'Número de Documento' },
      { name: 'firstName', type: 'string', required: true, label: 'Nombres' },
      { name: 'lastName', type: 'string', required: true, label: 'Apellidos' },
      { name: 'email', type: 'string', required: true, label: 'Correo Electrónico' },
      { name: 'phone', type: 'string', required: false, label: 'Teléfono' },
      { name: 'specialization', type: 'string', required: true, label: 'Especialización' },
      { name: 'department', type: 'string', required: true, label: 'Departamento' },
      { name: 'contractType', type: 'ContractType', required: true, label: 'Tipo de Contrato' },
      { name: 'status', type: 'InstructorStatus', required: true, label: 'Estado' },
      { name: 'hireDate', type: 'string', required: true, label: 'Fecha de Contratación' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/instructors',
      get: '/api/instructors/:id',
      create: '/api/instructors',
      update: '/api/instructors/:id',
      delete: '/api/instructors/:id'
    }
  },
  program: {
    displayName: 'Programa Académico',
    pluralName: 'Programas Académicos',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'code', type: 'string', required: true, label: 'Código' },
      { name: 'name', type: 'string', required: true, label: 'Nombre' },
      { name: 'description', type: 'string', required: false, label: 'Descripción' },
      { name: 'duration', type: 'number', required: true, label: 'Duración (semestres)' },
      { name: 'modality', type: 'ProgramModality', required: true, label: 'Modalidad' },
      { name: 'level', type: 'ProgramLevel', required: true, label: 'Nivel' },
      { name: 'department', type: 'string', required: true, label: 'Departamento' },
      { name: 'status', type: 'ProgramStatus', required: true, label: 'Estado' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/programs',
      get: '/api/programs/:id',
      create: '/api/programs',
      update: '/api/programs/:id',
      delete: '/api/programs/:id'
    }
  },
  course: {
    displayName: 'Curso',
    pluralName: 'Cursos',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'code', type: 'string', required: true, label: 'Código' },
      { name: 'name', type: 'string', required: true, label: 'Nombre' },
      { name: 'description', type: 'string', required: false, label: 'Descripción' },
      { name: 'credits', type: 'number', required: true, label: 'Créditos' },
      { name: 'hours', type: 'number', required: true, label: 'Horas' },
      { name: 'semester', type: 'number', required: true, label: 'Semestre' },
      { name: 'programId', type: 'string', required: true, label: 'Programa Académico' },
      { name: 'prerequisites', type: 'string[]', required: false, label: 'Prerrequisitos' },
      { name: 'status', type: 'CourseStatus', required: true, label: 'Estado' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/courses',
      get: '/api/courses/:id',
      create: '/api/courses',
      update: '/api/courses/:id',
      delete: '/api/courses/:id'
    }
  },
  classroom: {
    displayName: 'Aula',
    pluralName: 'Aulas',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'code', type: 'string', required: true, label: 'Código' },
      { name: 'name', type: 'string', required: true, label: 'Nombre' },
      { name: 'capacity', type: 'number', required: true, label: 'Capacidad' },
      { name: 'building', type: 'string', required: true, label: 'Edificio' },
      { name: 'floor', type: 'number', required: true, label: 'Piso' },
      { name: 'equipment', type: 'string[]', required: false, label: 'Equipamiento' },
      { name: 'type', type: 'ClassroomType', required: true, label: 'Tipo' },
      { name: 'status', type: 'ClassroomStatus', required: true, label: 'Estado' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/classrooms',
      get: '/api/classrooms/:id',
      create: '/api/classrooms',
      update: '/api/classrooms/:id',
      delete: '/api/classrooms/:id'
    }
  },
  schedule: {
    displayName: 'Horario',
    pluralName: 'Horarios',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'courseId', type: 'string', required: true, label: 'Curso' },
      { name: 'instructorId', type: 'string', required: true, label: 'Instructor' },
      { name: 'classroomId', type: 'string', required: true, label: 'Aula' },
      { name: 'dayOfWeek', type: 'DayOfWeek', required: true, label: 'Día de la Semana' },
      { name: 'startTime', type: 'string', required: true, label: 'Hora de Inicio' },
      { name: 'endTime', type: 'string', required: true, label: 'Hora de Fin' },
      { name: 'startDate', type: 'string', required: true, label: 'Fecha de Inicio' },
      { name: 'endDate', type: 'string', required: true, label: 'Fecha de Fin' },
      { name: 'group', type: 'string', required: true, label: 'Grupo' },
      { name: 'capacity', type: 'number', required: true, label: 'Capacidad' },
      { name: 'enrolled', type: 'number', required: true, readonly: true, label: 'Matriculados' },
      { name: 'status', type: 'ScheduleStatus', required: true, label: 'Estado' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/schedules',
      get: '/api/schedules/:id',
      create: '/api/schedules',
      update: '/api/schedules/:id',
      delete: '/api/schedules/:id'
    }
  },
  enrollment: {
    displayName: 'Matrícula',
    pluralName: 'Matrículas',
    fields: [
      { name: 'id', type: 'string', required: true, readonly: true },
      { name: 'studentId', type: 'string', required: true, label: 'Estudiante' },
      { name: 'scheduleId', type: 'string', required: true, label: 'Horario' },
      { name: 'enrollmentDate', type: 'string', required: true, label: 'Fecha de Matrícula' },
      { name: 'status', type: 'EnrollmentStatus', required: true, label: 'Estado' },
      { name: 'grade', type: 'number', required: false, label: 'Calificación' },
      { name: 'attendance', type: 'number', required: false, label: 'Asistencia (%)' },
      { name: 'createdAt', type: 'string', required: true, readonly: true },
      { name: 'updatedAt', type: 'string', required: true, readonly: true }
    ],
    endpoints: {
      list: '/api/enrollments',
      get: '/api/enrollments/:id',
      create: '/api/enrollments',
      update: '/api/enrollments/:id',
      delete: '/api/enrollments/:id'
    }
  }
}

/**
 * Utility functions
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
const toPascalCase = (str) => str.split(/[-_]/).map(capitalize).join('')
const toCamelCase = (str) => {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Template generators
 */
const generateTypes = (moduleName, config) => {
  const typeName = toPascalCase(moduleName)
  
  // Generate field types
  const fieldTypes = config.fields.map(field => {
    const optional = !field.required ? '?' : ''
    const readonly = field.readonly ? 'readonly ' : ''
    return `  ${readonly}${field.name}${optional}: ${field.type}`
  }).join('\n')

  // Generate enum types for specific fields
  const enumTypes = `
// Enum types for ${typeName}
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PEP = 'PEP',
  NIT = 'NIT'
}

export enum ${typeName}Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

${moduleName === 'instructor' ? `
export enum ContractType {
  PLANTA = 'PLANTA',
  CONTRATO = 'CONTRATO',
  CATEDRA = 'CATEDRA'
}
` : ''}

${moduleName === 'program' ? `
export enum ProgramModality {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  MIXTA = 'MIXTA'
}

export enum ProgramLevel {
  TECNICO = 'TECNICO',
  TECNOLOGO = 'TECNOLOGO',
  ESPECIALIZACION = 'ESPECIALIZACION'
}
` : ''}

${moduleName === 'classroom' ? `
export enum ClassroomType {
  LABORATORIO = 'LABORATORIO',
  AULA_TEORICA = 'AULA_TEORICA',
  TALLER = 'TALLER',
  AUDITORIO = 'AUDITORIO'
}
` : ''}

${moduleName === 'schedule' ? `
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}
` : ''}
`

  return `/**
 * ${config.displayName} Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'

${enumTypes}

// Main entity interface
export interface ${typeName} extends BaseEntity {
${fieldTypes}
}

// DTO interfaces for API operations
export interface Create${typeName}DTO {
${config.fields
  .filter(field => !field.readonly)
  .map(field => {
    const optional = !field.required ? '?' : ''
    return `  ${field.name}${optional}: ${field.type}`
  }).join('\n')}
}

export interface Update${typeName}DTO {
${config.fields
  .filter(field => !field.readonly && field.name !== 'id')
  .map(field => `  ${field.name}?: ${field.type}`)
  .join('\n')}
}

// Query interfaces
export interface ${typeName}ListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ${typeName}Status
  sortBy?: keyof ${typeName}
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface ${typeName}ListResponse extends PaginatedResponse<${typeName}> {}

export interface ${typeName}Response {
  data: ${typeName}
  message?: string
}

export interface ${typeName}Error extends ApiError {
  field?: keyof ${typeName}
}
`
}

const generateService = (moduleName, config) => {
  const typeName = toPascalCase(moduleName)
  const camelName = toCamelCase(moduleName)
  const basePath = config.endpoints.list
  
  return `/**
 * ${config.displayName} Service
 * Generated automatically by CRUD generator
 */

import { BaseApiService } from '@/services/api/base.service'
import type {
  ${typeName},
  Create${typeName}DTO,
  Update${typeName}DTO,
  ${typeName}ListQuery,
  ${typeName}ListResponse,
  ${typeName}Response
} from '../types'

export class ${typeName}Service extends BaseApiService {
  protected baseUrl = ''
  private readonly basePath = '${basePath}'

  /**
   * Get paginated list of ${config.pluralName}
   */
  async getList(query: ${typeName}ListQuery = {}): Promise<${typeName}ListResponse> {
    const response = await this.get<${typeName}ListResponse>(this.basePath, {
      params: query
    })
    return response.data!
  }

  /**
   * Get single ${config.displayName} by ID
   */
  async getById(id: string): Promise<${typeName}> {
    const response = await this.get<${typeName}Response>(\`\${this.basePath}/\${id}\`)
    return response.data!.data
  }

  /**
   * Create new ${config.displayName}
   */
  async create(data: Create${typeName}DTO): Promise<${typeName}> {
    const response = await this.post<${typeName}Response>(this.basePath, data)
    return response.data!.data
  }

  /**
   * Update existing ${config.displayName}
   */
  async update(id: string, data: Update${typeName}DTO): Promise<${typeName}> {
    const response = await this.put<${typeName}Response>(\`\${this.basePath}/\${id}\`, data)
    return response.data!.data
  }

  /**
   * Delete ${config.displayName}
   */
  async deleteItem(id: string): Promise<void> {
    await this.delete(\`\${this.basePath}/\${id}\`)
  }
}

// Create singleton instance
export const ${camelName}Service = new ${typeName}Service()
`
}

const generateHooks = (moduleName, config) => {
  const typeName = toPascalCase(moduleName)
  const camelName = toCamelCase(moduleName)
  
  return `/**
 * ${config.displayName} Hooks
 * Generated automatically by CRUD generator
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ${camelName}Service } from '../services'
import type {
  ${typeName},
  Create${typeName}DTO,
  Update${typeName}DTO,
  ${typeName}ListQuery
} from '../types'

// Query keys
export const ${camelName}Keys = {
  all: ['${camelName}'] as const,
  lists: () => [...${camelName}Keys.all, 'list'] as const,
  list: (query: ${typeName}ListQuery) => [...${camelName}Keys.lists(), query] as const,
  details: () => [...${camelName}Keys.all, 'detail'] as const,
  detail: (id: string) => [...${camelName}Keys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of ${config.pluralName}
 */
export const use${typeName}List = (query: ${typeName}ListQuery = {}) => {
  return useQuery({
    queryKey: ${camelName}Keys.list(query),
    queryFn: () => ${camelName}Service.getList(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de ${config.pluralName.toLowerCase()}'
    }
  })
}

/**
 * Hook to fetch single ${config.displayName}
 */
export const use${typeName} = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ${camelName}Keys.detail(id),
    queryFn: () => ${camelName}Service.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar ${config.displayName.toLowerCase()}'
    }
  })
}

/**
 * Hook to create new ${config.displayName}
 */
export const useCreate${typeName} = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Create${typeName}DTO) => ${camelName}Service.create(data),
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: ${camelName}Keys.lists() })
      queryClient.setQueryData(${camelName}Keys.detail(newData.id), newData)
      toast.success('${config.displayName} creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear ${config.displayName.toLowerCase()}')
    }
  })
}

/**
 * Hook to update existing ${config.displayName}
 */
export const useUpdate${typeName} = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update${typeName}DTO }) =>
      ${camelName}Service.update(id, data),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(${camelName}Keys.detail(updatedData.id), updatedData)
      queryClient.invalidateQueries({ queryKey: ${camelName}Keys.lists() })
      toast.success('${config.displayName} actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar ${config.displayName.toLowerCase()}')
    }
  })
}

/**
 * Hook to delete ${config.displayName}
 */
export const useDelete${typeName} = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ${camelName}Service.deleteItem(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ${camelName}Keys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: ${camelName}Keys.lists() })
      toast.success('${config.displayName} eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar ${config.displayName.toLowerCase()}')
    }
  })
}
`
}

/**
 * Main generation function
 */
function generateModule(moduleName, config) {
  const moduleDir = path.join(rootDir, 'src', 'features', moduleName)
  
  // Create module directory structure
  if (!existsSync(moduleDir)) {
    mkdirSync(moduleDir, { recursive: true })
  }
  
  // Create subdirectories
  const dirs = ['components', 'hooks', 'services', 'types', '__tests__', 'stories']
  dirs.forEach(dir => {
    const dirPath = path.join(moduleDir, dir)
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  })

  // Generate files
  console.log(`🔧 Generating ${config.displayName} module...`)
  
  // Types
  writeFileSync(
    path.join(moduleDir, 'types', 'index.ts'),
    generateTypes(moduleName, config)
  )
  
  // Service
  writeFileSync(
    path.join(moduleDir, 'services', 'index.ts'),
    generateService(moduleName, config)
  )
  
  // Hooks
  writeFileSync(
    path.join(moduleDir, 'hooks', 'index.ts'),
    generateHooks(moduleName, config)
  )
  
  // Main index file
  const indexContent = `/**
 * ${config.displayName} Module
 * Generated automatically by CRUD generator
 */

export * from './types'
export * from './services'
export * from './hooks'
export * from './components'
`
  
  writeFileSync(path.join(moduleDir, 'index.ts'), indexContent)
  
  console.log(`✅ ${config.displayName} module generated successfully!`)
  console.log(`📁 Location: ${moduleDir}`)
}

/**
 * CLI handler
 */
function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
CRUD Module Generator for Schedium

Usage: node scripts/generate-crud.js <module-name>

Available modules:
${Object.keys(SENA_MODULES).map(key => `  - ${key}: ${SENA_MODULES[key].displayName}`).join('\\n')}

Examples:
  node scripts/generate-crud.js student
  node scripts/generate-crud.js instructor

Flags:
  --help        Show this help message
  --all         Generate all modules
`)
    return
  }
  
  if (args.includes('--all')) {
    console.log('🚀 Generating all SENA modules...')
    Object.keys(SENA_MODULES).forEach(moduleName => {
      generateModule(moduleName, SENA_MODULES[moduleName])
    })
    console.log('🎉 All modules generated successfully!')
    return
  }
  
  const moduleName = args[0]
  
  if (!SENA_MODULES[moduleName]) {
    console.error(`❌ Module '${moduleName}' not found.\\n`)
    console.log('Available modules:')
    Object.keys(SENA_MODULES).forEach(key => {
      console.log(`  - ${key}: ${SENA_MODULES[key].displayName}`)
    })
    process.exit(1)
  }
  
  generateModule(moduleName, SENA_MODULES[moduleName])
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}