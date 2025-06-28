import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  X, 
  Building2, 
  Phone, 
  Mail, 
  User as UserIcon, 
  MapPin,
  Save,
  Search,
  ChevronDown,
  Check
} from 'lucide-react'

import { Card, Button } from '@/design-system/components'
import { useCreateCoordination, useUpdateCoordination, useAvailableCoordinators } from '../hooks'
import type { Coordination, CoordinationCreate, CoordinationUpdate, User } from '../types'

// Validation schema
const coordinationSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  coordinator_id: z.number({
    required_error: 'Debe seleccionar un coordinador'
  }).min(1, 'Debe seleccionar un coordinador'),
  email: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      return z.string().email().safeParse(val).success
    }, 'Email inválido'),
  phone_number: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      return phoneRegex.test(val) && val.replace(/\D/g, '').length >= 7
    }, 'Número de teléfono inválido'),
  location: z.string().optional(),
  active: z.boolean().default(true)
})

type CoordinationFormData = z.infer<typeof coordinationSchema>

interface CoordinationModalProps {
  coordination?: Coordination | null
  onClose: () => void
  onSuccess: () => void
}

// SearchableSelect Component
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
                placeholder="Buscar coordinador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-40 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-gray-500 dark:text-gray-400 text-center">No se encontraron coordinadores</div>
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

export const CoordinationModal: React.FC<CoordinationModalProps> = ({
  coordination,
  onClose,
  onSuccess
}) => {
  const isEditing = !!coordination
  const [originalValues, setOriginalValues] = useState<CoordinationFormData | null>(null)

  // Hooks
  const createMutation = useCreateCoordination()
  const updateMutation = useUpdateCoordination()
  const { data: availableCoordinators = [], isLoading: loadingCoordinators } = useAvailableCoordinators()

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm<CoordinationFormData>({
    resolver: zodResolver(coordinationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      coordinator_id: undefined,
      email: '',
      phone_number: '',
      location: '',
      active: true
    }
  })

  const formValues = watch()

  // Initialize form when coordination changes
  useEffect(() => {
    if (coordination) {
      const values: CoordinationFormData = {
        name: coordination.name || '',
        coordinator_id: coordination.coordinator_id || undefined,
        email: coordination.email || '',
        phone_number: coordination.phone_number || '',
        location: coordination.location || '',
        active: coordination.active ?? true
      }
      
      reset(values)
      setOriginalValues(values)
    } else {
      const defaultValues: CoordinationFormData = {
        name: '',
        coordinator_id: undefined,
        email: '',
        phone_number: '',
        location: '',
        active: true
      }
      reset(defaultValues)
      setOriginalValues(defaultValues)
    }
  }, [coordination, reset])

  // Check if form has changes
  const hasChanges = originalValues ? (
    formValues.name !== originalValues.name ||
    formValues.coordinator_id !== originalValues.coordinator_id ||
    formValues.email !== originalValues.email ||
    formValues.phone_number !== originalValues.phone_number ||
    formValues.location !== originalValues.location ||
    formValues.active !== originalValues.active
  ) : true

  // Prepare coordinator options
  const coordinatorOptions = availableCoordinators.map((coordinator: User) => ({
    value: coordinator.user_id,
    label: `${coordinator.first_name} ${coordinator.last_name}`,
    subtitle: coordinator.email
  }))

  // Handle coordinator selection
  const handleCoordinatorChange = (coordinatorId: number | null) => {
    setValue('coordinator_id', coordinatorId || undefined, { shouldValidate: true })
  }

  // Form submission
  const onSubmit = async (data: CoordinationFormData) => {
    try {
      if (isEditing && coordination) {
        const updateData: CoordinationUpdate = {
          name: data.name,
          coordinator_id: data.coordinator_id,
          email: data.email || undefined,
          phone_number: data.phone_number || undefined,
          location: data.location || undefined,
          active: data.active
        }

        await updateMutation.mutateAsync({
          id: coordination.department_id,
          data: updateData
        })
      } else {
        const createData: CoordinationCreate = {
          name: data.name,
          coordinator_id: data.coordinator_id,
          email: data.email || undefined,
          phone_number: data.phone_number || undefined,
          location: data.location || undefined,
          active: data.active
        }

        await createMutation.mutateAsync(createData)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting coordination form:', error)
      
      if (error.response?.status === 409) {
        toast.error('❌ Ya existe una coordinación con ese nombre')
      } else {
        toast.error(`❌ Error al ${isEditing ? 'actualizar' : 'crear'} la coordinación`)
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
                <Building2 className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {isEditing ? 'Editar Coordinación' : 'Nueva Coordinación'}
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
                {/* Coordination Name */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Building2 className="h-4 w-4" />
                    <span>Nombre de la Coordinación</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Ingrese el nombre de la coordinación"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                      <span>{errors.name.message}</span>
                    </p>
                  )}
                </div>

                {/* Coordinator Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <UserIcon className="h-4 w-4" />
                    <span>Coordinador Encargado</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={coordinatorOptions}
                    value={formValues.coordinator_id}
                    onChange={handleCoordinatorChange}
                    placeholder="Seleccionar coordinador encargado"
                    isLoading={loadingCoordinators}
                    error={!!errors.coordinator_id}
                  />
                  {errors.coordinator_id && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                      <span>{errors.coordinator_id.message}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4" />
                      <span>Email Alternativo</span>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Email adicional para comunicaciones (opcional)
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4" />
                      <span>Teléfono</span>
                    </label>
                    <input
                      {...register('phone_number')}
                      type="text"
                      placeholder="Número de teléfono"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.phone_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.phone_number && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.phone_number.message}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span>Ubicación</span>
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    placeholder="Ubicación de la coordinación"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
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
                    Coordinación activa
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
                        <span>{isEditing ? 'Actualizar Coordinación' : 'Crear Coordinación'}</span>
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