/**
 * Mobile Layout Component - Optimized layout for mobile devices
 * Provides mobile-first navigation, touch-friendly interface, and responsive behavior
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Calendar,
  Users,
  MapPin,
  BarChart3,
  Settings,
  Menu,
  Bell,
  Search,
  X,
  ChevronLeft
} from 'lucide-react'

import { useMobileOptimization } from '@/hooks/useMobileOptimization'
import { useAuthStore } from '@/stores/auth.store'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'

interface MobileLayoutProps {
  children?: React.ReactNode
}

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
  disabled?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: Home,
    path: '/dashboard'
  },
  {
    id: 'schedule',
    label: 'Horarios',
    icon: Calendar,
    path: '/schedule'
  },
  {
    id: 'courses',
    label: 'Cursos',
    icon: Users,
    path: '/courses'
  },
  {
    id: 'rooms',
    label: 'Aulas',
    icon: MapPin,
    path: '/rooms'
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    path: '/reports'
  }
]

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotifications()
  
  const {
    isMobile,
    viewportInfo,
    mobileClasses,
    onGesture,
    triggerHapticFeedback,
    hideAddressBar
  } = useMobileOptimization({
    enableTouchGestures: true,
    enableVirtualKeyboardHandling: true,
    enableOrientationHandling: true
  })

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get current page info
  const getCurrentPage = useCallback(() => {
    const currentPath = location.pathname
    const currentItem = navigationItems.find(item => 
      currentPath.startsWith(item.path)
    )
    return currentItem || { label: 'Schedium', path: currentPath }
  }, [location.pathname])

  const currentPage = getCurrentPage()

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard')
    }
    triggerHapticFeedback('light')
  }, [navigate, triggerHapticFeedback])

  // Handle navigation
  const handleNavigation = useCallback((path: string) => {
    if (location.pathname === path) return
    
    setIsLoading(true)
    triggerHapticFeedback('light')
    
    setTimeout(() => {
      navigate(path)
      setIsLoading(false)
    }, 150)
  }, [location.pathname, navigate, triggerHapticFeedback])

  // Handle menu toggle
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
    triggerHapticFeedback('medium')
  }, [triggerHapticFeedback])

  // Handle search
  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
    triggerHapticFeedback('light')
  }, [triggerHapticFeedback])

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }, [navigate])

  // Gesture handling
  useEffect(() => {
    const unsubscribe = onGesture('mobile-layout', (gesture) => {
      if (gesture.type === 'swipe') {
        switch (gesture.direction) {
          case 'right':
            if (!isMenuOpen && !isSearchOpen) {
              setIsMenuOpen(true)
            }
            break
          case 'left':
            if (isMenuOpen) {
              setIsMenuOpen(false)
            } else if (isSearchOpen) {
              setIsSearchOpen(false)
            }
            break
          case 'down':
            hideAddressBar()
            break
        }
      }
    })

    return unsubscribe
  }, [onGesture, isMenuOpen, isSearchOpen, hideAddressBar])

  // Close modals on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  // Update CSS custom properties for viewport height
  useEffect(() => {
    document.documentElement.style.setProperty('--vh', `${viewportInfo.height * 0.01}px`)
  }, [viewportInfo.height])

  if (!isMobile) {
    return <Outlet />
  }

  return (
    <div className={`mobile-layout ${mobileClasses.container} ${mobileClasses.touchOptimized} ${mobileClasses.safeArea}`}>
      {/* Mobile Header */}
      <header className={`mobile-header ${mobileClasses.keyboardOpen}`}>
        <div className="mobile-header-content">
          <div className="flex items-center gap-3">
            {location.pathname !== '/dashboard' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mobile-menu-button"
                aria-label="Volver"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="mobile-menu-button"
              aria-label="Menú"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {currentPage.label}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="mobile-menu-button"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notifications')}
              className="mobile-menu-button relative"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="error" 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
            style={{ paddingTop: `calc(${viewportInfo.safeArea.top}px + 1rem)` }}
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar cursos, instructores, aulas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery)
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                className="mobile-menu-button"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={toggleMenu}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div 
                  className="p-6 border-b border-gray-200"
                  style={{ paddingTop: `calc(${viewportInfo.safeArea.top}px + 1.5rem)` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">Schedium</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMenu}
                      className="mobile-menu-button"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname.startsWith(item.path)
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleNavigation(item.path)
                            setIsMenuOpen(false)
                          }}
                          disabled={item.disabled}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                            ${isActive 
                              ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                              : 'text-gray-700 hover:bg-gray-50'
                            }
                            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </nav>

                {/* Menu Footer */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleNavigation('/settings')
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Configuración</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
                  >
                    <X className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`mobile-content ${mobileClasses.keyboardOpen}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          children || <Outlet />
        )}
      </main>

      {/* Bottom Navigation */}
      {!viewportInfo.isKeyboardOpen && (
        <nav className="mobile-nav">
          <div className="mobile-nav-items">
            {navigationItems.slice(0, 5).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  disabled={item.disabled}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant="error" 
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-30"
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileLayout