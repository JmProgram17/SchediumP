import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { coordinationService } from '../services'
import type {
  Coordination,
  CoordinationCreate,
  CoordinationUpdate,
  CoordinationQuery,
  User
} from '../types'

const QUERY_KEYS = {
  COORDINATIONS: 'coordinations',
  COORDINATION: 'coordination',
  ALL_COORDINATIONS: 'all-coordinations',
  COORDINATORS: 'coordinators'
} as const

export function useCoordinations(params: CoordinationQuery = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.COORDINATIONS, params],
    queryFn: () => coordinationService.getCoordinations(params),
    keepPreviousData: true
  })
}

export function useAllCoordinations() {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_COORDINATIONS],
    queryFn: () => coordinationService.getAllCoordinations(),
    staleTime: 5 * 60 * 1000
  })
}

export function useCoordination(id: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.COORDINATION, id],
    queryFn: () => coordinationService.getCoordination(id),
    enabled: !!id
  })
}

export function useAvailableCoordinators() {
  return useQuery({
    queryKey: [QUERY_KEYS.COORDINATORS],
    queryFn: () => coordinationService.getAvailableCoordinators(),
    staleTime: 10 * 60 * 1000
  })
}

export function useCreateCoordination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (coordination: CoordinationCreate) => coordinationService.createCoordination(coordination),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COORDINATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COORDINATIONS] })
      toast.success('✅ Coordinación creada exitosamente')
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('❌ Ya existe una coordinación con ese nombre')
      } else {
        toast.error('❌ Error al crear la coordinación')
      }
    }
  })
}

export function useUpdateCoordination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CoordinationUpdate }) => 
      coordinationService.updateCoordination(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COORDINATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COORDINATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COORDINATION, id] })
      toast.success('✅ Coordinación actualizada exitosamente')
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('❌ Ya existe una coordinación con ese nombre')
      } else {
        toast.error('❌ Error al actualizar la coordinación')
      }
    }
  })
}

export function useDeleteCoordination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => coordinationService.deleteCoordination(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COORDINATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COORDINATIONS] })
      toast.success('✅ Coordinación eliminada exitosamente')
    },
    onError: () => {
      toast.error('❌ Error al eliminar la coordinación')
    }
  })
}

export function useCoordinationCounts(departmentId: number) {
  return useQuery({
    queryKey: ['coordination-counts', departmentId],
    queryFn: () => coordinationService.getCoordinationCounts(departmentId),
    enabled: !!departmentId,
    staleTime: 30000, // 30 seconds cache to reduce API calls
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false // Deshabilitar refetch automático
  })
}