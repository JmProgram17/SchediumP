import { enhancedApiService } from '@/services/api/enhanced-api.service'
import type {
  Coordination,
  CoordinationCreate,
  CoordinationUpdate,
  CoordinationResponse,
  CoordinationQuery,
  User
} from '../types'

class CoordinationService {
  private basePath = '/hr/departments'

  async getCoordinations(params: CoordinationQuery): Promise<CoordinationResponse> {
    const { data } = await enhancedApiService.get<CoordinationResponse>(this.basePath, {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search,
        coordinator_id: params.coordinator_id,
        sort_by: params.sortBy,
        sort_order: params.sortOrder
      }
    })
    return data
  }

  async getAllCoordinations(): Promise<Coordination[]> {
    const { data } = await enhancedApiService.get<Coordination[]>(`${this.basePath}/all`)
    return data
  }

  async getCoordination(id: number): Promise<Coordination> {
    const { data } = await enhancedApiService.get<Coordination>(`${this.basePath}/${id}`)
    return data
  }

  async createCoordination(coordination: CoordinationCreate): Promise<Coordination> {
    const { data } = await enhancedApiService.post<Coordination>(this.basePath, coordination)
    return data
  }

  async updateCoordination(id: number, coordination: CoordinationUpdate): Promise<Coordination> {
    const { data } = await enhancedApiService.put<Coordination>(`${this.basePath}/${id}`, coordination)
    return data
  }

  async deleteCoordination(id: number): Promise<void> {
    await enhancedApiService.delete(`${this.basePath}/${id}`)
  }

  async checkCoordinationNameExists(name: string, excludeCoordinationId?: number): Promise<boolean> {
    try {
      const coordinations = await this.getAllCoordinations()
      const exists = coordinations.some(coordination => 
        coordination.name.toLowerCase() === name.toLowerCase() && 
        coordination.department_id !== excludeCoordinationId
      )
      return exists
    } catch (error) {
      console.error('Error checking coordination name:', error)
      return false
    }
  }

  async getAvailableCoordinators(): Promise<User[]> {
    const { data } = await enhancedApiService.get<User[]>('/users', {
      params: {
        role: 'coordinator',
        active: true,
        limit: 1000
      }
    })
    return data
  }

  async getCoordinationCounts(departmentId: number): Promise<{
    programs_count: number
    instructors_count: number
    student_groups_count: number
    classrooms_count: number
  }> {
    try {
      // Obtener programas del departamento
      const { data: programsData } = await enhancedApiService.get('/academic/programs', {
        params: { department_id: departmentId, limit: 1000 }
      })
      
      // Obtener instructores del departamento
      const { data: instructorsData } = await enhancedApiService.get('/hr/instructors', {
        params: { department_id: departmentId, limit: 1000 }
      })
      
      // Obtener aulas del departamento
      const { data: classroomsData } = await enhancedApiService.get(`/infrastructure/departments/${departmentId}/classrooms`)
      
      // Contar fichas por programas del departamento
      let studentGroupsCount = 0
      if (programsData?.items?.length > 0) {
        for (const program of programsData.items) {
          const { data: groupsData } = await enhancedApiService.get('/academic/groups', {
            params: { program_id: program.program_id, limit: 1000 }
          })
          studentGroupsCount += groupsData?.total || 0
        }
      }

      return {
        programs_count: programsData?.total || 0,
        instructors_count: instructorsData?.total || 0,
        student_groups_count: studentGroupsCount,
        classrooms_count: classroomsData?.length || 0
      }
    } catch (error) {
      console.error('Error getting coordination counts:', error)
      return {
        programs_count: 0,
        instructors_count: 0,
        student_groups_count: 0,
        classrooms_count: 0
      }
    }
  }
}

export const coordinationService = new CoordinationService()