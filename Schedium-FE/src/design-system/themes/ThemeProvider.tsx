import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Theme, themes, ThemeColors } from '@/design-system/tokens'

interface ThemeContextValue {
  theme: Theme
  themeColors: ThemeColors
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'schedium-theme',
}: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme
      if (stored && (stored === 'light' || stored === 'dark')) {
        return stored
      }
      
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    return defaultTheme
  })

  const themeColors = themes[theme]
  const isDark = theme === 'dark'

  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
    updateDocumentClass(newTheme)
  }

  const toggleTheme = (): void => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const updateDocumentClass = (currentTheme: Theme): void => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(currentTheme)
    
    // Update CSS custom properties
    const themeColors = themes[currentTheme]
    root.style.setProperty('--color-primary', themeColors.primary)
    root.style.setProperty('--color-primary-hover', themeColors.primaryHover)
    root.style.setProperty('--color-primary-active', themeColors.primaryActive)
    root.style.setProperty('--color-secondary', themeColors.secondary)
    root.style.setProperty('--color-secondary-hover', themeColors.secondaryHover)
    root.style.setProperty('--color-secondary-active', themeColors.secondaryActive)
    
    root.style.setProperty('--color-background', themeColors.background)
    root.style.setProperty('--color-background-subtle', themeColors.backgroundSubtle)
    root.style.setProperty('--color-background-muted', themeColors.backgroundMuted)
    
    root.style.setProperty('--color-text', themeColors.text)
    root.style.setProperty('--color-text-secondary', themeColors.textSecondary)
    root.style.setProperty('--color-text-tertiary', themeColors.textTertiary)
    root.style.setProperty('--color-text-inverse', themeColors.textInverse)
    
    root.style.setProperty('--color-border', themeColors.border)
    root.style.setProperty('--color-border-medium', themeColors.borderMedium)
    root.style.setProperty('--color-border-strong', themeColors.borderStrong)
    
    root.style.setProperty('--color-success', themeColors.success)
    root.style.setProperty('--color-warning', themeColors.warning)
    root.style.setProperty('--color-error', themeColors.error)
    root.style.setProperty('--color-info', themeColors.info)
  }

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent): void => {
      // Only update if no manual preference is stored
      const storedTheme = localStorage.getItem(storageKey)
      if (!storedTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [storageKey])

  // Update document class on mount and theme change
  useEffect(() => {
    updateDocumentClass(theme)
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    themeColors,
    toggleTheme,
    setTheme,
    isDark,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook for theme-aware styles
export function useThemeColors(): ThemeColors {
  const { themeColors } = useTheme()
  return themeColors
}

// Hook for conditional rendering based on theme
export function useIsDark(): boolean {
  const { isDark } = useTheme()
  return isDark
}