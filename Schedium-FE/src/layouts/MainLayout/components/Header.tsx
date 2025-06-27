import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useIsDark, useTheme } from '@/design-system/themes/ThemeProvider'
import { UserDropdown } from './UserDropdown'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onToggleMobileSidebar: () => void
}

export function Header({ onToggleMobileSidebar }: HeaderProps) {
  const { toggleTheme } = useTheme()
  const isDark = useIsDark()

  return (
    <header className={cn(
      'sticky top-0 z-40 h-16 border-b transition-colors',
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    )}>
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleMobileSidebar}
            className={cn(
              'rounded-lg p-2 transition-colors lg:hidden',
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            )}
            aria-label="Open mobile menu"
          >
            <Menu size={20} />
          </button>

          {/* Schedium Logo */}
          <div className="flex items-center">
            <img 
              src={isDark ? '/images/Schedium-Blanco.svg' : '/images/Schedium-Negro.svg'}
              alt="Schedium Logo"
              className="h-8 object-contain"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isDark 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            )}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <button
            className={cn(
              'rounded-lg p-2 transition-colors relative',
              isDark 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            )}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}