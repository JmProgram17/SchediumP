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
    // Use the working users endpoint and filter coordinators on frontend
    const { data } = await enhancedApiService.get('/auth/users', {
      params: {
        page: 1,
        page_size: 50, // Safe limit
        active: true
      }
    })
    
    // Filter users with Coordinator role (role_id: 2)
    const coordinators = data?.items?.filter((user: any) => 
      user.role?.name === 'Coordinator' || user.role_id === 2
    ) || []
    
    return coordinators
  }

  async getCoordinationCounts(departmentId: number): Promise<{
    programs_count: number
    instructors_count: number
    student_groups_count: number
    classrooms_count: number
  }> {
    console.log('Starting getCoordinationCounts for department:', departmentId)
    
    let programsTotal = 0
    let instructorsTotal = 0
    let studentGroupsCount = 0
    let classroomsCount = 0
    
    // Usar la lógica del backend que ya filtra correctamente
    const promises = await Promise.allSettled([
      // Programas - usar el endpoint del backend que filtra correctamente
      enhancedApiService.get(`/academic/programs?department_id=${departmentId}&page=1&limit=1000`),
      // Instructores
      enhancedApiService.get(`/hr/instructors?department_id=${departmentId}&page=1&limit=1000`),
      // Aulas
      enhancedApiService.get(`/infrastructure/departments/${departmentId}/classrooms`)
    ])
    
    // Procesar respuesta de programas
    if (promises[0].status === 'fulfilled') {
      const programsResponse = promises[0].value
      console.log('Programs response for dept', departmentId, ':', programsResponse)
      
      if (programsResponse.data) {
        programsTotal = programsResponse.data.total || 0
        console.log(`Department ${departmentId} - Programs total from backend: ${programsTotal}`)
        
        if (programsResponse.data.items?.length > 0) {
          console.log(`Department ${departmentId} - Program IDs:`, programsResponse.data.items.map((p: any) => p.program_id))
          
          // Contar fichas para cada programa
          for (const program of programsResponse.data.items) {
            try {
              const groupsRes = await enhancedApiService.get(`/academic/groups?program_id=${program.program_id}&page=1&limit=1000`)
              const groupsTotal = groupsRes.data?.total || 0
              studentGroupsCount += groupsTotal
              
              console.log(`Program ${program.program_id} (dept ${departmentId}) has ${groupsTotal} groups`)
            } catch (e) {
              console.error('Error fetching groups for program', program.program_id, e)
            }
          }
        }
      }
    } else {
      console.error('Error fetching programs for dept', departmentId, ':', promises[0].reason)
    }
    
    // Procesar respuesta de instructores
    if (promises[1].status === 'fulfilled') {
      const instructorsResponse = promises[1].value
      console.log('Instructors response:', instructorsResponse)
      console.log('Instructors response.data:', instructorsResponse.data)
      
      // La estructura es response.data = { items: [], total: 0, ... }
      if (instructorsResponse.data) {
        instructorsTotal = instructorsResponse.data.total || 0
        console.log(`Department ${departmentId} has ${instructorsTotal} instructors`)
      }
    } else {
      console.error('Error fetching instructors:', promises[1].reason)
    }
    
    // Procesar respuesta de aulas
    if (promises[2].status === 'fulfilled') {
      const classroomsResponse = promises[2].value
      
      // Para classrooms, la respuesta es directamente un array en data
      const classroomsList = classroomsResponse.data || []
      classroomsCount = Array.isArray(classroomsList) ? classroomsList.length : 0
      console.log(`Department ${departmentId} has ${classroomsCount} classrooms`)
    } else {
      console.error('Error fetching classrooms:', promises[2].reason)
    }
    
    const counts = {
      programs_count: programsTotal,
      instructors_count: instructorsTotal,
      student_groups_count: studentGroupsCount,
      classrooms_count: classroomsCount
    }
    
    console.log('Final counts for department', departmentId, ':', counts)
    
    return counts
  }
}

export const coordinationService = new CoordinationService()