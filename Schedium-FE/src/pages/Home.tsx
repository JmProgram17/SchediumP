/**
 * Home Page - Landing page for Schedium
 * Redesigned with two-column layout
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/design-system/themes/ThemeToggle'
import { useIsDark, useThemeSync } from '@/design-system/themes/ThemeProvider'

interface NavigationCard {
  id: string
  icon: string
  title: string
  description: string
  route: string
}

const navigationCards: NavigationCard[] = [
  {
    id: 'reports',
    icon: '📊',
    title: 'Reportes y Analytics',
    description: 'Análisis detallado y reportes personalizables del sistema académico',
    route: '/informes'
  },
  {
    id: 'schedules',
    icon: '🕒',
    title: 'Gestión de Horarios',
    description: 'Crea, edita y optimiza horarios académicos con tecnología drag & drop',
    route: '/scheduling/schedules'
  },
  {
    id: 'instructors',
    icon: '👨‍🏫',
    title: 'Gestión de Instructores',
    description: 'Control completo de carga académica y especialidades docentes',
    route: '/hr/instructors'
  },
  {
    id: 'classrooms',
    icon: '🏫',
    title: 'Gestión de Ambientes',
    description: 'Optimización inteligente de espacios y recursos físicos disponibles',
    route: '/infrastructure/classrooms'
  }
]

export const Home: React.FC = () => {
  const navigate = useNavigate()
  const isDark = useIsDark()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  // Force theme synchronization
  useThemeSync()

  const handleAccessSystem = () => {
    navigate('/login')
  }

  const handleCardClick = (route: string) => {
    navigate(route)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} transition-colors duration-300`}>
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      <div className="container mx-auto px-4 min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-8 lg:py-0">
          
          {/* Left Column - Brand Identity */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center items-center text-center px-4 lg:px-8"
          >
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <img 
                src={isDark ? '/images/Schedium-Blanco.svg' : '/images/Schedium-Negro.svg'}
                alt="Schedium Logo"
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-5xl md:text-6xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}
            >
              Schedium
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-xl md:text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}
            >
              Sistema de Gestión de Horarios Académicos SENA
            </motion.p>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-md mb-8`}
            >
              Plataforma completa para la gestión, optimización y visualización 
              de horarios académicos con tecnología de vanguardia.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAccessSystem}
              className={`px-8 py-4 text-lg font-semibold rounded-xl ${
                isDark 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-xl transition-all duration-300 transform hover:shadow-2xl`}
            >
              Acceder al Sistema
            </motion.button>
          </motion.div>

          {/* Right Column - Navigation Cards */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-4 px-4 lg:px-8"
          >
            {navigationCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleCardClick(card.route)}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-white hover:bg-gray-50 text-gray-900'
                  } shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <span className="text-3xl">{card.icon}</span>
                  <span className="text-lg font-semibold">{card.title}</span>
                </motion.button>

                {/* Tooltip/Description on Hover */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ 
                    opacity: hoveredCard === card.id ? 1 : 0,
                    scale: hoveredCard === card.id ? 1 : 0.95,
                    y: hoveredCard === card.id ? 0 : -10
                  }}
                  transition={{ duration: 0.2 }}
                  className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 text-gray-600'
                  } shadow-xl z-10 pointer-events-none`}
                  style={{ 
                    visibility: hoveredCard === card.id ? 'visible' : 'hidden' 
                  }}
                >
                  <p className="text-sm">{card.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Home