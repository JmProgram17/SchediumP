/**
 * OccupancyHeatmap Component - Visual heatmap showing classroom occupancy
 */

import React, { useState } from 'react'
import { Card, CardContent, Typography } from '@/design-system/components'
import { motion } from 'framer-motion'

interface HeatmapCell {
  day: string
  timeSlot: string
  occupancy: number // 0-100
  details?: {
    classroom: string
    program: string
    instructor: string
  }
}

interface OccupancyHeatmapProps {
  className?: string
}

export const OccupancyHeatmap: React.FC<OccupancyHeatmapProps> = ({ className = '' }) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null)
  const [selectedCampus, setSelectedCampus] = useState('all')

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const timeSlots = [
    '06:00-08:00',
    '08:00-10:00', 
    '10:00-12:00',
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00',
    '18:00-20:00',
    '20:00-22:00'
  ]

  // Mock data - esto se reemplazará con datos reales
  const generateMockData = (): HeatmapCell[][] => {
    return days.map(day =>
      timeSlots.map(timeSlot => ({
        day,
        timeSlot,
        occupancy: Math.floor(Math.random() * 100),
        details: {
          classroom: `Aula ${Math.floor(Math.random() * 20) + 1}`,
          program: 'Análisis y Desarrollo de Software',
          instructor: 'Dr. García'
        }
      }))
    )
  }

  const heatmapData = generateMockData()

  const getOccupancyColor = (occupancy: number): string => {
    if (occupancy === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (occupancy <= 25) return 'bg-green-200 dark:bg-green-900'
    if (occupancy <= 50) return 'bg-yellow-200 dark:bg-yellow-900'
    if (occupancy <= 75) return 'bg-orange-200 dark:bg-orange-900'
    return 'bg-red-200 dark:bg-red-900'
  }

  const getOccupancyIntensity = (occupancy: number): string => {
    const intensity = Math.floor(occupancy / 20)
    const opacities = ['opacity-20', 'opacity-40', 'opacity-60', 'opacity-80', 'opacity-100']
    return opacities[Math.min(intensity, 4)]
  }

  return (
    <Card variant="elevated" className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
              Mapa de Ocupación Semanal
            </Typography>
            <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-1">
              Intensidad de uso por día y horario
            </Typography>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Campus</option>
              <option value="norte">Campus Norte</option>
              <option value="sur">Campus Sur</option>
            </select>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Ocupación:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <span className="text-xs text-gray-500">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded"></div>
              <span className="text-xs text-gray-500">25%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded"></div>
              <span className="text-xs text-gray-500">50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-200 dark:bg-orange-900 rounded"></div>
              <span className="text-xs text-gray-500">75%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded"></div>
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="relative overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header con días */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium"></div>
              {days.map(day => (
                <div key={day} className="text-xs text-gray-700 dark:text-gray-300 font-medium text-center py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de ocupación */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeSlot} className="grid grid-cols-7 gap-1 mb-1">
                {/* Etiqueta de hora */}
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium py-2 pr-2 text-right">
                  {timeSlot}
                </div>
                
                {/* Celdas de ocupación */}
                {heatmapData.map((dayData, dayIndex) => {
                  const cell = dayData[timeIndex]
                  return (
                    <motion.div
                      key={`${dayIndex}-${timeIndex}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (dayIndex + timeIndex) * 0.01 }}
                      className={`
                        relative h-8 rounded cursor-pointer transition-all duration-200
                        ${getOccupancyColor(cell.occupancy)}
                        ${getOccupancyIntensity(cell.occupancy)}
                        hover:scale-110 hover:z-10 hover:shadow-md
                      `}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Tooltip */}
                      {hoveredCell === cell && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50
                                   bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 
                                   px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap"
                        >
                          <div className="font-medium">{cell.day} - {cell.timeSlot}</div>
                          <div>Ocupación: {cell.occupancy}%</div>
                          {cell.details && (
                            <>
                              <div>{cell.details.classroom}</div>
                              <div>{cell.details.program}</div>
                              <div>{cell.details.instructor}</div>
                            </>
                          )}
                          {/* Flecha del tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 
                                        border-4 border-transparent border-b-gray-900 dark:border-b-gray-100">
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas del mapa */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Typography variant="h4" className="text-blue-600 dark:text-blue-400">
                78%
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Ocupación Promedio
              </Typography>
            </div>
            <div>
              <Typography variant="h4" className="text-green-600 dark:text-green-400">
                14:00-16:00
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Hora Pico
              </Typography>
            </div>
            <div>
              <Typography variant="h4" className="text-orange-600 dark:text-orange-400">
                Miércoles
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Día Más Ocupado
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OccupancyHeatmap