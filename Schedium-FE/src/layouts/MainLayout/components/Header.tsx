import { Icon, Button } from '@/design-system/components'
import { useTheme } from '@/design-system/components'
import { UserDropdown } from './UserDropdown'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onToggleMobileSidebar: () => void
}

export function Header({ sidebarOpen, onToggleSidebar, onToggleMobileSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-20 h-16 border-b bg-card px-4 md:px-6">
      <div className="flex h-full items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMobileSidebar}
            className="lg:hidden"
          >
            <Icon name="Menu" size="sm" />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="hidden lg:flex"
          >
            <Icon name={sidebarOpen ? 'MenuOpen' : 'Menu'} size="sm" />
          </Button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'light' ? 'DarkMode' : 'LightMode'} size="sm" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Icon name="Notifications" size="sm" />
          </Button>

          {/* User menu */}
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}