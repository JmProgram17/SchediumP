/**
 * DashboardPage - Página principal del dashboard con representación visual completa
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, Typography, Button } from '@/design-system/components'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.constants'
import { ChevronDown, X, BarChart3, Building2, Users, Bell, Calendar, MapPin, ClipboardList, TrendingUp, Clock, AlertTriangle, CheckCircle, FileText, School, RefreshCw, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDashboardData, useRefreshDashboard, useDistribucionProgramas } from '@/services/query/hooks/dashboard.hooks'

export function DashboardPage() {
  const [selectedCampus, setSelectedCampus] = useState<string>('all')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Dashboard data hooks
  const { metrics, ocupacionCampus, mapaCalor, proximaHora, isLoading, isError, error, refetch } = useDashboardData()
  const refreshDashboard = useRefreshDashboard()

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Función para actualizar dashboard sin refrescar página
  const handleUpdateDashboard = async () => {
    try {
      // Refrescar datos del dashboard y invalidar cache
      refreshDashboard()
      await refetch()
      
      // Actualizar tiempo actual
      setCurrentTime(new Date())
      
    } catch (error) {
      console.error('Error actualizando dashboard:', error)
    }
  }

  // Descripciones de tooltips para cada métrica
  const tooltipDescriptions = {
    ocupacion_general: 'Porcentaje de aulas ocupadas en este momento específico. Se actualiza en tiempo real basándose en los horarios de clases actuales.',
    ambientes_activos: 'Número total de aulas que tienen al menos una clase programada (en cualquier horario). Muestra el porcentaje de utilización de la infraestructura.',
    instructores_en_clase: 'Cantidad de instructores que están dictando clases en este momento. Se basa en los horarios actuales y estado activo de los instructores.',
    alertas_pendientes: 'Alertas del sistema que requieren atención: clases sin instructor, ambientes sin asignar, instructores sobrecargados y conflictos de horarios.'
  }

  // Preparar datos de métricas desde la API
  const metricsData = metrics.data ? [
    { 
      title: 'Ocupación General', 
      value: `${metrics.data.ocupacion_general?.porcentaje || 0}%`, 
      change: `${metrics.data.ocupacion_general?.aulas_ocupadas || 0}/${metrics.data.ocupacion_general?.aulas_totales || 0}`, 
      changeType: metrics.data.ocupacion_general?.tendencia || 'neutral' as const, 
      icon: BarChart3,
      tooltip: tooltipDescriptions.ocupacion_general
    },
    { 
      title: 'Ambientes Activos', 
      value: `${metrics.data.ambientes_activos?.total || 0}`, 
      change: `${metrics.data.ambientes_activos?.porcentaje_uso || 0}%`, 
      changeType: metrics.data.ambientes_activos?.tendencia || 'neutral' as const, 
      icon: Building2,
      tooltip: tooltipDescriptions.ambientes_activos
    },
    { 
      title: 'Instructores en Clase', 
      value: `${metrics.data.instructores_en_clase?.total || 0}`, 
      change: `${metrics.data.instructores_en_clase?.porcentaje_activo || 0}%`, 
      changeType: metrics.data.instructores_en_clase?.tendencia || 'neutral' as const, 
      icon: Users,
      tooltip: tooltipDescriptions.instructores_en_clase
    },
    { 
      title: 'Alertas Pendientes', 
      value: `${metrics.data.alertas_pendientes?.total || 0}`, 
      change: `${(metrics.data.alertas_pendientes?.detalle.fichas_sin_instructor || 0) + (metrics.data.alertas_pendientes?.detalle.ambientes_sin_asignar || 0)} críticas`, 
      changeType: metrics.data.alertas_pendientes?.tendencia || 'neutral' as const, 
      icon: Bell,
      tooltip: tooltipDescriptions.alertas_pendientes
    }
  ] : [
    // Fallback data while loading
    { title: 'Ocupación General', value: '--', change: '--', changeType: 'neutral' as const, icon: BarChart3, tooltip: tooltipDescriptions.ocupacion_general },
    { title: 'Ambientes Activos', value: '--', change: '--', changeType: 'neutral' as const, icon: Building2, tooltip: tooltipDescriptions.ambientes_activos },
    { title: 'Instructores en Clase', value: '--', change: '--', changeType: 'neutral' as const, icon: Users, tooltip: tooltipDescriptions.instructores_en_clase },
    { title: 'Alertas Pendientes', value: '--', change: '--', changeType: 'neutral' as const, icon: Bell, tooltip: tooltipDescriptions.alertas_pendientes }
  ]

  // Datos reales del mapa de calor desde la API
  const timeSlots = mapaCalor.data?.bloques_tiempo?.map(bloque => bloque.display_name) || []
  const days = mapaCalor.data?.dias?.map(dia => dia.short_name) || []
  
  // Matriz de ocupación real desde la base de datos
  const heatmapData = mapaCalor.data?.ocupacion_matriz || []

  // Estados para distribución de programas
  const [viewType, setViewType] = useState<'cadena' | 'nivel'>('cadena')
  
  // Hook para obtener distribución de programas
  const distribucionProgramas = useDistribucionProgramas(viewType)
  
  // Colores para el gráfico donut
  const donutColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']
  
  // Preparar datos del gráfico con colores asignados
  const programData = (distribucionProgramas.data?.distribucion || []).map((item, index) => ({
    ...item,
    color: donutColors[index % donutColors.length]
  }))

  // Mock data para actividades
  const activities = [
    { time: '14:30', type: 'warning', icon: Bell, description: 'Alerta: Ficha 2798456 sin instructor asignado' },
    { time: '14:25', type: 'success', icon: CheckCircle, description: 'Asignación de instructor completada' },
    { time: '14:20', type: 'info', icon: FileText, description: 'Reporte semanal generado' },
    { time: '14:15', type: 'success', icon: Building2, description: 'Ambiente 205 asignado correctamente' },
    { time: '14:10', type: 'warning', icon: AlertTriangle, description: 'Capacidad del ambiente próxima al límite' }
  ]

  // Funciones auxiliares
  const getOccupancyColor = (value: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (value <= 25) return 'bg-green-200 dark:bg-green-900'
    if (value <= 50) return 'bg-yellow-200 dark:bg-yellow-900'
    if (value <= 75) return 'bg-orange-200 dark:bg-orange-900'
    return 'bg-red-200 dark:bg-red-900'
  }

  // Helper para obtener el valor de ocupación de la matriz de datos reales
  const getOcupacionValue = (dayIndex: number, timeIndex: number) => {
    if (!mapaCalor.data?.ocupacion_matriz || 
        !mapaCalor.data.ocupacion_matriz[dayIndex] || 
        !mapaCalor.data.ocupacion_matriz[dayIndex][timeIndex]) {
      return 0
    }
    return mapaCalor.data.ocupacion_matriz[dayIndex][timeIndex].ocupacion
  }

  // Helper para obtener información adicional del slot
  const getSlotInfo = (dayIndex: number, timeIndex: number) => {
    if (!mapaCalor.data?.ocupacion_matriz || 
        !mapaCalor.data.ocupacion_matriz[dayIndex] || 
        !mapaCalor.data.ocupacion_matriz[dayIndex][timeIndex]) {
      return { clases: 0, total: 0 }
    }
    const slot = mapaCalor.data.ocupacion_matriz[dayIndex][timeIndex]
    return {
      clases: slot.clases_programadas,
      total: slot.total_aulas
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 -m-8 p-8">
      <div className="max-w-7xl mx-auto">
        
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
            
            {/* Controles del Dashboard */}
            <div className="flex flex-col sm:flex-row gap-3">
              <CustomDropdown
                value={selectedCampus}
                onChange={(value) => setSelectedCampus(value)}
                options={[
                  { value: 'all', label: 'Todos los Campus' },
                  { value: 'campus_norte', label: 'Campus Norte' },
                  { value: 'campus_sur', label: 'Campus Sur' },
                  { value: 'campus_centro', label: 'Campus Centro' }
                ]}
                placeholder="Seleccionar campus"
                className="min-w-[180px]"
              />
              
              <Button
                onClick={handleUpdateDashboard}
                disabled={isLoading}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error state */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <Typography variant="h4" className="text-red-800 dark:text-red-200">
                  Error al cargar datos del dashboard
                </Typography>
                <Typography variant="body2" className="text-red-600 dark:text-red-400 mt-1">
                  {error?.message || 'No se pudieron obtener las métricas. Intenta actualizar la página.'}
                </Typography>
              </div>
              <Button 
                onClick={handleUpdateDashboard}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Reintentar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Grid Principal del Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricsData.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="elevated" className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 w-fit">
                            <metric.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                              {metric.title}
                            </Typography>
                            <div className="relative group">
                              <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help transition-colors" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 text-center z-50">
                                {metric.tooltip}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                              </div>
                            </div>
                          </div>
                          <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mt-1">
                            {metric.value}
                          </Typography>
                        </div>
                        <span className={`text-sm font-medium ${
                          metric.changeType === 'positive' ? 'text-green-600' :
                          metric.changeType === 'negative' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {metric.change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Mapa de Calor de Ocupación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="elevated">
                <CardContent className="p-6">
                  <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-4">
                    Mapa de Calor de Ocupación Semanal
                  </Typography>
                  
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      {/* Header con días */}
                      <div className={`grid gap-2 mb-3`} style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}>
                        <div className="text-right text-sm font-medium text-gray-600 dark:text-gray-400 pr-2">
                          Hora
                        </div>
                        {days.map(day => (
                          <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Grid de heatmap */}
                      {timeSlots.map((time, timeIndex) => (
                        <div key={time} className={`grid gap-2 mb-2`} style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}>
                          <div className="text-right text-sm text-gray-600 dark:text-gray-400 pr-2 flex items-center justify-end">
                            {time}
                          </div>
                          {days.map((day, dayIndex) => {
                            const ocupacion = getOcupacionValue(dayIndex, timeIndex)
                            const { clases, total } = getSlotInfo(dayIndex, timeIndex)
                            
                            return (
                              <div
                                key={`${day}-${time}`}
                                className={`h-10 rounded ${getOccupancyColor(ocupacion)} 
                                  hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all
                                  flex items-center justify-center text-xs font-medium min-w-0`}
                                title={`${day} ${time}: ${ocupacion}% ocupado (${clases}/${total} aulas)`}
                              >
                                {ocupacion > 0 && 
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {ocupacion}%
                                  </span>
                                }
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Leyenda */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                      Ocupación:
                    </Typography>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-200 dark:bg-green-900 rounded"></div>
                      <Typography variant="caption">0-25%</Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900 rounded"></div>
                      <Typography variant="caption">26-50%</Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900 rounded"></div>
                      <Typography variant="caption">51-75%</Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-200 dark:bg-red-900 rounded"></div>
                      <Typography variant="caption">76-100%</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Distribución de Programas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                      Distribución de Programas
                    </Typography>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewType('cadena')}
                        className={`px-3 py-1 text-sm rounded ${
                          viewType === 'cadena' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Cadena
                      </button>
                      <button
                        onClick={() => setViewType('nivel')}
                        className={`px-3 py-1 text-sm rounded ${
                          viewType === 'nivel' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Nivel
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Gráfico Donut */}
                    <div className="relative">
                      {distribucionProgramas.isLoading ? (
                        <div className="w-[200px] h-[200px] flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                      ) : programData.length === 0 ? (
                        <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <Typography variant="caption">Sin datos disponibles</Typography>
                        </div>
                      ) : (
                        <svg width="200" height="200" viewBox="0 0 200 200" className="transform rotate-0">
                        {/* Anillo exterior del donut */}
                        {programData.length === 1 && programData[0].value === 100 ? (
                          // Caso especial: un solo elemento con 100%
                          <g>
                            <circle
                              cx="100"
                              cy="100"
                              r="65"
                              fill={programData[0].color}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            <circle
                              cx="100"
                              cy="100"
                              r="45"
                              fill="rgb(249 250 251)"
                              className="dark:fill-gray-800"
                            />
                          </g>
                        ) : (
                          // Caso normal: múltiples segmentos
                          programData.map((item, index) => {
                            let cumulativePercentage = 0
                            for (let i = 0; i < index; i++) {
                              cumulativePercentage += programData[i].value
                            }
                            
                            const startAngle = (cumulativePercentage / 100) * 360 - 90
                            const endAngle = ((cumulativePercentage + item.value) / 100) * 360 - 90
                            
                            const startAngleRad = (startAngle * Math.PI) / 180
                            const endAngleRad = (endAngle * Math.PI) / 180
                            
                            const largeArcFlag = item.value > 50 ? 1 : 0
                            
                            const x1 = 100 + 65 * Math.cos(startAngleRad)
                            const y1 = 100 + 65 * Math.sin(startAngleRad)
                            const x2 = 100 + 65 * Math.cos(endAngleRad)
                            const y2 = 100 + 65 * Math.sin(endAngleRad)
                            
                            const x3 = 100 + 45 * Math.cos(endAngleRad)
                            const y3 = 100 + 45 * Math.sin(endAngleRad)
                            const x4 = 100 + 45 * Math.cos(startAngleRad)
                            const y4 = 100 + 45 * Math.sin(startAngleRad)
                            
                            const pathData = [
                              `M ${x1} ${y1}`,
                              `A 65 65 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                              `L ${x3} ${y3}`,
                              `A 45 45 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                              'Z'
                            ].join(' ')
                            
                            return (
                              <path
                                key={index}
                                d={pathData}
                                fill={item.color}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            )
                          })
                        )}
                        
                        {/* Texto central */}
                        <text x="100" y="95" textAnchor="middle" className="text-xl font-bold fill-gray-900 dark:fill-gray-100">
                          {distribucionProgramas.data?.total_grupos || 0}
                        </text>
                        <text x="100" y="110" textAnchor="middle" className="text-sm fill-gray-600 dark:fill-gray-400">
                          Grupos
                        </text>
                      </svg>
                      )}
                    </div>
                    
                    {/* Leyenda */}
                    <div className="space-y-3">
                      {programData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <Typography variant="body" className="text-gray-700 dark:text-gray-300">
                              {item.name}
                            </Typography>
                          </div>
                          <div className="flex items-center gap-2">
                            <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                              {item.count} grupos
                            </Typography>
                            <Typography variant="caption" className="text-gray-500 dark:text-gray-500">
                              ({item.value}%)
                            </Typography>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Acciones Rápidas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="elevated">
                <CardContent className="p-6">
                  <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-4">
                    Acciones Rápidas
                  </Typography>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { 
                        title: 'Crear Horario', 
                        description: 'Acceder al módulo de programación',
                        icon: Calendar, 
                        route: ROUTES.PROGRAMMING, 
                        color: 'bg-blue-500', 
                        badge: 'Funcional' 
                      },
                      { 
                        title: 'Generar Reporte', 
                        description: 'Acceder al módulo de informes',
                        icon: FileText, 
                        route: ROUTES.INFORMES, 
                        color: 'bg-green-500', 
                        badge: 'Funcional' 
                      },
                      { 
                        title: 'Revisar Alertas', 
                        description: 'Ver notificaciones y alertas pendientes',
                        icon: Bell, 
                        onClick: () => {
                          // Por ahora mostrar alert, luego se puede conectar a un modal de notificaciones
                          alert('Módulo de notificaciones: Aquí se mostrarían las alertas pendientes como:\n\n• Ficha 2798456 sin instructor asignado\n• Ambiente 301 próximo al límite de capacidad\n• 1 clase sin ambiente confirmado')
                        }, 
                        color: 'bg-red-500', 
                        badge: '3 pendientes' 
                      }
                    ].map((action, index) => (
                      <motion.div
                        key={action.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {action.route ? (
                          <Link to={action.route}>
                            <Card 
                              variant="outlined" 
                              className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`p-3 rounded-xl ${action.color} bg-opacity-10 dark:bg-opacity-20`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                  </div>
                                  {action.badge && (
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium
                                      ${action.badge.includes('pendientes') 
                                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                        : action.badge === 'Funcional'
                                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                      }`}>
                                      {action.badge}
                                    </span>
                                  )}
                                </div>
                                
                                <Typography variant="h4" className="text-gray-900 dark:text-gray-100 mb-2">
                                  {action.title}
                                </Typography>
                                
                                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                  {action.description}
                                </Typography>
                                
                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                  <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                                    Clic para acceder →
                                  </Typography>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ) : (
                          <Card 
                            variant="outlined" 
                            className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                            onClick={action.onClick}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className={`p-3 rounded-xl ${action.color} bg-opacity-10 dark:bg-opacity-20`}>
                                  <action.icon className="w-6 h-6 text-white" />
                                </div>
                                {action.badge && (
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium
                                    ${action.badge.includes('pendientes') 
                                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                      : action.badge === 'Funcional'
                                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                    }`}>
                                    {action.badge}
                                  </span>
                                )}
                              </div>
                              
                              <Typography variant="h4" className="text-gray-900 dark:text-gray-100 mb-2">
                                {action.title}
                              </Typography>
                              
                              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                {action.description}
                              </Typography>
                              
                              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                                  Clic para acceder →
                                </Typography>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <Typography variant="h4" className="text-blue-600 dark:text-blue-400">12</Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Acciones hoy</Typography>
                      </div>
                      <div>
                        <Typography variant="h4" className="text-green-600 dark:text-green-400">3</Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Alertas resueltas</Typography>
                      </div>
                      <div>
                        <Typography variant="h4" className="text-orange-600 dark:text-orange-400">8</Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Aulas asignadas</Typography>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Columna Derecha */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* Snapshot del Momento */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                        Snapshot del Momento
                      </Typography>
                      <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-1">
                        Estado actual del sistema
                      </Typography>
                    </div>
                    <div className="text-right">
                      <Typography variant="h4" className="text-blue-600 dark:text-blue-400 font-mono">
                        {formatTime(currentTime)}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                        Tiempo real
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                          <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <Typography variant="h3" className="text-blue-600 dark:text-blue-400">
                            {metrics.data?.ocupacion_general?.aulas_ocupadas || 0}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Aulas ocupadas</Typography>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <Typography variant="h3" className="text-green-600 dark:text-green-400">
                            {metrics.data?.instructores_en_clase?.total || 0}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Instructores activos</Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {(ocupacionCampus.data || []).map((campus) => (
                      <div key={campus.campus} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Typography variant="caption" className="text-gray-700 dark:text-gray-300">
                            {campus.campus}
                          </Typography>
                          <Typography variant="caption" className={
                            campus.porcentaje_ocupacion >= 80 ? 'text-red-600 dark:text-red-400' :
                            campus.porcentaje_ocupacion >= 60 ? 'text-orange-600 dark:text-orange-400' :
                            'text-green-600 dark:text-green-400'
                          }>
                            {campus.porcentaje_ocupacion}%
                          </Typography>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${campus.porcentaje_ocupacion}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-2 rounded-full ${
                              campus.porcentaje_ocupacion >= 80 ? 'bg-red-500' :
                              campus.porcentaje_ocupacion >= 60 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{campus.aulas_ocupadas} ocupadas</span>
                          <span>{campus.total_aulas} total</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Fallback cuando no hay datos de campus */}
                    {(!ocupacionCampus.data || ocupacionCampus.data.length === 0) && (
                      <div className="text-center py-4">
                        <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                          {ocupacionCampus.isLoading ? 'Cargando campus...' : 'No hay datos de campus disponibles'}
                        </Typography>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <Typography variant="body" weight="medium" className="text-gray-900 dark:text-gray-100">
                        Próxima Hora
                      </Typography>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Typography variant="h4" className="text-green-600 dark:text-green-400">
                          +{proximaHora.data?.clases_inician || 0}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Clases inician</Typography>
                      </div>
                      <div className="text-center">
                        <Typography variant="h4" className="text-red-600 dark:text-red-400">
                          -{proximaHora.data?.clases_terminan || 0}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Clases terminan</Typography>
                      </div>
                      <div className="text-center">
                        <Typography variant="h4" className="text-blue-600 dark:text-blue-400">
                          {proximaHora.data?.aulas_se_liberan || 0}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">Aulas se liberan</Typography>
                      </div>
                    </div>
                    
                    {/* Mostrar a qué hora se refiere la información */}
                    {proximaHora.data?.proxima_hora && (
                      <div className="text-center mt-2">
                        <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                          Proyección para las {proximaHora.data.proxima_hora}
                        </Typography>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Timeline de Actividades */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                      Actividad Reciente
                    </Typography>
                    <Button variant="ghost" size="small">
                      Filtrar
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          activity.type === 'conflict' ? 'bg-red-50 dark:bg-red-900/20' :
                          activity.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                          activity.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                          'bg-blue-50 dark:bg-blue-900/20'
                        }`}
                      >
                        <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <activity.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <Typography variant="body" weight="medium" className="text-gray-900 dark:text-gray-100">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                            {activity.time}
                          </Typography>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button variant="ghost" fullWidth className="mt-4">
                    Ver más →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Notificaciones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1"
            >
              <Card variant="outlined" className="border-l-4 border-l-orange-500 h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <Typography variant="h4" className="text-gray-900 dark:text-gray-100">
                      Notificaciones
                    </Typography>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-2">
                        <Bell className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <Typography variant="caption" weight="medium" className="text-yellow-700 dark:text-yellow-300">
                            3 alertas pendientes de revisión
                          </Typography>
                          <Typography variant="caption" className="text-yellow-600 dark:text-yellow-400 block mt-1">
                            Fichas sin instructor y ambientes próximos al límite
                          </Typography>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <Typography variant="caption" weight="medium" className="text-blue-700 dark:text-blue-300">
                            Reporte semanal disponible
                          </Typography>
                          <Typography variant="caption" className="text-blue-600 dark:text-blue-400 block mt-1">
                            Estadísticas de ocupación actualizadas
                          </Typography>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <Typography variant="caption" weight="medium" className="text-green-700 dark:text-green-300">
                            Sistema funcionando correctamente
                          </Typography>
                          <Typography variant="caption" className="text-green-600 dark:text-green-400 block mt-1">
                            Todos los servicios operativos
                          </Typography>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información adicional para rellenar espacio */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <Typography variant="caption" weight="medium" className="text-gray-700 dark:text-gray-300">
                            Resumen del día
                          </Typography>
                          <Typography variant="caption" className="text-gray-600 dark:text-gray-400 block mt-1">
                            12 acciones completadas, 8 aulas asignadas
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="small" className="w-full mt-4 text-sm">
                    Ver todas las notificaciones →
                  </Button>
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

// Custom Dropdown Component (same as used in ProgramForm)
interface CustomDropdownOption {
  value: string
  label: string
}

interface CustomDropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: CustomDropdownOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  className?: string
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled = false,
  error,
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (disabled) return
    setIsOpen(!isOpen)
  }

  const handleOptionSelect = (optionValue: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div ref={selectRef} className="relative">
        {/* Main select button */}
        <div
          onClick={(e) => handleToggle(e)}
          className={cn(
            "w-full min-h-[40px] px-3 py-2 border rounded-lg bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700",
            "text-gray-900 dark:text-gray-100",
            "cursor-pointer transition-colors duration-200",
            "flex items-center justify-between",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <span className="text-sm truncate">{selectedOption.label}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {placeholder}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {selectedOption && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                type="button"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </div>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              {options.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                  No hay opciones disponibles
                </div>
              ) : (
                <div className="py-1">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => handleOptionSelect(option.value, e)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        "focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none",
                        selectedOption?.value === option.value && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      )}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}