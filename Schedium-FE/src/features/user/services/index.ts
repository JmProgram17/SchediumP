import { enhancedApiService } from '@/services/api/enhanced-api.service'
import type {
  User,
  Role,
  UserCreate,
  UserUpdate,
  UserResponse,
  UserQuery,
  UserStats,
  PasswordChangeRequest,
  BulkUserOperation,
  BulkUserResult
} from '../types'

class UserService {
  private basePath = '/auth/users'
  private rolesPath = '/auth/roles'

  async getUsers(params: UserQuery): Promise<UserResponse> {
    const { data } = await enhancedApiService.get<UserResponse>(this.basePath, {
      params: {
        page: params.page || 1,
        page_size: params.limit || 10,
        search: params.search,
        role_id: params.role_id,
        active: params.active,
        sort_by: params.sortBy,
        sort_order: params.sortOrder
      }
    })
    return data
  }

  async getAllUsers(): Promise<User[]> {
    // Get all users using pagination
    const { data } = await enhancedApiService.get<UserResponse>(this.basePath, {
      params: { page: 1, page_size: 100 } // Backend limit is 100
    })
    return data.items || []
  }

  async getUser(id: number): Promise<User> {
    const { data } = await enhancedApiService.get<User>(`${this.basePath}/${id}`)
    return data
  }

  async createUser(user: UserCreate): Promise<User> {
    const { data } = await enhancedApiService.post<User>(this.basePath, user)
    return data
  }

  async updateUser(id: number, user: UserUpdate): Promise<User> {
    const { data } = await enhancedApiService.put<User>(`${this.basePath}/${id}`, user)
    return data
  }

  async deleteUser(id: number): Promise<void> {
    await enhancedApiService.delete(`${this.basePath}/${id}`)
  }

  async toggleUserStatus(id: number, active: boolean): Promise<User> {
    // Update user with new active status since there's no specific toggle endpoint
    const { data } = await enhancedApiService.put<User>(`${this.basePath}/${id}`, { active })
    return data
  }

  async changePassword(id: number, passwordData: PasswordChangeRequest): Promise<void> {
    // Use the general change-password endpoint
    await enhancedApiService.post('/auth/change-password', {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password
    })
  }

  async resetPassword(id: number): Promise<{ temporary_password: string }> {
    // Since there's no specific reset password endpoint for a user by admin,
    // we'll return a message indicating this needs to be implemented in backend
    console.warn('Reset password endpoint not available in backend')
    return { temporary_password: 'Feature not available - Backend endpoint needed' }
  }

  async checkEmailExists(email: string, excludeUserId?: number): Promise<boolean> {
    try {
      // Check if email exists by searching users
      const { data } = await enhancedApiService.get<UserResponse>(this.basePath, {
        params: { search: email, page: 1, page_size: 10 }
      })
      
      const exists = data.items.some(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        user.user_id !== excludeUserId
      )
      
      return exists
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    }
  }

  async checkDocumentExists(documentNumber: string, excludeUserId?: number): Promise<boolean> {
    try {
      // Check if document exists by searching users
      const { data } = await enhancedApiService.get<UserResponse>(this.basePath, {
        params: { search: documentNumber, page: 1, page_size: 10 }
      })
      
      const exists = data.items.some(user => 
        user.document_number === documentNumber && 
        user.user_id !== excludeUserId
      )
      
      return exists
    } catch (error) {
      console.error('Error checking document:', error)
      return false
    }
  }

  async getUserStats(): Promise<UserStats> {
    // Since there's no stats endpoint in the backend, we'll aggregate data from existing endpoints
    try {
      // Get all users to calculate statistics
      const allUsersResponse = await enhancedApiService.get<UserResponse>(this.basePath, {
        params: {
          page: 1,
          page_size: 100 // Backend limit is 100
        }
      })

      const users = allUsersResponse.data.items || []
      const total = allUsersResponse.data.total || 0

      // Calculate statistics
      const activeUsers = users.filter(u => u.active).length
      const inactiveUsers = users.filter(u => !u.active).length

      // Group users by role
      const usersByRole = users.reduce((acc, user) => {
        if (user.role) {
          const existing = acc.find(r => r.role.role_id === user.role!.role_id)
          if (existing) {
            existing.count++
          } else {
            acc.push({ role: user.role, count: 1 })
          }
        }
        return acc
      }, [] as Array<{ role: Role; count: number }>)

      // Calculate recent logins (last 24 hours)
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const recentLogins = users.filter(u => {
        if (!u.last_login) return false
        const loginDate = new Date(u.last_login)
        return loginDate >= twentyFourHoursAgo
      }).length

      return {
        total_users: total,
        active_users: activeUsers,
        inactive_users: inactiveUsers,
        users_by_role: usersByRole,
        recent_logins: recentLogins
      }
    } catch (error) {
      console.error('Error calculating user stats:', error)
      // Return default stats on error
      return {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        users_by_role: [],
        recent_logins: 0
      }
    }
  }

  async getRoles(): Promise<Role[]> {
    const { data } = await enhancedApiService.get<Role[]>(this.rolesPath)
    return data
  }

  async getAvailableRoles(): Promise<Role[]> {
    return this.getRoles()
  }

  async bulkOperation(operation: BulkUserOperation): Promise<BulkUserResult> {
    // Bulk operations not available in backend, perform individually
    console.warn('Bulk operations not available in backend')
    
    const results = {
      affected_count: 0,
      success: false,
      errors: ['Bulk operations not implemented in backend']
    }
    
    return results
  }

  async bulkDeleteUsers(userIds: number[]): Promise<BulkUserResult> {
    return this.bulkOperation({
      user_ids: userIds,
      action: 'delete'
    })
  }

  async bulkToggleStatus(userIds: number[], activate: boolean): Promise<BulkUserResult> {
    return this.bulkOperation({
      user_ids: userIds,
      action: activate ? 'activate' : 'deactivate'
    })
  }

  async exportUsers(query?: UserQuery, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    // Export functionality not available in backend
    console.warn('Export functionality not available in backend')
    
    // For now, create a simple CSV with current data
    const users = await this.getUsers(query || {})
    
    let csvContent = 'ID,Nombre,Apellido,Email,Documento,Rol,Activo\n'
    users.items.forEach(user => {
      csvContent += `${user.user_id},${user.first_name},${user.last_name},${user.email},${user.document_number},${user.role?.name || 'N/A'},${user.active ? 'Si' : 'No'}\n`
    })
    
    return new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' })
  }
}

export const userService = new UserService()