/**
 * CurrentSnapshot Component - Real-time "snapshot of the moment" widget
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, Typography } from '@/design-system/components'
import { motion } from 'framer-motion'

interface SnapshotData {
  currentTime: Date
  activeClasses: number
  occupiedRooms: number
  totalRooms: number
  activeInstructors: number
  totalInstructors: number
  campusOccupancy: {
    name: string
    occupancy: number
    status: 'low' | 'medium' | 'high' | 'full'
  }[]
  alerts: number
  nextHourPrediction: {
    classesStarting: number
    classesEnding: number
    roomsFreeing: number
  }
}

interface CurrentSnapshotProps {
  className?: string
}

export const CurrentSnapshot: React.FC<CurrentSnapshotProps> = ({ className = '' }) => {
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data generator - esto se reemplazará con datos reales de la API
  const generateSnapshotData = (): SnapshotData => {
    const now = new Date()
    return {
      currentTime: now,
      activeClasses: Math.floor(Math.random() * 30) + 15,
      occupiedRooms: Math.floor(Math.random() * 40) + 25,
      totalRooms: 47,
      activeInstructors: Math.floor(Math.random() * 20) + 15,
      totalInstructors: 89,
      campusOccupancy: [
        {
          name: 'Campus Norte',
          occupancy: Math.floor(Math.random() * 30) + 70,
          status: 'high' as const
        },
        {
          name: 'Campus Sur',
          occupancy: Math.floor(Math.random() * 40) + 40,
          status: 'medium' as const
        },
        {
          name: 'Campus Centro',
          occupancy: Math.floor(Math.random() * 50) + 30,
          status: 'medium' as const
        }
      ],
      alerts: Math.floor(Math.random() * 5),
      nextHourPrediction: {
        classesStarting: Math.floor(Math.random() * 8) + 3,
        classesEnding: Math.floor(Math.random() * 10) + 5,
        roomsFreeing: Math.floor(Math.random() * 12) + 6
      }
    }
  }

  // Actualizar datos cada 30 segundos
  useEffect(() => {
    const fetchData = () => {
      setSnapshot(generateSnapshotData())
      setIsLoading(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getOccupancyColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'text-green-600 dark:text-green-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'high':
        return 'text-orange-600 dark:text-orange-400'
      case 'full':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getOccupancyBar = (occupancy: number) => {
    const percentage = Math.min(occupancy, 100)
    let colorClass = 'bg-green-500'
    
    if (percentage >= 90) colorClass = 'bg-red-500'
    else if (percentage >= 75) colorClass = 'bg-orange-500'
    else if (percentage >= 50) colorClass = 'bg-yellow-500'

    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-2 rounded-full ${colorClass}`}
        />
      </div>
    )
  }

  if (isLoading || !snapshot) {
    return (
      <Card variant="elevated" className={`${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className={`${className}`}>
      <CardContent className="p-6">
        {/* Header con tiempo actual */}
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
              {formatTime(snapshot.currentTime)}
            </Typography>
            <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
              Tiempo real
            </Typography>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <Typography variant="h3" className="text-blue-600 dark:text-blue-400">
                  {snapshot.activeClasses}
                </Typography>
                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                  Clases en curso
                </Typography>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👨‍🏫</span>
              <div>
                <Typography variant="h3" className="text-green-600 dark:text-green-400">
                  {snapshot.activeInstructors}
                </Typography>
                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                  Instructores activos
                </Typography>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ocupación de aulas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Typography variant="body" weight="medium" className="text-gray-900 dark:text-gray-100">
              Ocupación de Aulas
            </Typography>
            <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
              {snapshot.occupiedRooms} de {snapshot.totalRooms}
            </Typography>
          </div>
          
          <div className="space-y-3">
            {snapshot.campusOccupancy.map((campus, index) => (
              <motion.div
                key={campus.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Typography variant="caption" className="text-gray-700 dark:text-gray-300">
                    {campus.name}
                  </Typography>
                  <Typography variant="caption" className={getOccupancyColor(campus.status)}>
                    {campus.occupancy}%
                  </Typography>
                </div>
                {getOccupancyBar(campus.occupancy)}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        {snapshot.alerts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <Typography variant="body" weight="medium" className="text-red-700 dark:text-red-300">
                  {snapshot.alerts} Conflicto{snapshot.alerts > 1 ? 's' : ''} Detectado{snapshot.alerts > 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" className="text-red-600 dark:text-red-400">
                  Requiere atención inmediata
                </Typography>
              </div>
            </div>
          </motion.div>
        )}

        {/* Predicción próxima hora */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Typography variant="body" weight="medium" className="text-gray-900 dark:text-gray-100 mb-3">
            🔮 Próxima Hora
          </Typography>
          
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Typography variant="h4" className="text-green-600 dark:text-green-400">
                +{snapshot.nextHourPrediction.classesStarting}
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Clases inician
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <Typography variant="h4" className="text-red-600 dark:text-red-400">
                -{snapshot.nextHourPrediction.classesEnding}
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Clases terminan
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <Typography variant="h4" className="text-blue-600 dark:text-blue-400">
                {snapshot.nextHourPrediction.roomsFreeing}
              </Typography>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Aulas libres
              </Typography>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CurrentSnapshot