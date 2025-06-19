import { Link } from 'react-router-dom'
import { Card, CardContent, Typography, Button, Icon } from '@/design-system/components'
import { MainLayout } from '@/layouts/MainLayout'
import { ROUTES } from '@/constants/routes.constants'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth.store'

const stats = [
  {
    label: 'Programas Activos',
    value: '24',
    icon: '📚',
    color: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-600 dark:text-blue-400',
    trend: '+12%',
    trendUp: true,
  },
  {
    label: 'Instructores',
    value: '89',
    icon: '👨‍🏫',
    color: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-600 dark:text-green-400',
    trend: '+5%',
    trendUp: true,
  },
  {
    label: 'Aprendices',
    value: '2,450',
    icon: '👥',
    color: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-600 dark:text-purple-400',
    trend: '+18%',
    trendUp: true,
  },
  {
    label: 'Aulas Disponibles',
    value: '45',
    icon: '🏢',
    color: 'bg-orange-100 dark:bg-orange-900',
    textColor: 'text-orange-600 dark:text-orange-400',
    trend: '-2%',
    trendUp: false,
  },
]

const quickActions = [
  {
    title: 'Programación de Horarios',
    description: 'Gestiona y programa horarios académicos',
    icon: '📅',
    route: ROUTES.PROGRAMMING,
    color: 'bg-blue-500',
  },
  {
    title: 'Gestión Académica',
    description: 'Administra programas, cursos y aprendices',
    icon: '🎓',
    route: ROUTES.ACADEMIC.MAIN,
    color: 'bg-green-500',
  },
  {
    title: 'Consultas',
    description: 'Consulta horarios y disponibilidad',
    icon: '🔍',
    route: ROUTES.CONSULTAS,
    color: 'bg-purple-500',
  },
  {
    title: 'Informes',
    description: 'Genera reportes y estadísticas',
    icon: '📊',
    route: ROUTES.INFORMES,
    color: 'bg-orange-500',
  },
]

const recentActivity = [
  {
    id: 1,
    action: 'Nuevo horario creado',
    description: 'Horario para Programación de Software - Ficha 2798456',
    time: 'Hace 5 minutos',
    icon: '📅',
  },
  {
    id: 2,
    action: 'Instructor asignado',
    description: 'Juan Pérez asignado a Bases de Datos',
    time: 'Hace 1 hora',
    icon: '👨‍🏫',
  },
  {
    id: 3,
    action: 'Aula reservada',
    description: 'Aula 301 reservada para el período 2024-1',
    time: 'Hace 2 horas',
    icon: '🏢',
  },
  {
    id: 4,
    action: 'Nuevo programa registrado',
    description: 'Análisis y Desarrollo de Software',
    time: 'Hace 3 horas',
    icon: '📚',
  },
]

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <MainLayout>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Typography variant="h1" className="text-gray-900 dark:text-gray-100">
          Bienvenido, {user?.first_name || 'Usuario'}
        </Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-2">
          Sistema de Gestión de Horarios Académicos - SENA CGMLTI
        </Typography>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`inline-flex p-3 rounded-lg ${stat.color} mb-4`}>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <Typography variant="body" className="text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </Typography>
                    <Typography variant="h2" className={`mt-1 ${stat.textColor}`}>
                      {stat.value}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Typography variant="h3" className="mb-6 text-gray-900 dark:text-gray-100">
            Acciones Rápidas
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={action.route}>
                  <Card 
                    variant="outlined" 
                    className="hover:shadow-lg transition-all hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer h-full"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className={`p-3 rounded-lg ${action.color} bg-opacity-10 dark:bg-opacity-20`}>
                          <span className="text-2xl">{action.icon}</span>
                        </div>
                        <div className="ml-4 flex-1">
                          <Typography variant="h4" className="text-gray-900 dark:text-gray-100">
                            {action.title}
                          </Typography>
                          <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-1">
                            {action.description}
                          </Typography>
                        </div>
                        <Icon name="chevron-right" className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <Typography variant="h3" className="mb-6 text-gray-900 dark:text-gray-100">
            Actividad Reciente
          </Typography>
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 pb-4 last:pb-0 border-b last:border-0 dark:border-gray-700"
                  >
                    <span className="text-xl">{activity.icon}</span>
                    <div className="flex-1">
                      <Typography variant="body" weight="medium" className="text-gray-900 dark:text-gray-100">
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 dark:text-gray-500 mt-1">
                        {activity.time}
                      </Typography>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="ghost" fullWidth className="justify-center">
                  Ver toda la actividad
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Card variant="outlined" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full mr-4">
                <Icon name="check-circle" className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <Typography variant="h4" className="text-green-900 dark:text-green-100">
                  Sistema Operativo
                </Typography>
                <Typography variant="body" className="text-green-700 dark:text-green-300">
                  Todos los servicios funcionando correctamente
                </Typography>
              </div>
              <Button variant="secondary" size="sm">
                Ver estado detallado
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  )
}