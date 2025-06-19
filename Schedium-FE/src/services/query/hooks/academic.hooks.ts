/**
 * Academic module React Query hooks with intelligent caching and SWR
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { academicApi } from '@/services/api'
import { queryKeys, CACHE_CONFIG, invalidationStrategies } from '../query-client'
import { PaginatedResponse, ApiResponse } from '@/types/api.types'

// Types (these would typically come from your types file)
interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  document_number: string
  program_id?: number
  active: boolean
  created_at: string
  updated_at: string
}

interface Program {
  id: number
  name: string
  code: string
  description?: string
  duration_months: number
  active: boolean
  created_at: string
  updated_at: string
}

interface Course {
  id: number
  name: string
  code: string
  description?: string
  credits: number
  program_id: number
  active: boolean
  created_at: string
  updated_at: string
}

interface Enrollment {
  id: number
  student_id: number
  course_id: number
  enrollment_date: string
  status: 'active' | 'completed' | 'dropped'
  grade?: number
  created_at: string
  updated_at: string
  student?: Student
  course?: Course
}

interface QueryFilters {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: any
}

// ===== STUDENTS HOOKS =====

/**
 * Hook to get paginated students list with SWR
 */
export const useStudents = (filters: QueryFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.academic.students.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Student>> => {
      const response = await academicApi.getPaginated<Student>('/students', filters, {
        adapter: 'pagination',
        context: { module: 'academic', operation: 'list_students' }
      })
      return response as PaginatedResponse<Student>
    },
    ...CACHE_CONFIG.ACADEMIC,
    // Enable background refetching for student lists
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
  })
}

/**
 * Hook to get infinite students list (for virtual scrolling)
 */
export const useInfiniteStudents = (filters: Omit<QueryFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.academic.students.list(filters), 'infinite'],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Student>> => {
      const response = await academicApi.getPaginated<Student>('/students', {
        ...filters,
        page: pageParam,
        pageSize: 20
      }, {
        adapter: 'pagination',
        context: { module: 'academic', operation: 'infinite_students' }
      })
      return response as PaginatedResponse<Student>
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
    },
    ...CACHE_CONFIG.ACADEMIC,
  })
}

/**
 * Hook to get single student details
 */
export const useStudent = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.academic.students.detail(id),
    queryFn: async (): Promise<Student> => {
      const response = await academicApi.get<Student>(`/students/${id}`, {
        context: { module: 'academic', operation: 'get_student' }
      })
      return response.data!
    },
    enabled: enabled && !!id,
    ...CACHE_CONFIG.ACADEMIC,
  })
}

/**
 * Create student mutation
 */
export const useCreateStudent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'students', 'create'],
    mutationFn: async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
      const response = await academicApi.submitForm<Student>('/students', studentData, {
        context: { module: 'academic', operation: 'create_student' }
      })
      return response.data!
    },
    onSuccess: (newStudent) => {
      // Invalidate and refetch students list
      invalidationStrategies.onStudentChange(newStudent.id)
      
      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.academic.students.detail(newStudent.id), newStudent)
    }
  })
}

/**
 * Update student mutation
 */
export const useUpdateStudent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'students', 'update'],
    mutationFn: async ({ id, data }: { id: number; data: Partial<Student> }): Promise<Student> => {
      const response = await academicApi.put<Student>(`/students/${id}`, data, {
        context: { module: 'academic', operation: 'update_student' }
      })
      return response.data!
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.academic.students.detail(id) })
      
      // Snapshot previous value
      const previousStudent = queryClient.getQueryData<Student>(queryKeys.academic.students.detail(id))
      
      // Optimistically update
      if (previousStudent) {
        queryClient.setQueryData<Student>(queryKeys.academic.students.detail(id), {
          ...previousStudent,
          ...data,
          updated_at: new Date().toISOString()
        })
      }
      
      return { previousStudent }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.academic.students.detail(id), context.previousStudent)
      }
    },
    onSettled: (data) => {
      if (data) {
        invalidationStrategies.onStudentChange(data.id)
      }
    }
  })
}

/**
 * Delete student mutation
 */
export const useDeleteStudent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'students', 'delete'],
    mutationFn: async (id: number): Promise<void> => {
      await academicApi.delete(`/students/${id}`, {
        context: { module: 'academic', operation: 'delete_student' }
      })
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.academic.students.detail(id) })
      
      // Invalidate lists
      invalidationStrategies.onStudentChange()
    }
  })
}

// ===== PROGRAMS HOOKS =====

/**
 * Hook to get programs list
 */
export const usePrograms = (filters: QueryFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.academic.programs.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Program>> => {
      const response = await academicApi.getPaginated<Program>('/programs', filters, {
        adapter: 'pagination',
        context: { module: 'academic', operation: 'list_programs' }
      })
      return response as PaginatedResponse<Program>
    },
    ...CACHE_CONFIG.REFERENCE, // Programs change less frequently
  })
}

/**
 * Hook to get all programs (for dropdowns)
 */
