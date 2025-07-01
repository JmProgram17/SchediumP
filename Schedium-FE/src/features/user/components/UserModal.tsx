import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Shield,
  FileText,
  Key,
  Save,
  Search,
  ChevronDown,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'

import { Card, Button } from '@/design-system/components'
import { useCreateUser, useUpdateUser, useRoles } from '../hooks'
import type { User, UserCreate, UserUpdate, Role } from '../types'

// Validation schema
const userSchema = z.object({
  first_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  last_name: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  document_number: z.string()
    .min(6, 'El documento debe tener al menos 6 caracteres')
    .max(20, 'El documento no puede exceder 20 caracteres'),
  role_id: z.number({
    required_error: 'Debe seleccionar un rol'
  }).min(1, 'Debe seleccionar un rol'),
  password: z.string()
    .optional()
    .refine((val, ctx) => {
      // Si es creación, la contraseña es obligatoria
      if (!ctx.path.includes('password') && !val) return true
      if (val && val.length < 8) return false
      return true
    }, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string()
    .optional(),
  active: z.boolean().default(true)
}).refine((data) => {
  // Validar que las contraseñas coincidan solo si se proporciona una
  if (data.password && data.password !== data.confirm_password) {
    return false
  }
  return true
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"]
})

type UserFormData = z.infer<typeof userSchema>

interface UserModalProps {
  user?: User | null
  onClose: () => void
  onSuccess: () => void
}

// SearchableSelect Component for Roles
interface SearchableSelectProps {
  options: { value: number; label: string; subtitle?: string }[]
  value?: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  isLoading?: boolean
  error?: boolean
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  isLoading = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedOption = options.find(opt => opt.value === value)
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (optionValue: number) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } ${isLoading ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100`}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-40 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-gray-500 dark:text-gray-400 text-center">No se encontraron roles</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-gray-700 focus:outline-none flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{option.subtitle}</div>
                    )}
                  </div>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  onClose,
  onSuccess
}) => {
  const isEditing = !!user
  const [originalValues, setOriginalValues] = useState<UserFormData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Hooks
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const { data: availableRoles = [], isLoading: loadingRoles } = useRoles()

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      document_number: '',
      role_id: undefined,
      password: '',
      confirm_password: '',
      active: true
    }
  })

  const formValues = watch()

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      const values: UserFormData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        document_number: user.document_number || '',
        role_id: user.role_id || undefined,
        password: '',
        confirm_password: '',
        active: user.active ?? true
      }
      
      reset(values)
      setOriginalValues(values)
    } else {
      const defaultValues: UserFormData = {
        first_name: '',
        last_name: '',
        email: '',
        document_number: '',
        role_id: undefined,
        password: '',
        confirm_password: '',
        active: true
      }
      reset(defaultValues)
      setOriginalValues(defaultValues)
    }
  }, [user, reset])

  // Check if form has changes
  const hasChanges = originalValues ? (
    formValues.first_name !== originalValues.first_name ||
    formValues.last_name !== originalValues.last_name ||
    formValues.email !== originalValues.email ||
    formValues.document_number !== originalValues.document_number ||
    formValues.role_id !== originalValues.role_id ||
    formValues.active !== originalValues.active ||
    (formValues.password && formValues.password.length > 0)
  ) : true

  // Prepare role options
  const roleOptions = availableRoles.map((role: Role) => ({
    value: role.role_id,
    label: role.name,
    subtitle: role.description
  }))

  // Handle role selection
  const handleRoleChange = (roleId: number | null) => {
    setValue('role_id', roleId || undefined, { shouldValidate: true })
  }

  // Form submission
  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && user) {
        const updateData: UserUpdate = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          document_number: data.document_number,
          role_id: data.role_id,
          active: data.active
        }

        // Only include password if provided
        if (data.password && data.password.length > 0) {
          updateData.password = data.password
          updateData.confirm_password = data.confirm_password
        }

        await updateMutation.mutateAsync({
          id: user.user_id,
          data: updateData
        })
      } else {
        const createData: UserCreate = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          document_number: data.document_number,
          role_id: data.role_id!,
          password: data.password!,
          confirm_password: data.confirm_password!,
          active: data.active
        }

        await createMutation.mutateAsync(createData)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting user form:', error)
      
      if (error.response?.status === 409) {
        toast.error('❌ Ya existe un usuario con ese email o documento')
      } else {
        toast.error(`❌ Error al ${isEditing ? 'actualizar' : 'crear'} el usuario`)
      }
    }
  }

  const isSubmitDisabled = !isValid || isSubmitting || (!hasChanges && isEditing)
  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <UserIcon className="h-4 w-4" />
                      <span>Nombre</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      {...register('first_name')}
                      type="text"
                      placeholder="Nombre del usuario"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.first_name.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <UserIcon className="h-4 w-4" />
                      <span>Apellido</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      {...register('last_name')}
                      type="text"
                      placeholder="Apellido del usuario"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Document Number */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FileText className="h-4 w-4" />
                      <span>Documento</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      {...register('document_number')}
                      type="text"
                      placeholder="Número de documento"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.document_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.document_number && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.document_number.message}</p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Shield className="h-4 w-4" />
                      <span>Rol</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <SearchableSelect
                      options={roleOptions}
                      value={formValues.role_id}
                      onChange={handleRoleChange}
                      placeholder="Seleccionar rol"
                      isLoading={loadingRoles}
                      error={!!errors.role_id}
                    />
                    {errors.role_id && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.role_id.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Key className="h-4 w-4" />
                      <span>Contraseña</span>
                      {!isEditing && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Contraseña del usuario'}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
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

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Key className="h-4 w-4" />
                      <span>Confirmar Contraseña</span>
                      {!isEditing && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirm_password')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={isEditing ? 'Confirmar nueva contraseña' : 'Confirmar contraseña'}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                          errors.confirm_password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                    {errors.confirm_password && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-3">
                  <input
                    {...register('active')}
                    type="checkbox"
                    id="active"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuario activo
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="min-w-[140px] flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{isEditing ? 'Actualizando...' : 'Creando...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}