import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authorizationService, RoleName, PermissionName } from '@/services/auth/authorization.service'
import { ROUTES } from '@/constants'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: RoleName[]
  requiredPermissions?: PermissionName[]
  requireAll?: boolean // If true, user must have ALL roles/permissions. If false, user needs ANY
  fallbackPath?: string
  unauthorizedComponent?: ReactNode
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = ROUTES.LOGIN,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const location = useLocation()

  // Check if user is authenticated
  if (!authorizationService.isSessionValid()) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requireAll
      ? authorizationService.hasAllRoles(requiredRoles)
      : authorizationService.hasAnyRole(requiredRoles)

    if (!hasRequiredRole) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>
      }
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? authorizationService.hasAllPermissions(requiredPermissions)
      : authorizationService.hasAnyPermission(requiredPermissions)

    if (!hasRequiredPermission) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>
      }
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />
    }
  }

  return <>{children}</>
}

// Componentes específicos para roles comunes
export function AdminOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute {...props} requiredRoles={['Administrator']}>
      {children}
    </ProtectedRoute>
  )
}

export function CoordinatorRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute {...props} requiredRoles={['Administrator', 'Coordinator']}>
      {children}
    </ProtectedRoute>
  )
}

export function StaffRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute {...props} requiredRoles={['Administrator', 'Coordinator', 'Secretary']}>
      {children}
    </ProtectedRoute>
  )
}