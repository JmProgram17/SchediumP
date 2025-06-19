import { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { RoleName } from '@/services/auth/authorization.service'

interface RoleGuardProps {
  children: ReactNode
  roles: RoleName[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function RoleGuard({ 
  children, 
  roles, 
  requireAll = false, 
  fallback 
}: RoleGuardProps) {
  const { hasAnyRole, hasAllRoles } = useAuthStore()

  const hasRequiredRoles = requireAll 
    ? hasAllRoles(roles)
    : hasAnyRole(roles)

  if (!hasRequiredRoles) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta página.
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}