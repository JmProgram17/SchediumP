import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button, Card, CardContent } from '@/design-system/components'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'
import { authorizationService } from '@/services/auth/authorization.service'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
    }
  }, [isAuthenticated, navigate])

  const user = authorizationService.getCurrentUser()
  const userRole = authorizationService.getUserRoleDisplay()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100 dark:bg-error-900/20 mb-6">
              <svg
                className="h-8 w-8 text-error-600 dark:text-error-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 14.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Content */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Acceso No Autorizado
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No tiene permisos suficientes para acceder a esta página.
            </p>

            {/* User Info */}
            {user && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">{authorizationService.getUserFullName()}</p>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="mt-1">
                    <span className="font-medium">Rol:</span> {userRole}
                  </p>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Si cree que esto es un error, contacte al administrador del sistema.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1"
              >
                Volver Atrás
              </Button>
              
              <Link to={ROUTES.DASHBOARD} className="flex-1">
                <Button variant="primary" fullWidth>
                  Ir al Inicio
                </Button>
              </Link>
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿Necesita ayuda? Contacte al administrador:
                <br />
                <a 
                  href="mailto:admin@sena.edu.co" 
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  admin@sena.edu.co
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}