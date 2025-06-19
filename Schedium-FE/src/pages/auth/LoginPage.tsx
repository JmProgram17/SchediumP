import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Card, CardContent, ThemeToggle } from '@/design-system/components'
import { ROUTES } from '@/constants'
import { motion } from 'framer-motion'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingrese un email válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    
    try {
      // Sanitize input data
      const sanitizedData = {
        email: DOMPurify.sanitize(data.email),
        password: data.password, // Don't sanitize password as it might contain special chars
      }
      
      await login(sanitizedData)
      
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || ROUTES.DASHBOARD
      navigate(from, { replace: true })
    } catch (err) {
      // Error is handled by the store
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="w-full max-w-sm">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 mb-4 shadow-lg">
            <svg className="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Schedium
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            Sistema de Gestión Académica - SENA CGMLTI
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card variant="elevated" className="shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
                Iniciar Sesión
              </h2>
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                {...register('email')}
                label="Correo Electrónico"
                placeholder="ejemplo@sena.edu.co"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                required
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
              
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                placeholder="Contraseña"
                autoComplete="current-password"
                error={errors.password?.message}
                required
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Recordar sesión
                  </span>
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-4"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                loading={isLoading}
                fullWidth={true}
                size="lg"
                className="mt-6"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Información de acceso
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use sus credenciales para acceder al sistema.
                  <br />
                  Si tiene problemas de acceso, contacte al administrador.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 SENA CGMLTI. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  )
}