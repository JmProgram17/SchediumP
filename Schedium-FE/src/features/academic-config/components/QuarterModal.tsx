/**
 * Quarter Modal Component
 * Modal for creating and editing quarters with form validation
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, Typography, Button } from '@/design-system/components'
import { cn } from '@/utils/cn'
import type { Quarter, QuarterCreate, QuarterUpdate } from '@/services/api/academic-config.api'

interface QuarterModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: QuarterCreate | QuarterUpdate) => Promise<void>
  initialData?: Quarter | null
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

interface FormData {
  start_date: string
  end_date: string
  quarter_number: string
  academic_year: string
  description: string
}

interface GeneratedData {
  name: string
}

interface FormErrors {
  name?: string
  start_date?: string
  end_date?: string
  quarter_number?: string
  academic_year?: string
  general?: string
}

export function QuarterModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isLoading = false,
  mode = 'create'
}: QuarterModalProps) {
  const [formData, setFormData] = useState<FormData>({
    start_date: '',
    end_date: '',
    quarter_number: '',
    academic_year: new Date().getFullYear().toString(),
    description: ''
  })

  // Generate name automatically based on quarter_number and academic_year
  const generateQuarterName = (quarterNumber: string, academicYear: string): string => {
    if (!quarterNumber || !academicYear) return ''
    return `Trimestre ${quarterNumber} - ${academicYear}`
  }

  const generatedName = generateQuarterName(formData.quarter_number, formData.academic_year)
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          start_date: initialData.start_date.split('T')[0], // Extract date part
          end_date: initialData.end_date.split('T')[0],
          quarter_number: initialData.quarter_number?.toString() || '',
          academic_year: initialData.academic_year?.toString() || new Date().getFullYear().toString(),
          description: initialData.description || ''
        })
      } else {
        // Reset form for create mode
        const currentYear = new Date().getFullYear()
        setFormData({
          start_date: '',
          end_date: '',
          quarter_number: '',
          academic_year: currentYear.toString(),
          description: ''
        })
      }
      setErrors({})
      setTouched({})
    }
  }, [isOpen, initialData])

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {}

    // Required field validations
    if (!formData.quarter_number) {
      newErrors.quarter_number = 'El número de trimestre es requerido'
    }

    if (!formData.academic_year) {
      newErrors.academic_year = 'El año académico es requerido'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es requerida'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'La fecha de fin es requerida'
    }

    // Date validations
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate >= endDate) {
        newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
      
      // Check if quarter duration is reasonable (at least 30 days, max 6 months)
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 30) {
        newErrors.end_date = 'El trimestre debe durar al menos 30 días'
      } else if (diffDays > 180) {
        newErrors.end_date = 'El trimestre no puede durar más de 6 meses'
      }
    }

    // Academic year validation
    if (formData.academic_year) {
      const year = parseInt(formData.academic_year)
      const currentYear = new Date().getFullYear()
      
      if (isNaN(year) || year < currentYear - 5 || year > currentYear + 5) {
        newErrors.academic_year = 'Año académico inválido'
      }
    }

    // Quarter number validation
    if (formData.quarter_number) {
      const quarterNum = parseInt(formData.quarter_number)
      
      if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        newErrors.quarter_number = 'El número de trimestre debe estar entre 1 y 4'
      }
    }

    // Check for duplicate quarter+year combination
    if (formData.quarter_number && formData.academic_year && !newErrors.quarter_number && !newErrors.academic_year) {
      const quarterNum = parseInt(formData.quarter_number)
      const year = parseInt(formData.academic_year)
      const excludeId = initialData?.quarter_id // Exclude current quarter when editing
      
      try {
        const exists = await quarterService.checkQuarterExists(quarterNum, year, excludeId)
        if (exists) {
          newErrors.quarter_number = `Ya existe el Trimestre ${quarterNum} para el año ${year}`
        }
      } catch (error) {
        console.warn('Error checking quarter duplication:', error)
        // Don't block form submission if validation service fails
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // For basic validation, use synchronous validation on blur
    // Full async validation (including duplicates) will happen on submit
    const newErrors: FormErrors = { ...errors }
    
    if (field === 'start_date' && formData.start_date) {
      if (!formData.start_date) {
        newErrors.start_date = 'La fecha de inicio es requerida'
      } else {
        delete newErrors.start_date
      }
    }
    
    if (field === 'end_date' && formData.end_date) {
      if (!formData.end_date) {
        newErrors.end_date = 'La fecha de fin es requerida'
      } else if (formData.start_date) {
        const startDate = new Date(formData.start_date)
        const endDate = new Date(formData.end_date)
        
        if (startDate >= endDate) {
          newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
        } else {
          delete newErrors.end_date
        }
      }
    }
    
    if (field === 'academic_year' && formData.academic_year) {
      const year = parseInt(formData.academic_year)
      const currentYear = new Date().getFullYear()
      
      if (isNaN(year) || year < currentYear - 5 || year > currentYear + 5) {
        newErrors.academic_year = 'Año académico inválido'
      } else {
        delete newErrors.academic_year
      }
    }
    
    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Show loading state while validating
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    try {
      const submitData: CreateQuarterRequest | UpdateQuarterRequest = {
        name: generatedName, // Use generated name
        start_date: formData.start_date,
        end_date: formData.end_date,
        quarter_number: parseInt(formData.quarter_number),
        academic_year: parseInt(formData.academic_year),
        description: formData.description.trim() || undefined
      }

      await onSubmit(submitData)
      onClose()
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al guardar el trimestre' })
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <Card variant="elevated">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Typography variant="h2" className="text-gray-900 dark:text-gray-100">
                    {mode === 'create' ? 'Crear Trimestre' : 'Editar Trimestre'}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mt-1">
                    {mode === 'create' 
                      ? 'Define un nuevo período académico'
                      : 'Modifica los datos del trimestre'
                    }
                  </Typography>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Form */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* General Error */}
                  {errors.general && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <Typography variant="body2" className="text-red-700 dark:text-red-300">
                          {errors.general}
                        </Typography>
                      </div>
                    </div>
                  )}

                  {/* Academic Info - Moved to top */}
                  <div className="space-y-4">
                    <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                      Información Académica
                    </Typography>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Quarter Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número de Trimestre *
                        </label>
                        <select
                          value={formData.quarter_number}
                          onChange={(e) => handleInputChange('quarter_number', e.target.value)}
                          disabled={isLoading}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            errors.quarter_number ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                          )}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="1">Trimestre 1</option>
                          <option value="2">Trimestre 2</option>
                          <option value="3">Trimestre 3</option>
                          <option value="4">Trimestre 4</option>
                        </select>
                        {errors.quarter_number && (
                          <Typography variant="caption" className="text-red-600 dark:text-red-400 mt-1">
                            {errors.quarter_number}
                          </Typography>
                        )}
                      </div>

                      {/* Academic Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Año Académico *
                        </label>
                        <input
                          type="number"
                          value={formData.academic_year}
                          onChange={(e) => handleInputChange('academic_year', e.target.value)}
                          onBlur={() => handleBlur('academic_year')}
                          placeholder="2024"
                          disabled={isLoading}
                          min={new Date().getFullYear() - 5}
                          max={new Date().getFullYear() + 5}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            errors.academic_year ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                          )}
                        />
                        {errors.academic_year && (
                          <Typography variant="caption" className="text-red-600 dark:text-red-400 mt-1">
                            {errors.academic_year}
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Generated Name Preview */}
                    {generatedName && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <Typography variant="body2" className="text-green-800 dark:text-green-200 font-medium mb-1">
                          Nombre del Trimestre (Generado Automáticamente)
                        </Typography>
                        <Typography variant="h3" className="text-green-900 dark:text-green-100">
                          {generatedName}
                        </Typography>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descripción opcional del trimestre..."
                        disabled={isLoading}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                      Fechas
                    </Typography>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => handleInputChange('start_date', e.target.value)}
                          onBlur={() => handleBlur('start_date')}
                          disabled={isLoading}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            errors.start_date ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                          )}
                        />
                        {errors.start_date && (
                          <Typography variant="caption" className="text-red-600 dark:text-red-400 mt-1">
                            {errors.start_date}
                          </Typography>
                        )}
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Fin *
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                          onBlur={() => handleBlur('end_date')}
                          disabled={isLoading}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            errors.end_date ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                          )}
                        />
                        {errors.end_date && (
                          <Typography variant="caption" className="text-red-600 dark:text-red-400 mt-1">
                            {errors.end_date}
                          </Typography>
                        )}
                      </div>
                    </div>

                  </div>


                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <Typography variant="body2" className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                          Importante
                        </Typography>
                        <Typography variant="caption" className="text-blue-700 dark:text-blue-300">
                          Solo puede haber un trimestre activo a la vez. Al activar un nuevo trimestre, 
                          el anterior se desactivará automáticamente.
                        </Typography>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {mode === 'create' ? 'Crear Trimestre' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default QuarterModal