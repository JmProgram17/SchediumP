import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import { useIsDark } from '@/design-system/themes/ThemeProvider'

export function UserDropdown() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isDark = useIsDark()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  // Get user role display name
  const userRole = user?.roles?.[0]?.name || 'Usuario'
  const roleDisplayNames: Record<string, string> = {
    'admin': 'Administrador',
    'instructor': 'Instructor',
    'coordinator': 'Coordinador',
    'student': 'Estudiante'
  }
  const displayRole = roleDisplayNames[userRole] || userRole

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User size={20} />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute right-0 top-full mt-2 w-64 rounded-lg border shadow-xl z-50',
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info Header */}
            <div className={cn(
              'border-b px-4 py-3',
              isDark ? 'border-gray-700' : 'border-gray-200'
            )}>
              <p className={cn(
                'text-sm font-semibold',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className={cn(
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}>
                {displayRole}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleNavigation('/profile')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                )}
                role="menuitem"
              >
                <Settings size={16} />
                <span>Ajustes</span>
              </button>
            </div>

            {/* Separator */}
            <div className={cn(
              'border-t',
              isDark ? 'border-gray-700' : 'border-gray-200'
            )} />

            {/* Logout */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  isDark 
                    ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300' 
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                )}
                role="menuitem"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}