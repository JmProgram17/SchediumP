import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import * as icons from './icons'

const iconVariants = cva(
  'inline-block shrink-0',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
        '2xl': 'h-10 w-10',
      },
      color: {
        current: 'text-current',
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-600 dark:text-secondary-400',
        success: 'text-success-600 dark:text-success-400',
        warning: 'text-warning-600 dark:text-warning-400',
        error: 'text-error-600 dark:text-error-400',
        muted: 'text-gray-500 dark:text-gray-400',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'current',
    },
  }
)

// Map of icon names to icon components
const iconMap = {
  // User & Auth
  Person: icons.UserIcon,
  User: icons.UserIcon,
  Lock: icons.LockIcon,
  Eye: icons.EyeIcon,
  EyeOff: icons.EyeOffIcon,
  Logout: icons.LogoutIcon,
  
  // Navigation
  Home: icons.HomeIcon,
  Dashboard: icons.HomeIcon,
  Menu: icons.MenuIcon,
  MenuOpen: icons.MenuIcon, // Using Menu for now
  Search: icons.SearchIcon,
  Close: icons.XIcon,
  ArrowDropDown: icons.ChevronDownIcon,
  ArrowDropUp: icons.ChevronUpIcon,
  
  // Actions
  Add: icons.PlusIcon,
  Edit: icons.EditIcon,
  Delete: icons.DeleteIcon,
  Save: icons.SaveIcon,
  
  // Academic
  School: icons.AcademicCapIcon,
  MenuBook: icons.BookIcon,
  Category: icons.BookIcon, // Using Book for programs
  Layers: icons.BookIcon, // Using Book for levels
  Group: icons.UserIcon, // Using User for groups
  Groups: icons.UserIcon, // Using User for groups
  
  // Infrastructure
  Domain: icons.HomeIcon, // Using Home for infrastructure
  LocationCity: icons.HomeIcon, // Using Home for campus
  Apartment: icons.HomeIcon, // Using Home for buildings
  MeetingRoom: icons.HomeIcon, // Using Home for classrooms
  Business: icons.HomeIcon, // Using Home for departments
  Badge: icons.CertificateIcon,
  
  // Scheduling
  CalendarMonth: icons.CalendarIcon,
  Schedule: icons.ClockIcon,
  Event: icons.CalendarIcon,
  Warning: icons.AlertIcon,
  
  // Settings & Admin
  Settings: icons.SettingsIcon,
  Tune: icons.SettingsIcon,
  ManageAccounts: icons.UserIcon,
  Security: icons.LockIcon,
  
  // Theme
  LightMode: icons.SunIcon,
  DarkMode: icons.MoonIcon,
  
  // Status
  Check: icons.CheckIcon,
  Error: icons.XIcon,
  Info: icons.InfoIcon,
  
  // Other
  Notifications: icons.BellIcon,
  Email: icons.EmailIcon,
  Phone: icons.PhoneIcon,
  Chart: icons.ChartIcon,
  Loading: icons.LoadingIcon,
} as const

export type IconName = keyof typeof iconMap

export interface IconProps extends VariantProps<typeof iconVariants> {
  name: IconName
  className?: string
  'aria-label'?: string
}

interface IconWrapperProps extends IconProps {
  ref?: React.Ref<SVGSVGElement>
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size, color, className, ...props }, ref) => {
    const IconComponent = iconMap[name]
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found`)
      return null
    }
    
    return (
      <IconComponent
        size={size}
        color={color}
        className={cn(iconVariants({ size, color }), className)}
        {...props}
      />
    )
  }
)

Icon.displayName = 'Icon'