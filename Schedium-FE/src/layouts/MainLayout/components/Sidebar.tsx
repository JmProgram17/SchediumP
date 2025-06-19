import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants'
import { Icon } from '@/design-system/components'
import { useAuthStore } from '@/stores/auth.store'

interface SidebarProps {
  open: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  label: string
  path: string
  icon: string
  children?: NavItem[]
  roles?: string[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'Dashboard',
  },
  {
    label: 'Académico',
    path: ROUTES.ACADEMIC.BASE,
    icon: 'School',
    children: [
      { label: 'Estudiantes', path: ROUTES.ACADEMIC.STUDENTS, icon: 'Person' },
      { label: 'Programas', path: ROUTES.ACADEMIC.PROGRAMS, icon: 'Category' },
      { label: 'Niveles', path: ROUTES.ACADEMIC.LEVELS, icon: 'Layers' },
      { label: 'Grupos', path: ROUTES.ACADEMIC.GROUPS, icon: 'Group' },
      { label: 'Cursos', path: ROUTES.ACADEMIC.COURSES, icon: 'MenuBook' },
      { label: 'Matrículas', path: ROUTES.ACADEMIC.ENROLLMENTS, icon: 'AssignmentInd' },
    ],
  },
  {
    label: 'Recursos Humanos',
    path: ROUTES.HR.BASE,
    icon: 'Groups',
    children: [
      { label: 'Instructores', path: ROUTES.HR.INSTRUCTORS, icon: 'Person' },
      { label: 'Departamentos', path: ROUTES.HR.DEPARTMENTS, icon: 'Business' },
      { label: 'Cargos', path: ROUTES.HR.POSITIONS, icon: 'Badge' },
    ],
  },
  {
    label: 'Infraestructura',
    path: ROUTES.INFRASTRUCTURE.BASE,
    icon: 'Domain',
    children: [
      { label: 'Sedes', path: ROUTES.INFRASTRUCTURE.CAMPUS, icon: 'LocationCity' },
      { label: 'Edificios', path: ROUTES.INFRASTRUCTURE.BUILDINGS, icon: 'Apartment' },
      { label: 'Aulas', path: ROUTES.INFRASTRUCTURE.CLASSROOMS, icon: 'MeetingRoom' },
    ],
  },
  {
    label: 'Programación',
    path: ROUTES.SCHEDULING.BASE,
    icon: 'CalendarMonth',
    children: [
      { label: 'Horarios', path: ROUTES.SCHEDULING.SCHEDULES, icon: 'Schedule' },
      { label: 'Conflictos', path: ROUTES.SCHEDULING.CONFLICTS, icon: 'Warning' },
      { label: 'Calendario', path: ROUTES.SCHEDULING.CALENDAR, icon: 'Event' },
    ],
  },
  {
    label: 'Administración',
    path: ROUTES.ADMIN.BASE,
    icon: 'Settings',
    roles: ['admin'],
    children: [
      { label: 'Usuarios', path: ROUTES.ADMIN.USERS, icon: 'ManageAccounts' },
      { label: 'Roles', path: ROUTES.ADMIN.ROLES, icon: 'Security' },
      { label: 'Configuración', path: ROUTES.ADMIN.SETTINGS, icon: 'Tune' },
    ],
  },
]

export function Sidebar({ open, mobileOpen, onMobileClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user)

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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-full bg-card transition-all duration-300 lg:block',
          open ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center border-b px-4">
          {open ? (
            <h1 className="text-xl font-bold text-primary">Schedium</h1>
          ) : (
            <Icon name="School" size="lg" className="mx-auto text-primary" />
          )}
        </div>

        <nav className="h-[calc(100%-64px)] overflow-y-auto p-2">
          {filteredNavItems.map((item) => (
            <NavItem key={item.path} item={item} open={open} level={0} />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-card transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h1 className="text-xl font-bold text-primary">Schedium</h1>
          <button
            onClick={onMobileClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <Icon name="Close" size="sm" />
          </button>
        </div>

        <nav className="h-[calc(100%-64px)] overflow-y-auto p-2">
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              open={true}
              level={0}
              onNavigate={onMobileClose}
            />
          ))}
        </nav>
      </aside>
    </>
  )
}

interface NavItemProps {
  item: NavItem
  open: boolean
  level: number
  onNavigate?: () => void
}

function NavItem({ item, open, level, onNavigate }: NavItemProps) {
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div className={cn('mb-1', level > 0 && 'ml-4')}>
        {open && (
          <div className="mb-1 px-3 py-1">
            <span className="text-xs font-medium text-muted-foreground">
              {item.label}
            </span>
          </div>
        )}
        {item.children?.map((child) => (
          <NavItem
            key={child.path}
            item={child}
            open={open}
            level={level + 1}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'mb-1 flex items-center rounded-lg px-3 py-2 transition-colors',
          'hover:bg-muted',
          isActive && 'bg-primary/10 text-primary',
          level > 0 && open && 'ml-4'
        )
      }
    >
      <Icon name={item.icon} size="sm" />
      {open && <span className="ml-3">{item.label}</span>}
    </NavLink>
  )
}