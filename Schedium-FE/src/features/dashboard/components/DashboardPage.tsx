/**
 * DashboardPage - Página principal del dashboard con todos los componentes visuales
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, Typography, Button } from '@/design-system/components'
import { MetricsCards } from './MetricsCards'
import { OccupancyHeatmap } from './OccupancyHeatmap'
import { ProgramDistribution } from './ProgramDistribution'
import { ActivityTimeline } from './ActivityTimeline'
import { CurrentSnapshot } from './CurrentSnapshot'
import { QuickActions } from './QuickActions'

interface DashboardPageProps {
  className?: string
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ className = '' }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const [selectedCampus, setSelectedCampus] = useState<string>('all')

  const timeRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' }
  ]

  const campusOptions = [
    { value: 'all', label: 'Todos los Campus' },
    { value: 'campus_norte', label: 'Campus Norte' },
    { value: 'campus_sur', label: 'Campus Sur' },
    { value: 'campus_centro', label: 'Campus Centro' }
  ]

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header del Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <Typography variant="h1" className="text-gray-900 dark:text-gray-100">
                📊 Dashboard Académico
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-2">
                Vista general del sistema de gestión académica
              </Typography>
            </div>
            
            {/* Filtros del Dashboard */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Selector de Campus */}
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {campusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Selector de Tiempo */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as 'today' | 'week' | 'month')}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Botón de Actualización */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.location.reload()}
                className="whitespace-nowrap"
              >
                🔄 Actualizar
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Grid Principal del Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda - Métricas y Controles */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Métricas Principales */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MetricsCards />
            </motion.div>
            
            {/* Mapa de Calor de Ocupación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <OccupancyHeatmap selectedCampus={selectedCampus} />
            </motion.div>
            
            {/* Distribución de Programas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ProgramDistribution />
            </motion.div>
            
            {/* Acciones Rápidas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <QuickActions />
            </motion.div>
          </div>
          
          {/* Columna Derecha - Timeline y Snapshot */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Snapshot del Momento */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CurrentSnapshot />
            </motion.div>
            
            {/* Timeline de Actividades */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ActivityTimeline />
            </motion.div>
            
            {/* Widget de Alertas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="outlined" className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">🔔</span>
                    <Typography variant="h4" className="text-gray-900 dark:text-gray-100">
                      Notificaciones
                    </Typography>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Typography variant="caption" weight="medium" className="text-yellow-700 dark:text-yellow-300">
                        ⚠️ 3 conflictos de horarios detectados
                      </Typography>
                      <Typography variant="caption" className="text-yellow-600 dark:text-yellow-400 block mt-1">
                        Requieren resolución antes de las 14:00
                      </Typography>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Typography variant="caption" weight="medium" className="text-blue-700 dark:text-blue-300">
                        📊 Reporte semanal disponible
                      </Typography>
                      <Typography variant="caption" className="text-blue-600 dark:text-blue-400 block mt-1">
                        Estadísticas de ocupación actualizadas
                      </Typography>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Typography variant="caption" weight="medium" className="text-green-700 dark:text-green-300">
                        ✅ Sistema funcionando correctamente
                      </Typography>
                      <Typography variant="caption" className="text-green-600 dark:text-green-400 block mt-1">
                        Todos los servicios operativos
                      </Typography>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="small"
                    className="w-full mt-4 text-sm"
                  >
                    Ver todas las notificaciones →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Widget de Estado del Sistema */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card variant="outlined">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">⚡</span>
                    <Typography variant="h4" className="text-gray-900 dark:text-gray-100">
                      Estado del Sistema
                    </Typography>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                        API Backend
                      </Typography>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <Typography variant="caption" className="text-green-600 dark:text-green-400">
                          Operativo
                        </Typography>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                        Base de Datos
                      </Typography>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <Typography variant="caption" className="text-green-600 dark:text-green-400">
                          Conectada
                        </Typography>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                        Sincronización
                      </Typography>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <Typography variant="caption" className="text-yellow-600 dark:text-yellow-400">
                          En progreso
                        </Typography>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                        Última actualización: hace 2 min
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        
        {/* Footer del Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>
              <Typography variant="caption">
                Dashboard actualizado en tiempo real • Schedium Academic Management System
              </Typography>
            </div>
            <div className="mt-2 sm:mt-0">
              <Typography variant="caption">
                Última sincronización: {new Date().toLocaleTimeString('es-ES')}
              </Typography>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage