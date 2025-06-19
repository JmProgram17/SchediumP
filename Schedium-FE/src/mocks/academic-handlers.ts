/**
 * Academic Modules MSW Handlers
 * Mock API endpoints for all SENA academic modules
 */

import { http, HttpResponse } from 'msw'
import { API_CONFIG } from '@/config'

// Mock data generators
const generateMockStudents = (count: number = 20) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `student-${i + 1}`,
    documentType: ['CC', 'TI', 'CE'][i % 3],
    documentNumber: `10000000${i}`,
    firstName: ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen'][i % 6],
    lastName: ['García', 'Rodríguez', 'López', 'Martínez', 'González'][i % 5],
    email: `estudiante${i + 1}@sena.edu.co`,
    phone: `300123456${i}`,
    program: `program-${(i % 3) + 1}`,
    semester: (i % 6) + 1,
    status: ['ACTIVE', 'INACTIVE', 'SUSPENDED'][i % 3],
    enrollmentDate: new Date(2024, 0, i + 1).toISOString(),
    createdAt: new Date(2024, 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

const generateMockInstructors = (count: number = 15) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `instructor-${i + 1}`,
    documentType: 'CC',
    documentNumber: `20000000${i}`,
    firstName: ['Pedro', 'Laura', 'Miguel', 'Sofía', 'Roberto'][i % 5],
    lastName: ['Hernández', 'Jiménez', 'Ruiz', 'Díaz', 'Moreno'][i % 5],
    email: `instructor${i + 1}@sena.edu.co`,
    phone: `310123456${i}`,
    specialization: ['Sistemas', 'Administración', 'Mecánica', 'Electrónica'][i % 4],
    department: ['Informática', 'Gestión', 'Industrial', 'Tecnología'][i % 4],
    contractType: ['PLANTA', 'CONTRATO', 'CATEDRA'][i % 3],
    status: 'ACTIVE',
    hireDate: new Date(2020 + (i % 4), 0, i + 1).toISOString(),
    createdAt: new Date(2020 + (i % 4), 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

const generateMockPrograms = (count: number = 8) => {
  const programs = [
    'Técnico en Sistemas',
    'Tecnólogo en Análisis y Desarrollo de Software',
    'Técnico en Administración de Empresas',
    'Tecnólogo en Gestión Empresarial',
    'Técnico en Mecánica Industrial',
    'Tecnólogo en Mantenimiento Electrónico',
    'Técnico en Diseño Gráfico',
    'Tecnólogo en Multimedia'
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `program-${i + 1}`,
    code: `PRG-${String(i + 1).padStart(3, '0')}`,
    name: programs[i],
    description: `Descripción del ${programs[i]}`,
    duration: [4, 6, 4, 6, 4, 6, 4, 6][i],
    modality: ['PRESENCIAL', 'VIRTUAL', 'MIXTA'][i % 3],
    level: ['TECNICO', 'TECNOLOGO'][i % 2],
    department: ['Informática', 'Gestión', 'Industrial', 'Diseño'][i % 4],
    status: 'ACTIVE',
    createdAt: new Date(2020, 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

const generateMockCourses = (count: number = 25) => {
  const courses = [
    'Fundamentos de Programación',
    'Base de Datos',
    'Desarrollo Web',
    'Análisis de Sistemas',
    'Redes de Computadores',
    'Gestión de Proyectos',
    'Contabilidad Básica',
    'Mercadeo',
    'Matemáticas Aplicadas',
    'Física Mecánica'
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `course-${i + 1}`,
    code: `CRS-${String(i + 1).padStart(3, '0')}`,
    name: courses[i % courses.length],
    description: `Descripción del curso ${courses[i % courses.length]}`,
    credits: [2, 3, 4][i % 3],
    hours: [40, 60, 80][i % 3],
    semester: (i % 6) + 1,
    programId: `program-${(i % 8) + 1}`,
    prerequisites: i > 5 ? [`course-${i - 5}`] : [],
    status: 'ACTIVE',
    createdAt: new Date(2023, 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

const generateMockClassrooms = (count: number = 12) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `classroom-${i + 1}`,
    code: `AUL-${String(i + 1).padStart(3, '0')}`,
    name: `Aula ${i + 1}`,
    capacity: [20, 25, 30, 35, 40][i % 5],
    building: ['Bloque A', 'Bloque B', 'Bloque C'][i % 3],
    floor: (i % 3) + 1,
    equipment: ['Proyector', 'Computadores', 'Pizarra Digital', 'Audio'][i % 4] ? 
               [['Proyector', 'Computadores', 'Pizarra Digital', 'Audio'][i % 4]] : [],
    type: ['LABORATORIO', 'AULA_TEORICA', 'TALLER', 'AUDITORIO'][i % 4],
    status: 'ACTIVE',
    createdAt: new Date(2023, 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

const generateMockSchedules = (count: number = 30) => {
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const times = [
    { start: '07:00', end: '09:00' },
    { start: '09:00', end: '11:00' },
    { start: '11:00', end: '13:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
    { start: '18:00', end: '20:00' }
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `schedule-${i + 1}`,
    courseId: `course-${(i % 25) + 1}`,
    instructorId: `instructor-${(i % 15) + 1}`,
    classroomId: `classroom-${(i % 12) + 1}`,
    dayOfWeek: days[i % days.length],
    startTime: times[i % times.length].start,
    endTime: times[i % times.length].end,
    startDate: new Date(2024, 1, 1).toISOString(),
    endDate: new Date(2024, 11, 31).toISOString(),
    group: `Grupo ${String.fromCharCode(65 + (i % 3))}`,
    capacity: [20, 25, 30][i % 3],
    enrolled: Math.floor(Math.random() * [20, 25, 30][i % 3]),
    status: 'ACTIVE',
    createdAt: new Date(2024, 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

const generateMockEnrollments = (count: number = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `enrollment-${i + 1}`,
    studentId: `student-${(i % 20) + 1}`,
    scheduleId: `schedule-${(i % 30) + 1}`,
    enrollmentDate: new Date(2024, 1, i + 1).toISOString(),
    status: ['ENROLLED', 'COMPLETED', 'DROPPED'][i % 3],
    grade: i % 3 === 1 ? Math.floor(Math.random() * 3) + 3 : null,
    attendance: i % 3 === 1 ? Math.floor(Math.random() * 30) + 70 : null,
    createdAt: new Date(2024, 1, i + 1).toISOString(),
    updatedAt: new Date(2024, 1, i + 1).toISOString()
  }))
}

// Mock data storage
const mockData = {
  students: generateMockStudents(),
  instructors: generateMockInstructors(),
  programs: generateMockPrograms(),
  courses: generateMockCourses(),
  classrooms: generateMockClassrooms(),
  schedules: generateMockSchedules(),
  enrollments: generateMockEnrollments()
}

// Generic CRUD handlers generator
const createCRUDHandlers = (resource: string, data: any[]) => {
  const baseUrl = `${API_CONFIG.BASE_URL}/academic/${resource}`

  return [
    // GET /api/{resource} - List with pagination
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const search = url.searchParams.get('search') || ''
      const status = url.searchParams.get('status')

      let filteredData = [...data]

      // Search filter
      if (search) {
        filteredData = filteredData.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(search.toLowerCase())
          )
        )
      }

      // Status filter
      if (status) {
        filteredData = filteredData.filter(item => item.status === status)
      }

      const total = filteredData.length
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit
      const paginatedData = filteredData.slice(offset, offset + limit)

      return HttpResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })
    }),

    // GET /api/{resource}/{id} - Get single item
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const { id } = params
      const item = data.find(item => item.id === id)

      if (!item) {
        return HttpResponse.json(
          {
            success: false,
            error_code: 'NOT_FOUND',
            message: `${resource} not found`
          },
          { status: 404 }
        )
      }

      return HttpResponse.json({
        success: true,
        data: item
      })
    }),

    // POST /api/{resource} - Create new item
    http.post(baseUrl, async ({ request }) => {
      const body = await request.json() as any
      const newItem = {
        id: `${resource}-${data.length + 1}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      data.push(newItem)

      return HttpResponse.json({
        success: true,
        data: newItem,
        message: `${resource} created successfully`
      }, { status: 201 })
    }),

    // PUT /api/{resource}/{id} - Update item
    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const { id } = params
      const body = await request.json() as any
      const index = data.findIndex(item => item.id === id)

      if (index === -1) {
        return HttpResponse.json(
          {
            success: false,
            error_code: 'NOT_FOUND',
            message: `${resource} not found`
          },
          { status: 404 }
        )
      }

      const updatedItem = {
        ...data[index],
        ...body,
        updatedAt: new Date().toISOString()
      }

      data[index] = updatedItem

      return HttpResponse.json({
        success: true,
        data: updatedItem,
        message: `${resource} updated successfully`
      })
    }),

    // DELETE /api/{resource}/{id} - Delete item
    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const { id } = params
      const index = data.findIndex(item => item.id === id)

      if (index === -1) {
        return HttpResponse.json(
          {
            success: false,
            error_code: 'NOT_FOUND',
            message: `${resource} not found`
          },
          { status: 404 }
        )
      }

      data.splice(index, 1)

      return HttpResponse.json({
        success: true,
        message: `${resource} deleted successfully`
      })
    })
  ]
}

// Generate handlers for all academic modules
export const academicHandlers = [
  ...createCRUDHandlers('academic/students', mockData.students),
  ...createCRUDHandlers('hr/instructors', mockData.instructors),
  ...createCRUDHandlers('academic/programs', mockData.programs),
  ...createCRUDHandlers('academic/courses', mockData.courses),
  ...createCRUDHandlers('infrastructure/classrooms', mockData.classrooms),
  ...createCRUDHandlers('scheduling/schedules', mockData.schedules),
  ...createCRUDHandlers('academic/enrollments', mockData.enrollments),

  // Special endpoints for complex operations
  
  // Dashboard statistics
  http.get(`${API_CONFIG.BASE_URL}/api/dashboard/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        students: {
          total: mockData.students.length,
          active: mockData.students.filter(s => s.status === 'ACTIVE').length,
          newThisMonth: 5
        },
        instructors: {
          total: mockData.instructors.length,
          active: mockData.instructors.filter(i => i.status === 'ACTIVE').length
        },
        programs: {
          total: mockData.programs.length,
          active: mockData.programs.filter(p => p.status === 'ACTIVE').length
        },
        schedules: {
          total: mockData.schedules.length,
          thisWeek: mockData.schedules.filter(s => s.status === 'ACTIVE').length
        }
      }
    })
  }),

  // Schedule conflicts check
  http.post(`${API_CONFIG.BASE_URL}/api/schedules/check-conflicts`, async ({ request }) => {
    const body = await request.json() as any
    
    // Simulate conflict detection logic
    const conflicts = mockData.schedules.filter(schedule =>
      schedule.instructorId === body.instructorId &&
      schedule.dayOfWeek === body.dayOfWeek &&
      schedule.startTime === body.startTime
    )

    return HttpResponse.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts
      }
    })
  }),

  // Bulk enrollment
  http.post(`${API_CONFIG.BASE_URL}/api/enrollments/bulk`, async ({ request }) => {
    const body = await request.json() as any
    const { studentIds, scheduleId } = body

    const newEnrollments = studentIds.map((studentId: string, index: number) => ({
      id: `enrollment-${mockData.enrollments.length + index + 1}`,
      studentId,
      scheduleId,
      enrollmentDate: new Date().toISOString(),
      status: 'ENROLLED',
      grade: null,
      attendance: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    mockData.enrollments.push(...newEnrollments)

    return HttpResponse.json({
      success: true,
      data: newEnrollments,
      message: `${newEnrollments.length} students enrolled successfully`
    })
  }),

  // Student bulk operations
  http.post(`${API_CONFIG.BASE_URL}/api/academic/students/bulk-delete`, async ({ request }) => {
    const body = await request.json() as any
    const { ids } = body

    const deletedCount = ids.length
    mockData.students = mockData.students.filter(student => !ids.includes(student.id))

    return HttpResponse.json({
      success: true,
      data: { deletedCount, message: `${deletedCount} students deleted successfully` }
    })
  }),

  http.post(`${API_CONFIG.BASE_URL}/api/academic/students/bulk-update`, async ({ request }) => {
    const body = await request.json() as any
    const { updates } = body

    let updatedCount = 0
    updates.forEach((update: any) => {
      const index = mockData.students.findIndex(student => student.id === update.id)
      if (index !== -1) {
        mockData.students[index] = {
          ...mockData.students[index],
          ...update.data,
          updatedAt: new Date().toISOString()
        }
        updatedCount++
      }
    })

    return HttpResponse.json({
      success: true,
      data: { updatedCount, message: `${updatedCount} students updated successfully` }
    })
  }),

  // Student export
  http.get(`${API_CONFIG.BASE_URL}/api/academic/students/export`, ({ request }) => {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'csv'

    // Simulate file generation
    const csvContent = 'ID,Document,Name,Email,Program,Status\n' + 
      mockData.students.map(s => 
        `${s.id},${s.documentNumber},${s.firstName} ${s.lastName},${s.email},${s.program},${s.status}`
      ).join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=students.${format}`
      }
    })
  })
]