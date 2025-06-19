/**
 * React Query Integration - Phase 4: Sincronización de Estado y Cache
 * 
 * This module provides:
 * - Customized QueryClient with intelligent caching
 * - Module-specific cache strategies (AUTH, ACADEMIC, REFERENCE, REALTIME)
 * - Optimistic UI with automatic rollback
 * - Cross-module cache invalidation
 * - Enhanced hooks with error handling and performance optimization
 * - Real-time data synchronization
 */

// Core Query Client and Configuration
export { 
  queryClient, 
  createQueryClient, 
  queryKeys, 
  CACHE_CONFIG,
  cacheUtils,
  invalidationStrategies 
} from './query-client'

// React Query Provider
export { QueryProvider } from './query-provider'

// Optimistic UI System
export {
  useOptimisticMutation,
  useOptimisticListMutation,
  useBatchOptimisticMutation,
  useOptimisticWithFeedback,
  optimisticHelpers
} from './optimistic-ui'
export type {
  OptimisticConfig,
  OptimisticListConfig,
  ListUpdateType
} from './optimistic-ui'

// Authentication Hooks
export {
  useCurrentUser,
  useUserPermissions,
  useCsrfToken,
  useLogin,
  useLogout,
  useChangePassword,
  useRequestPasswordReset,
  useResetPassword,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions
} from './hooks/auth.hooks'

// Academic Module Hooks
export {
  useStudents,
  useInfiniteStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  usePrograms,
  useAllPrograms,
  useProgram,
  useCourses,
  useCoursesByProgram,
  useEnrollments,
  useEnrollmentsByStudent,
  useEnrollmentsByCourse,
  useCreateEnrollment,
  useUpdateEnrollmentStatus,
  usePrefetchStudent,
  useAcademicStats
} from './hooks/academic.hooks'

// Enhanced Hooks with Optimistic UI
export {
  useCreateStudentOptimistic,
  useUpdateStudentOptimistic,
  useBatchUpdateStudentsStatus,
  useCreateEnrollmentWithValidation,
  useScheduleConflicts,
  useUpdateScheduleWithConflictResolution,
  useUpdateUserProfileOptimistic,
  useSearch,
  useGlobalSearch,
  useDashboardMetrics
} from './hooks/enhanced-hooks'

/**
 * Quick Start Guide for React Query Integration:
 * 
 * 1. Setup Provider (in your main App component):
 *    ```tsx
 *    import { QueryProvider } from '@/services/query'
 *    
 *    function App() {
 *      return (
 *        <QueryProvider>
 *          <YourApp />
 *        </QueryProvider>
 *      )
 *    }
 *    ```
 * 
 * 2. Basic Query Usage:
 *    ```tsx
 *    import { useStudents } from '@/services/query'
 *    
 *    function StudentsList() {
 *      const { data: students, isLoading, error } = useStudents({
 *        page: 1,
 *        pageSize: 20,
 *        search: 'john'
 *      })
 *      
 *      if (isLoading) return <Loading />
 *      if (error) return <Error error={error} />
 *      
 *      return <StudentsTable students={students.data} />
 *    }
 *    ```
 * 
 * 3. Optimistic Updates:
 *    ```tsx
 *    import { useCreateStudentOptimistic } from '@/services/query'
 *    
 *    function CreateStudentForm() {
 *      const createStudent = useCreateStudentOptimistic()
 *      
 *      const handleSubmit = (data) => {
 *        createStudent.mutate(data) // Instantly shows in UI
 *      }
 *      
 *      return <StudentForm onSubmit={handleSubmit} />
 *    }
 *    ```
 * 
 * 4. Real-time Data:
 *    ```tsx
 *    import { useEnrollmentsByCourse } from '@/services/query'
 *    
 *    function CourseEnrollments({ courseId }) {
 *      const { data: enrollments } = useEnrollmentsByCourse(courseId)
 *      // Automatically refetches every minute
 *      
 *      return <EnrollmentsList enrollments={enrollments} />
 *    }
 *    ```
 * 
 * 5. Infinite Scrolling:
 *    ```tsx
 *    import { useInfiniteStudents } from '@/services/query'
 *    
 *    function InfiniteStudentsList() {
 *      const {
 *        data,
 *        fetchNextPage,
 *        hasNextPage,
 *        isFetchingNextPage
 *      } = useInfiniteStudents()
 *      
 *      return (
 *        <VirtualizedList
 *          data={data?.pages.flatMap(page => page.data)}
 *          onLoadMore={fetchNextPage}
 *          hasMore={hasNextPage}
 *        />
 *      )
 *    }
 *    ```
 * 
 * 6. Search with Debouncing:
 *    ```tsx
 *    import { useGlobalSearch } from '@/services/query'
 *    
 *    function SearchBox() {
 *      const [query, setQuery] = useState('')
 *      const { data: results } = useGlobalSearch(query)
 *      // Automatically debounced and cached
 *      
 *      return <SearchResults results={results} />
 *    }
 *    ```
 * 
 * 7. Cache Management:
 *    ```tsx
 *    import { cacheUtils, invalidationStrategies } from '@/services/query'
 *    
 *    // Manually invalidate cache
 *    await cacheUtils.invalidateModule('academic')
 *    
 *    // Clear all cache
 *    cacheUtils.clearAll()
 *    
 *    // Trigger cross-module invalidation
 *    await invalidationStrategies.onStudentChange(studentId)
 *    ```
 * 
 * Cache Strategies by Module:
 * 
 * - **AUTH**: 5min stale, 10min cache, refetch on focus
 * - **USERS**: 10min stale, 30min cache, background updates
 * - **ACADEMIC**: 15min stale, 1hr cache, periodic refetch
 * - **REFERENCE**: 1hr stale, 24hr cache, long-term caching
 * - **REALTIME**: 30s stale, 2min cache, aggressive polling
 * 
 * Error Handling:
 * - Authentication errors automatically redirect to login
 * - Network errors trigger automatic retries
 * - Validation errors show immediate feedback
 * - Optimistic updates rollback on failure
 * 
 * Performance Features:
 * - Request deduplication
 * - Background refetching
 * - Stale-while-revalidate
 * - Infinite query support
 * - Prefetching strategies
 * - Cache persistence
 */