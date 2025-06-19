import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryProvider } from '@/services/query'
import { observabilityService } from '@/services/observability'
import './index.css'

async function enableMocking(): Promise<void> {
  // API mocking disabled for backend integration
  console.log('📡 [API] Real API integration enabled - connecting to backend')
  ;(window as any).__MSW_ENABLED__ = false
  return
}

enableMocking().then(() => {
  // Initialize observability services
  observabilityService.initialize({
    enableSentry: import.meta.env.PROD,
    enableDebugTools: import.meta.env.DEV,
    enableWebVitals: true,
    logLevel: import.meta.env.PROD ? 'warn' : 'debug'
  })

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>,
  )
})