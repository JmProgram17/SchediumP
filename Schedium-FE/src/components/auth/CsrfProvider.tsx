import { createContext, useContext, ReactNode } from 'react'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { axiosClient } from '@/services/api/axios-client'

interface CsrfContextValue {
  token: string | null
  isLoading: boolean
  error: string | null
  refreshToken: () => Promise<string | null>
  validateToken: (token?: string) => Promise<boolean>
  clearToken: () => void
  isValid: boolean
  expiresAt: Date | null
  lastRefresh: Date | null
  needsRefresh: boolean
  timeUntilExpiry: number
  retryCount: number
  isRefreshing: boolean
}

const CsrfContext = createContext<CsrfContextValue | undefined>(undefined)

interface CsrfProviderProps {
  children: ReactNode
}

export function CsrfProvider({ children }: CsrfProviderProps) {
  const csrfData = useCsrfToken()

  // Add CSRF token to axios requests when available
  if (csrfData.token) {
    axiosClient.defaults.headers.common['X-CSRF-Token'] = csrfData.token
  }

  return (
    <CsrfContext.Provider value={csrfData}>
      {children}
    </CsrfContext.Provider>
  )
}

export function useCsrf(): CsrfContextValue {
  const context = useContext(CsrfContext)
  if (context === undefined) {
    throw new Error('useCsrf must be used within a CsrfProvider')
  }
  return context
}