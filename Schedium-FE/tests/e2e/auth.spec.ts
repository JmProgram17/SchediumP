import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText(['Iniciar Sesión', 'Login']);
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form elements
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for SENA branding
    await expect(page.locator('text=SENA')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=requerido')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid credentials
    await page.fill('input[name="username"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill valid credentials (these should be test credentials)
    await page.fill('input[name="username"]', 'admin@sena.edu.co');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');
    
    // Intercept login request to add delay
    await page.route('**/api/v1/auth/login', async route => {
      await page.waitForTimeout(1000);
      await route.continue();
    });
    
    await page.fill('input[name="username"]', 'admin@sena.edu.co');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@sena.edu.co');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Cerrar Sesión');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should persist session on page refresh', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@sena.edu.co');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@sena.edu.co');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Mock expired token response
    await page.route('**/api/v1/**', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });
    
    // Try to navigate to another page
    await page.click('text=Horarios');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('Role-Based Access Control', () => {
  test('should restrict access based on user role', async ({ page }) => {
    // Login as secretary (read-only role)
    await page.goto('/login');
    await page.fill('input[name="username"]', 'secretary@sena.edu.co');
    await page.fill('input[name="password"]', 'Secretary123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Try to access admin settings
    await page.goto('/admin/settings');
    
    // Should show access denied or redirect
    await expect(page.locator('text=Acceso denegado')).toBeVisible();
  });

  test('should show appropriate navigation based on role', async ({ page }) => {
    // Login as coordinator
    await page.goto('/login');
    await page.fill('input[name="username"]', 'coordinator@sena.edu.co');
    await page.fill('input[name="password"]', 'Coordinator123!');
    await page.click('button[type="submit"]');
    
    // Should see coordinator-specific navigation
    await expect(page.locator('text=Gestión Académica')).toBeVisible();
    await expect(page.locator('text=Recursos Humanos')).toBeVisible();
    
    // Should not see admin-only options
    await expect(page.locator('text=Configuración del Sistema')).not.toBeVisible();
  });
});