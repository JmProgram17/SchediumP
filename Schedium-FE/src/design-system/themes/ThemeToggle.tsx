import { useTheme } from './ThemeProvider'
import { SunIcon, MoonIcon } from '../components/Icon'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps): JSX.Element {
  const { theme, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]}
        rounded-lg
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        border border-gray-200 dark:border-gray-700
        text-gray-500 hover:text-gray-700
        dark:text-gray-400 dark:hover:text-gray-200
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {/* Sun Icon - visible in dark mode */}
      <SunIcon
        size={iconSizes[size]}
        className={`
          absolute transition-all duration-300
          ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}
        `}
      />

      {/* Moon Icon - visible in light mode */}
      <MoonIcon
        size={iconSizes[size]}
        className={`
          absolute transition-all duration-300
          ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}
        `}
      />
    </button>
  )
}

// Alternative toggle with text
export function ThemeToggleWithText({ className = '' }: { className?: string }): JSX.Element {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center gap-2 px-3 py-2
        rounded-md
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        border border-gray-200 dark:border-gray-700
        text-sm font-medium
        text-gray-700 dark:text-gray-200
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {theme === 'light' ? (
        <>
          <MoonIcon size="sm" />
          Modo Oscuro
        </>
      ) : (
        <>
          <SunIcon size="sm" />
          Modo Claro
        </>
      )}
    </button>
  )
}