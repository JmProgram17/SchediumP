import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Card, CardContent } from '@/design-system/components'
import { ThemeToggle } from '@/design-system/themes/ThemeToggle'
import { useIsDark, useThemeSync } from '@/design-system/themes/ThemeProvider'
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

const REMEMBER_EMAIL_KEY = 'schedium_remembered_email'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberUser, setRememberUser] = useState(false)
  const isDark = useIsDark()
  
  // Force theme synchronization
  useThemeSync()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (rememberedEmail) {
      setValue('email', rememberedEmail)
      setRememberUser(true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    
    try {
      // Sanitize input data
      const sanitizedData = {
        email: DOMPurify.sanitize(data.email),
        password: data.password, // Don't sanitize password as it might contain special chars
      }
      
      // Handle remember user
      if (rememberUser) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, sanitizedData.email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
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
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'} relative`}>
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
            {/* Header with Logos - Inside Card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex justify-center items-center gap-6">
                {/* Schedium Logo */}
                <img 
                  src={isDark ? '/images/Schedium-Blanco.svg' : '/images/Schedium-Negro.svg'}
                  alt="Schedium Logo"
                  className="h-12 object-contain"
                />

                {/* Vertical divider line */}
                <div className={`w-px h-14 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

                {/* SENA Logo */}
                <img 
                  src="/images/Sena-Verde.svg"
                  alt="SENA Logo"
                  className="h-14 object-contain"
                />
              </div>
            </motion.div>

            {/* Login Form */}
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
                    className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
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

              {/* Remember User & Forgot Password - Same Line */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberUser}
                    onChange={(e) => setRememberUser(e.target.checked)}
                    className={`h-3 w-3 sm:h-4 sm:w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                      isDark ? 'bg-gray-800 border-gray-600' : ''
                    }`}
                  />
                  <span className={`ml-1 sm:ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Recordar usuario
                  </span>
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className={`font-medium transition-colors whitespace-nowrap ${
                    isDark 
                      ? 'text-primary-400 hover:text-primary-300' 
                      : 'text-primary-600 hover:text-primary-500'
                  }`}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-md p-4 ${
                    isDark 
                      ? 'bg-error-900/20 border-error-800' 
                      : 'bg-error-50 border-error-200'
                  } border`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${isDark ? 'text-error-400' : 'text-error-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${isDark ? 'text-error-400' : 'text-error-700'}`}>{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                loading={isLoading}
                fullWidth={true}
                size="lg"
                className="mt-6"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}