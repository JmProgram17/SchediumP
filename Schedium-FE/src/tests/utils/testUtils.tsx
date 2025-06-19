/**
 * Test Utilities - Comprehensive testing utilities and helpers
 * Advanced test setup with providers, mocks, and custom matchers
 */

import React from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '@emotion/react'
import { ToastContainer } from 'react-hot-toast'
import userEvent from '@testing-library/user-event'

// Import your actual store slices and theme
// import { rootReducer } from '../../store'
// import { theme } from '../../theme'

// Mock store configuration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }) => state,
      schedules: (state = { items: [], loading: false }) => state,
      dashboard: (state = { widgets: [], analytics: null }) => state,
      // Add other reducers as needed
    },
    preloadedState: initialState,
  })
}

// Mock theme
const mockTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
}

interface TestProvidersProps {
  children: React.ReactNode
  initialState?: any
  queryClient?: QueryClient
  route?: string
}

// All Providers wrapper for testing
const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialState = {},
  queryClient,
  route = '/'
}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const mockStore = createMockStore(initialState)

  // Set initial route
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route)
  }

  return (
    <Provider store={mockStore}>
      <QueryClientProvider client={testQueryClient}>
        <BrowserRouter>
          <ThemeProvider theme={mockTheme}>
            {children}
            <ToastContainer />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  )
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any
  queryClient?: QueryClient
  route?: string
  user?: ReturnType<typeof userEvent.setup>
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const {
    initialState,
    queryClient,
    route,
    user = userEvent.setup(),
    ...renderOptions
  } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProviders
      initialState={initialState}
      queryClient={queryClient}
      route={route}
    >
      {children}
    </TestProviders>
  )

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return {
    ...result,
    user,
  }
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'coordinator',
  permissions: ['read:schedules', 'write:schedules'],
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockSchedule = (overrides = {}) => ({
  id: '1',
  title: 'Test Schedule',
  description: 'Test description',
  startTime: '09:00',
  endTime: '10:30',
  dayOfWeek: 'monday',
  instructorId: '1',
  classroomId: '1',
  programId: '1',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockInstructor = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  specializations: ['Math', 'Science'],
  status: 'active',
  ...overrides,
})

export const createMockClassroom = (overrides = {}) => ({
  id: '1',
  name: 'Room A-101',
  capacity: 30,
  equipment: ['projector', 'whiteboard'],
  building: 'Main Building',
  floor: 1,
  status: 'available',
  ...overrides,
})

export const createMockReport = (overrides = {}) => ({
  id: '1',
  name: 'Test Report',
  description: 'Test report description',
  category: 'academic',
  visualizations: [],
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message = 'API Error', status = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message)
      ;(error as any).status = status
      reject(error)
    }, delay)
  })
}

// Wait utilities
export const waitForElement = async (selector: string, timeout = 5000) => {
  return new Promise<Element>((resolve, reject) => {
    const startTime = Date.now()
    
    const checkElement = () => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`))
      } else {
        setTimeout(checkElement, 100)
      }
    }
    
    checkElement()
  })
}

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now()
    
    const checkCondition = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`))
      } else {
        setTimeout(checkCondition, interval)
      }
    }
    
    checkCondition()
  })
}

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  })
  window.IntersectionObserver = mockIntersectionObserver
  window.IntersectionObserverEntry = jest.fn()
}

// Mock resize observer
export const mockResizeObserver = () => {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

// Mock matchMedia
export const mockMatchMedia = (matches = false) => {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

// Mock localStorage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
  return localStorageMock
}

// Mock fetch
export const mockFetch = (response: any, options: { status?: number; ok?: boolean } = {}) => {
  const { status = 200, ok = true } = options
  
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    headers: {
      get: jest.fn().mockReturnValue('application/json'),
    },
  })
}

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const startTime = performance.now()
  await renderFn()
  const endTime = performance.now()
  return endTime - startTime
}

export const measureAsyncOperation = async (operation: () => Promise<any>) => {
  const startTime = performance.now()
  const result = await operation()
  const endTime = performance.now()
  return {
    result,
    duration: endTime - startTime,
  }
}

// Accessibility testing helpers
export const getAccessibilityViolations = async (container: HTMLElement) => {
  // This would use axe-core in a real implementation
  const violations: any[] = []
  
  // Check for missing alt text
  const images = container.querySelectorAll('img:not([alt])')
  if (images.length > 0) {
    violations.push({
      id: 'image-alt',
      description: 'Images must have alternate text',
      nodes: Array.from(images),
    })
  }
  
  // Check for missing labels
  const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
  inputs.forEach(input => {
    const label = container.querySelector(`label[for="${input.id}"]`)
    if (!label && input.type !== 'hidden') {
      violations.push({
        id: 'label-missing',
        description: 'Form elements must have labels',
        nodes: [input],
      })
    }
  })
  
  return violations
}

// Custom Jest matchers
export const customMatchers = {
  toHaveAccessibleName: (element: HTMLElement, expectedName: string) => {
    const accessibleName = element.getAttribute('aria-label') || 
                          element.getAttribute('aria-labelledby') ||
                          element.textContent
    
    return {
      message: () => `expected element to have accessible name "${expectedName}"`,
      pass: accessibleName === expectedName,
    }
  },
  
  toBeWithinLoadTime: (duration: number, maxTime: number) => {
    return {
      message: () => `expected ${duration}ms to be within ${maxTime}ms`,
      pass: duration <= maxTime,
    }
  },
  
  toHaveValidMarkup: (element: HTMLElement) => {
    const violations = []
    
    // Check for proper heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let lastLevel = 0
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1])
      if (level > lastLevel + 1) {
        violations.push(`Heading level ${level} skips level ${lastLevel + 1}`)
      }
      lastLevel = level
    })
    
    return {
      message: () => `expected valid markup but found violations: ${violations.join(', ')}`,
      pass: violations.length === 0,
    }
  },
}

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock APIs
  mockIntersectionObserver()
  mockResizeObserver()
  mockMatchMedia()
  mockLocalStorage()
  
  // Extend Jest matchers
  expect.extend(customMatchers)
  
  // Mock console methods in tests
  global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
  }
  
  // Mock timers
  jest.useFakeTimers()
}

// Cleanup after tests
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks()
  jest.clearAllTimers()
  jest.useRealTimers()
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }
export { userEvent }
export { default as userEvent } from '@testing-library/user-event'