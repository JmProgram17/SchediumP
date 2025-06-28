import { Users, UserCheck, UserX, Shield, Clock } from 'lucide-react'
import { Card } from '@/design-system/components'
import { Badge } from '@/design-system/components/Badge'
import { useUserStats } from '../hooks'

export function UserStats() {
  const { data: stats, isLoading } = useUserStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Users */}
      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_users}</p>
          </div>
        </div>
      </Card>

      {/* Active Users */}
      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Activos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active_users}</p>
          </div>
        </div>
      </Card>

      {/* Inactive Users */}
      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Inactivos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive_users}</p>
          </div>
        </div>
      </Card>

      {/* Recent Logins */}
      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Logins Recientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.recent_logins}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimas 24h</p>
          </div>
        </div>
      </Card>

      {/* Users by Role */}
      {stats.users_by_role && stats.users_by_role.length > 0 && (
        <Card className="p-6 md:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usuarios por Rol</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stats.users_by_role.map((roleData) => (
              <div key={roleData.role.role_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{roleData.role.name}</p>
                  {roleData.role.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{roleData.role.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2">
                  {roleData.count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}