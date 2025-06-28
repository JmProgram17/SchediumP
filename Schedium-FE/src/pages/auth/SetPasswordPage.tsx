import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Key, 
  Check, 
  X, 
  AlertCircle,
  Shield,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button, Card } from '@/design-system/components'
import { enhancedApiService } from '@/services/api/enhanced-api.service'

// Schema de validación para nueva contraseña
const setPasswordSchema = z.object({
  password: z.string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
})

type SetPasswordFormData = z.infer<typeof setPasswordSchema>

export function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenData, setTokenData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const token = searchParams.get('token')
  const isFirstLogin = searchParams.get('first') === 'true'

  // Validaciones en tiempo real de la contraseña
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    mode: 'onChange'
  })

  const password = watch('password', '')

  // Verificar validez del token al cargar la página
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await enhancedApiService.post('/auth/verify-token', {
          token: token
        })
        
        const userData = response.data.user
        setTokenData({
          userId: userData.user_id,
          email: userData.email,
          firstName: userData.first_name,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // Asumimos 2 horas por defecto
        })
        setTokenValid(true)
      } catch (error: any) {
        console.error('Token verification failed:', error)
        setTokenValid(false)
      }
    }

    verifyToken()
  }, [token])

  // Actualizar indicadores de fortaleza de contraseña
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    })
  }, [password])

  const onSubmit = async (data: SetPasswordFormData) => {
    setIsSubmitting(true)
    
    try {
      // Llamada real al backend para establecer contraseña
      await enhancedApiService.post('/auth/set-password-from-token', {
        token: token,
        new_password: data.password
      })
      
      toast.success('Contraseña establecida exitosamente')
      
      // Redirigir al login
      navigate('/login', { 
        state: { 
          message: 'Contraseña establecida. Ahora puedes iniciar sesión.',
          email: tokenData?.email 
        }
      })
    } catch (error: any) {
      console.error('Error setting password:', error)
      const errorMessage = error.response?.data?.detail || 'Error al establecer la contraseña. Intenta nuevamente.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar estados de error
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Enlace Inválido
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Este enlace no es válido o ha expirado. Solicita un nuevo enlace al administrador.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Ir al Login
          </Button>
        </Card>
      </div>
    )
  }

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {isFirstLogin ? 'Crear tu Contraseña' : 'Restablecer Contraseña'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isFirstLogin 
                ? `¡Bienvenido/a ${tokenData?.firstName}! Crea una contraseña segura para tu cuenta.`
                : 'Establece una nueva contraseña para tu cuenta.'
              }
            </p>
          </div>

          {/* Información del token */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Clock className="h-4 w-4" />
              <span>Este enlace expira en {Math.floor((tokenData?.expiresAt - new Date()) / (1000 * 60 * 60))} horas</span>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nueva contraseña */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Key className="h-4 w-4" />
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crea una contraseña segura"
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Indicadores de fortaleza */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Requisitos de la contraseña:
              </p>
              <div className="space-y-1">
                {Object.entries({
                  length: 'Al menos 12 caracteres',
                  uppercase: 'Una letra mayúscula',
                  lowercase: 'Una letra minúscula',
                  number: 'Un número',
                  special: 'Un carácter especial'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    {passwordStrength[key as keyof typeof passwordStrength] ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${
                      passwordStrength[key as keyof typeof passwordStrength] 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Key className="h-4 w-4" />
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Estableciendo contraseña...</span>
                </div>
              ) : (
                'Establecer Contraseña'
              )}
            </Button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-1">Consejos de seguridad:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Usa una contraseña única que no uses en otros sitios</li>
                  <li>• Considera usar un gestor de contraseñas</li>
                  <li>• No compartas tu contraseña con nadie</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}