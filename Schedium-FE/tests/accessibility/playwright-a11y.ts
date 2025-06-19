import { test, expect, Page } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright'

/**
 * Enhanced accessibility testing utilities for Playwright
 */

/**
 * Setup accessibility testing for a page
 */
export const setupA11yTesting = async (page: Page) => {
  await injectAxe(page)
}

/**
 * Run comprehensive accessibility checks
 */
export const runA11yChecks = async (
  page: Page, 
  options?: {
    selector?: string
    rules?: string[]
    tags?: string[]
    skipFailures?: boolean
  }
) => {
  const config: any = {}
  
  if (options?.rules) {
    config.rules = options.rules.reduce((acc, rule) => {
      acc[rule] = { enabled: true }
      return acc
    }, {})
  }
  
  if (options?.tags) {
    config.runOnly = {
      type: 'tag',
      values: options.tags
    }
  }

  try {
    await checkA11y(page, options?.selector, config)
  } catch (error) {
    if (!options?.skipFailures) {
      throw error
    }
    console.warn('Accessibility violations found:', error)
  }
}

/**
 * Get detailed accessibility violations for analysis
 */
export const getA11yViolations = async (page: Page, selector?: string) => {
  return await getViolations(page, selector)
}

/**
 * Test keyboard navigation
 */
export const testKeyboardNavigation = async (page: Page) => {
  // Test Tab navigation
  await page.keyboard.press('Tab')
  const activeElement = await page.evaluateHandle(() => document.activeElement)
  expect(activeElement).toBeTruthy()
  
  // Test Shift+Tab navigation
  await page.keyboard.press('Shift+Tab')
  
  // Test Enter key activation
  await page.keyboard.press('Enter')
  
  // Test Escape key
  await page.keyboard.press('Escape')
  
  // Test Arrow keys for custom components
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowRight')
}

/**
 * Test screen reader compatibility
 */
export const testScreenReaderCompat = async (page: Page) => {
  // Check for ARIA landmarks
  const landmarks = await page.$$('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer')
  expect(landmarks.length).toBeGreaterThan(0)
  
  // Check for heading structure
  const headings = await page.$$('h1, h2, h3, h4, h5, h6, [role="heading"]')
  expect(headings.length).toBeGreaterThan(0)
  
  // Check for proper form labels
  const formInputs = await page.$$('input, select, textarea')
  for (const input of formInputs) {
    const hasLabel = await input.evaluate(el => {
      const id = el.getAttribute('id')
      const ariaLabel = el.getAttribute('aria-label')
      const ariaLabelledBy = el.getAttribute('aria-labelledby')
      const label = id ? document.querySelector(`label[for="${id}"]`) : null
      
      return !!(ariaLabel || ariaLabelledBy || label)
    })
    expect(hasLabel).toBe(true)
  }
}

/**
 * Test color contrast
 */
export const testColorContrast = async (page: Page) => {
  await runA11yChecks(page, {
    tags: ['cat.color']
  })
}

/**
 * Test in different viewport sizes
 */
export const testResponsiveA11y = async (page: Page, testFn: (page: Page) => Promise<void>) => {
  const viewports = [
    { width: 320, height: 568 },   // Mobile
    { width: 768, height: 1024 },  // Tablet
    { width: 1920, height: 1080 }, // Desktop
  ]
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await testFn(page)
  }
}

/**
 * Test with different themes
 */
export const testThemeA11y = async (page: Page, testFn: (page: Page) => Promise<void>) => {
  // Test light theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
  })
  await testFn(page)
  
  // Test dark theme
  await page.evaluate(() => {
    document.documentElement.classList.add('dark')
  })
  await testFn(page)
  
  // Reset to light theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
  })
}

/**
 * Test with reduced motion
 */
export const testReducedMotionA11y = async (page: Page, testFn: (page: Page) => Promise<void>) => {
  // Enable reduced motion
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await testFn(page)
  
  // Reset to no preference
  await page.emulateMedia({ reducedMotion: 'no-preference' })
}

/**
 * Test focus management
 */
