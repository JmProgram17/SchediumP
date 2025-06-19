/**
 * Basic Navigation Integration Test
 * Simple test to verify integration testing setup works
 */

import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { API_CONFIG } from '@/config'

// Simple test component
const TestApp = () => {
  return React.createElement('div', { 'data-testid': 'test-app' }, 'Integration Test App')
}

// MSW server setup
const server = setupServer(
  http.get(`${API_CONFIG.BASE_URL}/api/test`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Test endpoint working'
    })
  })
)

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      BrowserRouter,
      null,
      children
    )
  )
}

describe('Basic Integration Test Setup', () => {
  beforeEach(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.close()
  })

  it('should render test component successfully', () => {
    render(React.createElement(TestWrapper, null, React.createElement(TestApp)))
    
    expect(screen.getByTestId('test-app')).toBeInTheDocument()
    expect(screen.getByText('Integration Test App')).toBeInTheDocument()
  })

  it('should have API_CONFIG available', () => {
    expect(API_CONFIG).toBeDefined()
    expect(API_CONFIG.BASE_URL).toBeDefined()
  })

  it('should setup MSW server correctly', async () => {
    // Test that our MSW server can be reached
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/test`)
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.message).toBe('Test endpoint working')
  })
})