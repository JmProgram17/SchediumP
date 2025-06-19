import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  FormLabel as Label,
  Select,
  Alert,
  Badge,
  LoadingSpinner
} from '@/design-system/components'
import { useAuthStore } from '@/stores/auth.store'
import {
  User,
  Lock,
  Settings,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  Save,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Bell
} from 'lucide-react'

// Validation schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  position: z.string().min(1, 'Cargo es requerido'),
  department: z.string().min(1, 'Departamento es requerido'),
  document: z.string().min(8, 'Número de documento inválido')
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

const preferencesSchema = z.object({
  language: z.string(),
  theme: z.string(),
  timezone: z.string(),
  notifications: z.boolean(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean()
})

type PersonalInfoForm = z.infer<typeof personalInfoSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type PreferencesForm = z.infer<typeof preferencesSchema>

export function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences'>('personal')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const personalForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user?.firstName || user?.first_name || '',
      lastName: user?.lastName || user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || '',
      department: user?.department || '',
      document: user?.document || ''
    }
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const preferencesForm = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: user?.preferences?.language || 'es',
      theme: user?.preferences?.theme || 'light',
      timezone: user?.preferences?.timezone || 'America/Bogota',
      notifications: user?.preferences?.notifications ?? true,
      emailNotifications: user?.preferences?.emailNotifications ?? true,
      smsNotifications: user?.preferences?.smsNotifications ?? false
    }
  })

  const onPersonalInfoSubmit = async (data: PersonalInfoForm) => {
    setIsLoading(true)
    try {
      // API call to update personal information
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccessMessage('Información personal actualizada correctamente')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating personal info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      // API call to change password
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccessMessage('Contraseña cambiada exitosamente')
      passwordForm.reset()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onPreferencesSubmit = async (data: PreferencesForm) => {
    setIsLoading(true)
    try {
      // API call to update preferences
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccessMessage('Preferencias actualizadas correctamente')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutAllSessions = async () => {
    setIsLoading(true)
    try {
      // API call to logout all sessions
      await new Promise(resolve => setTimeout(resolve, 1000))
      logout()
    } catch (error) {
      console.error('Error logging out all sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    {
      id: 'personal' as const,
      label: 'Información Personal',
      icon: User,
      description: 'Datos básicos y contacto'
    },
    {
      id: 'security' as const,
      label: 'Seguridad',
      icon: Lock,
      description: 'Contraseña y sesiones'
    },
    {
      id: 'preferences' as const,
      label: 'Preferencias',
      icon: Settings,
      description: 'Configuración personal'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <User className="w-8 h-8 text-primary-600" />
            Mi Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de información personal y configuración de cuenta - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Cuenta Verificada
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {user?.roles?.[0]?.name || 'Usuario'}
          </Badge>
        </div>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <div className="ml-2">
              <p className="text-sm">{successMessage}</p>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user?.position} - {user?.department}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Último acceso: {new Date().toLocaleDateString('es-CO')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-b border-gray-200 dark:border-gray-700"
      >
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400">{tab.description}</div>
                </div>
              </button>
            )
          })}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'personal' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={personalForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">Nombres</Label>
                    <Input
                      id="firstName"
                      {...personalForm.register('firstName')}
                      placeholder="Ingresa tus nombres"
                    />
                    {personalForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input
                      id="lastName"
                      {...personalForm.register('lastName')}
                      placeholder="Ingresa tus apellidos"
                    />
                    {personalForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="document">Número de Documento</Label>
                    <Input
                      id="document"
                      {...personalForm.register('document')}
                      placeholder="Cédula de ciudadanía"
                    />
                    {personalForm.formState.errors.document && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.document.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      {...personalForm.register('email')}
                      placeholder="correo@sena.edu.co"
                    />
                    {personalForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      {...personalForm.register('phone')}
                      placeholder="+57 300 123 4567"
                    />
                    {personalForm.formState.errors.phone && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      {...personalForm.register('position')}
                      placeholder="Instructor"
                    />
                    {personalForm.formState.errors.position && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.position.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Select {...personalForm.register('department')}>
                      <option value="">Selecciona un departamento</option>
                      <option value="tecnologia">Área Tecnológica</option>
                      <option value="gestion">Gestión Empresarial</option>
                      <option value="salud">Salud y Bienestar</option>
                      <option value="agropecuario">Agropecuario</option>
                      <option value="turismo">Turismo y Gastronomía</option>
                      <option value="construccion">Construcción</option>
                      <option value="industrial">Industrial</option>
                      <option value="administrativo">Administrativo</option>
                    </Select>
                    {personalForm.formState.errors.department && (
                      <p className="text-sm text-red-600 mt-1">
                        {personalForm.formState.errors.department.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Cambiar Contraseña
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="info" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <div className="ml-2">
                    <p className="text-sm">
                      Tu contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.
                    </p>
                  </div>
                </Alert>

                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...passwordForm.register('currentPassword')}
                        placeholder="Contraseña actual"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('newPassword')}
                        placeholder="Nueva contraseña"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...passwordForm.register('confirmPassword')}
                        placeholder="Confirma la nueva contraseña"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4" />}
                      {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Gestión de Sesiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Sesión Actual</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Navegador Web - {new Date().toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Activa</Badge>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={handleLogoutAllSessions}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : <LogOut className="w-4 h-4" />}
                      {isLoading ? 'Cerrando...' : 'Cerrar Todas las Sesiones'}
                    </Button>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Esto cerrará tu sesión en todos los dispositivos y navegadores.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferencias del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select {...preferencesForm.register('language')}>
                      <option value="es">Español (Colombia)</option>
                      <option value="en">English</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="theme">Tema</Label>
                    <Select {...preferencesForm.register('theme')}>
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                      <option value="system">Sistema</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select {...preferencesForm.register('timezone')}>
                      <option value="America/Bogota">Colombia (UTC-5)</option>
                      <option value="America/New_York">Nueva York (UTC-4)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1)</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notificaciones
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        {...preferencesForm.register('notifications')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium">Notificaciones del Sistema</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Recibir notificaciones sobre cambios en horarios y programación
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        {...preferencesForm.register('emailNotifications')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium">Notificaciones por Email</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Recibir resúmenes y alertas importantes por correo electrónico
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        {...preferencesForm.register('smsNotifications')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium">Notificaciones SMS</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Recibir alertas críticas por mensaje de texto
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                    {isLoading ? 'Guardando...' : 'Guardar Preferencias'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}