import { Suspense } from 'react'
import { QueryProvider } from '@/providers'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from './router/AppRouter'
import { ThemeProvider } from '@/design-system/themes/ThemeProvider'

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <AppRouter />
        </Suspense>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #ffffff)',
              color: 'var(--toast-text, #1f2937)',
              border: '1px solid var(--toast-border, #e5e7eb)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryProvider>
  )
}

export default App