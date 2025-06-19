import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  LoadingSpinner,
  Alert
} from '@/design-system/components'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'
import {
  Shield,
  Users,
  UserCheck,
  Settings,
  Lock,
  AlertTriangle,
  Eye,
  Edit,
  Plus,
  Trash2,
  Key,
  Crown,
  UserX,
  Activity,
  Clock,
  Database,
  Laptop
} from 'lucide-react'

export function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  // Mock data for demonstration
  const systemStats = {
    totalUsers: 156,
    activeUsers: 142,
    inactiveUsers: 14,
    adminUsers: 3,
    coordinatorUsers: 12,
    secretaryUsers: 141,
    lastWeekLogins: 1247,
    avgSessionTime: '2h 15m'
  }

  const adminModules = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'CRUD completo de usuarios del sistema',
      icon: Users,
      route: ROUTES.ADMIN.USERS,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
      count: systemStats.totalUsers,
      features: [
        'Crear nuevos usuarios',
        'Editar perfiles existentes',
        'Asignar roles y permisos',
        'Activar/Desactivar acceso'
      ],
      metrics: {
        active: systemStats.activeUsers,
        inactive: systemStats.inactiveUsers,
        new_month: 8,
        last_login: '2 min ago'
      },
      protected: false
    },
    {
      id: 'roles',
      title: 'Roles y Permisos',
      description: 'Configuración de roles del sistema',
      icon: Shield,
      route: ROUTES.ADMIN.ROLES,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200 dark:border-purple-800',
      count: 3, // Administrator, Coordinator, Secretary
      features: [
        'Roles base del sistema',
        'Permisos granulares',
        'Control de acceso',
        'Auditoría de cambios'
      ],
      metrics: {
        admin: systemStats.adminUsers,
        coordinator: systemStats.coordinatorUsers,
        secretary: systemStats.secretaryUsers,
        custom: 0
      },
      protected: true // Base roles cannot be renamed or deleted
    },
    {
      id: 'configuracion',
      title: 'Configuración del Sistema',
      description: 'Parámetros generales y configuración',
      icon: Settings,
      route: ROUTES.ADMIN.SETTINGS,
      color: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200 dark:border-green-800',
      count: 24, // Number of configuration options
      features: [
        'Configuración general',
        'Parámetros académicos',
        'Políticas de seguridad',
        'Respaldos automáticos'
      ],
      metrics: {
        email_enabled: true,
        backup_enabled: true,
        ssl_enabled: true,
        last_backup: '6 hours ago'
      },
      protected: false
    }
  ]

  const baseRoles = [
    {
      name: 'Administrator',
      description: 'Acceso completo al sistema',
      users: systemStats.adminUsers,
      permissions: ['CRUD completo', 'Configuración', 'Usuarios', 'Roles'],
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      icon: Crown,
      protected: true
    },
    {
      name: 'Coordinator',
      description: 'CRUD sin eliminación crítica',
      users: systemStats.coordinatorUsers,
      permissions: ['Gestión académica', 'RRHH', 'Programación', 'Informes'],
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: UserCheck,
      protected: true
    },
    {
      name: 'Secretary',
      description: 'Solo lectura y reportes',
      users: systemStats.secretaryUsers,
      permissions: ['Consultas', 'Informes', 'Vista general'],
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: Eye,
      protected: true
    }
  ]

  if (!user || !user.roles.some(role => role.name === 'Administrator')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert variant="error" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-2">
            <h3 className="font-medium">Acceso Denegado</h3>
            <p className="text-sm mt-1">
              Solo los administradores pueden acceder a esta sección.
            </p>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-600" />
            Administración del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de usuarios, roles y configuración general - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {systemStats.activeUsers} Usuarios Activos
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            Sistema Operativo
          </Badge>
        </div>
      </motion.div>

      {/* Security Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Alert variant="warning">
          <Lock className="h-4 w-4" />
          <div className="ml-2">
            <h3 className="font-medium">Zona de Administración</h3>
            <p className="text-sm mt-1">
              Los cambios realizados en esta sección afectan a todo el sistema. 
              Los roles base (Administrator, Coordinator, Secretary) están protegidos y no pueden ser eliminados.
            </p>
          </div>
        </Alert>
      </motion.div>

      {/* System Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {systemStats.totalUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {systemStats.activeUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Laptop className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones/Semana</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {systemStats.lastWeekLogins.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sesión Promedio</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {systemStats.avgSessionTime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {adminModules.map((module, index) => {
          const IconComponent = module.icon
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              onHoverStart={() => setActiveModule(module.id)}
              onHoverEnd={() => setActiveModule(null)}
            >
              <Card className={`transition-all duration-300 cursor-pointer hover:shadow-xl ${module.borderColor} ${
                activeModule === module.id ? 'shadow-lg' : ''
              }`}>
                <CardHeader className={`${module.color} border-b ${module.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <IconComponent className={`w-6 h-6 ${module.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {module.title}
                          {module.protected && (
                            <Lock className="w-4 h-4 text-amber-500" title="Protegido" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {module.count}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Funcionalidades:
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {module.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${module.iconColor.replace('text-', 'bg-')}`} />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Estado:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(module.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key === 'new_month' ? 'Nuevos/Mes' :
                               key === 'last_login' ? 'Último Login' :
                               key === 'email_enabled' ? 'Email' :
                               key === 'backup_enabled' ? 'Respaldos' :
                               key === 'ssl_enabled' ? 'SSL' :
                               key === 'last_backup' ? 'Últ. Respaldo' :
                               key}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(module.route)}
                        className="flex items-center gap-1 flex-1"
                      >
                        <Settings className="w-3 h-3" />
                        Configurar
                      </Button>
                      {!module.protected && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Nuevo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Base Roles Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Roles Base del Sistema
              <Badge variant="outline" className="ml-2">Protegidos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {baseRoles.map((role) => {
                const IconComponent = role.icon
                return (
                  <Card key={role.name} className="border-2 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${role.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {role.name}
                            </h4>
                            {role.protected && (
                              <Lock className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {role.description}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {role.users} usuarios
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Permisos principales:
                        </h5>
                        {role.permissions.map((permission, index) => (
                          <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            {permission}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Protección de Roles Base
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Los tres roles base del sistema (Administrator, Coordinator, Secretary) no pueden ser renombrados o eliminados 
                    para mantener la integridad del sistema. Solo se pueden modificar sus permisos específicos.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}