/**
 * InstructorForm Component - Professional form following Student pattern
 * Implements create/edit functionality with Zod validation and accessibility
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCreateInstructor, useUpdateInstructor } from '../hooks'
import { Instructor, DocumentType, InstructorStatus, ContractType } from '../types'

// Validation schema
const instructorSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(6).max(15).regex(/^\d+$/),
  firstName: z.string().min(2).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
  email: z.string().email().max(100),
  phone: z.string().optional().refine((val) => !val || /^\d{10}$/.test(val)),
  specialization: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  contractType: z.nativeEnum(ContractType),
  status: z.nativeEnum(InstructorStatus),
  hireDate: z.string().min(1).refine((date) => !isNaN(Date.parse(date)))
})

type InstructorFormData = z.infer<typeof instructorSchema>

interface InstructorFormProps {
  instructor?: Instructor | null
  onClose: () => void
  onSuccess: () => void
}

export const InstructorForm: React.FC<InstructorFormProps> = ({
  instructor,
  onClose,
  onSuccess
}) => {
  const isEditing = !!instructor
  const createInstructor = useCreateInstructor()
  const updateInstructor = useUpdateInstructor()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    mode: 'onChange',
    defaultValues: {
      documentType: DocumentType.CC,
      status: InstructorStatus.ACTIVE,
      contractType: ContractType.CONTRATO,
      hireDate: new Date().toISOString().split('T')[0]
    }
  })

  // Load instructor data for editing
  useEffect(() => {
    if (instructor) {
      Object.entries(instructor).forEach(([key, value]) => {
        if (key === 'hireDate') {
          setValue(key as keyof InstructorFormData, value.split('T')[0])
        } else {
          setValue(key as keyof InstructorFormData, value)
        }
      })
    }
  }, [instructor, setValue])

  const onSubmit = async (data: InstructorFormData) => {
    try {
      if (isEditing && instructor) {
        await updateInstructor.mutateAsync({ id: instructor.id, data })
      } else {
        await createInstructor.mutateAsync(data)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving instructor:', error)
    }
  }

  const isLoading = createInstructor.isPending || updateInstructor.isPending

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
                {isEditing ? 'Editar Instructor' : 'Nuevo Instructor'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Document Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento *
                    </label>
                    <select
                      {...register('documentType')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      {Object.values(DocumentType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Número de Documento *"
                    {...register('documentNumber')}
                    error={errors.documentNumber?.message}
                    disabled={isLoading}
                    maxLength={15}
                  />
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombres *"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    disabled={isLoading}
                    maxLength={50}
                  />

                  <Input
                    label="Apellidos *"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email *"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    disabled={isLoading}
                    maxLength={100}
                  />

                  <Input
                    label="Teléfono"
                    type="tel"
                    {...register('phone')}
                    error={errors.phone?.message}
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>

                {/* Professional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Especialización *"
                    {...register('specialization')}
                    error={errors.specialization?.message}
                    disabled={isLoading}
                    maxLength={100}
                  />

                  <Input
                    label="Departamento *"
                    {...register('department')}
                    error={errors.department?.message}
                    disabled={isLoading}
                    maxLength={100}
                  />
                </div>

                {/* Contract Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contrato *
                    </label>
                    <select
                      {...register('contractType')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      {Object.values(ContractType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
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
                      {Object.values(InstructorStatus).map((status) => (
                        <option key={status} value={status}>
                          {status === 'ACTIVE' ? 'Activo' : 
                           status === 'INACTIVE' ? 'Inactivo' : 'Suspendido'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Fecha de Contratación *"
                    type="date"
                    {...register('hireDate')}
                    error={errors.hireDate?.message}
                    disabled={isLoading}
                  />
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