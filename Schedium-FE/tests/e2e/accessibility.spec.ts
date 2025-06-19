import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for full access
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@sena.edu.co');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should not have any automatically detectable accessibility issues on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on login page', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on schedule page', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation on main navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Focus on first navigation item
    await page.keyboard.press('Tab');
    
    // Navigate through menu items
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    // Should be able to activate with Enter
    await page.keyboard.press('Enter');
    
    // Should navigate to the selected page
    await expect(page).toHaveURL(/.*\/(scheduling|academic|hr|infrastructure)/);
  });

  test('should support keyboard navigation in schedule matrix', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Tab to schedule matrix
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    
    // Enter should activate cell
    await page.keyboard.press('Enter');
    
    // Should open schedule form or show context menu
    const formVisible = await page.locator('[data-testid="schedule-form"]').isVisible();
    const menuVisible = await page.locator('[role="menu"]').isVisible();
    
    expect(formVisible || menuVisible).toBe(true);
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Check for aria-live regions
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    
    // Create a schedule entry to test announcements
    await page.click('[data-testid="time-slot-monday-0800"]');
    await page.selectOption('[name="courseId"]', { label: 'Programación Web' });
    await page.click('button[type="submit"]');
    
    // Should announce the creation
    await expect(page.locator('[aria-live="polite"]')).toContainText(/creado|agregado/);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check heading levels
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    const h3 = page.locator('h3');
    
    await expect(h1).toHaveCount(1); // Should have exactly one h1
    
    // H1 should come before h2
    const h1Text = await h1.textContent();
    const firstH2Text = await h2.first().textContent();
    
    expect(h1Text).toBeTruthy();
    expect(firstH2Text).toBeTruthy();
  });

  test('should have proper form labels and descriptions', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    await page.click('[data-testid="time-slot-monday-0800"]');
    
    // All form inputs should have labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Should have associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    await page.goto('/dashboard');
    
    // Check that elements are still visible and properly styled
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('button').first()).toBeVisible();
    
    // Run accessibility scan in high contrast mode
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/dashboard');
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    const count = await animatedElements.count();
    
    if (count > 0) {
      // Check that animations have reduced duration or are disabled
      for (let i = 0; i < count; i++) {
        const element = animatedElements.nth(i);
        const style = await element.evaluate(el => getComputedStyle(el));
        
        // Animation duration should be very short or none
        const animationDuration = style.animationDuration;
        const transitionDuration = style.transitionDuration;
        
        if (animationDuration !== 'none') {
          expect(parseFloat(animationDuration)).toBeLessThanOrEqual(0.1);
        }
        if (transitionDuration !== 'none') {
          expect(parseFloat(transitionDuration)).toBeLessThanOrEqual(0.1);
        }
      }
    }
  });

  test('should provide skip links for navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab to skip link
    await page.keyboard.press('Tab');
    
    // Should focus skip link
    const skipLink = page.locator('a:has-text("Saltar al contenido")');
    await expect(skipLink).toBeFocused();
    
    // Activate skip link
    await page.keyboard.press('Enter');
    
    // Should focus main content
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeFocused();
  });

  test('should have proper focus management in modals', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Open modal
    await page.click('[data-testid="time-slot-monday-0800"]');
    
    // First focusable element should be focused
    const firstInput = page.locator('input, select, button').first();
    await expect(firstInput).toBeFocused();
    
    // Tab should cycle within modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Escape should close modal
    await page.keyboard.press('Escape');
    
    // Focus should return to trigger element
    const trigger = page.locator('[data-testid="time-slot-monday-0800"]');
    await expect(trigger).toBeFocused();
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Create a schedule entry
    await page.click('[data-testid="time-slot-monday-0800"]');
    await page.selectOption('[name="courseId"]', { label: 'Programación Web' });
    await page.click('button[type="submit"]');
    
    // Should announce success
    const announcements = page.locator('[aria-live], [role="status"], [role="alert"]');
    await expect(announcements).toContainText(/exitoso|creado|guardado/);
    
    // Delete the entry
    await page.click('[data-testid="schedule-entry"] button[aria-label*="eliminar"]');
    await page.click('button:has-text("Confirmar")');
    
    // Should announce deletion
    await expect(announcements).toContainText(/eliminado|borrado/);
  });
});