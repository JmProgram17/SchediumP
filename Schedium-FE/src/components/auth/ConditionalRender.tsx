import { ReactNode } from 'react'
import { authorizationService, RoleName, PermissionName } from '@/services/auth/authorization.service'

interface ConditionalRenderProps {
  children: ReactNode
  requiredRoles?: RoleName[]
  requiredPermissions?: PermissionName[]
  requireAll?: boolean
  fallback?: ReactNode
  inverse?: boolean // If true, show children when conditions are NOT met
}

/**
 * Conditionally render children based on user roles and permissions
 */
export function ConditionalRender({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  inverse = false,
}: ConditionalRenderProps) {
  let shouldRender = true

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requireAll
      ? authorizationService.hasAllRoles(requiredRoles)
      : authorizationService.hasAnyRole(requiredRoles)

    shouldRender = shouldRender && hasRequiredRole
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? authorizationService.hasAllPermissions(requiredPermissions)
      : authorizationService.hasAnyPermission(requiredPermissions)

    shouldRender = shouldRender && hasRequiredPermission
  }

  // Apply inverse logic if specified
  if (inverse) {
    shouldRender = !shouldRender
  }

  return shouldRender ? <>{children}</> : <>{fallback}</>
}

// Componentes específicos para casos comunes
interface RoleBasedRenderProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return (
    <ConditionalRender requiredRoles={['Administrator']} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function CoordinatorOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return (
    <ConditionalRender requiredRoles={['Coordinator']} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function CoordinatorOrAbove({ children, fallback = null }: RoleBasedRenderProps) {
  return (
    <ConditionalRender requiredRoles={['Administrator', 'Coordinator']} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function SecretaryOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return (
    <ConditionalRender requiredRoles={['Secretary']} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function StaffOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return (
    <ConditionalRender requiredRoles={['Administrator', 'Coordinator', 'Secretary']} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

// Componentes para permisos específicos
interface PermissionBasedRenderProps {
  children: ReactNode
  resource: string
  action: 'view' | 'create' | 'update' | 'delete'
  fallback?: ReactNode
}

export function CanView({ children, resource, fallback = null }: Omit<PermissionBasedRenderProps, 'action'>) {
  const permission = `${resource}.view` as PermissionName
  return (
    <ConditionalRender requiredPermissions={[permission]} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function CanCreate({ children, resource, fallback = null }: Omit<PermissionBasedRenderProps, 'action'>) {
  const permission = `${resource}.create` as PermissionName
  return (
    <ConditionalRender requiredPermissions={[permission]} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function CanUpdate({ children, resource, fallback = null }: Omit<PermissionBasedRenderProps, 'action'>) {
  const permission = `${resource}.update` as PermissionName
  return (
    <ConditionalRender requiredPermissions={[permission]} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

export function CanDelete({ children, resource, fallback = null }: Omit<PermissionBasedRenderProps, 'action'>) {
  const permission = `${resource}.delete` as PermissionName
  return (
    <ConditionalRender requiredPermissions={[permission]} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}

// Componente genérico para acciones CRUD
export function CanPerformAction({ children, resource, action, fallback = null }: PermissionBasedRenderProps) {
  const permission = `${resource}.${action}` as PermissionName
  return (
    <ConditionalRender requiredPermissions={[permission]} fallback={fallback}>
      {children}
    </ConditionalRender>
  )
}