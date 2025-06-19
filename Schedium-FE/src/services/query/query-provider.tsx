/**
 * React Query Provider with DevTools and Persistence
 */

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './query-client'
import { SECURITY_CONFIG } from '@/config'

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Query Provider component that wraps the app with React Query context
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Only show devtools in development */}
      {SECURITY_CONFIG.ENVIRONMENT.isDevelopment && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
              transformOrigin: 'bottom right'
            }
          }}
        />
      )}
    </QueryClientProvider>
  )
}