import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import { Button, Input, Card, CardContent } from '@/design-system/components'
import { ThemeToggle } from '@/design-system/themes/ThemeToggle'
import { useThemeSync } from '@/design-system/themes/ThemeProvider'
import { authService } from '@/services/auth/auth.service'
import { toast } from 'react-hot-toast'
import { ROUTES } from '@/constants/routes.constants'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido')
    .max(100, 'El correo electrónico no puede exceder 100 caracteres'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Force theme synchronization
  useThemeSync()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    
    try {
      const sanitizedEmail = DOMPurify.sanitize(data.email)
      await authService.requestPasswordReset(sanitizedEmail)
      setIsSubmitted(true)
      toast.success('Correo enviado exitosamente')
    } catch (error) {
      toast.error('Error al enviar el correo. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative">
      {/* Theme Toggle - Fixed Position */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md px-4"
      >
        <Card variant="elevated" className="shadow-2xl">
          <CardContent className="p-8">
            {/* Header inside card */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 mb-4 shadow-lg">
                <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Recuperar Contraseña
              </h1>
            </motion.div>
            {!isSubmitted ? (
              <>
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-5 text-justify">
                    Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
                  </div>

                    <Input
                      {...register('email')}
                      type="email"
                      label="Correo Electrónico"
                      placeholder="correo@sena.edu.co"
                      autoComplete="email"
                      error={errors.email?.message}
                      required
                      leftIcon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      }
                    />

                  <Button
                    type="submit"
                    loading={isLoading}
                    fullWidth={true}
                    size="lg"
                    className="mt-6"
                  >
                    {isLoading ? 'Enviando correo...' : 'Enviar Correo de Recuperación'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <a
                    href={ROUTES.LOGIN}
                    className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Volver al inicio de sesión
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                  >
                    <svg className="mx-auto h-16 w-16 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Correo Enviado
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Si existe una cuenta asociada al correo electrónico proporcionado, recibirás un enlace para restablecer tu contraseña.
                </p>
                
                <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-md p-4 mb-6">
                  <h4 className="text-sm font-medium text-info-900 dark:text-info-100 mb-2">
                    Próximos pasos:
                  </h4>
                  <ol className="text-sm text-info-700 dark:text-info-300 space-y-1 text-left list-decimal list-inside">
                    <li>Revisa tu bandeja de entrada</li>
                    <li>Busca un correo de noreply@sena.edu.co</li>
                    <li>Haz clic en el enlace para restablecer tu contraseña</li>
                    <li>El enlace expirará en 1 hora</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    variant="primary"
                    fullWidth={true}
                    size="lg"
                  >
                    Volver al Inicio de Sesión
                  </Button>
                  
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    ¿No recibiste el correo? Intenta nuevamente
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}