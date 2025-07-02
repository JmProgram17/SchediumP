import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple test component
function SimpleLogin() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1>🔓 Schedium Login (Simple)</h1>
        <form>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Iniciar Sesión
          </button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          ✅ React montado correctamente
        </p>
      </div>
    </div>
  )
}

console.log('🚀 Starting simple React mount...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  console.log('✅ Root element found')
  
  const root = ReactDOM.createRoot(rootElement)
  console.log('✅ React root created')
  
  root.render(<SimpleLogin />)
  console.log('✅ React component rendered')
  
} catch (error) {
  console.error('❌ Failed to mount React:', error)
  
  // Fallback: show error in DOM
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; color: red; font-family: monospace;">
        <h1>❌ React Mount Error</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Stack:</strong></p>
        <pre>${error.stack}</pre>
      </div>
    `
  }
}