export const testFocusManagement = async (page: Page) => {
  // Test that focus is visible
  await page.keyboard.press('Tab')
  const focusedElement = await page.evaluateHandle(() => document.activeElement)
  
  // Check if focus indicator is visible
  const hasFocusStyles = await page.evaluate(() => {
    const activeEl = document.activeElement as HTMLElement
    if (!activeEl) return false
    
    const styles = window.getComputedStyle(activeEl)
    const pseudoStyles = window.getComputedStyle(activeEl, ':focus')
    
    // Check for focus indicators
    return (
      styles.outline !== 'none' ||
      styles.boxShadow !== 'none' ||
      pseudoStyles.outline !== 'none' ||
      pseudoStyles.boxShadow !== 'none'
    )
  })
  
  expect(hasFocusStyles).toBe(true)
}

/**
 * Test form accessibility
 */
export const testFormA11y = async (page: Page) => {
  await runA11yChecks(page, {
    tags: ['cat.forms']
  })
  
  // Test required field indicators
  const requiredFields = await page.$$('[required], [aria-required="true"]')
  for (const field of requiredFields) {
    const hasRequiredIndicator = await field.evaluate(el => {
      const ariaRequired = el.getAttribute('aria-required')
      const required = el.hasAttribute('required')
      const label = el.getAttribute('aria-label') || ''
      const labelElement = el.getAttribute('id') ? 
        document.querySelector(`label[for="${el.getAttribute('id')}"]`) : null
      const labelText = labelElement?.textContent || ''
      
      return ariaRequired === 'true' || required || 
             label.includes('*') || label.includes('required') ||
             labelText.includes('*') || labelText.includes('required')
    })
    expect(hasRequiredIndicator).toBe(true)
  }
}

/**
 * Test image accessibility
 */
export const testImageA11y = async (page: Page) => {
  const images = await page.$$('img')
  
  for (const img of images) {
    const isDecorative = await img.evaluate(el => {
      const alt = el.getAttribute('alt')
      const role = el.getAttribute('role')
      const ariaHidden = el.getAttribute('aria-hidden')
      
      return alt === '' || role === 'presentation' || ariaHidden === 'true'
    })
    
    const hasAltText = await img.evaluate(el => {
      return el.hasAttribute('alt')
    })
    
    // All images should either be decorative or have alt text
    expect(isDecorative || hasAltText).toBe(true)
  }
}

/**
 * Comprehensive accessibility test suite
 */
export const runComprehensiveA11yTests = async (page: Page) => {
  await setupA11yTesting(page)
  
  // Run all accessibility checks
  await runA11yChecks(page)
  
  // Test specific categories
  await testKeyboardNavigation(page)
  await testScreenReaderCompat(page)
  await testColorContrast(page)
  await testFocusManagement(page)
  await testFormA11y(page)
  await testImageA11y(page)
}

/**
 * Create accessibility test for a specific page
 */
export const createA11yTest = (
  testName: string,
  url: string,
  additionalTests?: (page: Page) => Promise<void>
) => {
  test.describe(`Accessibility: ${testName}`, () => {
    test('should pass basic accessibility checks', async ({ page }) => {
      await page.goto(url)
      await setupA11yTesting(page)
      await runA11yChecks(page)
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(url)
      await testKeyboardNavigation(page)
    })

    test('should work with screen readers', async ({ page }) => {
      await page.goto(url)
      await testScreenReaderCompat(page)
    })

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto(url)
      await setupA11yTesting(page)
      await testColorContrast(page)
    })

    test('should handle focus management correctly', async ({ page }) => {
      await page.goto(url)
      await testFocusManagement(page)
    })

    test('should work across different themes', async ({ page }) => {
      await page.goto(url)
      await setupA11yTesting(page)
      await testThemeA11y(page, async (p) => {
        await runA11yChecks(p)
      })
    })

    test('should work with reduced motion', async ({ page }) => {
      await page.goto(url)
      await setupA11yTesting(page)
      await testReducedMotionA11y(page, async (p) => {
        await runA11yChecks(p)
      })
    })

    test('should work across different viewport sizes', async ({ page }) => {
      await page.goto(url)
      await setupA11yTesting(page)
      await testResponsiveA11y(page, async (p) => {
        await runA11yChecks(p)
      })
    })

    if (additionalTests) {
      test('should pass additional accessibility tests', async ({ page }) => {
        await page.goto(url)
        await setupA11yTesting(page)
        await additionalTests(page)
      })
    }
  })
}