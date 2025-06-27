import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Select } from '@/design-system/components'
import { Label } from '@/design-system/components/Label'
import { 
  useCreateCoordination, 
  useUpdateCoordination, 
  useAvailableCoordinators,
  useAllCoordinations 
} from '../hooks'
import { coordinationService } from '../services'
import type { Coordination, CoordinationFormData } from '../types'

const coordinationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre debe tener máximo 100 caracteres'),
  phone_number: z.string().optional(),
  email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
  coordinator_id: z.number().nullable()
})

interface CoordinationFormProps {
  coordination?: Coordination
  onSuccess?: () => void
}

export function CoordinationForm({ coordination, onSuccess }: CoordinationFormProps) {
  const isEdit = !!coordination
  const [originalValues, setOriginalValues] = useState<CoordinationFormData | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const { data: coordinators, isLoading: loadingCoordinators } = useAvailableCoordinators()
  const { data: allCoordinations } = useAllCoordinations()
  const createMutation = useCreateCoordination()
  const updateMutation = useUpdateCoordination()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<CoordinationFormData>({
    resolver: zodResolver(coordinationSchema),
    defaultValues: {
      name: coordination?.name || '',
      phone_number: coordination?.phone_number || '',
      email: coordination?.email || '',
      coordinator_id: coordination?.coordinator_id || null
    },
    mode: 'onChange'
  })

  const watchedValues = watch()

  useEffect(() => {
    if (coordination) {
      const values = {
        name: coordination.name,
        phone_number: coordination.phone_number || '',
        email: coordination.email || '',
        coordinator_id: coordination.coordinator_id || null
      }
      reset(values)
      setOriginalValues(values)
    }
  }, [coordination, reset])

  const checkCoordinationNameDuplicate = (name: string): string | null => {
    if (!name || name.trim() === '') {
      return null
    }

    if (!allCoordinations) {
      return null
    }

    const exists = allCoordinations.some(coord => 
      coord.name.toLowerCase() === name.toLowerCase() && 
      coord.department_id !== coordination?.department_id
    )

    return exists ? `Ya existe una coordinación con el nombre "${name}"` : null
  }

  useEffect(() => {
    const message = checkCoordinationNameDuplicate(watchedValues.name)
    setValidationMessage(message)
  }, [watchedValues.name, allCoordinations, coordination?.department_id])

  const hasChanges = originalValues && (
    watchedValues.name !== originalValues.name ||
    watchedValues.phone_number !== originalValues.phone_number ||
    watchedValues.email !== originalValues.email ||
    watchedValues.coordinator_id !== originalValues.coordinator_id
  )

  const isFormValid = isValid && !validationMessage
  const isSubmitDisabled = isEdit ? (!hasChanges || !isFormValid) : !isFormValid

  const onSubmit = async (data: CoordinationFormData) => {
    if (validationMessage) return

    const coordinationData = {
      ...data,
      email: data.email || undefined,
      phone_number: data.phone_number || undefined,
      coordinator_id: data.coordinator_id || undefined
    }

    try {
      if (isEdit && coordination) {
        await updateMutation.mutateAsync({
          id: coordination.department_id,
          data: coordinationData
        })
      } else {
        await createMutation.mutateAsync(coordinationData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Error saving coordination:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Nombre de la coordinación"
            error={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="coordinator_id">Coordinador</Label>
          <Select
            value={watchedValues.coordinator_id?.toString() || ''}
            onValueChange={(value) => setValue('coordinator_id', value ? parseInt(value) : null)}
            disabled={loadingCoordinators}
          >
            <option value="">Seleccionar coordinador</option>
            {coordinators?.map((coordinator) => (
              <option key={coordinator.user_id} value={coordinator.user_id.toString()}>
                {coordinator.full_name || `${coordinator.first_name} ${coordinator.last_name}`}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="coordinacion@ejemplo.com"
            error={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Teléfono</Label>
          <Input
            id="phone_number"
            {...register('phone_number')}
            placeholder="Número de teléfono"
          />
        </div>
      </div>

      {validationMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{validationMessage}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          type="submit"
          disabled={isSubmitDisabled || isLoading}
          className="min-w-[120px]"
        >
          {isLoading 
            ? (isEdit ? 'Actualizando...' : 'Creando...') 
            : (isEdit ? 'Actualizar Coordinación' : 'Crear Coordinación')
          }
        </Button>
      </div>
    </form>
  )
}