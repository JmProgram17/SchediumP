/**
 * Day Configuration Component
 * Manages which days are active for scheduling
 */

import { FC } from 'react'
import { BookOpen, Calendar, Settings } from 'lucide-react'
import { Card, CardContent, Typography, Button } from '@/design-system/components'

export function DayConfiguration() {
  return (
    <Card variant="elevated">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <Typography variant="h2" className="text-gray-900 dark:text-gray-100 mb-2">
            Configuración de Días Lectivos
          </Typography>
          
          <Typography variant="body" className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Activa o desactiva días de la semana para la programación de clases. 
            Define qué días son lectivos en tu institución.
          </Typography>

          <div className="space-y-4">
            <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Calendar className="w-4 h-4" />
              Configurar Días
            </Button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <Settings className="w-4 h-4 inline mr-1" />
              Componente en desarrollo
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DayConfiguration