export const useAllPrograms = () => {
  return useQuery({
    queryKey: [...queryKeys.academic.programs.all(), 'dropdown'],
    queryFn: async (): Promise<Program[]> => {
      const response = await academicApi.get<Program[]>('/programs/all', {
        cache: 60 * 60 * 1000, // 1 hour cache for dropdown data
        context: { module: 'academic', operation: 'all_programs' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REFERENCE,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get single program
 */
export const useProgram = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.academic.programs.detail(id),
    queryFn: async (): Promise<Program> => {
      const response = await academicApi.get<Program>(`/programs/${id}`, {
        context: { module: 'academic', operation: 'get_program' }
      })
      return response.data!
    },
    enabled: enabled && !!id,
    ...CACHE_CONFIG.REFERENCE,
  })
}

// ===== COURSES HOOKS =====

/**
 * Hook to get courses list
 */
export const useCourses = (filters: QueryFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.academic.courses.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Course>> => {
      const response = await academicApi.getPaginated<Course>('/courses', filters, {
        adapter: 'pagination',
        context: { module: 'academic', operation: 'list_courses' }
      })
      return response as PaginatedResponse<Course>
    },
    ...CACHE_CONFIG.ACADEMIC,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get courses by program
 */
export const useCoursesByProgram = (programId: number, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.academic.courses.all(), 'by-program', programId],
    queryFn: async (): Promise<Course[]> => {
      const response = await academicApi.get<Course[]>(`/programs/${programId}/courses`, {
        context: { module: 'academic', operation: 'courses_by_program' }
      })
      return response.data!
    },
    enabled: enabled && !!programId,
    ...CACHE_CONFIG.ACADEMIC,
  })
}

// ===== ENROLLMENTS HOOKS =====

/**
 * Hook to get enrollments list
 */
export const useEnrollments = (filters: QueryFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.academic.enrollments.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Enrollment>> => {
      const response = await academicApi.getPaginated<Enrollment>('/enrollments', filters, {
        adapter: 'pagination',
        context: { module: 'academic', operation: 'list_enrollments' }
      })
      return response as PaginatedResponse<Enrollment>
    },
    ...CACHE_CONFIG.REALTIME, // Enrollments need real-time updates
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get enrollments by student
 */
export const useEnrollmentsByStudent = (studentId: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.academic.enrollments.byStudent(studentId),
    queryFn: async (): Promise<Enrollment[]> => {
      const response = await academicApi.get<Enrollment[]>(`/students/${studentId}/enrollments`, {
        context: { module: 'academic', operation: 'enrollments_by_student' }
      })
      return response.data!
    },
    enabled: enabled && !!studentId,
    ...CACHE_CONFIG.ACADEMIC,
  })
}

/**
 * Hook to get enrollments by course
 */
export const useEnrollmentsByCourse = (courseId: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.academic.enrollments.byCourse(courseId),
    queryFn: async (): Promise<Enrollment[]> => {
      const response = await academicApi.get<Enrollment[]>(`/courses/${courseId}/enrollments`, {
        context: { module: 'academic', operation: 'enrollments_by_course' }
      })
      return response.data!
    },
    enabled: enabled && !!courseId,
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 60 * 1000, // 1 minute for active course data
  })
}

/**
 * Create enrollment mutation
 */
export const useCreateEnrollment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'enrollments', 'create'],
    mutationFn: async (enrollmentData: { student_id: number; course_id: number }): Promise<Enrollment> => {
      const response = await academicApi.post<Enrollment>('/enrollments', enrollmentData, {
        context: { module: 'academic', operation: 'create_enrollment' }
      })
      return response.data!
    },
    onSuccess: (newEnrollment) => {
      // Invalidate related queries
      invalidationStrategies.onStudentChange(newEnrollment.student_id)
      invalidationStrategies.onCourseChange(newEnrollment.course_id)
      
      // Update specific caches
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.byStudent(newEnrollment.student_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.byCourse(newEnrollment.course_id) })
    }
  })
}

/**
 * Update enrollment status mutation
 */
export const useUpdateEnrollmentStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'enrollments', 'update-status'],
    mutationFn: async ({ id, status, grade }: { id: number; status: string; grade?: number }): Promise<Enrollment> => {
      const response = await academicApi.patch<Enrollment>(`/enrollments/${id}`, { status, grade }, {
        context: { module: 'academic', operation: 'update_enrollment_status' }
      })
      return response.data!
    },
    onMutate: async ({ id, status, grade }) => {
      // Optimistic update
      const enrollmentQueries = queryClient.getQueriesData<Enrollment[]>({ 
        queryKey: queryKeys.academic.enrollments.lists() 
      })
      
      enrollmentQueries.forEach(([queryKey, data]) => {
        if (data) {
          const updatedData = data.map(enrollment => 
            enrollment.id === id 
              ? { ...enrollment, status: status as any, grade, updated_at: new Date().toISOString() }
              : enrollment
          )
          queryClient.setQueryData(queryKey, updatedData)
        }
      })
    },
    onSettled: (data) => {
      if (data) {
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.byStudent(data.student_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.byCourse(data.course_id) })
      }
    }
  })
}

// ===== UTILITY HOOKS =====

/**
 * Hook to prefetch student details
 */
export const usePrefetchStudent = () => {
  const queryClient = useQueryClient()
  
  return (studentId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.academic.students.detail(studentId),
      queryFn: async (): Promise<Student> => {
        const response = await academicApi.get<Student>(`/students/${studentId}`)
        return response.data!
      },
      staleTime: CACHE_CONFIG.ACADEMIC.staleTime
    })
  }
}

/**
 * Hook for academic module statistics
 */
export const useAcademicStats = () => {
  return useQuery({
    queryKey: [...queryKeys.academic.all(), 'stats'],
    queryFn: async () => {
      const response = await academicApi.get('/stats', {
        cache: 5 * 60 * 1000, // 5 minutes cache
        context: { module: 'academic', operation: 'get_stats' }
      })
      return response.data
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 5 * 60 * 1000, // Update every 5 minutes
  })
}