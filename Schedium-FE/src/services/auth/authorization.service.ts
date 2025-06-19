import { User, Role, Permission } from '@/types/auth.types'
import { tokenService } from './token.service'
import { secureStorage } from '@/services/storage/secure-storage.service'

// Definición de roles disponibles en el sistema (debe coincidir con backend)
export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  COORDINATOR: 'Coordinator', 
  SECRETARY: 'Secretary',
} as const

export type RoleName = typeof ROLES[keyof typeof ROLES]

// Definición de permisos por módulo
export const PERMISSIONS = {
  // Estudiantes
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',
  
  // Instructores
  INSTRUCTORS_VIEW: 'instructors.view',
  INSTRUCTORS_CREATE: 'instructors.create',
  INSTRUCTORS_UPDATE: 'instructors.update',
  INSTRUCTORS_DELETE: 'instructors.delete',
  
  // Programas
  PROGRAMS_VIEW: 'programs.view',
  PROGRAMS_CREATE: 'programs.create',
  PROGRAMS_UPDATE: 'programs.update',
  PROGRAMS_DELETE: 'programs.delete',
  
  // Cursos
  COURSES_VIEW: 'courses.view',
  COURSES_CREATE: 'courses.create',
  COURSES_UPDATE: 'courses.update',
  COURSES_DELETE: 'courses.delete',
  
  // Aulas
  CLASSROOMS_VIEW: 'classrooms.view',
  CLASSROOMS_CREATE: 'classrooms.create',
  CLASSROOMS_UPDATE: 'classrooms.update',
  CLASSROOMS_DELETE: 'classrooms.delete',
  
  // Horarios
  SCHEDULES_VIEW: 'schedules.view',
  SCHEDULES_CREATE: 'schedules.create',
  SCHEDULES_UPDATE: 'schedules.update',
  SCHEDULES_DELETE: 'schedules.delete',
  
  // Inscripciones
  ENROLLMENTS_VIEW: 'enrollments.view',
  ENROLLMENTS_CREATE: 'enrollments.create',
  ENROLLMENTS_UPDATE: 'enrollments.update',
  ENROLLMENTS_DELETE: 'enrollments.delete',
  
  // Administración
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // Reportes
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Sistema
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_LOGS: 'system.logs',
} as const

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Matriz de permisos por rol (debe coincidir con backend)
const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  [ROLES.ADMINISTRATOR]: [
    // Acceso completo a todo
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.COORDINATOR]: [
    // Gestión académica completa, sin administración de usuarios
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.STUDENTS_DELETE,
    
    PERMISSIONS.INSTRUCTORS_VIEW,
    PERMISSIONS.INSTRUCTORS_CREATE,
    PERMISSIONS.INSTRUCTORS_UPDATE,
    
    PERMISSIONS.PROGRAMS_VIEW,
    PERMISSIONS.PROGRAMS_CREATE,
    PERMISSIONS.PROGRAMS_UPDATE,
    
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_DELETE,
    
    PERMISSIONS.CLASSROOMS_VIEW,
    PERMISSIONS.CLASSROOMS_CREATE,
    PERMISSIONS.CLASSROOMS_UPDATE,
    
    PERMISSIONS.SCHEDULES_VIEW,
    PERMISSIONS.SCHEDULES_CREATE,
    PERMISSIONS.SCHEDULES_UPDATE,
    PERMISSIONS.SCHEDULES_DELETE,
    
    PERMISSIONS.ENROLLMENTS_VIEW,
    PERMISSIONS.ENROLLMENTS_CREATE,
    PERMISSIONS.ENROLLMENTS_UPDATE,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  
  [ROLES.SECRETARY]: [
    // Solo visualización y operaciones básicas
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_UPDATE,
    
    PERMISSIONS.INSTRUCTORS_VIEW,
    
    PERMISSIONS.PROGRAMS_VIEW,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.CLASSROOMS_VIEW,
    PERMISSIONS.SCHEDULES_VIEW,
    
    PERMISSIONS.ENROLLMENTS_VIEW,
    PERMISSIONS.ENROLLMENTS_CREATE,
    
    PERMISSIONS.REPORTS_VIEW,
  ],
}

class AuthorizationService {
  /**
   * Get current user from cached data or token
   */
  getCurrentUser(): User | null {
    // First try cached user
    const cachedUserStr = secureStorage.get('user')
    if (cachedUserStr) {
      try {
        return JSON.parse(cachedUserStr) as User
      } catch {
        // Fall through to token parsing
      }
    }
    
    // Try to extract from token
    const accessToken = secureStorage.getAccessToken()
    if (accessToken) {
      const userFromToken = tokenService.getUserFromToken(accessToken)
      if (userFromToken) {
        // Convert token format to User format
        return {
          user_id: userFromToken.user_id,
          email: userFromToken.email,
          first_name: userFromToken.full_name?.split(' ')[0] || '',
          last_name: userFromToken.full_name?.split(' ').slice(1).join(' ') || '',
          document_number: '',
          active: true,
          created_at: '',
          updated_at: '',
          role: userFromToken.role ? {
            role_id: 0,
            name: userFromToken.role,
            description: ''
          } : undefined,
        }
      }
    }
    
    return null
  }

  /**
   * Check if user has specific role
   */
  hasRole(roleName: RoleName): boolean {
    const user = this.getCurrentUser()
    return user?.role?.name === roleName
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: RoleName[]): boolean {
    const user = this.getCurrentUser()
    return user?.role ? roleNames.includes(user.role.name as RoleName) : false
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roleNames: RoleName[]): boolean {
    // En el backend cada usuario tiene un solo rol,
    // por lo tanto solo puede tener "todos" los roles si se pide exactamente uno
    return roleNames.length === 1 && this.hasRole(roleNames[0])
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: PermissionName): boolean {
    const user = this.getCurrentUser()
    if (!user?.role) return false

    const userRole = user.role.name as RoleName
    const rolePermissions = ROLE_PERMISSIONS[userRole]
    
    return rolePermissions ? rolePermissions.includes(permission) : false
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: PermissionName[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: PermissionName[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * Get all permissions for current user
   */
  getUserPermissions(): PermissionName[] {
    const user = this.getCurrentUser()
    if (!user?.role) return []

    const userRole = user.role.name as RoleName
    return ROLE_PERMISSIONS[userRole] || []
  }

  /**
   * Check if user is administrator
   */
  isAdmin(): boolean {
    return this.hasRole(ROLES.ADMINISTRATOR)
  }

  /**
   * Check if user is coordinator or above
   */
  isCoordinatorOrAbove(): boolean {
    return this.hasAnyRole([ROLES.ADMINISTRATOR, ROLES.COORDINATOR])
  }

  /**
   * Check if user can access a module
   */
  canAccessModule(module: 'students' | 'instructors' | 'programs' | 'courses' | 'classrooms' | 'schedules' | 'enrollments' | 'users' | 'reports'): boolean {
    const modulePermissions: Record<string, PermissionName> = {
      students: PERMISSIONS.STUDENTS_VIEW,
      instructors: PERMISSIONS.INSTRUCTORS_VIEW,
      programs: PERMISSIONS.PROGRAMS_VIEW,
      courses: PERMISSIONS.COURSES_VIEW,
      classrooms: PERMISSIONS.CLASSROOMS_VIEW,
      schedules: PERMISSIONS.SCHEDULES_VIEW,
      enrollments: PERMISSIONS.ENROLLMENTS_VIEW,
      users: PERMISSIONS.USERS_VIEW,
      reports: PERMISSIONS.REPORTS_VIEW,
    }

    const requiredPermission = modulePermissions[module]
    return requiredPermission ? this.hasPermission(requiredPermission) : false
  }

  /**
   * Check if user can perform CRUD operations on a resource
   */
  canCreate(resource: string): boolean {
    const permission = `${resource}.create` as PermissionName
    return this.hasPermission(permission)
  }

  canUpdate(resource: string): boolean {
    const permission = `${resource}.update` as PermissionName
    return this.hasPermission(permission)
  }

  canDelete(resource: string): boolean {
    const permission = `${resource}.delete` as PermissionName
    return this.hasPermission(permission)
  }

  canView(resource: string): boolean {
    const permission = `${resource}.view` as PermissionName
    return this.hasPermission(permission)
  }

  /**
   * Get user role display name
   */
  getUserRoleDisplay(): string {
    const user = this.getCurrentUser()
    if (!user?.role) return 'Sin rol'

    const roleTranslations: Record<RoleName, string> = {
      [ROLES.ADMINISTRATOR]: 'Administrador',
      [ROLES.COORDINATOR]: 'Coordinador',
      [ROLES.SECRETARY]: 'Secretario',
    }

    return roleTranslations[user.role.name as RoleName] || user.role.name
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    const user = this.getCurrentUser()
    if (!user) return 'Usuario'

    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): boolean {
    const accessToken = secureStorage.getAccessToken()
    if (!accessToken) return false

    return tokenService.isValidTokenStructure(accessToken) && !tokenService.isTokenExpired(accessToken)
  }
}

export const authorizationService = new AuthorizationService()

// Export helper hooks para React components
export function useAuthUser() {
  return authorizationService.getCurrentUser()
}

export function useAuthRole() {
  const user = authorizationService.getCurrentUser()
  return user?.role?.name as RoleName | undefined
}

export function usePermissions() {
  return {
    hasRole: (role: RoleName) => authorizationService.hasRole(role),
    hasAnyRole: (roles: RoleName[]) => authorizationService.hasAnyRole(roles),
    hasPermission: (permission: PermissionName) => authorizationService.hasPermission(permission),
    hasAnyPermission: (permissions: PermissionName[]) => authorizationService.hasAnyPermission(permissions),
    canAccessModule: (module: Parameters<typeof authorizationService.canAccessModule>[0]) => 
      authorizationService.canAccessModule(module),
    canCreate: (resource: string) => authorizationService.canCreate(resource),
    canUpdate: (resource: string) => authorizationService.canUpdate(resource),
    canDelete: (resource: string) => authorizationService.canDelete(resource),
    canView: (resource: string) => authorizationService.canView(resource),
    isAdmin: () => authorizationService.isAdmin(),
    isCoordinatorOrAbove: () => authorizationService.isCoordinatorOrAbove(),
  }
}