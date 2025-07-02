import React, { useState, useCallback, useMemo, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
// import { useModalExpansion } from '@/hooks/useModalExpansion' // Hook doesn't exist
import {
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  Modal,
  Typography,
  // SearchableSelect, // Component doesn't exist
  // type SearchableSelectOption // Type doesn't exist
} from '@/design-system/components'
import { useInstructorList } from '@/features/instructor/hooks'
import { useGroupList } from '@/features/scheduling/hooks'
import { useClassroomList } from '@/features/classroom/hooks'
import { useTimeBlockList, useDayTimeBlockList, useClassScheduleList, useQuarterList, useUpdateClassSchedule, useDeleteClassSchedule } from '@/features/scheduling/hooks'
import { useTimeBlocks, useActiveScheduleConfig, useDays } from '@/services/query/hooks/academic-config.hooks'
import { ScheduleMatrix } from '@/features/scheduling/components/ScheduleMatrix/ScheduleMatrix'
import { AcademicIntegrityGuard } from '@/components/AcademicIntegrityGuard'
import { useAcademicIntegrity, useCanSchedule } from '@/hooks/useAcademicIntegrity'
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  AlertCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ClassSchedule } from '@/features/scheduling/types'
import { useAuthStore } from '@/stores/auth.store'

// Memoized cell component for better performance
const ScheduleCellComponent = memo(({ 
  cell, 
  onCellClick, 
  getCellColor, 
  selectedContext 
}: {
  cell: ScheduleCell
  onCellClick: (cell: ScheduleCell) => void
  getCellColor: (status: CellStatus) => string
  selectedContext: SelectedContext | null
}) => {
  return (
    <button
      onClick={() => onCellClick(cell)}
      disabled={!selectedContext || !cell.dayTimeBlockId}
      className={cn(
        "w-full h-20 rounded-lg border-2 transition-all duration-200",
        getCellColor(cell.status),
        selectedContext && cell.dayTimeBlockId
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-50"
      )}
    >
      {cell.classSchedule && (
        <div className="p-2 text-xs">
          <p className="font-medium truncate">{cell.classSchedule.subject}</p>
          {cell.status === 'partial' && (
            <div className="flex items-center justify-center mt-1">
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
          )}
        </div>
      )}
    </button>
  )
})

ScheduleCellComponent.displayName = 'ScheduleCellComponent'

// Memoized search results component
const SearchResults = memo(({ 
  results, 
  searchType, 
  onSelectContext 
}: {
  results: any[]
  searchType: SearchType
  onSelectContext: (item: any) => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-50"
    >
      {results.map((item: any) => (
        <button
          key={item.id}
          onClick={() => onSelectContext(item)}
          className="w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {searchType === 'instructor' && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span>{item.first_name} {item.last_name}</span>
            </div>
          )}
          {searchType === 'ficha' && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span>{item.group_number} - {item.program?.name}</span>
            </div>
          )}
          {searchType === 'ambiente' && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span>{item.room_number} - {item.campus?.address}</span>
            </div>
          )}
        </button>
      ))}
    </motion.div>
  )
})

SearchResults.displayName = 'SearchResults'

type SearchType = 'instructor' | 'ficha' | 'ambiente'
type SelectedContext = {
  type: SearchType
  value: string
  label: string
  id: string
}

type CellStatus = 'empty' | 'complete' | 'partial'

interface ScheduleCell {
  dayTimeBlockId: string
  status: CellStatus
  classSchedule?: ClassSchedule
}

function ProgrammingPage() {
  // Navigation
  const navigate = useNavigate()
  
  // Academic integrity validation
  const { canScheduleClasses, criticalErrors, warnings } = useAcademicIntegrity()
  const canSchedule = useCanSchedule()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('instructor')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedContext, setSelectedContext] = useState<SelectedContext | null>(null)
  const [showProgrammingModal, setShowProgrammingModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ blockIndex: number; dayIndex: number } | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    instructor_id: '',
    group_id: '',
    classroom_id: ''
  })

  // Debug: Check auth state
  const { isAuthenticated, user, token } = useAuthStore()

  // Data hooks - Always load for search functionality
  const instructorQuery = useInstructorList(
    { limit: 200 }, // Increased limit for better search
    { enabled: isAuthenticated }
  )
  
  // Debug authentication status
  useEffect(() => {
    console.log('🔐 [AUTH DEBUG] Authentication status:', {
      isAuthenticated,
      token: token ? 'present' : 'missing',
      user: user ? user.email : 'no user'
    })
  }, [isAuthenticated, token, user])
  const groupQuery = useGroupList(
    {},
    { enabled: isAuthenticated }
  )
  const classroomQuery = useClassroomList(
    { limit: 200 },
    { enabled: isAuthenticated }
  )
  
  const { data: instructorsData, isLoading: instructorsLoading, error: instructorsError, status: instructorsStatus } = instructorQuery
  const { data: groupsData, isLoading: groupsLoading, error: groupsError, status: groupsStatus } = groupQuery
  const { data: classroomsData, isLoading: classroomsLoading, error: classroomsError, status: classroomsStatus } = classroomQuery
  
  // Enhanced debugging with React Query status - DISABLED
  /* useEffect(() => {
    console.log('🔄 Query Status Update:', {
      instructors: { status: instructorsStatus, loading: instructorsLoading, error: instructorsError, dataCount: instructorsData?.items?.length || 0 },
      groups: { status: groupsStatus, loading: groupsLoading, error: groupsError, dataCount: groupsData?.items?.length || 0 },
      classrooms: { status: classroomsStatus, loading: classroomsLoading, error: classroomsError, dataCount: classroomsData?.items?.length || 0 }
    })
  }, [instructorsStatus, groupsStatus, classroomsStatus, instructorsData, groupsData, classroomsData, instructorsError, groupsError, classroomsError]) */
  
  // Load dynamic academic configuration
  const { data: academicTimeBlocks } = useTimeBlocks({})
  const { data: academicDays } = useDays()
  const { data: academicScheduleConfig } = useActiveScheduleConfig()
  
  // Load schedule data when needed - ENABLE ALL FOR TESTING
  const { data: timeBlocksData, refetch: refetchTimeBlocks } = useTimeBlockList({ 
    enabled: isAuthenticated
  })
  const { data: dayTimeBlocksData, refetch: refetchDayTimeBlocks } = useDayTimeBlockList({ 
    enabled: isAuthenticated
  })
  
  // Debug day time blocks data
  useEffect(() => {
    if (dayTimeBlocksData) {
      console.log('📅 Day time blocks loaded:', (dayTimeBlocksData as any)?.items?.length || 0, 'items')
      console.log('📅 Day time blocks data structure:', dayTimeBlocksData)
      console.log('📅 Sample day time block:', (dayTimeBlocksData as any)?.items?.[0])
    }
  }, [dayTimeBlocksData])
  
  // Debug academic configuration
  useEffect(() => {
    if (academicTimeBlocks) {
      console.log('🎯 Academic time blocks loaded:', academicTimeBlocks.time_blocks?.length || 0, 'blocks')
    }
    if (academicDays) {
      console.log('🗓️ Academic days loaded:', academicDays.days?.length || 0, 'days')
    }
  }, [academicTimeBlocks, academicDays])
  
  // Debug data loading status
  useEffect(() => {
    console.log('🔎 Data loading status:', {
      instructors: {
        loading: instructorsLoading,
        error: instructorsError?.message,
        dataLength: (instructorsData as any)?.data?.length || 0,
        status: instructorsStatus
      },
      groups: {
        loading: groupsLoading,
        error: groupsError?.message,
        dataLength: groupsData?.items?.length || 0,
        status: groupsStatus
      },
      classrooms: {
        loading: classroomsLoading,
        error: classroomsError?.message,
        dataLength: classroomsData?.items?.length || 0,
        status: classroomsStatus
      }
    })
  }, [instructorsLoading, groupsLoading, classroomsLoading, instructorsData, groupsData, classroomsData])
  
  // Debug específico para instructores
  useEffect(() => {
    console.log('👨‍🏫 [INSTRUCTORS DEBUG] Status update:', {
      loading: instructorsLoading,
      error: instructorsError,
      status: instructorsStatus,
      hasData: !!instructorsData,
      dataStructure: instructorsData ? Object.keys(instructorsData) : 'no data',
      itemsLength: instructorsData?.items?.length || 0,
      totalInResponse: instructorsData?.total || 0,
      firstInstructor: instructorsData?.items?.[0]
    })
  }, [instructorsData, instructorsLoading, instructorsError, instructorsStatus])
  
  const { data: classSchedulesData, refetch: refetchClassSchedules } = useClassScheduleList({}, { 
    enabled: isAuthenticated
  })
  const { data: quartersData } = useQuarterList({ 
    enabled: isAuthenticated 
  })

  // Mutation hooks for class schedule operations
  const updateClassSchedule = useUpdateClassSchedule()
  const deleteClassSchedule = useDeleteClassSchedule()

  // Modal expansion hook
  // const { expandedHeight, isExpanded, handleDropdownOpen, currentOpenDropdown } = useModalExpansion()
  const expandedHeight = 'auto'
  const isExpanded = false
  const handleDropdownOpen = () => {}
  const currentOpenDropdown = null
  
  // State to track which dropdown is open
  const [openDropdownField, setOpenDropdownField] = useState<string | null>(null)
  
  // Handle single dropdown logic
  const handleSingleDropdownOpen = useCallback((fieldName: string, isOpen: boolean) => {
    if (isOpen) {
      // Close any other open dropdown and open this one
      setOpenDropdownField(fieldName)
    } else {
      // Close only if this dropdown was open
      if (openDropdownField === fieldName) {
        setOpenDropdownField(null)
      }
    }
    // Always call the modal expansion handler
    handleDropdownOpen()
  }, [openDropdownField, handleDropdownOpen])

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  const isLoading = instructorsLoading || groupsLoading || classroomsLoading
  
  // Enhanced debug info
  const debugInfo = {
    isAuthenticated,
    searchType,
    instructorsCount: instructorsData?.items?.length || 0,
    groupsCount: groupsData?.items?.length || 0,
    classroomsCount: classroomsData?.items?.length || 0,
    instructorsStatus,
    groupsStatus,
    classroomsStatus,
    instructorsError: instructorsError?.message || null,
    groupsError: groupsError?.message || null,
    classroomsError: classroomsError?.message || null,
    instructorsLoading,
    groupsLoading,
    classroomsLoading
  }

  // Get current quarter
  const currentQuarter = useMemo(() => {
    return quartersData?.data?.find((q: any) => {
      const now = new Date()
      const start = new Date(q.start_date)
      const end = new Date(q.end_date)
      return now >= start && now <= end
    })
  }, [quartersData])
  
  // Dynamic academic configuration
  const dynamicTimeBlocks = useMemo(() => {
    if (academicTimeBlocks?.time_blocks && academicTimeBlocks.time_blocks.length > 0) {
      // Remove is_active filter temporarily since all blocks are inactive in DB
      const activeBlocks = academicTimeBlocks.time_blocks
        .filter((block: any) => block.is_active)
      
      // If no active blocks, use all blocks as fallback
      const blocksToUse = activeBlocks.length > 0 ? activeBlocks : academicTimeBlocks.time_blocks
      
      return blocksToUse
        .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
        .map((block: any, index: number) => ({
          id: index + 1,
          start: block.start_time.substring(0, 5),
          end: block.end_time.substring(0, 5),
          originalId: block.time_block_id
        }))
    }
    // Fallback to default 8 blocks if no configuration
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      start: `${6 + i * 2}:00`,
      end: `${8 + i * 2}:00`,
      originalId: i + 1
    }))
  }, [academicTimeBlocks])
  
  // Debug dynamicTimeBlocks
  useEffect(() => {
    console.log('🕰️ [TIME BLOCKS DEBUG]:', {
      academicTimeBlocks: academicTimeBlocks ? 'loaded' : 'not loaded',
      timeBlocksArray: academicTimeBlocks?.time_blocks,
      timeBlocksCount: academicTimeBlocks?.time_blocks?.length || 0,
      dynamicTimeBlocksCount: dynamicTimeBlocks.length,
      dynamicTimeBlocks: dynamicTimeBlocks,
      firstBlock: dynamicTimeBlocks[0]
    })
  }, [academicTimeBlocks, dynamicTimeBlocks])
  
  const dynamicDays = useMemo(() => {
    if (academicDays?.days) {
      return academicDays.days
        .filter((day: any) => day.is_active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((day: any) => ({
          id: day.day_id,
          name: day.name === 'Monday' ? 'Lunes' :
                day.name === 'Tuesday' ? 'Martes' :
                day.name === 'Wednesday' ? 'Miércoles' :
                day.name === 'Thursday' ? 'Jueves' :
                day.name === 'Friday' ? 'Viernes' :
                day.name === 'Saturday' ? 'Sábado' :
                day.name === 'Sunday' ? 'Domingo' : day.name,
          shortName: day.short_name || day.name.substring(0, 3),
          originalId: day.day_id
        }))
    }
    // Fallback to default 6 days if no configuration (Monday to Saturday)
    return [
      { id: 1, name: 'Lunes', shortName: 'LUN', originalId: 1 },
      { id: 2, name: 'Martes', shortName: 'MAR', originalId: 2 },
      { id: 3, name: 'Miércoles', shortName: 'MIE', originalId: 3 },
      { id: 4, name: 'Jueves', shortName: 'JUE', originalId: 4 },
      { id: 5, name: 'Viernes', shortName: 'VIE', originalId: 5 },
      { id: 6, name: 'Sábado', shortName: 'SAB', originalId: 6 }
    ]
  }, [academicDays])
  
  // Debug dynamicDays
  useEffect(() => {
    console.log('🗓️ [DAYS DEBUG]:', {
      academicDays: academicDays ? 'loaded' : 'not loaded',
      daysArray: academicDays?.days,
      daysCount: academicDays?.days?.length || 0,
      dynamicDaysCount: dynamicDays.length,
      dynamicDays: dynamicDays
    })
  }, [academicDays, dynamicDays])
  
  // Debug selectedContext and grid rendering
  useEffect(() => {
    console.log('🎯 [CONTEXT DEBUG]:', {
      hasSelectedContext: !!selectedContext,
      selectedContextType: selectedContext?.type,
      selectedContextLabel: selectedContext?.label,
      shouldShowGrid: !!selectedContext,
      dynamicTimeBlocksReady: dynamicTimeBlocks.length > 0,
      dynamicDaysReady: dynamicDays.length > 0
    })
  }, [selectedContext, dynamicTimeBlocks, dynamicDays])

  // Prepare options for select components - memoized for performance
  const instructorOptions = useMemo(() => {
    return (instructorsData?.items || []).map((instructor: any) => ({
      value: instructor.instructor_id.toString(),
      label: `${instructor.first_name} ${instructor.last_name}`,
      subtext: instructor.email
    }))
  }, [instructorsData])

  const groupOptions = useMemo(() => {
    return (groupsData?.items || []).map((group: any) => ({
      value: group.group_id.toString(),
      label: `Ficha ${group.group_number}`,
      subtext: group.program?.name || 'Programa no especificado'
    }))
  }, [groupsData])

  const classroomOptions = useMemo(() => {
    return (classroomsData?.items || []).map((classroom: any) => ({
      value: classroom.classroom_id.toString(),
      label: `${classroom.room_number}`,
      subtext: `${classroom.classroom_type || 'Ambiente'} - ${classroom.campus?.address || 'Sede no especificada'}`
    }))
  }, [classroomsData])

  // Days of the week - now dynamic from academic configuration
  const daysOfWeek = useMemo(() => {
    if (academicDays?.days) {
      return academicDays.days
        .filter((day: any) => day.is_active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((day: any) => ({
          id: day.day_id,
          name: day.name === 'Monday' ? 'Lunes' :
                day.name === 'Tuesday' ? 'Martes' :
                day.name === 'Wednesday' ? 'Miércoles' :
                day.name === 'Thursday' ? 'Jueves' :
                day.name === 'Friday' ? 'Viernes' :
                day.name === 'Saturday' ? 'Sábado' :
                day.name === 'Sunday' ? 'Domingo' : day.name
        }))
    }
    // Fallback to default if no configuration
    return [
      { id: 1, name: 'Lunes' },
      { id: 2, name: 'Martes' },
      { id: 3, name: 'Miércoles' },
      { id: 4, name: 'Jueves' },
      { id: 5, name: 'Viernes' },
      { id: 6, name: 'Sábado' }
    ]
  }, [academicDays])


  // Search functionality with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])
  
  // Function to normalize text for search (handles accents and special characters)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, '') // Remove special characters except spaces
  }

  // Process search results when debounced query changes
  useEffect(() => {
    let results: any[] = []
    
    // Debug data loading
    console.log('🔍 Processing search results:', {
      searchType,
      debouncedQuery,
      instructorsData: instructorsData ? 'loaded' : 'not loaded',
      groupsData: groupsData ? 'loaded' : 'not loaded', 
      classroomsData: classroomsData ? 'loaded' : 'not loaded',
      instructorsCount: instructorsData?.items?.length || 0,
      groupsCount: groupsData?.items?.length || 0,
      classroomsCount: classroomsData?.items?.length || 0
    })
    
    // If no search query, show initial results (first few items)
    if (!debouncedQuery.trim()) {
      switch (searchType) {
        case 'instructor':
          results = (instructorsData?.items || []).slice(0, 10)
          console.log('👨‍🏫 [INSTRUCTOR SEARCH] Initial results:', {
            instructorsDataExists: !!instructorsData,
            itemsExists: !!instructorsData?.items,
            itemsLength: instructorsData?.items?.length || 0,
            results: results.length,
            sampleResult: results[0]
          })
          break
        case 'ficha':
          results = (groupsData?.items || []).slice(0, 10)
          break
        case 'ambiente':
          results = (classroomsData?.items || []).slice(0, 10)
          break
      }
      console.log('📋 Initial results for', searchType, ':', results.length, 'items')
      setSearchResults(results)
      return
    }

    // Filter results based on search query
    const normalizedQuery = normalizeText(debouncedQuery)

    switch (searchType) {
      case 'instructor':
        const instructors = instructorsData?.items || []
        console.log('👨‍🏫 [INSTRUCTOR SEARCH] Filtering:', {
          query: normalizedQuery,
          totalInstructors: instructors.length,
          sampleInstructor: instructors[0]
        })
        results = instructors.filter((instructor: any) => {
          const fullName = normalizeText(`${instructor.first_name || ''} ${instructor.last_name || ''}`)
          const email = normalizeText(instructor.email || '')
          const phoneNumber = normalizeText((instructor.phone_number || '').toString())
          
          return fullName.includes(normalizedQuery) || 
                 email.includes(normalizedQuery) ||
                 phoneNumber.includes(normalizedQuery)
        })
        console.log('👨‍🏫 [INSTRUCTOR SEARCH] Filtered results:', results.length)
        break
      case 'ficha':
        const groups = groupsData?.items || []
        results = groups.filter((group: any) => {
          const groupNumber = normalizeText((group.group_number || '').toString())
          const programName = normalizeText(group.program?.name || '')
          const code = normalizeText(group.code || '')
          
          return groupNumber.includes(normalizedQuery) ||
                 programName.includes(normalizedQuery) ||
                 code.includes(normalizedQuery)
        })
        break
      case 'ambiente':
        const classrooms = classroomsData?.items || []
        results = classrooms.filter((classroom: any) => {
          const roomNumber = normalizeText(classroom.room_number || '')
          const campusAddress = normalizeText(classroom.campus?.address || '')
          const classroomType = normalizeText(classroom.classroom_type || '')
          
          return roomNumber.includes(normalizedQuery) ||
                 campusAddress.includes(normalizedQuery) ||
                 classroomType.includes(normalizedQuery)
        })
        break
    }

    setSearchResults(results.slice(0, 15))
    
    // Debug UTF-8 encoding issues
    if (results.length > 0) {
      console.log('🔤 Search results sample:')
      console.log('Original data:', results[0])
      if (searchType === 'ficha' && results[0]?.program?.name) {
        console.log('Program name:', results[0].program.name)
        console.log('Program name chars:', [...results[0].program.name])
      }
    }
  }, [debouncedQuery, searchType, instructorsData, groupsData, classroomsData])

  // Select context
  const handleSelectContext = (item: any) => {
    let label = ''
    let id = ''

    switch (searchType) {
      case 'instructor':
        label = `${item.first_name} ${item.last_name}`
        id = item.instructor_id
        break
      case 'ficha':
        label = `${item.group_number} - ${item.program?.name}`
        id = item.group_id
        break
      case 'ambiente':
        label = `${item.room_number} - ${item.campus?.address}`
        id = item.classroom_id
        break
    }

    setSelectedContext({
      type: searchType,
      value: label,
      label,
      id
    })
    setSearchQuery('')
    setShowSearchResults(false)
  }

  // Get schedule grid data
  const scheduleGrid = useMemo(() => {
    if (!selectedContext || !dayTimeBlocksData || !classSchedulesData) return []

    const grid: ScheduleCell[][] = []
    const timeBlocks = (timeBlocksData as any)?.items || []
    const dayTimeBlocks = (dayTimeBlocksData as any)?.items || []
    const classSchedules = (classSchedulesData as any)?.items || []

    // Filter class schedules based on selected context
    const filteredSchedules = classSchedules.filter((schedule: any) => {
      switch (selectedContext.type) {
        case 'instructor':
          return schedule.instructor_id === selectedContext.id
        case 'ficha':
          return schedule.group_id === selectedContext.id
        case 'ambiente':
          return schedule.classroom_id === selectedContext.id
        default:
          return false
      }
    })

    // Build grid
    timeBlocks.forEach((timeBlock: any, rowIndex: number) => {
      grid[rowIndex] = []
      daysOfWeek.forEach((day, colIndex) => {
        const dayTimeBlock = dayTimeBlocks.find(
          (dtb: any) => dtb.day_id === day.id && dtb.time_block_id === timeBlock.time_block_id
        )

        if (dayTimeBlock) {
          const classSchedule = filteredSchedules.find(
            (cs: any) => cs.day_time_block_id === dayTimeBlock.day_time_block_id
          )

          let status: CellStatus = 'empty'
          if (classSchedule) {
            // Check if complete or partial
            if (classSchedule.instructor_id && classSchedule.classroom_id) {
              status = 'complete'
            } else if (classSchedule.instructor_id || classSchedule.classroom_id) {
              status = 'partial'
            }
          }

          grid[rowIndex][colIndex] = {
            dayTimeBlockId: dayTimeBlock.day_time_block_id,
            status,
            classSchedule
          }
        } else {
          grid[rowIndex][colIndex] = {
            dayTimeBlockId: '',
            status: 'empty'
          }
        }
      })
    })

    return grid
  }, [selectedContext, dayTimeBlocksData, classSchedulesData, timeBlocksData, daysOfWeek])

  // Handle cell click - memoized
  const handleCellClick = useCallback((blockIndex: number, dayIndex: number) => {
    console.log('🖱️ Cell clicked:', { blockIndex, dayIndex, selectedContext, showProgrammingModal })
    if (!selectedContext) {
      console.log('❌ No selected context')
      return
    }

    // Get the current cell data to check if there's an existing class
    const cellData = scheduleGrid[blockIndex]?.[dayIndex]
    const existingClass = cellData?.classSchedule

    setSelectedCell({ blockIndex, dayIndex })
    setShowProgrammingModal(true)
    
    if (existingClass) {
      // Edit mode: Pre-fill form with existing class data
      console.log('✏️ Edit mode: Found existing class:', existingClass)
      setIsEditMode(true)
      setEditingClassId(existingClass.class_schedule_id)
      
      const editFormData = {
        subject: existingClass.subject || '',
        instructor_id: existingClass.instructor_id?.toString() || '',
        group_id: existingClass.group_id?.toString() || '',
        classroom_id: existingClass.classroom_id?.toString() || ''
      }
      setFormData(editFormData)
    } else {
      // Create mode: Reset form and pre-fill with selected context
      console.log('➕ Create mode: No existing class found')
      setIsEditMode(false)
      setEditingClassId(null)
      
      const initialFormData = {
        subject: '',
        instructor_id: selectedContext.type === 'instructor' ? selectedContext.id : '',
        group_id: selectedContext.type === 'ficha' ? selectedContext.id : '',
        classroom_id: selectedContext.type === 'ambiente' ? selectedContext.id : ''
      }
      setFormData(initialFormData)
    }
    
    console.log('✅ Modal should open now')
  }, [selectedContext, showProgrammingModal, scheduleGrid])

  // Handle form submission (create or update)
  const handleSubmitClass = useCallback(async () => {
    if (!selectedCell) return
    
    // Academic integrity validation
    if (!canScheduleClasses) {
      toast.error('❌ Configuración académica incompleta. Complete la configuración antes de programar clases.')
      console.error('🚨 Programming blocked due to incomplete academic configuration:', criticalErrors)
      return
    }
    
    setIsSubmitting(true)
    try {
      // Validate required fields
      if (!formData.subject.trim()) {
        toast.error('La materia es requerida')
        return
      }
      
      if (!formData.group_id) {
        toast.error('La ficha es requerida')
        return
      }
      
      // Business rule: Must have instructor OR classroom (not both empty)
      if (!formData.instructor_id && !formData.classroom_id) {
        toast.error('Debe asignar al menos un instructor O un ambiente')
        return
      }
      
      if (isEditMode && editingClassId) {
        // UPDATE MODE - Edit existing class
        console.log('✏️ Updating existing class:', editingClassId)
        
        const updateData = {
          subject: formData.subject.trim(),
          group_id: formData.group_id,
          instructor_id: formData.instructor_id || undefined,
          classroom_id: formData.classroom_id || undefined
        }
        
        await updateClassSchedule.mutateAsync({
          id: editingClassId,
          data: updateData
        })
        
        console.log('✅ Class updated successfully')
        
      } else {
        // CREATE MODE - Create new class
        console.log('➕ Creating new class')
        
        if (!selectedContext) {
          toast.error('Debe seleccionar un contexto (instructor, ficha o ambiente)')
          return
        }
        
        // Find the current quarter
        const quarters = (quartersData as any)?.data || []
        const currentQuarter = quarters.find((q: any) => {
          const now = new Date()
          const start = new Date(q.start_date)
          const end = new Date(q.end_date)
          return now >= start && now <= end
        })
        
        if (!currentQuarter) {
          console.error('❌ No current quarter found. Available quarters:', quarters)
          console.log('⚠️ Using quarter_id = 1 as fallback')
        }
        
        // Calculate day_time_block_id
        const dayId = selectedCell.dayIndex + 1 // Days: 1=Monday, 2=Tuesday, etc.
        const timeBlockId = selectedCell.blockIndex + 1 // Time blocks: 1-8
        
        // Find the specific day_time_block_id from the backend data
        const dayTimeBlock = (dayTimeBlocksData as any)?.items?.find(
          (dtb: any) => dtb.day_id === dayId && dtb.time_block_id === timeBlockId
        )
        
        if (!dayTimeBlock) {
          console.error('❌ Day time block not found for:', { dayId, timeBlockId })
          toast.error('Error: No se pudo encontrar el bloque de tiempo para este horario')
          return
        }
        
        const classData = {
          subject: formData.subject.trim(),
          group_id: parseInt(formData.group_id),
          instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : null,
          classroom_id: formData.classroom_id ? parseInt(formData.classroom_id) : null,
          quarter_id: currentQuarter?.quarter_id || 1,
          day_time_block_id: dayTimeBlock.day_time_block_id
        }

        // Use fetch for creation to maintain existing create logic
        const response = await fetch('http://localhost:8001/api/v1/scheduling/class-schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(classData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Failed to create class:', errorData)
          throw new Error(errorData.error?.message || 'Error al crear la clase')
        }
        
        console.log('✅ Class created successfully')
        toast.success('Clase programada exitosamente')
      }
      
      // Close modal and reset form
      setShowProgrammingModal(false)
      setSelectedCell(null)
      setIsEditMode(false)
      setEditingClassId(null)
      setFormData({ subject: '', instructor_id: '', group_id: '', classroom_id: '' })
      
      // Refresh schedule data
      console.log('🔄 Refreshing data...')
      setIsRefreshing(true)
      
      try {
        await Promise.all([
          refetchClassSchedules(),
          refetchDayTimeBlocks(),
          refetchTimeBlocks()
        ])
        console.log('✅ Data refreshed successfully')
      } catch (error) {
        console.error('❌ Error refreshing data:', error)
      } finally {
        setIsRefreshing(false)
      }
      
    } catch (error: any) {
      console.error('❌ Error in handleSubmitClass:', error)
      toast.error(error.message || 'Error al procesar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedCell, selectedContext, formData, isEditMode, editingClassId, token, quartersData, dayTimeBlocksData, updateClassSchedule, refetchClassSchedules, refetchDayTimeBlocks, refetchTimeBlocks])

  // Handle class deletion
  const handleDeleteClass = useCallback(async () => {
    if (!isEditMode || !editingClassId) return
    
    // Confirm deletion
    if (!window.confirm('¿Está seguro de que desea eliminar esta clase?')) {
      return
    }
    
    setIsSubmitting(true)
    try {
      await deleteClassSchedule.mutateAsync(editingClassId)
      
      console.log('✅ Class deleted successfully')
      
      // Close modal and reset form
      setShowProgrammingModal(false)
      setSelectedCell(null)
      setIsEditMode(false)
      setEditingClassId(null)
      setFormData({ subject: '', instructor_id: '', group_id: '', classroom_id: '' })
      
      // Refresh schedule data
      console.log('🔄 Refreshing data after deletion...')
      setIsRefreshing(true)
      
      try {
        await Promise.all([
          refetchClassSchedules(),
          refetchDayTimeBlocks(),
          refetchTimeBlocks()
        ])
        console.log('✅ Data refreshed successfully')
      } catch (error) {
        console.error('❌ Error refreshing data:', error)
      } finally {
        setIsRefreshing(false)
      }
      
    } catch (error: any) {
      console.error('❌ Error deleting class:', error)
      toast.error(error.message || 'Error al eliminar la clase')
    } finally {
      setIsSubmitting(false)
    }
  }, [isEditMode, editingClassId, deleteClassSchedule, refetchClassSchedules, refetchDayTimeBlocks, refetchTimeBlocks])

  // Get cell color based on status - memoized
  const getCellColor = useCallback((status: CellStatus) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/30'
      case 'partial':
        return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/30'
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
    }
  }, [])

  // Early loading state with minimal UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  // Show search interface immediately, load data progressively
  const showLoadingInline = isLoading && searchQuery.length > 0

  // Generate schedule data based on real database data and dynamic configuration
  const scheduleData = useMemo(() => {
    const data: Array<Array<{ 
      hasClass: boolean; 
      isPartial: boolean; 
      classData?: any;
      dayTimeBlockId?: number;
    }>> = []
    
    // Initialize empty grid (dynamic time blocks x dynamic days)
    const numTimeBlocks = dynamicTimeBlocks.length
    const numDays = dynamicDays.length
    
    for (let blockIndex = 0; blockIndex < numTimeBlocks; blockIndex++) {
      const row: Array<{ 
        hasClass: boolean; 
        isPartial: boolean; 
        classData?: any;
        dayTimeBlockId?: number;
      }> = []
      for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
        row.push({ hasClass: false, isPartial: false })
      }
      data.push(row)
    }
    
    // If we have schedule data, populate it
    if ((classSchedulesData as any)?.items && (dayTimeBlocksData as any)?.items) {
      (classSchedulesData as any).items.forEach((classSchedule: any) => {
        // Find the corresponding day_time_block
        const dayTimeBlock = (dayTimeBlocksData as any).items.find(
          (dtb: any) => dtb.day_time_block_id === classSchedule.day_time_block_id
        )
        
        if (dayTimeBlock) {
          // Find the corresponding indices in our dynamic configuration
          const dayIndex = dynamicDays.findIndex(day => day.originalId === dayTimeBlock.day_id)
          const blockIndex = dynamicTimeBlocks.findIndex(block => block.originalId === dayTimeBlock.time_block_id)
          
          // Check if this class is relevant to the selected context
          const isRelevantToContext = !selectedContext || (
            (selectedContext.type === 'instructor' && classSchedule.instructor_id === parseInt(selectedContext.id)) ||
            (selectedContext.type === 'ficha' && classSchedule.group_id === parseInt(selectedContext.id)) ||
            (selectedContext.type === 'ambiente' && classSchedule.classroom_id === parseInt(selectedContext.id))
          )
          
          if (isRelevantToContext && dayIndex >= 0 && dayIndex < dynamicDays.length && blockIndex >= 0 && blockIndex < dynamicTimeBlocks.length) {
            // Check if class is complete or partial
            const hasInstructor = !!classSchedule.instructor_id
            const hasClassroom = !!classSchedule.classroom_id
            const hasGroup = !!classSchedule.group_id
            
            const isComplete = hasInstructor && hasClassroom && hasGroup
            const isPartial = (hasInstructor || hasClassroom) && !(hasInstructor && hasClassroom)
            
            data[blockIndex][dayIndex] = {
              hasClass: true,
              isPartial: isPartial,
              classData: classSchedule,
              dayTimeBlockId: dayTimeBlock.day_time_block_id
            }
          }
        }
      })
    }
    
    console.log('🔄 Schedule data updated:', {
      classSchedulesCount: (classSchedulesData as any)?.items?.length || 0,
      dayTimeBlocksCount: (dayTimeBlocksData as any)?.items?.length || 0,
      selectedContext: selectedContext?.type,
      dataStructure: data.map((row, blockIndex) => 
        row.map((cell, dayIndex) => ({
          hasClass: cell.hasClass,
          subject: cell.classData?.subject || null
        }))
      )
    })
    
    return data
  }, [classSchedulesData, dayTimeBlocksData, selectedContext, dynamicTimeBlocks, dynamicDays])

  // ScheduleCell component - memoized to prevent unnecessary re-renders
  const ScheduleCell = memo<{
    timeBlock: { id: number; start: string; end: string }
    dayIndex: number
    hasClass: boolean
    isPartial: boolean
    selectedContext: any
    onClick: () => void
  }>(({ timeBlock, dayIndex, hasClass, isPartial, selectedContext, onClick }) => {
    const getCellStyle = () => {
      if (!hasClass) {
        return 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
      }
      if (isPartial) {
        return 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50 cursor-pointer'
      }
      return 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer'
    }

    const getClassInfo = () => {
      if (!hasClass) return null
      
      // Get real class data from scheduleData
      const cellData = scheduleData[timeBlock.id - 1]?.[dayIndex]
      const realClassData = cellData?.classData
      
      if (!realClassData) return null
      
      // Get instructor, group, and classroom data
      const instructor = instructorsData?.items?.find((i: any) => i.instructor_id === realClassData.instructor_id)
      const group = groupsData?.items?.find((g: any) => g.group_id === realClassData.group_id)
      const classroom = classroomsData?.items?.find((c: any) => c.classroom_id === realClassData.classroom_id)
      
      // Based on selected context, hide what's already selected
      return (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
            🎯 {realClassData.subject}
          </div>
          
          {selectedContext?.type !== 'ficha' && group && (
            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
              👥 {group.group_number}
            </div>
          )}
          
          {selectedContext?.type !== 'instructor' && instructor && (
            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
              👨‍🏫 {instructor.first_name} {instructor.last_name}
            </div>
          )}
          
          {selectedContext?.type !== 'ambiente' && classroom && (
            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
              🏢 {classroom.room_number}
            </div>
          )}
          
          {/* Show missing info for partial classes */}
          {isPartial && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {!instructor && !classroom ? '⚠️ Sin asignar' : 
               !instructor ? '⚠️ Sin instructor' : '⚠️ Sin ambiente'}
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        className={cn(
          "min-h-[80px] p-2 rounded-md transition-all duration-200 transform hover:scale-105",
          getCellStyle()
        )}
        onClick={onClick}
      >
        {hasClass && (
          <div className="h-full flex flex-col justify-center">
            {getClassInfo()}
          </div>
        )}
        {!hasClass && (
          <div className="h-full flex items-center justify-center">
            <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </div>
    )
  })

  ScheduleCell.displayName = 'ScheduleCell'

  return (
    <AcademicIntegrityGuard 
      requiresConfiguration={false}
      showWarnings={true}
      allowPartialAccess={true}
      fallbackMessage="Para programar clases, primero debe configurar trimestres, bloques de tiempo y días laborables en el módulo de Configuración Académica."
    >
      <div className="min-h-screen flex flex-col -m-4 md:-m-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 py-1 px-4"
      >
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div 
            className="relative flex-1 max-w-md"
            onMouseEnter={() => setShowSearchResults(true)}
            onMouseLeave={() => setShowSearchResults(false)}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
              placeholder={
                searchType === 'instructor' ? 'Buscar instructor (ej: juan, maria@sena.edu.co, 12345678)...' :
                searchType === 'ficha' ? 'Buscar ficha (ej: 2798456, sistemas, adso)...' :
                'Buscar ambiente (ej: 301, laboratorio, edificio a)...'
              }
              className="pl-10 pr-4"
            />
            {showLoadingInline && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
            
            {/* Search results dropdown */}
            <AnimatePresence>
              {showSearchResults && (
                <SearchResults
                  results={searchResults}
                  searchType={searchType}
                  onSelectContext={handleSelectContext}
                />
              )}
            </AnimatePresence>
            
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-full left-0 mt-12 p-2 bg-gray-100 text-xs text-gray-700 rounded z-50">
                Results: {searchResults.length} | Type: {searchType} | Show: {showSearchResults.toString()}
              </div>
            )}
          </div>

          {/* Filter button */}
          <div 
            className="relative"
            onMouseEnter={() => setShowFilters(true)}
            onMouseLeave={() => setShowFilters(false)}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center w-10 h-10"
            >
              <Filter className="w-4 h-4" />
            </Button>

            {/* Filter dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-[60]"
                >
                  <div className="space-y-2 min-w-[200px]">
                    <button
                      onClick={() => {
                        setSearchType('instructor')
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left rounded-md transition-colors",
                        searchType === 'instructor'
                          ? "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      Instructor
                    </button>
                    <button
                      onClick={() => {
                        setSearchType('ficha')
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left rounded-md transition-colors",
                        searchType === 'ficha'
                          ? "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      Ficha
                    </button>
                    <button
                      onClick={() => {
                        setSearchType('ambiente')
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left rounded-md transition-colors",
                        searchType === 'ambiente'
                          ? "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      Ambiente
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic label */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedContext ? selectedContext.label : 'Instructor / Ficha / Ambiente'}
              </h2>
              {isRefreshing && (
                <LoadingSpinner size="sm" />
              )}
            </div>
          </div>

          {/* View schedule button */}
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedContext || !canSchedule}
            className="flex items-center gap-2"
            title={!canSchedule ? 'Complete la configuración académica para habilitar programación' : ''}
          >
            <Eye className="w-4 h-4" />
            Visualizar Horario
          </Button>
        </div>
      </motion.div>

      {/* Schedule Grid */}
      {selectedContext ? (
        <div className="flex-1 bg-white dark:bg-gray-900 mx-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full flex flex-col"
          >
            {/* Header fijo tipo Excel */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 pb-2">
              <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${dynamicDays.length + 1}, minmax(0, 1fr))` }}>
                {/* Header row */}
                <div className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md">
                  Horas
                </div>
                {dynamicDays.map((day) => (
                  <div key={day.id} className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {day.name}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-4 pt-2">
              <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${dynamicDays.length + 1}, minmax(0, 1fr))` }}>

              {/* Time blocks and schedule cells */}
              {dynamicTimeBlocks.map((timeBlock, blockIndex) => {
                return (
                  <React.Fragment key={blockIndex}>
                    {/* Time label */}
                    <div className="p-3 text-center font-medium text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{timeBlock.start} - {timeBlock.end}</span>
                      </div>
                    </div>
                    
                    {/* Schedule cells for each day */}
                    {scheduleData[blockIndex]?.map((cellData, dayIndex) => {
                      const cellKey = `${blockIndex}-${dayIndex}`
                      
                      return (
                        <ScheduleCell
                          key={cellKey}
                          timeBlock={timeBlock}
                          dayIndex={dayIndex}
                          hasClass={cellData.hasClass}
                          isPartial={cellData.isPartial}
                          selectedContext={selectedContext}
                          onClick={() => handleCellClick(blockIndex, dayIndex)}
                        />
                      )
                    }).slice(0, dynamicDays.length) || []}
                  </React.Fragment>
                )
              })}
              </div>
            </div>
            
            {/* Legend fijo abajo */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Completo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Parcial</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Disponible</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecciona un contexto para comenzar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Utiliza la barra de búsqueda para seleccionar un instructor, ficha o ambiente
              y visualizar su horario de programación.
            </p>
          </motion.div>
        </div>
      )}

      {/* Academic Integrity Warnings */}
      {warnings.length > 0 && canScheduleClasses && (
        <div className="mx-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Typography variant="body2" className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                  Advertencias de Configuración
                </Typography>
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-700 dark:text-amber-300">
                      {warning}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/configuracion-academica')}
                  className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  Optimizar Configuración
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Programming Modal */}
      {console.log('🔍 Modal Debug:', { showProgrammingModal, selectedCell, selectedContext })}
      <Modal
        open={showProgrammingModal}
        onClose={() => {
          console.log('❌ Modal closing')
          setShowProgrammingModal(false)
          setSelectedCell(null)
          setIsEditMode(false)
          setEditingClassId(null)
          setOpenDropdownField(null)
        }}
        title={isEditMode ? "Editar Clase" : "Programar Clase"}
        size="lg"
      >
        <motion.div 
          className="space-y-4"
          animate={{
            paddingBottom: isExpanded ? `${expandedHeight}px` : '20px'
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isEditMode 
              ? "Modifica la información de esta clase existente." 
              : "Completa la información para programar esta clase."
            }
          </p>
          
          {/* Context info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              Información del bloque
            </h4>
            <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Contexto:</span> {selectedContext?.type === 'instructor' ? 'Instructor' : selectedContext?.type === 'ficha' ? 'Ficha' : 'Ambiente'} - {selectedContext?.label}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Bloque:</span> {selectedCell && dynamicTimeBlocks[selectedCell.blockIndex] ? `${dynamicTimeBlocks[selectedCell.blockIndex].start} - ${dynamicTimeBlocks[selectedCell.blockIndex].end}` : ''}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Día:</span> {selectedCell && dynamicDays[selectedCell.dayIndex] ? dynamicDays[selectedCell.dayIndex].name : ''}
              </p>
            </div>
          </div>

          {/* Form fields based on context */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temática <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ingrese la temática de la clase"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>
            
            {/* Instructor field */}
            {selectedContext?.type === 'instructor' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instructor (Ya seleccionado)
                </label>
                <Input
                  value={selectedContext.label}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instructor {selectedContext?.type === 'ficha' ? '*' : '(Opcional)'}
                </label>
                <select
                  value={formData.instructor_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor_id: e.target.value }))}
                  disabled={instructorsLoading}
                  className="w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={selectedContext?.type === 'ficha'}
                >
                  <option value="">
                    {selectedContext?.type === 'ficha' ? 'Seleccione un instructor' : 'Seleccione un instructor (opcional)'}
                  </option>
                  {instructorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.subtext ? `(${option.subtext})` : ''}
                    </option>
                  ))}
                </select>
                {selectedContext?.type === 'ficha' && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Debe seleccionar al menos instructor O ambiente (no ambos vacíos)
                  </p>
                )}
              </div>
            )}
            
            {/* Ficha field */}
            {selectedContext?.type === 'ficha' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ficha (Ya seleccionada)
                </label>
                <Input
                  value={selectedContext.label}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ficha *
                </label>
                <select
                  value={formData.group_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, group_id: e.target.value }))}
                  disabled={groupsLoading}
                  className="w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccione una ficha</option>
                  {groupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.subtext ? `(${option.subtext})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Ambiente field */}
            {selectedContext?.type === 'ambiente' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ambiente (Ya seleccionado)
                </label>
                <Input
                  value={selectedContext.label}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ambiente {selectedContext?.type === 'ficha' ? '*' : '(Opcional)'}
                </label>
                <select
                  value={formData.classroom_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, classroom_id: e.target.value }))}
                  disabled={classroomsLoading}
                  className="w-full min-h-[40px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={selectedContext?.type === 'ficha'}
                >
                  <option value="">
                    {selectedContext?.type === 'ficha' ? 'Seleccione un ambiente' : 'Seleccione un ambiente (opcional)'}
                  </option>
                  {classroomOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.subtext ? `(${option.subtext})` : ''}
                    </option>
                  ))}
                </select>
                {selectedContext?.type === 'ficha' && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Debe seleccionar al menos instructor O ambiente (no ambos vacíos)
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-3">
              {isEditMode && (
                <Button
                  variant="outline"
                  onClick={handleDeleteClass}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProgrammingModal(false)
                  setSelectedCell(null)
                  setIsEditMode(false)
                  setEditingClassId(null)
                  setOpenDropdownField(null)
                  setFormData({ subject: '', instructor_id: '', group_id: '', classroom_id: '' })
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button 
                variant="primary"
                onClick={() => {
                  console.log('🖱️ Button clicked!', { formData, selectedCell, selectedContext, isEditMode })
                  handleSubmitClass()
                }}
                disabled={
                  isSubmitting || 
                  !formData.subject.trim() || 
                  !formData.group_id ||
                  (!isEditMode && selectedContext?.type === 'ficha' && !formData.instructor_id && !formData.classroom_id)
                }
              >
                {isSubmitting 
                  ? 'Guardando...' 
                  : isEditMode 
                    ? 'Actualizar Clase' 
                    : 'Programar Clase'
                }
              </Button>
            </div>
          </div>
        </motion.div>
      </Modal>
      </div>
    </AcademicIntegrityGuard>
  )
}

export default memo(ProgrammingPage)