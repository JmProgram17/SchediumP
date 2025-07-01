/**
 * ActivityTimeline Component - Real-time activity feed for dashboard
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Button } from '@/design-system/components'
import { motion, AnimatePresence } from 'framer-motion'

interface Activity {
  id: string
  type: 'class_start' | 'class_end' | 'conflict_detected' | 'room_assigned' | 'instructor_assigned' | 'schedule_change'
  title: string
  description: string
  timestamp: Date
  icon: string
  priority: 'low' | 'medium' | 'high'
  metadata?: {
    classroom?: string
    instructor?: string
    program?: string
    campus?: string
  }
}

interface ActivityTimelineProps {
  className?: string
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ className = '' }) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<'all' | 'high' | 'conflicts'>('all')
  const [isLive, setIsLive] = useState(true)

  // Mock data generator - esto se reemplazará con WebSocket real
  const generateMockActivity = (): Activity => {
    const types: Activity['type'][] = ['class_start', 'class_end', 'conflict_detected', 'room_assigned', 'instructor_assigned', 'schedule_change']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const activityTemplates = {
      class_start: {
        title: 'Clase Iniciada',
        description: 'Análisis y Desarrollo de Software - Ficha 2798456',
        icon: '🟢',
        priority: 'low' as const
      },
      class_end: {
        title: 'Clase Finalizada',
        description: 'Bases de Datos - Aula 301',
        icon: '🔴',
        priority: 'low' as const
      },
      conflict_detected: {
        title: 'Conflicto Detectado',
        description: 'Solapamiento de horarios en Aula 205',
        icon: '⚠️',
        priority: 'high' as const
      },
      room_assigned: {
        title: 'Aula Asignada',
        description: 'Aula 102 - Programación Web',
        icon: '🏫',
        priority: 'medium' as const
      },
      instructor_assigned: {
        title: 'Instructor Asignado',
        description: 'Dr. García - Estructura de Datos',
        icon: '👨‍🏫',
        priority: 'medium' as const
      },
      schedule_change: {
        title: 'Cambio de Horario',
        description: 'Redes de Datos movido a 14:00-16:00',
        icon: '📅',
        priority: 'medium' as const
      }
    }

    const template = activityTemplates[type]
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      ...template,
      timestamp: new Date(),
      metadata: {
        classroom: `Aula ${Math.floor(Math.random() * 20) + 1}`,
        instructor: 'Dr. García',
        program: 'ADSI',
        campus: 'Campus Norte'
      }
    }
  }

  // Simular actividades en tiempo real
  useEffect(() => {
    if (!isLive) return

    // Cargar actividades iniciales
    const initialActivities = Array.from({ length: 8 }, generateMockActivity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setActivities(initialActivities)

    // Agregar nuevas actividades cada 10 segundos
    const interval = setInterval(() => {
      const newActivity = generateMockActivity()
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]) // Mantener solo 20 actividades
    }, 10000)

    return () => clearInterval(interval)
  }, [isLive])

  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case 'high':
        return activity.priority === 'high'
      case 'conflicts':
        return activity.type === 'conflict_detected'
      default:
        return true
    }
  })

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    return `Hace ${diffHours}h`
  }

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  return (
    <Card variant="elevated" className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
              Actividad en Tiempo Real
            </Typography>
            {isLive && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Typography variant="caption" className="text-green-600 dark:text-green-400 font-medium">
                  EN VIVO
                </Typography>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">Todas</option>
              <option value="high">Alta Prioridad</option>
              <option value="conflicts">Solo Conflictos</option>
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={isLive ? 'text-green-600' : 'text-gray-600'}
            >
              {isLive ? '⏸️' : '▶️'}
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`
                  border-l-4 pl-4 pr-3 py-3 rounded-r-lg transition-all duration-200
                  hover:shadow-md cursor-pointer
                  ${getPriorityColor(activity.priority)}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Typography variant="body" weight="medium" className="text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </Typography>
                        {activity.priority === 'high' && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <Typography variant="body" className="text-gray-600 dark:text-gray-400 text-sm">
                        {activity.description}
                      </Typography>
                      {activity.metadata && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {activity.metadata.classroom && (
                            <span>📍 {activity.metadata.classroom}</span>
                          )}
                          {activity.metadata.campus && (
                            <span>🏫 {activity.metadata.campus}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                      {formatTime(activity.timestamp)}
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 dark:text-gray-500 block">
                      {getTimeAgo(activity.timestamp)}
                    </Typography>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-8">
            <Typography variant="body" className="text-gray-500 dark:text-gray-400">
              No hay actividades para mostrar con los filtros actuales
            </Typography>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
            Mostrando {filteredActivities.length} de {activities.length} actividades
          </Typography>
          
          <Button variant="ghost" size="sm">
            Ver historial completo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline