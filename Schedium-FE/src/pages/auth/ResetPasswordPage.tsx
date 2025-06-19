import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button, Input, Card, CardContent, ThemeToggle } from '@/design-system/components'
import { authService } from '@/services/auth/auth.service'
import { toast } from 'react-hot-toast'
import { ROUTES } from '@/constants/routes.constants'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }

    // Validate token on mount
    authService.validateResetToken(token)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false))
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || tokenValid === false) {
      toast.error('Token inválido o expirado')
      return
    }

    setIsLoading(true)
    
    try {
      await authService.resetPassword(token, data.password)
      toast.success('Contraseña actualizada exitosamente')
      navigate(ROUTES.LOGIN, { 
        state: { message: 'Tu contraseña ha sido actualizada. Por favor, inicia sesión con tu nueva contraseña.' } 
      })
    } catch (error) {
      toast.error('Error al restablecer la contraseña. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestReset = () => {
    navigate(ROUTES.FORGOT_PASSWORD)
  }

  if (tokenValid === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Restablecer Contraseña
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
            {tokenValid ? 'Ingresa tu nueva contraseña' : 'Token inválido o expirado'}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card variant="elevated" className="shadow-xl">
            <CardContent className="p-8">
              {tokenValid ? (
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Nueva Contraseña"
                    placeholder="Ingrese su nueva contraseña"
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
                  
                  <Input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirmar Contraseña"
                    placeholder="Confirme su nueva contraseña"
                    error={errors.confirmPassword?.message}
                    required
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? (
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

                  <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-md p-4 mt-4">
                    <h4 className="text-sm font-medium text-info-900 dark:text-info-100 mb-2">
                      Requisitos de la contraseña:
                    </h4>
                    <ul className="text-xs text-info-700 dark:text-info-300 space-y-1">
                      <li className="flex items-center">
                        <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Mínimo 8 caracteres
                      </li>
                      <li className="flex items-center">
                        <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Al menos una letra mayúscula
                      </li>
                      <li className="flex items-center">
                        <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Al menos una letra minúscula
                      </li>
                      <li className="flex items-center">
                        <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Al menos un número
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    loading={isLoading}
                    fullWidth={true}
                    size="lg"
                    className="mt-6"
                  >
                    {isLoading ? 'Actualizando contraseña...' : 'Actualizar Contraseña'}
                  </Button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <svg className="mx-auto h-16 w-16 text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Enlace Inválido
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    El enlace de restablecimiento de contraseña es inválido o ha expirado.
                    Por favor, solicita un nuevo enlace.
                  </p>
                  <Button
                    onClick={handleRequestReset}
                    variant="primary"
                    fullWidth={true}
                  >
                    Solicitar Nuevo Enlace
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center">
                <a
                  href={ROUTES.LOGIN}
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Volver al inicio de sesión
                </a>
              </div>
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