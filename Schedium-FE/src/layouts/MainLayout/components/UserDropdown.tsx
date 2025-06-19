import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Button } from '@/design-system/components'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'

export function UserDropdown() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Icon name="Person" size="sm" className="text-primary" />
        </div>
        <span className="hidden md:block">{user?.first_name || 'Usuario'}</span>
        <Icon name={isOpen ? 'ArrowDropUp' : 'ArrowDropDown'} size="sm" />
      </Button>

      {/* Dropdown menu */}
      <div
        className={cn(
          'absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card p-1 shadow-lg transition-all',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="mb-2 border-b px-3 py-2">
          <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleNavigation(ROUTES.PROFILE)}
        >
          <Icon name="Person" size="sm" />
          <span>Mi Perfil</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleNavigation(ROUTES.SETTINGS)}
        >
          <Icon name="Settings" size="sm" />
          <span>Configuración</span>
        </Button>
        
        <div className="my-1 border-t" />
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <Icon name="Logout" size="sm" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  )
}