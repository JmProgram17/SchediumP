export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
  
  // Private routes
  DASHBOARD: '/dashboard',
  PROGRAMMING: '/programming',
  CONSULTAS: '/consultas',
  INFORMES: '/informes',
  
  // Academic module
  ACADEMIC: {
    BASE: '/academic',
    MAIN: '/academico',
    STUDENTS: '/academic/students',
    PROGRAMS: '/academic/programs',
    LEVELS: '/academic/levels',
    GROUPS: '/academic/groups',
    COURSES: '/academic/courses',
    ENROLLMENTS: '/academic/enrollments',
  },
  
  // HR module
  HR: {
    BASE: '/hr',
    MAIN: '/rrhh',
    INSTRUCTORS: '/hr/instructors',
    DEPARTMENTS: '/hr/departments',
    POSITIONS: '/hr/positions',
    COORDINATIONS: '/hr/coordinations',
  },
  
  // Infrastructure module
  INFRASTRUCTURE: {
    BASE: '/infrastructure',
    MAIN: '/infraestructura',
    CAMPUS: '/infrastructure/campus',
    ENVIRONMENTS: '/infrastructure/environments',
    BUILDINGS: '/infrastructure/buildings',
    CLASSROOMS: '/infrastructure/classrooms',
  },
  
  // Scheduling module
  SCHEDULING: {
    BASE: '/scheduling',
    SCHEDULES: '/scheduling/schedules',
    CONFLICTS: '/scheduling/conflicts',
    CALENDAR: '/scheduling/calendar',
  },
  
  // Admin routes
  ADMIN: {
    BASE: '/admin',
    MAIN: '/usuarios-roles',
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    SETTINGS: '/admin/settings',
  },
  
  // User routes
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const