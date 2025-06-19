import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../LoginPage'
import { useAuthStore } from '@/stores/auth.store'

// Mock the auth store
vi.mock('@/stores/auth.store')

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: null,
    }),
  }
})

const mockUseAuthStore = useAuthStore as any

describe('LoginPage', () => {
  const mockLogin = vi.fn()
  const mockClearError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('Schedium')).toBeInTheDocument()
    expect(screen.getByText('Sistema de Gestión Académica - SENA CGMLTI')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre de usuario')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument()
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
    })
  })

  it('should validate username format', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const usernameInput = screen.getByPlaceholderText('Nombre de usuario')
    await user.type(usernameInput, 'invalid@username!')

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/solo se permiten letras, números/i)).toBeInTheDocument()
    })
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByPlaceholderText('Contraseña')
    await user.type(passwordInput, '123')

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByPlaceholderText('Contraseña') as HTMLInputElement
    const toggleButton = screen.getByLabelText(/mostrar contraseña/i)

    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const usernameInput = screen.getByPlaceholderText('Nombre de usuario')
    const passwordInput = screen.getByPlaceholderText('Contraseña')
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
    })
  })

  it('should show loading state during login', () => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    })

    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /iniciando sesión/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument()
  })

  it('should display error message', () => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
      clearError: mockClearError,
    })

    render(<LoginPage />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('should clear error when starting new login attempt', async () => {
    const user = userEvent.setup()
    
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Previous error',
      clearError: mockClearError,
    })

    render(<LoginPage />)

    const usernameInput = screen.getByPlaceholderText('Nombre de usuario')
    const passwordInput = screen.getByPlaceholderText('Contraseña')
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(mockClearError).toHaveBeenCalled()
  })
})