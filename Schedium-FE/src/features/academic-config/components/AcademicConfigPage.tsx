/**
 * Academic Configuration Page
 * Main page for academic configuration with horizontal tabs like consultations module
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Bell,
  ArrowRightLeft
} from 'lucide-react'
import { Typography, Card, CardContent } from '@/design-system/components'
import { cn } from '@/utils/cn'

// Import section components
import { QuarterManagement } from './QuarterManagement'
import { TimeBlockManagement } from './TimeBlockManagement'
import { NotificationsSettings } from './NotificationsSettings'
import { QuarterTransition } from './QuarterTransition'

// Module definitions
const modules = [
  {
    id: 'quarters',
    title: 'Trimestres',
    icon: Calendar,
    component: QuarterManagement,
    hasOwnCards: true // This module already has its own cards
  },
  {
    id: 'academic-config',
    title: 'Estructura Horaria',
    icon: Clock,
    component: TimeBlockManagement,
    hasOwnCards: false // This module needs card wrapper
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    icon: Bell,
    component: NotificationsSettings,
    hasOwnCards: false
  },
  {
    id: 'quarter-transition',
    title: 'Transición de Trimestre',
    icon: ArrowRightLeft,
    component: QuarterTransition,
    hasOwnCards: false
  }
] as const

type ModuleId = typeof modules[number]['id']

// Tab button component (exact consultation style)
const TabButton = ({ 
  icon: Icon, 
  title, 
  isActive, 
  onClick 
}: { 
  icon: any, 
  title: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-3 whitespace-nowrap",
      isActive
        ? "border-green-500 text-green-600 dark:text-green-400"
        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
    )}
  >
    <Icon className="w-4 h-4 stroke-1" />
    {title}
  </button>
)

// Placeholder component for modules in development - WITH CARD
const PlaceholderModule = ({ title }: { title: string }) => (
  <Card variant="elevated">
    <CardContent className="p-8 text-center">
      <Typography variant="h3" className="text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </Typography>
      <Typography variant="body" className="text-gray-400 dark:text-gray-500">
        Este módulo estará disponible próximamente
      </Typography>
    </CardContent>
  </Card>
)

export function AcademicConfigPage() {
  const [activeModule, setActiveModule] = useState<ModuleId>('quarters')
  
  const currentModule = modules.find(module => module.id === activeModule)
  const ActiveComponent = currentModule?.component

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Header - Directly on background */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Typography variant="h1" className="text-gray-900 dark:text-gray-100 mb-2">
            ⚙️ Configuración Académica
          </Typography>
          <Typography variant="body" className="text-gray-600 dark:text-gray-400">
            Gestiona los parámetros académicos del sistema
          </Typography>
        </motion.div>

        {/* Module Navigation Tabs - Directly on background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 space-x-8">
            {modules.map((module) => {
              const isActive = activeModule === module.id
              
              return (
                <TabButton
                  key={module.id}
                  icon={module.icon}
                  title={module.title}
                  isActive={isActive}
                  onClick={() => setActiveModule(module.id)}
                />
              )
            })}
          </div>
        </motion.div>

        {/* Active Module Content - Conditional card wrapper */}
        <motion.div
          key={activeModule}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {ActiveComponent ? (
            currentModule?.hasOwnCards ? (
              <ActiveComponent />
            ) : (
              <Card variant="elevated">
                <CardContent className="p-6">
                  <ActiveComponent />
                </CardContent>
              </Card>
            )
          ) : (
            <PlaceholderModule title={currentModule?.title || ''} />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AcademicConfigPage