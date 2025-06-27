/**
 * GroupForm Component - Modal form for creating/editing student groups (fichas)
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, ChevronDown, Search, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useCreateGroup, 
  useUpdateGroup, 
  useAllPrograms, 
  useAllSchedules,
  useGroupList 
} from '../hooks'
import { StudentGroup, Program, ScheduleInfo } from '../types'

// Validation schema
const groupSchema = z.object({
  group_number: z.number().min(1, 'El número de ficha es obligatorio'),
  program_id: z.number().min(1, 'El programa académico es obligatorio'),
  start_date: z.string().min(1, 'La fecha de inicio es obligatoria'),
  end_date: z.string().min(1, 'La fecha final es obligatoria'),
  schedule_id: z.number().min(1, 'La jornada es obligatoria'),
  active: z.boolean().default(true)
})

type GroupFormData = z.infer<typeof groupSchema>

interface GroupFormProps {
  group?: StudentGroup | null
  onClose: () => void
  onSuccess: () => void
}

export const GroupForm: React.FC<GroupFormProps> = ({
  group,
  onClose,
  onSuccess
}) => {
  const isEditing = !!group
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  
  // Estado para controlar cuando los dropdowns están activos
  const [dropdownActiveCount, setDropdownActiveCount] = useState(0)
  
  // Estado para almacenar los valores originales
  const [originalValues, setOriginalValues] = useState<GroupFormData | null>(null)
  
  const handleDropdownStateChange = useCallback((isOpen: boolean) => {
    setDropdownActiveCount(prev => isOpen ? prev + 1 : Math.max(0, prev - 1))
  }, [])
  
  // Fetch data for dropdowns
  const { data: programsData = [], isLoading: isLoadingPrograms } = useAllPrograms()
  const { data: schedulesData = [], isLoading: isLoadingSchedules } = useAllSchedules()
  
  // Load existing groups for validation
  const { data: allGroupsResponse, isLoading: loadingGroups } = useGroupList({ 
    page: 1, 
    limit: 1000 
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
    trigger
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    mode: 'onChange',
    defaultValues: {
      active: true
    }
  })

  // Watch form values for controlled components
  const formValues = watch()
  
  // Frontend validation function for duplicate group numbers
  const checkGroupNumberDuplicate = (groupNumber: number): string | null => {
    // Skip validation if no group number
    if (!groupNumber || isNaN(groupNumber) || groupNumber <= 0) {
      return null
    }
    
    try {
      const groupsList = (allGroupsResponse as any)?.items || []
      
      // Use groups data for validation if available
      if (groupsList.length > 0) {
        const duplicate = groupsList.find((existingGroup: StudentGroup) => {
          // Skip current group when editing
          if (isEditing && existingGroup.group_id === group?.group_id) {
            return false
          }
          
          // Check if group number matches
          return existingGroup.group_number === groupNumber
        })
        
        if (duplicate) {
          return `Ya existe una ficha con el número ${groupNumber}. Por favor, elija un número diferente.`
        }
      }
      
      return null
    } catch (error) {
      console.warn('Frontend validation error:', error)
      return null
    }
  }
  
  // Get current validation error - make it reactive
  const currentValidationError = checkGroupNumberDuplicate(formValues.group_number)

  // Initialize form with existing data when editing
  useEffect(() => {
    if (isEditing && group) {
      const initialValues = {
        group_number: group.group_number,
        program_id: group.program_id,
        start_date: group.start_date,
        end_date: group.end_date,
        schedule_id: group.schedule_id,
        active: group.active
      }
      reset(initialValues)
      setOriginalValues(initialValues)
    }
  }, [group, isEditing, reset])

  // Calculate end date when program or start date changes
  useEffect(() => {
    if (formValues.program_id && formValues.start_date) {
      const selectedProgram = programsData.find(p => p.program_id === formValues.program_id)
      if (selectedProgram?.level?.duration) {
        const startDate = new Date(formValues.start_date)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + selectedProgram.level.duration)
        
        const formattedEndDate = endDate.toISOString().split('T')[0]
        setValue('end_date', formattedEndDate)
        // Triggear validación para que reconozca el campo como lleno
        trigger('end_date')
      }
    }
  }, [formValues.program_id, formValues.start_date, programsData, setValue, trigger])

  // Handle form submission
  const onSubmit = async (data: GroupFormData) => {
    try {
      // Check for duplicates before submitting
      const duplicateError = checkGroupNumberDuplicate(data.group_number)
      if (duplicateError) {
        toast.error(duplicateError)
        return
      }
      
      if (isEditing && group) {
        await updateGroup.mutateAsync({
          groupId: group.group_id,
          data: {
            group_number: data.group_number,
            program_id: data.program_id,
            start_date: data.start_date,
            end_date: data.end_date,
            schedule_id: data.schedule_id,
            active: data.active
          }
        })
      } else {
        await createGroup.mutateAsync({
          group_number: data.group_number,
          program_id: data.program_id,
          start_date: data.start_date,
          end_date: data.end_date,
          schedule_id: data.schedule_id,
          active: data.active
        })
      }
      // Solo cerrar modal y llamar onSuccess después de éxito
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving group:', error)
      // El error ya se maneja en los hooks con toast
    }
  }

  const isLoading = createGroup.isPending || updateGroup.isPending
  const isLoadingData = isLoadingPrograms || isLoadingSchedules || loadingGroups
  
  // Función para comparar si hay cambios
  const hasChanges = useCallback(() => {
    if (!isEditing || !originalValues) return true // Si es crear, siempre permitir
    
    return (
      formValues.group_number !== originalValues.group_number ||
      formValues.program_id !== originalValues.program_id ||
      formValues.start_date !== originalValues.start_date ||
      formValues.end_date !== originalValues.end_date ||
      formValues.schedule_id !== originalValues.schedule_id ||
      formValues.active !== originalValues.active
    )
  }, [isEditing, originalValues, formValues])
  
  // Form validation function
  const isFormValid = () => {
    const hasValidFields = (
      formValues.group_number && !isNaN(formValues.group_number) && formValues.group_number > 0 &&
      formValues.program_id > 0 &&
      formValues.start_date &&
      formValues.end_date &&
      formValues.schedule_id > 0 &&
      typeof formValues.active === 'boolean'
    )
    
    // Use the reactive validation error
    return hasValidFields && !currentValidationError
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && dropdownActiveCount === 0 && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>
                {isEditing ? 'Editar Ficha' : 'Nueva Ficha Académica'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent>
              {isLoadingData ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Número de ficha */}
                  <div className="w-full">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número de Ficha <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      type="number"
                      {...register('group_number', { valueAsNumber: true })}
                      placeholder="Ej: 2486521"
                      error={errors.group_number?.message}
                      disabled={isLoading}
                      onKeyPress={(e) => {
                        // Solo permitir números
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                          e.preventDefault()
                        }
                      }}
                      min="1"
                      step="1"
                      style={{
                        MozAppearance: 'textfield'
                      }}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Fila: Programa y Jornada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Programa académico - SearchableSelect */}
                    <div className="w-full">
                      <SearchableSelect
                        label="Programa Académico"
                        value={formValues.program_id}
                        onChange={(value) => {
                          setValue('program_id', value, { shouldValidate: true })
                        }}
                        options={programsData.map(program => ({
                          value: program.program_id,
                          label: program.name,
                          subtitle: `${program.nomenclature?.code || ''}-${program.level?.study_type || ''}`
                        }))}
                        placeholder="Seleccionar programa académico"
                        disabled={isLoading}
                        error={errors.program_id?.message}
                        required
                        onDropdownStateChange={handleDropdownStateChange}
                      />
                    </div>

                    {/* Jornada - Select normal */}
                    <div className="w-full">
                      <SimpleSelect
                        label="Jornada"
                        value={formValues.schedule_id}
                        onChange={(value) => {
                          setValue('schedule_id', value, { shouldValidate: true })
                        }}
                        options={schedulesData.map(schedule => ({
                          value: schedule.schedule_id,
                          label: schedule.name,
                          subtitle: `${schedule.start_time} - ${schedule.end_time}`
                        }))}
                        placeholder="Seleccionar jornada..."
                        disabled={isLoading}
                        error={errors.schedule_id?.message}
                        required
                        onDropdownStateChange={handleDropdownStateChange}
                      />
                    </div>
                  </div>

                  {/* Fila: Fechas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha de inicio */}
                    <div className="w-full">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de Inicio <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Input
                        type="date"
                        {...register('start_date')}
                        error={errors.start_date?.message}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Fecha final (calculada) */}
                    <div className="w-full">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de Finalización (Calculada)
                      </label>
                      <Input
                        type="date"
                        {...register('end_date')}
                        error={errors.end_date?.message}
                        disabled={isLoading}
                        className="bg-gray-50 dark:bg-gray-700"
                        readOnly={true}
                      />
                    </div>
                  </div>

                  {/* Ficha activa */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('active')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      disabled={isLoading}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ficha activa
                    </label>
                  </div>

                  {/* Validation Error Display */}
                  {currentValidationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-md"
                    >
                      <p className="text-sm text-red-600 font-medium">
                        ⚠️ {currentValidationError}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Para crear esta ficha, elija un número diferente.
                      </p>
                    </motion.div>
                  )}

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4">
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
                        disabled={!isFormValid() || isLoading || (isEditing && !hasChanges())}
                      >
                        {isLoading ? (
                          <LoadingSpinner />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {isEditing ? 'Actualizar Ficha' : 'Crear Ficha'}
                          </>
                        )}
                      </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// SearchableSelect Component
interface SearchableSelectOption {
  value: number
  label: string
  subtitle?: string
}

interface SearchableSelectProps {
  label: string
  value: number
  onChange: (value: number) => void
  options: SearchableSelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  onDropdownStateChange?: (isOpen: boolean) => void
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  disabled = false,
  error,
  required = false,
  onDropdownStateChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Notificar cuando cambia el estado del dropdown
  useEffect(() => {
    onDropdownStateChange?.(isOpen)
  }, [isOpen, onDropdownStateChange])

  const selectedOption = options.find(opt => opt.value === value)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleOptionSelect = (optionValue: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div ref={selectRef} className="relative">
        <div
          onClick={(e) => handleToggle(e)}
          className={cn(
            "w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800",
            "border-gray-300 dark:border-gray-600",
            "text-gray-900 dark:text-gray-100",
            "cursor-pointer transition-colors duration-200",
            "flex items-center justify-between",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        >
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <div>
                <div className="text-sm font-medium truncate">{selectedOption.label}</div>
                {selectedOption.subtitle && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedOption.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {placeholder}
              </span>
            )}
          </div>
          
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={(e) => handleOptionSelect(option.value, e)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.subtitle}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// SimpleSelect Component (for schedules)
interface SimpleSelectOption {
  value: number
  label: string
  subtitle?: string
}

interface SimpleSelectProps {
  label: string
  value: number
  onChange: (value: number) => void
  options: SimpleSelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  onDropdownStateChange?: (isOpen: boolean) => void
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled = false,
  error,
  required = false,
  onDropdownStateChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  // Notificar cuando cambia el estado del dropdown
  useEffect(() => {
    onDropdownStateChange?.(isOpen)
  }, [isOpen, onDropdownStateChange])

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setIsOpen(!isOpen)
  }

  const handleOptionSelect = (optionValue: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div ref={selectRef} className="relative">
        <div
          onClick={(e) => handleToggle(e)}
          className={cn(
            "w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800",
            "border-gray-300 dark:border-gray-600",
            "text-gray-900 dark:text-gray-100",
            "cursor-pointer transition-colors duration-200",
            "flex items-center justify-between",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        >
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <div>
                <div className="text-sm font-medium truncate">{selectedOption.label}</div>
                {selectedOption.subtitle && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedOption.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {placeholder}
              </span>
            )}
          </div>
          
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-48 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => handleOptionSelect(option.value, e)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </div>
                    {option.subtitle && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.subtitle}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}