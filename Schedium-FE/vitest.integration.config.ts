/**
 * Vitest Configuration for Integration Tests
 * Specific configuration for running integration tests with longer timeouts
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Integration tests need longer timeouts
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Setup files
    setupFiles: [
      './src/test/setup.ts'
    ],
    
    // Test patterns
    include: [
      'src/__tests__/integration/**/*.test.{ts,tsx}'
    ],
    
    // Globals
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    
    // Retry failed tests
    retry: 1,
    
    // Run tests in sequence for integration tests
    sequence: {
      concurrent: false
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@features': resolve(__dirname, './src/features'),
      '@services': resolve(__dirname, './src/services'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@assets': resolve(__dirname, './src/assets'),
      '@styles': resolve(__dirname, './src/styles'),
    }
  },
  
  esbuild: {
    target: 'node14'
  }
})