import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { AuthGuard } from '../AuthGuard'
import { useAuthStore } from '@/stores/auth.store'

// Mock the auth store
vi.mock('@/stores/auth.store')

const mockUseAuthStore = useAuthStore as any

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      checkAuth: vi.fn(),
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should show loading spinner when loading', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      checkAuth: vi.fn(),
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should show custom fallback when loading', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      checkAuth: vi.fn(),
    })

    render(
      <AuthGuard fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
  })

  it('should call checkAuth on mount', () => {
    const checkAuthMock = vi.fn()
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      checkAuth: checkAuthMock,
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(checkAuthMock).toHaveBeenCalledOnce()
  })
})