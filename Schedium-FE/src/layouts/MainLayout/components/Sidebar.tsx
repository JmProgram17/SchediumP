import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Calendar, 
  Search, 
  BarChart3, 
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  Building2,
  Users2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'
import { useIsDark } from '@/design-system/themes/ThemeProvider'

interface SidebarProps {
  open: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  label: string
  path: string
  icon: any
  children?: NavItem[]
  roles?: string[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: Home,
  },
  {
    label: 'Programación',
    path: ROUTES.PROGRAMMING,
    icon: Calendar,
  },
  {
    label: 'Consultas',
    path: '/consultas',
    icon: Search,
  },
  {
    label: 'Informes',
    path: '/informes',
    icon: BarChart3,
  },
  {
    label: 'Formación',
    path: '/formacion',
    icon: GraduationCap,
    children: [
      { label: 'Programas', path: ROUTES.ACADEMIC.PROGRAMS, icon: BookOpen },
      { label: 'Fichas', path: ROUTES.ACADEMIC.GROUPS, icon: Users },
    ],
  },
  {
    label: 'Recursos Humanos',
    path: ROUTES.HR.BASE,
    icon: UserCheck,
    children: [
      { label: 'Instructores', path: ROUTES.HR.INSTRUCTORS, icon: Users },
      { label: 'Coordinaciones', path: ROUTES.HR.COORDINATIONS, icon: Users2 },
    ],
  },
  {
    label: 'Sedes',
    path: ROUTES.INFRASTRUCTURE.CAMPUS,
    icon: Building2,
  },
  {
    label: 'Usuarios',
    path: ROUTES.ADMIN.USERS,
    icon: Users2,
    roles: ['admin'],
  },
]

export function Sidebar({ open, mobileOpen, onMobileClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user)
  const isDark = useIsDark()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      if (item.roles && user && user.roles && !item.roles.some(role => user.roles?.some(userRole => userRole.name === role))) {
        return false
      }
      if (item.children) {
        item.children = filterNavItems(item.children)
      }
      return true
    })
  }

  const filteredNavItems = filterNavItems(navigationItems)

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    )
  }

  const shouldShowText = open || isHovered

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: shouldShowText ? 'auto' : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed left-0 top-16 z-20 hidden h-[calc(100vh-64px)] transition-all duration-300 lg:block',
          shouldShowText ? 'min-w-[256px] shadow-xl' : '',
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
      >
        <nav className="h-full overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <NavItem 
                key={item.path} 
                item={item} 
                open={shouldShowText}
                expanded={expandedItems.includes(item.path) || hoveredItem === item.path}
                onToggleExpanded={() => toggleExpanded(item.path)}
                onHover={(path: string | null) => setHoveredItem(path)}
                isDark={isDark}
              />
            ))}
          </div>
        </nav>
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : -256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-64px)] w-64 lg:hidden',
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
      >
        <nav className="h-full overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                open={true}
                expanded={expandedItems.includes(item.path)}
                onToggleExpanded={() => toggleExpanded(item.path)}
                onHover={() => {}}
                onNavigate={onMobileClose}
                isDark={isDark}
              />
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  )
}

interface NavItemProps {
  item: NavItem
  open: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onHover: (path: string | null) => void
  onNavigate?: () => void
  isDark: boolean
}

function NavItem({ item, open, expanded, onToggleExpanded, onHover, onNavigate, isDark }: NavItemProps) {
  const hasChildren = item.children && item.children.length > 0
  const IconComponent = item.icon

  if (hasChildren) {
    return (
      <div 
        className="space-y-1"
        onMouseEnter={() => onHover(item.path)}
        onMouseLeave={() => onHover(null)}
      >
        <motion.button
          onClick={onToggleExpanded}
          className={cn(
            'w-full flex items-center rounded-lg p-2 transition-all duration-200 whitespace-nowrap',
            open ? '' : 'justify-center',
            isDark 
              ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          )}
        >
          <IconComponent size={20} strokeWidth={1.5} />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-sm font-medium"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {open && (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </motion.div>
          )}
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pl-6">
                {item.children?.map((child) => (
                  <NavItem
                    key={child.path}
                    item={child}
                    open={open}
                    expanded={false}
                    onToggleExpanded={() => {}}
                    onHover={() => {}}
                    onNavigate={onNavigate}
                    isDark={isDark}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-lg p-2 transition-all duration-200 whitespace-nowrap',
          open ? '' : 'justify-center',
          isActive
            ? isDark
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-600'
            : isDark
              ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        )
      }
    >
      <IconComponent size={20} strokeWidth={1.5} />
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="ml-3 text-sm font-medium"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  )
}