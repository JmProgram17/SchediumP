import { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { PermissionName } from '@/services/auth/authorization.service'

interface PermissionGuardProps {
  children: ReactNode
  permissions: PermissionName[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGuard({ 
  children, 
  permissions, 
  requireAll = false, 
  fallback 
}: PermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions } = useAuthStore()

  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)

  if (!hasRequiredPermissions) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-600">
              No tienes permisos para realizar esta acción.
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}