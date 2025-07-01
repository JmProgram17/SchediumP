/**
 * Notifications Center Component
 * Displays notification history and manages notification states
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  Clock,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  X,
  RotateCcw,
  Archive
} from 'lucide-react'
import { Typography, Button } from '@/design-system/components'
import { cn } from '@/utils/cn'

// Types for notifications
interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  category: 'schedule' | 'system' | 'user' | 'academic'
  timestamp: string
  isRead: boolean
  isArchived: boolean
  actions?: NotificationAction[]
  metadata?: {
    quarter?: string
    user?: string
    classroom?: string
    instructor?: string
  }
}

interface NotificationAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'danger'
  onClick: () => void
}

interface NotificationFilters {
  category?: string
  type?: string
  isRead?: boolean
  dateRange?: string
}

export function NotificationsSettings() {
  const [filters, setFilters] = useState<NotificationFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null)

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Conflicto de Horario Detectado',
      message: 'Se detectó un conflicto entre las clases de "Programación Avanzada" y "Base de Datos" en el aula 101 para el día Lunes a las 8:00 AM.',
      type: 'error',
      category: 'schedule',
      timestamp: '2024-06-30T10:30:00Z',
      isRead: false,
      isArchived: false,
      metadata: {
        quarter: 'Trimestre 2 - 2024',
        classroom: 'Aula 101',
        instructor: 'Prof. García'
      },
      actions: [
        {
          id: 'resolve',
          label: 'Resolver Conflicto',
          type: 'primary',
          onClick: () => console.log('Resolver conflicto')
        },
        {
          id: 'view_schedule',
          label: 'Ver Horario',
          type: 'secondary',
          onClick: () => console.log('Ver horario')
        }
      ]
    },
    {
      id: '2',
      title: 'Nuevo Trimestre Activado',
      message: 'El Trimestre 2 - 2024 ha sido activado exitosamente. Todas las configuraciones han sido aplicadas.',
      type: 'success',
      category: 'academic',
      timestamp: '2024-06-30T08:00:00Z',
      isRead: false,
      isArchived: false,
      metadata: {
        quarter: 'Trimestre 2 - 2024'
      }
    },
    {
      id: '3',
      title: 'Usuario Registrado',
      message: 'Se registró un nuevo usuario: Maria Rodriguez (maria.rodriguez@schedium.edu) con rol de Instructor.',
      type: 'info',
      category: 'user',
      timestamp: '2024-06-29T16:45:00Z',
      isRead: true,
      isArchived: false,
      metadata: {
        user: 'Maria Rodriguez'
      }
    },
    {
      id: '4',
      title: 'Mantenimiento Programado',
      message: 'El sistema estará en mantenimiento el domingo 7 de julio de 2:00 AM a 6:00 AM. Durante este tiempo no estará disponible.',
      type: 'warning',
      category: 'system',
      timestamp: '2024-06-29T14:20:00Z',
      isRead: true,
      isArchived: false
    },
    {
      id: '5',
      title: 'Horario Creado Exitosamente',
      message: 'Se creó el horario para el grupo "Sistemas 301" con 24 horas académicas distribuidas en la semana.',
      type: 'success',
      category: 'schedule',
      timestamp: '2024-06-29T11:15:00Z',
      isRead: true,
      isArchived: false,
      metadata: {
        quarter: 'Trimestre 2 - 2024'
      }
    },
    {
      id: '6',
      title: 'Actualización de Sistema',
      message: 'Se instaló la versión 2.1.4 con mejoras en el módulo de consultas y correcciones de errores menores.',
      type: 'info',
      category: 'system',
      timestamp: '2024-06-28T20:30:00Z',
      isRead: true,
      isArchived: false
    },
    {
      id: '7',
      title: 'Aula No Disponible',
      message: 'El aula 203 no está disponible para programación debido a mantenimiento de equipos hasta el 5 de julio.',
      type: 'warning',
      category: 'schedule',
      timestamp: '2024-06-28T09:10:00Z',
      isRead: true,
      isArchived: false,
      metadata: {
        classroom: 'Aula 203'
      }
    },
    {
      id: '8',
      title: 'Respaldo Completado',
      message: 'Se completó exitosamente el respaldo automático de la base de datos. Tamaño: 2.4 GB.',
      type: 'success',
      category: 'system',
      timestamp: '2024-06-28T03:00:00Z',
      isRead: true,
      isArchived: false
    }
  ])

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      if (notification.isArchived) return false
      
      // Search filter
      if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Category filter
      if (filters.category && notification.category !== filters.category) {
        return false
      }
      
      // Type filter
      if (filters.type && notification.type !== filters.type) {
        return false
      }
      
      // Read status filter
      if (filters.isRead !== undefined && notification.isRead !== filters.isRead) {
        return false
      }
      
      return true
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length

  // Notification actions
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ))
  }

  const markAsUnread = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: false } : n
    ))
  }

  const archiveNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isArchived: true } : n
    ))
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const toggleNotificationExpansion = (notificationId: string) => {
    setExpandedNotification(prev => prev === notificationId ? null : notificationId)
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora mismo'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays}d`
    
    return notificationTime.toLocaleDateString('es-ES')
  }

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'error') return AlertTriangle
    if (type === 'success') return CheckCircle
    if (type === 'warning') return AlertTriangle
    if (category === 'schedule') return Calendar
    if (category === 'user') return Users
    if (category === 'system') return Settings
    return Info
  }

  const getNotificationColor = (type: string) => {
    const colors = {
      error: 'text-red-600 dark:text-red-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-amber-600 dark:text-amber-400',
      info: 'text-blue-600 dark:text-blue-400'
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Typography variant="h2" className="text-gray-900 dark:text-gray-100">
                Centro de Notificaciones
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Todas las notificaciones están leídas'}
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar Todas como Leídas
              </Button>
            )}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todas</option>
                    <option value="schedule">Horarios</option>
                    <option value="system">Sistema</option>
                    <option value="user">Usuarios</option>
                    <option value="academic">Académico</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos</option>
                    <option value="error">Error</option>
                    <option value="warning">Advertencia</option>
                    <option value="success">Éxito</option>
                    <option value="info">Información</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.isRead === undefined ? '' : filters.isRead.toString()}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      isRead: e.target.value === '' ? undefined : e.target.value === 'true' 
                    })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todas</option>
                    <option value="false">No leídas</option>
                    <option value="true">Leídas</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => setFilters({})}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Limpiar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-2">
              No hay notificaciones
            </Typography>
            <Typography variant="body" className="text-gray-600 dark:text-gray-400">
              {searchTerm || Object.keys(filters).length > 0 
                ? 'No se encontraron notificaciones con los criterios seleccionados.'
                : 'Aún no tienes notificaciones.'
              }
            </Typography>
          </div>
        ) : (
          <>
            {/* Results summary */}
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                Mostrando {filteredNotifications.length} de {notifications.filter(n => !n.isArchived).length} notificaciones
              </Typography>
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type, notification.category)
                const isExpanded = expandedNotification === notification.id
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200",
                      notification.isRead 
                        ? "border-gray-200 dark:border-gray-700" 
                        : "border-blue-200 dark:border-blue-700 shadow-sm"
                    )}
                  >
                    {/* Main notification content */}
                    <div 
                      className={cn(
                        "p-4 cursor-pointer",
                        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                      )}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id)
                        }
                        toggleNotificationExpansion(notification.id)
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon and unread indicator */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          <div className={cn(
                            "p-2 rounded-lg",
                            notification.type === 'error' && "bg-red-100 dark:bg-red-900/30",
                            notification.type === 'success' && "bg-green-100 dark:bg-green-900/30",
                            notification.type === 'warning' && "bg-amber-100 dark:bg-amber-900/30",
                            notification.type === 'info' && "bg-blue-100 dark:bg-blue-900/30"
                          )}>
                            <Icon className={cn("w-5 h-5", getNotificationColor(notification.type))} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Typography 
                                variant="body2" 
                                className={cn(
                                  "font-medium mb-1",
                                  notification.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-white"
                                )}
                              >
                                {notification.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                className={cn(
                                  "text-gray-600 dark:text-gray-400 line-clamp-2",
                                  !isExpanded && "line-clamp-2"
                                )}
                              >
                                {notification.message}
                              </Typography>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(notification.timestamp)}
                              </Typography>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Metadata badges */}
                          {notification.metadata && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {notification.metadata.quarter && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                                  <Calendar className="w-3 h-3" />
                                  {notification.metadata.quarter}
                                </span>
                              )}
                              {notification.metadata.classroom && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                  <Settings className="w-3 h-3" />
                                  {notification.metadata.classroom}
                                </span>
                              )}
                              {notification.metadata.user && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                  <Users className="w-3 h-3" />
                                  {notification.metadata.user}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions menu */}
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Toggle dropdown menu logic here
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                            {/* Action buttons */}
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {notification.actions.map((action) => (
                                  <Button
                                    key={action.id}
                                    size="sm"
                                    variant={action.type === 'primary' ? 'default' : action.type === 'danger' ? 'outline' : 'outline'}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      action.onClick()
                                    }}
                                    className={cn(
                                      action.type === 'danger' && "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    )}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* Quick actions */}
                            <div className="flex items-center gap-2 text-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                              >
                                {notification.isRead ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {notification.isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  archiveNotification(notification.id)
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                              >
                                <Archive className="w-3 h-3" />
                                Archivar
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default NotificationsSettings