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
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

import { Modal, Card, Input, Button, Select } from '@/design-system/components'
import { CardHeader, CardContent } from '@/design-system/components/Card'

import { useCreateCoordination, useUpdateCoordination, useAvailableCoordinators } from '../hooks'
import type { Coordination, CoordinationCreate, CoordinationUpdate, User } from '../types'

const coordinationSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  phone_number: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      return phoneRegex.test(val) && val.replace(/\D/g, '').length >= 7
    }, 'Número de teléfono inválido'),
  email: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      return z.string().email().safeParse(val).success
    }, 'Email inválido'),
  coordinator_id: z.number()
    .optional()
    .nullable()
    .transform(val => val === 0 ? null : val),
  active: z.boolean().default(true)
})

type CoordinationFormData = z.infer<typeof coordinationSchema>

interface CoordinationFormProps {
  coordination?: Coordination | null
  onClose: () => void
  onSuccess: () => void
}

export const CoordinationForm: React.FC<CoordinationFormProps> = ({
  coordination,
  onClose,
  onSuccess
}) => {
  const isEditing = !!coordination
  const [originalValues, setOriginalValues] = useState<CoordinationFormData | null>(null)
  const [inlineValidationMessage, setInlineValidationMessage] = useState<string | null>(null)

  // Hooks
  const createMutation = useCreateCoordination()
  const updateMutation = useUpdateCoordination()
  const { data: availableCoordinators = [], isLoading: loadingCoordinators } = useAvailableCoordinators()

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm<CoordinationFormData>({
    resolver: zodResolver(coordinationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone_number: '',
      email: '',
      coordinator_id: null,
      active: true
    }
  })

  const formValues = watch()

  // Initialize form when coordination changes
  useEffect(() => {
    if (coordination) {
      const values: CoordinationFormData = {
        name: coordination.name || '',
        phone_number: coordination.phone_number || '',
        email: coordination.email || '',
        coordinator_id: coordination.coordinator_id || null,
        active: coordination.active ?? true
      }
      
      reset(values)
      setOriginalValues(values)
    } else {
      const defaultValues: CoordinationFormData = {
        name: '',
        phone_number: '',
        email: '',
        coordinator_id: null,
        active: true
      }
      reset(defaultValues)
      setOriginalValues(defaultValues)
    }
  }, [coordination, reset])

  // Check if form has changes
  const hasChanges = originalValues ? (
    formValues.name !== originalValues.name ||
    formValues.phone_number !== originalValues.phone_number ||
    formValues.email !== originalValues.email ||
    formValues.coordinator_id !== originalValues.coordinator_id ||
    formValues.active !== originalValues.active
  ) : false

  // Real-time validation for coordination name
  const checkCoordinationNameDuplicate = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return null
    }

    // Simple frontend validation - the backend will do the authoritative check
    if (name.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres'
    }

    return null
  }

  // Watch name changes for real-time validation
  useEffect(() => {
    const subscription = watch((value, { name: fieldName }) => {
      if (fieldName === 'name') {
        const validationMessage = checkCoordinationNameDuplicate(value.name || '')
        setInlineValidationMessage(validationMessage)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  // Handle coordinator selection
  const handleCoordinatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    const coordinatorId = value === '' ? null : parseInt(value)
    setValue('coordinator_id', coordinatorId, { shouldValidate: true })
  }

  // Form submission
  const onSubmit = async (data: CoordinationFormData) => {
    try {
      setInlineValidationMessage(null)

      if (isEditing && coordination) {
        const updateData: CoordinationUpdate = {
          name: data.name,
          phone_number: data.phone_number || undefined,
          email: data.email || undefined,
          coordinator_id: data.coordinator_id || undefined,
          active: data.active
        }

        await updateMutation.mutateAsync({
          id: coordination.department_id,
          data: updateData
        })
      } else {
        const createData: CoordinationCreate = {
          name: data.name,
          phone_number: data.phone_number || undefined,
          email: data.email || undefined,
          coordinator_id: data.coordinator_id || undefined,
          active: data.active
        }

        await createMutation.mutateAsync(createData)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting coordination form:', error)
      
      if (error.response?.status === 409) {
        setInlineValidationMessage('Ya existe una coordinación con ese nombre')
      } else {
        toast.error(`❌ Error al ${isEditing ? 'actualizar' : 'crear'} la coordinación`)
      }
    }
  }

  // Simple modal close handler
  const handleOverlayClick = () => {
    onClose()
  }

  const isSubmitDisabled = !hasChanges || isSubmitting || !!inlineValidationMessage

  return (
    <AnimatePresence>
      <Modal
        isOpen={true}
        onClose={handleOverlayClick}
        size="lg"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Editar Coordinación' : 'Nueva Coordinación'}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Coordination Name */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4" />
                    <span>Nombre de la Coordinación</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('name')}
                    placeholder="Ingrese el nombre de la coordinación"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.name.message}</span>
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Phone className="h-4 w-4" />
                      <span>Teléfono</span>
                    </label>
                    <Input
                      {...register('phone_number')}
                      placeholder="Número de teléfono"
                      className={errors.phone_number ? 'border-red-500' : ''}
                    />
                    {errors.phone_number && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.phone_number.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.email.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Coordinator Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <UserIcon className="h-4 w-4" />
                    <span>Coordinador</span>
                  </label>
                  <Select
                    value={formValues.coordinator_id?.toString() || ''}
                    onChange={handleCoordinatorChange}
                    disabled={loadingCoordinators}
                    className={errors.coordinator_id ? 'border-red-500' : ''}
                  >
                    <option value="">Seleccionar coordinador</option>
                    {availableCoordinators.map((coordinator: User) => (
                      <option key={coordinator.user_id} value={coordinator.user_id.toString()}>
                        {coordinator.first_name} {coordinator.last_name}
                      </option>
                    ))}
                  </Select>
                  {errors.coordinator_id && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.coordinator_id.message}</span>
                    </p>
                  )}
                </div>

                {/* Inline Validation Message */}
                {inlineValidationMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">{inlineValidationMessage}</span>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{isEditing ? 'Actualizando...' : 'Creando...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isEditing ? 'Actualizar Coordinación' : 'Crear Coordinación'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Modal>
    </AnimatePresence>
  )
}