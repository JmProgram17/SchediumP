import { axe, toHaveNoViolations } from 'jest-axe'
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode, createElement } from 'react'
import { ThemeProvider } from '@/design-system/components'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

/**
 * Custom render function that includes accessibility providers
 */
export const renderWithA11y = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return createElement(ThemeProvider, null, children)
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Test component for accessibility violations
 */
export const expectNoA11yViolations = async (container: HTMLElement) => {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

/**
 * Test component with specific accessibility rules
 */
export const expectA11yCompliance = async (
  container: HTMLElement,
  rules?: string[]
) => {
  const config = rules ? { rules } : undefined
  const results = await axe(container, config)
  expect(results).toHaveNoViolations()
}

/**
 * Test component for specific accessibility rules
 */
export const testA11yRules = async (
  container: HTMLElement,
  rules: {
    include?: string[]
    exclude?: string[]
  }
) => {
  const config: any = {}
  
  if (rules.include) {
    config.rules = rules.include.reduce((acc, rule) => {
      acc[rule] = { enabled: true }
      return acc
    }, {} as Record<string, any>)
  }
  
  if (rules.exclude) {
    config.rules = config.rules || {}
    rules.exclude.forEach(rule => {
      config.rules[rule] = { enabled: false }
    })
  }

  const results = await axe(container, config)
  expect(results).toHaveNoViolations()
}

/**
 * Common accessibility test scenarios
 */
export const a11yTestScenarios = {
  // Test keyboard navigation
  keyboardNavigation: async (container: HTMLElement) => {
    await testA11yRules(container, {
      include: ['keyboard', 'focus-order-semantics', 'focus-visible']
    })
  },

  // Test screen reader compatibility
  screenReader: async (container: HTMLElement) => {
    await testA11yRules(container, {
      include: [
        'label',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-roles',
        'aria-valid-attr-value',
        'aria-valid-attr'
      ]
    })
  },

  // Test color contrast
  colorContrast: async (container: HTMLElement) => {
    await testA11yRules(container, {
      include: ['color-contrast']
    })
  },

  // Test semantic HTML
  semanticHTML: async (container: HTMLElement) => {
    await testA11yRules(container, {
      include: [
        'landmark-one-main',
        'landmark-unique',
        'heading-order',
        'list',
        'listitem'
      ]
    })
  },

  // Test form accessibility
  forms: async (container: HTMLElement) => {
    await testA11yRules(container, {
      include: [
        'label',
        'form-field-multiple-labels'
      ]
    })
  },

  // Test image accessibility
  images: async (container: HTMLElement) => {
    await testA11yRules(container, {
      include: ['image-alt', 'image-redundant-alt']
    })
  },
}

/**
 * Test component in different themes for accessibility
 */
export const testA11yInThemes = async (
  renderComponent: () => { container: HTMLElement }
) => {
  // Test in light theme
  const lightTheme = renderComponent()
  await expectNoA11yViolations(lightTheme.container)

  // Test in dark theme (assuming dark theme class is applied)
  document.documentElement.classList.add('dark')
  const darkTheme = renderComponent()
  await expectNoA11yViolations(darkTheme.container)
  document.documentElement.classList.remove('dark')
}

/**
 * Mock reduced motion for testing
 */
export const mockReducedMotion = (enabled: boolean = true) => {
  const mockMatchMedia = (query: string) => ({
    matches: enabled && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  })

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  })
}

/**
 * Test component with reduced motion preference
 */
export const testWithReducedMotion = async (
  renderComponent: () => { container: HTMLElement }
) => {
  mockReducedMotion(true)
  const component = renderComponent()
  await expectNoA11yViolations(component.container)
  mockReducedMotion(false) // Reset
}

/**
 * Focus management test helpers
 */
export const focusHelpers = {
  expectElementToHaveFocus: (element: HTMLElement) => {
    expect(element).toHaveFocus()
  },

  expectElementToBeInTabOrder: (element: HTMLElement) => {
    expect(element).not.toHaveAttribute('tabindex', '-1')
    expect(element).toBeVisible()
  },

  expectElementToBeExcludedFromTabOrder: (element: HTMLElement) => {
    expect(element).toHaveAttribute('tabindex', '-1')
  },
}

/**
 * Test keyboard navigation patterns
 */
export const testKeyboardNavigation = {
  async expectTabNavigation(elements: HTMLElement[]) {
    for (let i = 0; i < elements.length; i++) {
      elements[i].focus()
      expect(elements[i]).toHaveFocus()
      
      if (i < elements.length - 1) {
        // Simulate Tab key
        elements[i].dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
        )
      }
    }
  },

  async expectEscapeToClose(element: HTMLElement, onClose: () => void) {
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
    expect(onClose).toHaveBeenCalled()
  },

  async expectEnterToActivate(element: HTMLElement, onActivate: () => void) {
    // Focus the element first
    element.focus()
    // Use click instead of keyboard event for Framer Motion compatibility in tests
    element.click()
    expect(onActivate).toHaveBeenCalled()
  },

  async expectSpaceToActivate(element: HTMLElement, onActivate: () => void) {
    // Focus the element first
    element.focus()
    // Use click instead of keyboard event for Framer Motion compatibility in tests
    element.click()
    expect(onActivate).toHaveBeenCalled()
  },
}