/**
 * QuickActions Component - Quick access buttons for common dashboard actions
 */

import React from 'react'
import { Card, CardContent, Typography, Button } from '@/design-system/components'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.constants'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  route?: string
  onClick?: () => void
  color: string
  badge?: string
  disabled?: boolean
}

interface QuickActionsProps {
  className?: string
}

export const QuickActions: React.FC<QuickActionsProps> = ({ className = '' }) => {
  const actions: QuickAction[] = [
    {
      id: 'create_schedule',
      title: 'Crear Horario',
      description: 'Programar nueva asignación de clase',
      icon: '📅',
      route: '/programming/schedule/create',
      color: 'bg-blue-500',
      badge: 'Rápido'
    },
    {
      id: 'assign_room',
      title: 'Asignar Aula',
      description: 'Encontrar y asignar aula disponible',
      icon: '🏫',
      onClick: () => console.log('Assign room'),
      color: 'bg-green-500'
    },
    {
      id: 'resolve_conflict',
      title: 'Resolver Conflicto',
      description: 'Gestionar conflictos de horarios',
      icon: '⚠️',
      onClick: () => console.log('Resolve conflict'),
      color: 'bg-red-500',
      badge: '3 pendientes'
    },
    {
      id: 'instructor_availability',
      title: 'Ver Disponibilidad',
      description: 'Consultar disponibilidad de instructores',
      icon: '👨‍🏫',
      route: '/consultas/instructors',
      color: 'bg-purple-500'
    },
    {
      id: 'room_status',
      title: 'Estado de Aulas',
      description: 'Ver ocupación actual de aulas',
      icon: '📊',
      route: '/consultas/rooms',
      color: 'bg-orange-500'
    },
    {
      id: 'generate_report',
      title: 'Generar Reporte',
      description: 'Crear reporte de ocupación',
      icon: '📋',
      route: '/informes/occupancy',
      color: 'bg-teal-500'
    }
  ]

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    }
  }

  return (
    <Card variant="elevated" className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
              Acciones Rápidas
            </Typography>
            <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-1">
              Accesos directos a tareas comunes
            </Typography>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const ActionComponent = ({ children }: { children: React.ReactNode }) => {
              if (action.route) {
                return <Link to={action.route}>{children}</Link>
              }
              return <div onClick={() => handleAction(action)}>{children}</div>
            }

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ActionComponent>
                  <Card 
                    variant="outlined" 
                    className={`
                      h-full cursor-pointer transition-all duration-200
                      hover:shadow-lg hover:scale-105 
                      ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 dark:hover:border-gray-600'}
                    `}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className={`p-3 rounded-xl ${action.color} bg-opacity-10 dark:bg-opacity-20`}
                        >
                          <span className="text-2xl">{action.icon}</span>
                        </div>
                        {action.badge && (
                          <span className={`
                            px-2 py-1 text-xs rounded-full font-medium
                            ${action.badge.includes('pendientes') 
                              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }
                          `}>
                            {action.badge}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Typography variant="h4" className="text-gray-900 dark:text-gray-100">
                          {action.title}
                        </Typography>
                        <Typography variant="body" className="text-gray-600 dark:text-gray-400 text-sm">
                          {action.description}
                        </Typography>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            {action.disabled ? 'No disponible' : 'Clic para acceder'}
                          </Typography>
                          <span className="text-gray-400 dark:text-gray-600">→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ActionComponent>
              </motion.div>
            )
          })}
        </div>

        {/* Sección de estadísticas de acciones */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Typography variant="h4" className="text-blue-600 dark:text-blue-400">
                12
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Acciones hoy
              </Typography>
            </div>
            <div>
              <Typography variant="h4" className="text-green-600 dark:text-green-400">
                3
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Conflictos resueltos
              </Typography>
            </div>
            <div>
              <Typography variant="h4" className="text-orange-600 dark:text-orange-400">
                8
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Aulas asignadas
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActions