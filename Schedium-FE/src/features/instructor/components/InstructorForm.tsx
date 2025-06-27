/**
 * InstructorForm Component - Professional form following Student pattern
 * Implements create/edit functionality with Zod validation and accessibility
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
// import { SearchableSelect } from '@/design-system/components/SearchableSelect' // Component doesn't exist
import { useCreateInstructor, useUpdateInstructor } from '../hooks'
// import { useAllDepartments, useAllContracts } from '@/services/query/hooks/hr.hooks' // Hooks don't exist
// import { useModalExpansion } from '@/hooks/useModalExpansion' // Hook doesn't exist
import { Instructor, CreateInstructorDTO, UpdateInstructorDTO } from '../types'

// Validation schema with proper error messages
const instructorSchema = z.object({
  first_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  last_name: z.string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Los apellidos solo pueden contener letras y espacios'),
  email: z.string()
    .email('El email debe tener un formato válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  phone_number: z.string().optional().refine(
    (val) => !val || /^\d{10}$/.test(val), 
    'El teléfono debe tener exactamente 10 dígitos'
  ),
  department_id: z.string().min(1, 'Debe seleccionar una coordinación'),
  contract_id: z.string().min(1, 'Debe seleccionar un tipo de contrato'),
  active: z.boolean().default(true)
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
  
  // Modal expansion hook - fallback implementation
  // const { expandedHeight, isExpanded, handleDropdownOpen } = useModalExpansion() // Hook doesn't exist
  const expandedHeight = 0
  const isExpanded = false
  const handleDropdownOpen = () => {}
  
  // State for tracking changes (following ProgramForm pattern)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalValues, setOriginalValues] = useState<InstructorFormData | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    mode: 'onChange', // Enable real-time validation for better UX
    defaultValues: {
      active: true
    }
  })

  // Watch form values for controlled components
  const departmentId = watch('department_id')
  const contractId = watch('contract_id')
  
  // Log when key values change (for debugging)
  useEffect(() => {
    console.log('🔄 [INSTRUCTOR FORM] Key form values changed:', { departmentId, contractId })
  }, [departmentId, contractId])

  // Fetch departments and contracts data - using fallback data
  // const { data: departments = [], isLoading: isDepartmentsLoading } = useAllDepartments() // Hook doesn't exist
  // const { data: contracts = [], isLoading: isContractsLoading, error: contractsError } = useAllContracts() // Hook doesn't exist
  
  // Fallback data for departments and contracts
  const departments = [
    { department_id: 1, name: 'Informática', email: 'informatica@sena.edu.co' },
    { department_id: 2, name: 'Electrónica', email: 'electronica@sena.edu.co' },
    { department_id: 3, name: 'Mecánica', email: 'mecanica@sena.edu.co' },
    { department_id: 4, name: 'Soldadura', email: 'soldadura@sena.edu.co' }
  ]
  const isDepartmentsLoading = false
  
  const contracts = {
    items: [
      { contract_id: 1, contract_type: 'Planta', hour_limit: 40 },
      { contract_id: 2, contract_type: 'Contrato', hour_limit: 30 },
      { contract_id: 3, contract_type: 'Hora Cátedra', hour_limit: 20 }
    ]
  }
  const isContractsLoading = false
  const contractsError = null

  // Debug logging (only once per load)
  useEffect(() => {
    console.log('🏢 [INSTRUCTOR FORM] Departments data:', departments)
    console.log('📄 [INSTRUCTOR FORM] Contracts data:', contracts)
    console.log('⏳ [INSTRUCTOR FORM] Loading states:', { isDepartmentsLoading, isContractsLoading })
    console.log('❌ [INSTRUCTOR FORM] Contracts error:', contractsError)
  }, [departments, contracts, isDepartmentsLoading, isContractsLoading, contractsError])

  // Ensure data is array format
  const departmentsArray = Array.isArray(departments) ? departments : []
  
  // Handle paginated contracts response
  let contractsArray: any[] = []
  if (contracts && Array.isArray(contracts.items)) {
    // Paginated response structure
    contractsArray = contracts.items
    console.log('📄 [INSTRUCTOR FORM] Using paginated contracts from backend:', contractsArray)
  } else if (Array.isArray(contracts)) {
    // Direct array response
    contractsArray = contracts
    console.log('📄 [INSTRUCTOR FORM] Using direct array contracts from backend:', contractsArray)
  } else if (!isContractsLoading) {
    // Fallback only if no data and not loading
    contractsArray = [
      { contract_id: 1, contract_type: 'Planta', hour_limit: 40 },
      { contract_id: 2, contract_type: 'Contrato', hour_limit: 30 }
    ]
    console.log('🔄 [INSTRUCTOR FORM] Using fallback contracts (no backend data)')
  }
  
  console.log('📋 [INSTRUCTOR FORM] Final arrays:', { 
    departmentsCount: departmentsArray.length, 
    contractsCount: contractsArray.length 
  })


  // Load instructor data for editing and store original values
  useEffect(() => {
    if (instructor) {
      // For editing existing instructor
      const formData = {
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        phone_number: instructor.phone_number || '',
        department_id: instructor.department_id?.toString() || '',
        contract_id: instructor.contract_id?.toString() || '',
        active: instructor.active
      }
      reset(formData)
      setOriginalValues(formData) // Store original values for comparison
      setHasChanges(false)
      console.log('📝 [INSTRUCTOR FORM] Loaded instructor data and stored original values:', formData)
    } else {
      // For new instructors - require selection for department and contract
      const defaultValues = {
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        department_id: '', // Will need to be selected
        contract_id: '', // Will need to be selected
        active: true
      }
      reset(defaultValues)
      setOriginalValues(defaultValues)
      setHasChanges(false)
      console.log('📝 [INSTRUCTOR FORM] Set default values for new instructor:', defaultValues)
    }
  }, [instructor, reset])

  // Watch ALL form fields for changes automatically (following ProgramForm pattern)
  const watchedValues = watch()
  useEffect(() => {
    if (originalValues) {
      const currentValues = watchedValues
      const hasActualChanges = 
        currentValues.first_name !== originalValues.first_name ||
        currentValues.last_name !== originalValues.last_name ||
        currentValues.email !== originalValues.email ||
        currentValues.phone_number !== originalValues.phone_number ||
        currentValues.department_id !== originalValues.department_id ||
        currentValues.contract_id !== originalValues.contract_id ||
        currentValues.active !== originalValues.active
      
      console.log('🔍 [INSTRUCTOR FORM] Checking for changes:', {
        original: originalValues,
        current: currentValues,
        hasActualChanges
      })
      
      setHasChanges(hasActualChanges)
    }
  }, [watchedValues, originalValues]) // This will trigger whenever ANY field changes

  // Form validation helper (following ProgramForm pattern)
  const isFormValid = () => {
    const values = watch()
    return !!(values.first_name?.trim() && 
             values.last_name?.trim() && 
             values.email?.trim() &&
             values.department_id?.trim() &&
             values.contract_id?.trim())
  }

  const onSubmit = async (data: InstructorFormData, event?: React.BaseSyntheticEvent) => {
    console.log('💾 [INSTRUCTOR FORM] Form submitted with data:', data)
    console.log('📝 [INSTRUCTOR FORM] Submit event type:', event?.type, 'nativeEvent:', event?.nativeEvent?.type)
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number || undefined,
        department_id: data.department_id ? parseInt(data.department_id) : undefined,
        contract_id: data.contract_id ? parseInt(data.contract_id) : undefined,
        active: data.active
      }
      
      console.log('📤 [INSTRUCTOR FORM] Sending payload:', payload)
      
      if (isEditing && instructor) {
        await updateInstructor.mutateAsync({ id: instructor.instructor_id, data: payload as UpdateInstructorDTO })
      } else {
        await createInstructor.mutateAsync(payload as CreateInstructorDTO)
      }
      
      console.log('✅ [INSTRUCTOR FORM] Save successful, calling onSuccess')
      onSuccess()
    } catch (error) {
      console.error('❌ [INSTRUCTOR FORM] Error saving instructor:', error)
    }
  }

  const isLoading = createInstructor.isPending || updateInstructor.isPending

  // Button state logic (following ProgramForm pattern)
  const isButtonDisabled = isEditing 
    ? (!isFormValid() || !hasChanges || isLoading)  // For editing: need valid form AND changes
    : (!isFormValid() || isLoading)  // For new instructors: just need valid form
  
  console.log('🔘 [INSTRUCTOR FORM] Button state:', {
    isEditing,
    isFormValid: isFormValid(),
    hasChanges,
    isLoading,
    isButtonDisabled
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            console.log('🚪 [INSTRUCTOR FORM] Modal backdrop clicked, closing')
            onClose()
          }
        }}
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
              <Button variant="ghost" size="sm" onClick={() => {
                console.log('❌ [INSTRUCTOR FORM] X button clicked, closing')
                onClose()
              }} disabled={isLoading}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form 
                onSubmit={(e) => {
                  console.log('🚀 [INSTRUCTOR FORM] Form submit event triggered by:', e.nativeEvent)
                  handleSubmit(onSubmit)(e)
                }}
                onKeyDown={(e) => {
                  // Prevent Enter key from submitting the form unless it's on the submit button
                  if (e.key === 'Enter' && e.target !== e.currentTarget) {
                    const target = e.target as HTMLElement
                    if (target.type !== 'submit' && !target.closest('button[type="submit"]')) {
                      console.log('⚠️ [INSTRUCTOR FORM] Prevented Enter key submit from:', target.tagName, target.className)
                      e.preventDefault()
                    }
                  }
                }}
              >
                <motion.div 
                  className="space-y-6"
                  animate={{
                    paddingBottom: isExpanded ? `${expandedHeight}px` : '20px'
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                >

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombres"
                    {...register('first_name')}
                    error={errors.first_name?.message}
                    disabled={isLoading}
                    maxLength={50}
                    required
                  />

                  <Input
                    label="Apellidos"
                    {...register('last_name')}
                    error={errors.last_name?.message}
                    disabled={isLoading}
                    maxLength={50}
                    required
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    disabled={isLoading}
                    maxLength={100}
                    required
                  />

                  <Input
                    label="Teléfono"
                    type="tel"
                    {...register('phone_number')}
                    error={errors.phone_number?.message}
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>

                {/* Professional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department select - replaced SearchableSelect with regular select */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Coordinación
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      {...register('department_id')}
                      disabled={isLoading || isDepartmentsLoading}
                      className="w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar coordinación...</option>
                      {departmentsArray.map((dept: any) => (
                        <option key={dept.department_id} value={dept.department_id?.toString() || ''}>
                          {dept.name || 'Sin nombre'} {dept.email ? `(${dept.email})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.department_id && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                        {errors.department_id?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Contrato
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    
                    <div className="relative">
                      {/* Main select button */}
                      <div
                        onClick={() => {
                          if (!isLoading && !isContractsLoading) {
                            // Toggle dropdown manually
                            const dropdown = document.getElementById('contract-dropdown')
                            if (dropdown) {
                              dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none'
                            }
                          }
                        }}
                        className="w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 cursor-pointer transition-colors duration-200 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        tabIndex={0}
                      >
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const selectedContract = contractsArray.find(c => c.contract_id?.toString() === contractId)
                            return selectedContract ? (
                              <div className="flex flex-col">
                                <span className="text-sm truncate">{selectedContract.contract_type}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {selectedContract.hour_limit ? `${selectedContract.hour_limit} horas` : 'Sin límite'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Seleccionar contrato...
                              </span>
                            )
                          })()}
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Dropdown */}
                      <div
                        id="contract-dropdown"
                        style={{ display: 'none' }}
                        className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[9999]"
                      >
                        {/* Options list */}
                        <div className="overflow-y-auto max-h-48">
                          {contractsArray.map((contract) => (
                            <button
                              key={contract.contract_id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setValue('contract_id', contract.contract_id?.toString() || '')
                                document.getElementById('contract-dropdown')!.style.display = 'none'
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {contract.contract_type}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {contract.hour_limit ? `${contract.hour_limit} horas` : 'Sin límite'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {errors.contract_id && (
                      <p className="mt-1 text-xs text-error-600 dark:text-error-400" role="alert">
                        {errors.contract_id?.message}
                      </p>
                    )}
                    
                    {/* Hidden input for form registration */}
                    <input
                      {...register('contract_id')}
                      type="hidden"
                      required
                    />
                  </div>
                </div>

                {/* Status Information */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('active')}
                      id="active"
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                      Instructor activo
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => {
                    console.log('🔄 [INSTRUCTOR FORM] Cancel button clicked, closing')
                    onClose()
                  }} disabled={isLoading}>
                    Cancelar
                  </Button>
                  
                  <Button type="submit" disabled={isButtonDisabled} className="min-w-[120px]">
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
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}