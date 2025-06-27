import { Building2, Users, GraduationCap, Users2 } from 'lucide-react'
import { Card } from '@/design-system/components'
import { useCoordinations } from '../hooks'
import { useInstructorList } from '@/features/instructor/hooks'
import { useGroupList } from '@/features/group/hooks'
import { useClassroomList } from '@/features/classroom/hooks'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  loading?: boolean
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </p>
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function CoordinationStats() {
  const { data: coordinationsData, isLoading: loadingCoordinations } = useCoordinations({ page: 1, limit: 1 })
  const { data: instructorsData, isLoading: loadingInstructors } = useInstructorList({ page: 1, limit: 1 })
  const { data: groupsData, isLoading: loadingGroups } = useGroupList({ page: 1, limit: 1 })
  const { data: classroomsData, isLoading: loadingClassrooms } = useClassroomList({ page: 1, limit: 1 })

  const stats = [
    {
      title: 'Total Coordinaciones',
      value: coordinationsData?.total || 0,
      icon: <Building2 size={24} />,
      loading: loadingCoordinations
    },
    {
      title: 'Total Instructores',
      value: instructorsData?.total || 0,
      icon: <Users2 size={24} />,
      loading: loadingInstructors
    },
    {
      title: 'Total Fichas',
      value: groupsData?.total || 0,
      icon: <GraduationCap size={24} />,
      loading: loadingGroups
    },
    {
      title: 'Total Ambientes',
      value: classroomsData?.total || 0,
      icon: <Users size={24} />,
      loading: loadingClassrooms
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          loading={stat.loading}
        />
      ))}
    </div>
  )
}