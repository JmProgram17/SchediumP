/**
 * User Hooks - React Query integration with optimistic updates
 * Provides comprehensive CRUD operations with caching and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { userService } from '../services'
import type {
  User,
  Role,
  UserCreate,
  UserUpdate,
  UserQuery,
  UserStats,
  PasswordChangeRequest,
  BulkUserOperation
} from '../types'

// Query keys for consistent cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (query: UserQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
  roles: () => ['roles'] as const,
  exports: () => [...userKeys.all, 'export'] as const,
  bulk: () => [...userKeys.all, 'bulk'] as const,
}

/**
 * Hook to fetch paginated list of users
 */
export const useUsers = (query: UserQuery = {}) => {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => userService.getUsers(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de usuarios'
    }
  })
}

/**
 * Hook to fetch single user
 */
export const useUser = (id: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUser(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar usuario'
    }
  })
}

/**
 * Hook to fetch user statistics
 */
export const useUserStats = () => {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => userService.getUserStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Error al cargar estadísticas de usuarios'
    }
  })
}

/**
 * Hook to fetch available roles
 */
export const useRoles = () => {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => userService.getAvailableRoles(),
    staleTime: 30 * 60 * 1000, // 30 minutes - roles don't change frequently
    gcTime: 60 * 60 * 1000, // 1 hour
    meta: {
      errorMessage: 'Error al cargar roles'
    }
  })
}

/**
 * Hook to create new user with optimistic updates
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserCreate) => userService.createUser(data),
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })

      const optimisticUser: User = {
        user_id: Date.now(), // Temporary ID
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        document_number: newUser.document_number,
        active: newUser.active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role_id: newUser.role_id
      }

      const previousData = queryClient.getQueryData(userKeys.lists())
      
      queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: [optimisticUser, ...old.items],
          total: old.total + 1
        }
      })

      return { previousData, optimisticUser }
    },
    onSuccess: (newUser, _, context) => {
      queryClient.setQueryData(userKeys.detail(newUser.user_id), newUser)
      
      queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((item: User) => 
            item.user_id === context?.optimisticUser.user_id ? newUser : item
          )
        }
      })
      
      toast.success('Usuario creado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: userKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al crear usuario')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
    }
  })
}

/**
 * Hook to update existing user with optimistic updates
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      userService.updateUser(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })

      const previousUser = queryClient.getQueryData(userKeys.detail(id))
      const previousLists = queryClient.getQueryData(userKeys.lists())

      if (previousUser) {
        const optimisticUser = { ...previousUser as User, ...data, updated_at: new Date().toISOString() }
        queryClient.setQueryData(userKeys.detail(id), optimisticUser)
        
        queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item: User) => 
              item.user_id === id ? optimisticUser : item
            )
          }
        })
      }

      return { previousUser, previousLists }
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.detail(updatedUser.user_id), updatedUser)
      toast.success('Usuario actualizado exitosamente')
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser)
      }
      if (context?.previousLists) {
        queryClient.setQueriesData({ queryKey: userKeys.lists() }, context.previousLists)
      }
      toast.error(error.message || 'Error al actualizar usuario')
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
    }
  })
}

/**
 * Hook to delete user with optimistic updates
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })

      const previousData = queryClient.getQueryData(userKeys.lists())
      
      queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.filter((item: User) => item.user_id !== id),
          total: Math.max(0, old.total - 1)
        }
      })

      return { previousData }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) })
      toast.success('Usuario eliminado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: userKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al eliminar usuario')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
    }
  })
}

/**
 * Hook to toggle user status (active/inactive)
 */
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      userService.toggleUserStatus(id, active),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.detail(updatedUser.user_id), updatedUser)
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      toast.success(`Usuario ${updatedUser.active ? 'activado' : 'desactivado'} exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar estado del usuario')
    }
  })
}

/**
 * Hook to change user password
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, passwordData }: { id: number; passwordData: PasswordChangeRequest }) =>
      userService.changePassword(id, passwordData),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar contraseña')
    }
  })
}

/**
 * Hook to reset user password
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (id: number) => userService.resetPassword(id),
    onSuccess: (result) => {
      toast.success(`Contraseña temporal generada: ${result.temporary_password}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al resetear contraseña')
    }
  })
}

/**
 * Hook for bulk operations
 */
export const useBulkUserOperation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (operation: BulkUserOperation) => userService.bulkOperation(operation),
    onSuccess: (result, operation) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      const actionText = {
        'activate': 'activados',
        'deactivate': 'desactivados',
        'delete': 'eliminados'
      }[operation.action]
      
      toast.success(`${result.affected_count} usuarios ${actionText} exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en operación masiva')
    }
  })
}

/**
 * Hook for data export
 */
export const useExportUsers = () => {
  return useMutation({
    mutationFn: ({ query, format }: { query?: UserQuery; format?: 'csv' | 'xlsx' }) =>
      userService.exportUsers(query, format),
    onSuccess: (blob, { format = 'csv' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `usuarios_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Exportación completada exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al exportar datos')
    }
  })
}

/**
 * Hook to check if email exists
 */
export const useCheckEmailExists = (email: string, excludeUserId?: number) => {
  return useQuery({
    queryKey: ['check-email', email, excludeUserId],
    queryFn: () => userService.checkEmailExists(email, excludeUserId),
    enabled: !!email && email.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    meta: {
      errorMessage: 'Error al verificar email'
    }
  })
}

/**
 * Hook to check if document exists
 */
export const useCheckDocumentExists = (documentNumber: string, excludeUserId?: number) => {
  return useQuery({
    queryKey: ['check-document', documentNumber, excludeUserId],
    queryFn: () => userService.checkDocumentExists(documentNumber, excludeUserId),
    enabled: !!documentNumber && documentNumber.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    meta: {
      errorMessage: 'Error al verificar documento'
    }
  })
}