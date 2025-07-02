import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

console.log('🚀 Starting Schedium application...')

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 React Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h1>🚨 Application Error</h1>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <details>
            <summary>Stack Trace</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            🔄 Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

async function initializeApp() {
  try {
    console.log('📦 Loading dependencies...')
    
    // Dynamic imports to catch import errors
    const [
      { default: App },
      { QueryProvider },
      { observabilityService }
    ] = await Promise.all([
      import('./App.tsx'),
      import('@/services/query'),
      import('@/services/observability')
    ])
    
    console.log('✅ Dependencies loaded successfully')
    
    // Initialize observability with error handling
    try {
      observabilityService.initialize({
        enableSentry: import.meta.env.PROD,
        enableDebugTools: import.meta.env.DEV,
        enableWebVitals: true,
        logLevel: import.meta.env.PROD ? 'warn' : 'debug'
      })
      console.log('✅ Observability service initialized')
    } catch (error) {
      console.warn('⚠️ Observability service failed to initialize:', error)
      // Continue without observability
    }

    // Check for root element
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      throw new Error('Root element not found in DOM')
    }
    console.log('✅ Root element found')

    // Create React root
    const root = ReactDOM.createRoot(rootElement)
    console.log('✅ React root created')

    // Render application
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryProvider>
            <App />
          </QueryProvider>
        </ErrorBoundary>
      </React.StrictMode>
    )
    
    console.log('✅ Application rendered successfully')
    
  } catch (error) {
    console.error('💥 Failed to initialize application:', error)
    
    // Fallback rendering
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 2rem; font-family: monospace; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 2rem;">
          <h1 style="color: #856404;">⚠️ Application Failed to Load</h1>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          
          <details style="margin: 1rem 0;">
            <summary>Technical Details</summary>
            <pre style="background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow: auto;">
${error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
            </pre>
          </details>
          
          <div style="margin-top: 1rem;">
            <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
              🔄 Reload Page
            </button>
            <button onclick="window.location.href='/debug-react-mount.html'" style="background: #6c757d; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;">
              🔧 Debug Mode
            </button>
          </div>
          
          <p style="font-size: 0.9rem; color: #6c757d; margin-top: 1rem;">
            If the problem persists, please contact support or check the browser console for more details.
          </p>
        </div>
      `
    }
  }
}

// Start the application
console.log('🎯 Initializing Schedium...')
initializeApp()

// Also handle global errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
})