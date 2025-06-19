import { http, HttpResponse } from 'msw'
import { API_CONFIG } from '@/config'
import { academicHandlers } from './academic-handlers'

console.log('🎭 [MSW] Configuring handlers with base URL:', API_CONFIG.BASE_URL)

export const handlers = [
  // Debug endpoint
  http.get('/api/v1/debug', () => {
    console.log('🎭 [MSW] Debug endpoint called - MSW is working!')
    return HttpResponse.json({
      message: 'MSW is working!',
      baseUrl: API_CONFIG.BASE_URL,
      timestamp: new Date().toISOString(),
    })
  }),

  // Health check endpoint
  http.get(`${API_CONFIG.BASE_URL}/health`, () => {
    console.log('🎭 [MSW] Health endpoint called')
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  }),

  // Auth endpoints
  http.post(`${API_CONFIG.BASE_URL}/auth/login`, async ({ request }) => {
    console.log('🎭 [MSW] Login handler called!')
    console.log('🎭 [MSW] Handler URL:', `${API_CONFIG.BASE_URL}/auth/login`)
    
    const body = await request.json() as { email: string; password: string }
    console.log('🎭 [MSW] Received credentials:', { email: body.email, password: '***' })
    
    if (body.email === 'admin@sena.edu.co' && body.password === 'admin123') {
      console.log('✅ [MSW] Credentials valid, returning success')
      return HttpResponse.json({
        success: true,
        message: "Login successful",
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0"
        },
        errors: null
      })
    }

    console.log('❌ [MSW] Invalid credentials, returning error')
    return HttpResponse.json(
      {
        success: false,
        message: 'Incorrect email or password',
        error_code: 'INVALID_CREDENTIALS',
        errors: null,
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0"
        }
      },
      { status: 401 }
    )
  }),

  // CSRF token endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/csrf-token`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        csrf_token: 'mock-csrf-token-12345',
      },
    })
  }),

  // Current user endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/me`, () => {
    console.log('🎭 [MSW] Get current user called')
    return HttpResponse.json({
      success: true,
      message: "User information retrieved",
      data: {
        user_id: 1,
        email: 'admin@sena.edu.co',
        first_name: 'Admin',
        last_name: 'User',
        document_number: '1234567890',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role: {
          role_id: 1,
          name: 'Administrator',
          description: 'Full system access'
        },
        role_id: 1
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "1.0"
      },
      errors: null
    })
  }),

  // Logout endpoint
  http.post(`${API_CONFIG.BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  }),

  // Academic module handlers
  ...academicHandlers,

  // Placeholder for other endpoints
  http.get(`${API_CONFIG.BASE_URL}/*`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: 'Mock endpoint',
    })
  }),
]