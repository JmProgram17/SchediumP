/**
 * StudentForm Component - Professional form with validation and security
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
import { useCreateStudent, useUpdateStudent } from '../hooks'
import { Student, DocumentType, StudentStatus } from '../types'

// Validation schema
const studentSchema = z.object({
  documentType: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Tipo de documento requerido' })
  }),
  documentNumber: z
    .string()
    .min(6, 'Número de documento debe tener al menos 6 dígitos')
    .max(15, 'Número de documento no puede exceder 15 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
  firstName: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  lastName: z
    .string()
    .min(2, 'Apellido debe tener al menos 2 caracteres')
    .max(50, 'Apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email no puede exceder 100 caracteres'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{10}$/.test(val),
      'Teléfono debe tener 10 dígitos'
    ),
  program: z
    .string()
    .min(1, 'Programa es requerido')
    .max(100, 'Programa no puede exceder 100 caracteres'),
  semester: z
    .number()
    .min(1, 'Semestre debe ser al menos 1')
    .max(12, 'Semestre no puede exceder 12'),
  status: z.nativeEnum(StudentStatus, {
    errorMap: () => ({ message: 'Estado requerido' })
  }),
  enrollmentDate: z
    .string()
    .min(1, 'Fecha de matrícula requerida')
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Fecha de matrícula inválida'
    )
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormProps {
  student?: Student | null
  onClose: () => void
  onSuccess: () => void
}

export const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onClose,
  onSuccess
}) => {
  const isEditing = !!student
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    mode: 'onChange',
    defaultValues: {
      documentType: DocumentType.CC,
      documentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      program: '',
      semester: 1,
      status: StudentStatus.ACTIVE,
      enrollmentDate: new Date().toISOString().split('T')[0]
    }
  })

  // Load student data for editing
  useEffect(() => {
    if (student) {
      setValue('documentType', student.documentType)
      setValue('documentNumber', student.documentNumber)
      setValue('firstName', student.firstName)
      setValue('lastName', student.lastName)
      setValue('email', student.email)
      setValue('phone', student.phone || '')
      setValue('program', student.program)
      setValue('semester', student.semester)
      setValue('status', student.status)
      setValue('enrollmentDate', student.enrollmentDate.split('T')[0])
    }
  }, [student, setValue])

  const onSubmit = async (data: StudentFormData) => {
    try {
      if (isEditing && student) {
        await updateStudent.mutateAsync({
          id: student.id,
          data: {
            ...data,
            semester: Number(data.semester)
          }
        })
      } else {
        await createStudent.mutateAsync({
          ...data,
          semester: Number(data.semester)
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving student:', error)
    }
  }

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('¿Está seguro de cerrar? Los cambios no guardados se perderán.')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const isLoading = createStudent.isPending || updateStudent.isPending

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
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
                {isEditing ? 'Editar Estudiante' : 'Nuevo Estudiante'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isLoading}
              >
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    >
                      {Object.values(DocumentType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.documentType && (
                      <p className="text-red-600 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.documentType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Número de Documento *"
                      {...register('documentNumber')}
                      error={errors.documentNumber?.message}
                      disabled={isLoading}
                      maxLength={15}
                    />
                  </div>
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
                    placeholder="3001234567"
                  />
                </div>

                {/* Academic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Programa *"
                      {...register('program')}
                      error={errors.program?.message}
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Input
                      label="Semestre *"
                      type="number"
                      min="1"
                      max="12"
                      {...register('semester', { valueAsNumber: true })}
                      error={errors.semester?.message}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Status and Enrollment Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    >
                      {Object.values(StudentStatus).map((status) => (
                        <option key={status} value={status}>
                          {status === 'ACTIVE' ? 'Activo' : 
                           status === 'INACTIVE' ? 'Inactivo' : 'Suspendido'}
                        </option>
                      ))}
                    </select>
                    {errors.status && (
                      <p className="text-red-600 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.status.message}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Fecha de Matrícula *"
                    type="date"
                    {...register('enrollmentDate')}
                    error={errors.enrollmentDate?.message}
                    disabled={isLoading}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
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