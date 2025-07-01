/**
 * ProgramDistribution Component - Donut chart showing program distribution
 */

import React, { useState } from 'react'
import { Card, CardContent, Typography } from '@/design-system/components'
import { motion } from 'framer-motion'

interface ProgramData {
  id: string
  name: string
  count: number
  percentage: number
  color: string
  level?: string
}

interface ProgramDistributionProps {
  className?: string
}

export const ProgramDistribution: React.FC<ProgramDistributionProps> = ({ className = '' }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'chain' | 'level'>('chain')

  // Mock data - esto se reemplazará con datos reales
  const chainData: ProgramData[] = [
    {
      id: 'abierta',
      name: 'Cadena Abierta',
      count: 15,
      percentage: 62.5,
      color: '#3B82F6'
    },
    {
      id: 'formacion',
      name: 'Cadena de Formación',
      count: 9,
      percentage: 37.5,
      color: '#10B981'
    }
  ]

  const levelData: ProgramData[] = [
    {
      id: 'tecnologo',
      name: 'Tecnólogo',
      count: 12,
      percentage: 50,
      color: '#3B82F6',
      level: '30 meses'
    },
    {
      id: 'tecnico',
      name: 'Técnico',
      count: 8,
      percentage: 33.3,
      color: '#10B981',
      level: '18 meses'
    },
    {
      id: 'especializacion',
      name: 'Especialización',
      count: 4,
      percentage: 16.7,
      color: '#F59E0B',
      level: '6 meses'
    }
  ]

  const currentData = viewMode === 'chain' ? chainData : levelData

  // Crear path del donut chart
  const createDonutPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)
    
    const x1 = 120 + outerRadius * Math.cos(startAngleRad)
    const y1 = 120 + outerRadius * Math.sin(startAngleRad)
    const x2 = 120 + outerRadius * Math.cos(endAngleRad)
    const y2 = 120 + outerRadius * Math.sin(endAngleRad)
    
    const x3 = 120 + innerRadius * Math.cos(endAngleRad)
    const y3 = 120 + innerRadius * Math.sin(endAngleRad)
    const x4 = 120 + innerRadius * Math.cos(startAngleRad)
    const y4 = 120 + innerRadius * Math.sin(startAngleRad)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
  }

  let cumulativeAngle = 0

  return (
    <Card variant="elevated" className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
              Distribución de Programas
            </Typography>
            <Typography variant="body" className="text-gray-600 dark:text-gray-400 mt-1">
              {viewMode === 'chain' ? 'Por cadena de formación' : 'Por nivel académico'}
            </Typography>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chain')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'chain'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Cadenas
            </button>
            <button
              onClick={() => setViewMode('level')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'level'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Niveles
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative">
            {/* SVG Donut Chart */}
            <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
              {currentData.map((item, index) => {
                const startAngle = cumulativeAngle
                const endAngle = cumulativeAngle + (item.percentage / 100) * 360
                cumulativeAngle = endAngle

                const path = createDonutPath(startAngle, endAngle, 60, 100)
                const isSelected = selectedSegment === item.id

                return (
                  <motion.path
                    key={item.id}
                    d={path}
                    fill={item.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? 'drop-shadow-lg' : 'hover:brightness-110'
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: isSelected ? 1.05 : 1,
                      filter: isSelected ? 'brightness(1.1)' : 'brightness(1)'
                    }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    onMouseEnter={() => setSelectedSegment(item.id)}
                    onMouseLeave={() => setSelectedSegment(null)}
                  />
                )
              })}
            </svg>

            {/* Centro del donut con información */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Typography variant="h2" className="text-gray-900 dark:text-gray-100 text-2xl font-bold">
                  {currentData.reduce((sum, item) => sum + item.count, 0)}
                </Typography>
                <Typography variant="body" className="text-gray-600 dark:text-gray-400 text-sm">
                  Programas Activos
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-6 space-y-3">
          {currentData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                selectedSegment === item.id
                  ? 'bg-gray-50 dark:bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onMouseEnter={() => setSelectedSegment(item.id)}
              onMouseLeave={() => setSelectedSegment(null)}
            >
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div>
                  <Typography variant="body" className="text-gray-900 dark:text-gray-100 font-medium">
                    {item.name}
                  </Typography>
                  {item.level && (
                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                      Duración: {item.level}
                    </Typography>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Typography variant="body" className="text-gray-900 dark:text-gray-100 font-semibold">
                  {item.count}
                </Typography>
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                  {item.percentage.toFixed(1)}%
                </Typography>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Estadísticas adicionales */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Typography variant="h4" className="text-blue-600 dark:text-blue-400">
                2,450
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Total Aprendices
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h4" className="text-green-600 dark:text-green-400">
                89
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Instructores Asignados
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgramDistribution