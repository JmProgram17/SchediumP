export const PERMISSIONS = {
  // Academic permissions
  ACADEMIC: {
    VIEW_PROGRAMS: 'academic.programs.view',
    CREATE_PROGRAMS: 'academic.programs.create',
    UPDATE_PROGRAMS: 'academic.programs.update',
    DELETE_PROGRAMS: 'academic.programs.delete',
    
    VIEW_GROUPS: 'academic.groups.view',
    CREATE_GROUPS: 'academic.groups.create',
    UPDATE_GROUPS: 'academic.groups.update',
    DELETE_GROUPS: 'academic.groups.delete',
  },
  
  // HR permissions
  HR: {
    VIEW_INSTRUCTORS: 'hr.instructors.view',
    CREATE_INSTRUCTORS: 'hr.instructors.create',
    UPDATE_INSTRUCTORS: 'hr.instructors.update',
    DELETE_INSTRUCTORS: 'hr.instructors.delete',
  },
  
  // Infrastructure permissions
  INFRASTRUCTURE: {
    VIEW_CLASSROOMS: 'infrastructure.classrooms.view',
    CREATE_CLASSROOMS: 'infrastructure.classrooms.create',
    UPDATE_CLASSROOMS: 'infrastructure.classrooms.update',
    DELETE_CLASSROOMS: 'infrastructure.classrooms.delete',
  },
  
  // Scheduling permissions
  SCHEDULING: {
    VIEW_SCHEDULES: 'scheduling.schedules.view',
    CREATE_SCHEDULES: 'scheduling.schedules.create',
    UPDATE_SCHEDULES: 'scheduling.schedules.update',
    DELETE_SCHEDULES: 'scheduling.schedules.delete',
    RESOLVE_CONFLICTS: 'scheduling.conflicts.resolve',
  },
  
  // Admin permissions
  ADMIN: {
    VIEW_USERS: 'admin.users.view',
    CREATE_USERS: 'admin.users.create',
    UPDATE_USERS: 'admin.users.update',
    DELETE_USERS: 'admin.users.delete',
    MANAGE_ROLES: 'admin.roles.manage',
  },
} as const

export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  COORDINATOR: 'Coordinator',
  SECRETARY: 'Secretary',
} as const