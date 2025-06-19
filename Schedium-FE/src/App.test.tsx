import { describe, it, expect, vi } from 'vitest'
import { render, screen } from './test/utils'
import App from './App'

// Mock the auth store to return unauthenticated state
vi.mock('./stores/auth.store', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    isLoading: false,
    checkAuth: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders login page when not authenticated', () => {
    render(<App />, { includeRouter: false })
    
    const heading = screen.getByText('Schedium')
    expect(heading).toBeInTheDocument()
    
    const subtitle = screen.getByText('Sistema de Gestión Académica - SENA CGMLTI')
    expect(subtitle).toBeInTheDocument()
    
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i })
    expect(loginButton).toBeInTheDocument()
  })
})