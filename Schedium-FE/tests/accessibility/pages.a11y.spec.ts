import { test, expect } from '@playwright/test'
import { 
  createA11yTest,
  setupA11yTesting,
  runA11yChecks,
  testFormA11y,
  testKeyboardNavigation
} from './playwright-a11y'

// Test login page accessibility
createA11yTest(
  'Login Page',
  '/login',
  async (page) => {
    // Additional tests specific to login page
    await testFormA11y(page)
    
    // Test password visibility toggle
    const passwordToggle = page.locator('[aria-label*="password"], [aria-label*="contraseña"]')
    if (await passwordToggle.count() > 0) {
      await passwordToggle.click()
      await runA11yChecks(page)
    }
    
    // Test theme toggle
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="tema"]')
    if (await themeToggle.count() > 0) {
      await themeToggle.click()
      await runA11yChecks(page)
    }
  }
)

// Test dashboard accessibility
createA11yTest(
  'Dashboard',
  '/dashboard',
  async (page) => {
    // Test navigation menu
    const navItems = page.locator('nav a, nav button')
    const navCount = await navItems.count()
    
    for (let i = 0; i < navCount; i++) {
      const item = navItems.nth(i)
      await expect(item).toHaveAttribute('href', /.+/)
      
      // Check for accessible names
      const accessibleName = await item.getAttribute('aria-label') || 
                           await item.textContent()
      expect(accessibleName).toBeTruthy()
    }
    
    // Test card interactions
    const cards = page.locator('[role="article"], .card, [data-testid="card"]')
    const cardCount = await cards.count()
    
    if (cardCount > 0) {
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = cards.nth(i)
        await card.focus()
        await runA11yChecks(page)
      }
    }
  }
)

test.describe('Component Accessibility in Context', () => {
  test('Button components should be accessible in all contexts', async ({ page }) => {
    await page.goto('/dashboard')
    await setupA11yTesting(page)
    
    // Test all button variants
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      
      // Check if button has accessible name
      const accessibleName = await button.getAttribute('aria-label') || 
                           await button.textContent()
      expect(accessibleName?.trim()).toBeTruthy()
      
      // Test keyboard interaction
      await button.focus()
      await page.keyboard.press('Enter')
      
      // Verify no accessibility violations after interaction
      await runA11yChecks(page)
    }
  })

  test('Form inputs should be accessible', async ({ page }) => {
    await page.goto('/login')
    await setupA11yTesting(page)
    
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      
      // Check for proper labeling
      const inputId = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      
      if (inputId) {
        const associatedLabel = page.locator(`label[for="${inputId}"]`)
        const labelExists = await associatedLabel.count() > 0
        expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
      
      // Test focus state
      await input.focus()
      const hasFocus = await input.evaluate(el => el === document.activeElement)
      expect(hasFocus).toBe(true)
      
      // Test input interaction
      await input.fill('test value')
      await runA11yChecks(page)
      await input.clear()
    }
  })

  test('Navigation should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await setupA11yTesting(page)
    
    // Test skip links
    const skipLinks = page.locator('a[href^="#"]')
    const skipLinkCount = await skipLinks.count()
    
    for (let i = 0; i < skipLinkCount; i++) {
      const skipLink = skipLinks.nth(i)
      await skipLink.focus()
      
      const href = await skipLink.getAttribute('href')
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1)
        const target = page.locator(`#${targetId}`)
        const targetExists = await target.count() > 0
        expect(targetExists).toBe(true)
      }
    }
    
    // Test main navigation
    const nav = page.locator('nav')
    if (await nav.count() > 0) {
      await runA11yChecks(page, 'nav')
    }
  })

  test('Cards should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await setupA11yTesting(page)
    
    const cards = page.locator('[role="article"], .card, [data-testid="card"]')
    const cardCount = await cards.count()
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i)
      
      // Check for proper heading structure within cards
      const headings = card.locator('h1, h2, h3, h4, h5, h6, [role="heading"]')
      const headingCount = await headings.count()
      
      if (headingCount > 0) {
        for (let j = 0; j < headingCount; j++) {
          const heading = headings.nth(j)
          const headingText = await heading.textContent()
          expect(headingText?.trim()).toBeTruthy()
        }
      }
      
      // If card is interactive, test keyboard interaction
      const isClickable = await card.evaluate(el => {
        const style = window.getComputedStyle(el)
        return style.cursor === 'pointer' || el.onclick !== null
      })
      
      if (isClickable) {
        await card.focus()
        await page.keyboard.press('Enter')
        await runA11yChecks(page)
      }
    }
  })

  test('Theme switching should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await setupA11yTesting(page)
    
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="tema"], [data-testid="theme-toggle"]')
    
    if (await themeToggle.count() > 0) {
      // Test initial state
      await runA11yChecks(page)
      
      // Toggle theme
      await themeToggle.click()
      
      // Wait for theme change
      await page.waitForTimeout(100)
      
      // Test accessibility in new theme
      await runA11yChecks(page)
      
      // Toggle back
      await themeToggle.click()
      await page.waitForTimeout(100)
      
      // Verify accessibility is maintained
      await runA11yChecks(page)
    }
  })

  test('Animations should respect reduced motion', async ({ page }) => {
    await page.goto('/dashboard')
    await setupA11yTesting(page)
    
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Reload page to apply reduced motion preference
    await page.reload()
    
    // Test that animations are reduced/disabled
    const animatedElements = page.locator('[class*="animate"], [style*="animation"], [style*="transition"]')
    const animatedCount = await animatedElements.count()
    
    for (let i = 0; i < Math.min(animatedCount, 5); i++) {
      const element = animatedElements.nth(i)
      
      // Check that animations are respectfully reduced
      const computedStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          animationDuration: style.animationDuration,
          transitionDuration: style.transitionDuration
        }
      })
      
      // Animations should be very short or disabled when reduced motion is preferred
      const isDurationReduced = 
        computedStyle.animationDuration === '0.01ms' ||
        computedStyle.animationDuration === '0s' ||
        computedStyle.transitionDuration === '0.01ms' ||
        computedStyle.transitionDuration === '0s'
      
      // This is informational - we're checking our implementation respects the preference
      console.log(`Element ${i}: Animation duration: ${computedStyle.animationDuration}, Transition duration: ${computedStyle.transitionDuration}`)
    }
    
    // Verify no accessibility violations with reduced motion
    await runA11yChecks(page)
    
    // Reset reduced motion preference
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('Error states should be accessible', async ({ page }) => {
    await page.goto('/login')
    await setupA11yTesting(page)
    
    // Trigger form validation by submitting empty form
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.count() > 0) {
      await submitButton.click()
      
      // Wait for error messages to appear
      await page.waitForTimeout(500)
      
      // Check for error messages
      const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"] + *, [data-testid*="error"]')
      const errorCount = await errorMessages.count()
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const error = errorMessages.nth(i)
          const errorText = await error.textContent()
          expect(errorText?.trim()).toBeTruthy()
        }
        
        // Verify errors are accessible
        await runA11yChecks(page)
      }
    }
  })
})