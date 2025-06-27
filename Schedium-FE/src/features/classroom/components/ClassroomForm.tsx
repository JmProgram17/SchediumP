/**
 * ClassroomForm Component - Clean modal form for classroom management
 * Implements create/edit functionality with Zod validation and proper TypeScript types
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCreateClassroom, useUpdateClassroom } from '../hooks'
import { Classroom, ClassroomType, CreateClassroomDTO } from '../types'

// Validation schema matching the CreateClassroomDTO interface
const classroomSchema = z.object({
  room_number: z.string().min(1, 'El número de aula es requerido').max(10, 'Máximo 10 caracteres'),
  capacity: z.number().min(1, 'La capacidad debe ser mayor a 0').max(500, 'Capacidad máxima 500'),
  campus_id: z.number().min(1, 'El ID del campus es requerido'),
  classroom_type: z.string().min(1, 'El tipo de aula es requerido')
})

type ClassroomFormData = z.infer<typeof classroomSchema>

interface ClassroomFormProps {
  classroom?: Classroom | null
  onClose: () => void
  onSuccess: () => void
}

export const ClassroomForm: React.FC<ClassroomFormProps> = ({
  classroom,
  onClose,
  onSuccess
}) => {
  const isEditing = !!classroom
  const createClassroom = useCreateClassroom()
  const updateClassroom = useUpdateClassroom()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    reset
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    mode: 'onChange',
    defaultValues: {
      room_number: '',
      capacity: 30,
      campus_id: 1,
      classroom_type: ClassroomType.AULA_TEORICA
    }
  })

  // Load classroom data for editing
  useEffect(() => {
    if (classroom) {
      setValue('room_number', classroom.room_number)
      setValue('capacity', classroom.capacity)
      setValue('campus_id', classroom.campus_id)
      setValue('classroom_type', classroom.classroom_type)
    } else {
      reset()
    }
  }, [classroom, setValue, reset])

  const onSubmit = async (data: ClassroomFormData) => {
    try {
      const submitData: CreateClassroomDTO = {
        room_number: data.room_number,
        capacity: data.capacity,
        campus_id: data.campus_id,
        classroom_type: data.classroom_type
      }

      if (isEditing && classroom) {
        await updateClassroom.mutateAsync({ 
          id: classroom.classroom_id.toString(), 
          data: submitData 
        })
      } else {
        await createClassroom.mutateAsync(submitData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving classroom:', error)
    }
  }

  const isLoading = createClassroom.isPending || updateClassroom.isPending

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>
                {isEditing ? 'Editar Aula' : 'Nueva Aula'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Número de Aula *"
                    {...register('room_number')}
                    error={errors.room_number?.message}
                    disabled={isLoading}
                    maxLength={10}
                    placeholder="A101, LAB-01, etc."
                  />

                  <Input
                    label="Capacidad *"
                    type="number"
                    {...register('capacity', { valueAsNumber: true })}
                    error={errors.capacity?.message}
                    disabled={isLoading}
                    min={1}
                    max={500}
                    placeholder="30"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="ID del Campus *"
                    type="number"
                    {...register('campus_id', { valueAsNumber: true })}
                    error={errors.campus_id?.message}
                    disabled={isLoading}
                    min={1}
                    placeholder="1"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Aula *
                    </label>
                    <select
                      {...register('classroom_type')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.classroom_type 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    >
                      <option value={ClassroomType.AULA_TEORICA}>Aula Teórica</option>
                      <option value={ClassroomType.LABORATORIO}>Laboratorio</option>
                      <option value={ClassroomType.TALLER}>Taller</option>
                      <option value={ClassroomType.AUDITORIO}>Auditorio</option>
                    </select>
                    {errors.classroom_type && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.classroom_type.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
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
                    disabled={!isValid || isLoading} 
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isEditing ? 'Actualizar' : 'Crear'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}