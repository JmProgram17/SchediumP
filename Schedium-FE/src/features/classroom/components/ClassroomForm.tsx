/**
 * ClassroomForm Component - Professional form following Student pattern
 * Implements create/edit functionality with Zod validation and accessibility
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCreateClassroom, useUpdateClassroom } from '../hooks'
import { Classroom, ClassroomStatus, ClassroomType } from '../types'

// Validation schema
const classroomSchema = z.object({
  code: z.string().min(2).max(10).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(2).max(100),
  capacity: z.number().min(1).max(500),
  building: z.string().min(1).max(50),
  floor: z.number().int().min(-5).max(50),
  equipment: z.array(z.string().min(1)).optional(),
  type: z.nativeEnum(ClassroomType),
  status: z.nativeEnum(ClassroomStatus)
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
    formState: { errors, isValid, isDirty },
    setValue,
    control,
    watch
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    mode: 'onChange',
    defaultValues: {
      status: ClassroomStatus.ACTIVE,
      type: ClassroomType.AULA_TEORICA,
      capacity: 30,
      floor: 1,
      equipment: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'equipment'
  })

  const [newEquipment, setNewEquipment] = useState('')

  // Load classroom data for editing
  useEffect(() => {
    if (classroom) {
      Object.entries(classroom).forEach(([key, value]) => {
        if (key === 'equipment' && Array.isArray(value)) {
          setValue('equipment', value)
        } else {
          setValue(key as keyof ClassroomFormData, value as any)
        }
      })
    }
  }, [classroom, setValue])

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      append(newEquipment.trim())
      setNewEquipment('')
    }
  }

  const onSubmit = async (data: ClassroomFormData) => {
    try {
      const submitData = {
        ...data,
        equipment: data.equipment?.filter(item => item.trim().length > 0) || []
      }

      if (isEditing && classroom) {
        await updateClassroom.mutateAsync({ id: classroom.id, data: submitData })
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
                    label="Código del Aula *"
                    {...register('code')}
                    error={errors.code?.message}
                    disabled={isLoading}
                    maxLength={10}
                    placeholder="A101, LAB-01, etc."
                    className="uppercase"
                  />

                  <Input
                    label="Nombre del Aula *"
                    {...register('name')}
                    error={errors.name?.message}
                    disabled={isLoading}
                    maxLength={100}
                    placeholder="Laboratorio de Física"
                  />
                </div>

                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Edificio *"
                    {...register('building')}
                    error={errors.building?.message}
                    disabled={isLoading}
                    maxLength={50}
                    placeholder="Edificio Principal"
                  />

                  <Input
                    label="Piso *"
                    type="number"
                    {...register('floor', { valueAsNumber: true })}
                    error={errors.floor?.message}
                    disabled={isLoading}
                    min={-5}
                    max={50}
                    placeholder="1"
                  />
                </div>

                {/* Capacity and Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Aula *
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value={ClassroomType.AULA_TEORICA}>Aula Teórica</option>
                      <option value={ClassroomType.LABORATORIO}>Laboratorio</option>
                      <option value={ClassroomType.TALLER}>Taller</option>
                      <option value={ClassroomType.AUDITORIO}>Auditorio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value={ClassroomStatus.ACTIVE}>Activa</option>
                      <option value={ClassroomStatus.INACTIVE}>Inactiva</option>
                      <option value={ClassroomStatus.MAINTENANCE}>Mantenimiento</option>
                    </select>
                  </div>
                </div>

                {/* Equipment Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipamiento
                  </label>
                  
                  {/* Add new equipment */}
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                      placeholder="Agregar equipamiento..."
                      disabled={isLoading}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddEquipment()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddEquipment}
                      disabled={!newEquipment.trim() || isLoading}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Equipment list */}
                  {fields.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-1 text-sm">{watch(`equipment.${index}`)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {fields.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No hay equipamiento registrado
                    </p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  
                  <Button type="submit" disabled={!isValid || isLoading} className="min-w-[120px]">
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