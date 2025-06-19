import { test, expect } from '@playwright/test';

test.describe('Schedule Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as coordinator
    await page.goto('/login');
    await page.fill('input[name="username"]', 'coordinator@sena.edu.co');
    await page.fill('input[name="password"]', 'Coordinator123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should display schedule matrix', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Should show schedule matrix
    await expect(page.locator('[data-testid="schedule-matrix"]')).toBeVisible();
    
    // Should show day headers
    await expect(page.locator('text=Lunes')).toBeVisible();
    await expect(page.locator('text=Martes')).toBeVisible();
    await expect(page.locator('text=Miércoles')).toBeVisible();
    
    // Should show time slots
    await expect(page.locator('text=06:00')).toBeVisible();
    await expect(page.locator('text=07:00')).toBeVisible();
  });

  test('should create new schedule entry', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Click on empty time slot
    await page.click('[data-testid="time-slot-monday-0800"]');
    
    // Should open schedule form
    await expect(page.locator('[data-testid="schedule-form"]')).toBeVisible();
    
    // Fill schedule details
    await page.selectOption('[name="courseId"]', { label: 'Programación Web' });
    await page.selectOption('[name="instructorId"]', { label: 'Juan Pérez' });
    await page.selectOption('[name="classroomId"]', { label: 'Aula 101' });
    await page.selectOption('[name="groupId"]', { label: 'ADSI-2024-1' });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('[role="alert"]')).toContainText('Horario creado exitosamente');
    
    // Should display new entry in matrix
    await expect(page.locator('[data-testid="schedule-entry"]')).toContainText('Programación Web');
  });

  test('should detect and display conflicts', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Create first schedule entry
    await page.click('[data-testid="time-slot-monday-0800"]');
    await page.selectOption('[name="courseId"]', { label: 'Programación Web' });
    await page.selectOption('[name="instructorId"]', { label: 'Juan Pérez' });
    await page.selectOption('[name="classroomId"]', { label: 'Aula 101' });
    await page.click('button[type="submit"]');
    
    // Create conflicting schedule entry (same instructor, same time)
    await page.click('[data-testid="time-slot-tuesday-0800"]');
    await page.selectOption('[name="courseId"]', { label: 'Base de Datos' });
    await page.selectOption('[name="instructorId"]', { label: 'Juan Pérez' }); // Same instructor
    await page.selectOption('[name="classroomId"]', { label: 'Aula 102' });
    await page.click('button[type="submit"]');
    
    // Should show conflict warning
    await expect(page.locator('[data-testid="conflict-alert"]')).toBeVisible();
    await expect(page.locator('text=Conflicto detectado')).toBeVisible();
  });

  test('should drag and drop schedule entries', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Wait for existing schedule entry
    await expect(page.locator('[data-testid="schedule-entry"]').first()).toBeVisible();
    
    // Get source and target elements
    const source = page.locator('[data-testid="schedule-entry"]').first();
    const target = page.locator('[data-testid="time-slot-tuesday-0900"]');
    
    // Perform drag and drop
    await source.dragTo(target);
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="move-confirmation"]')).toBeVisible();
    await page.click('button:has-text("Confirmar")');
    
    // Should update schedule entry position
    await expect(target.locator('[data-testid="schedule-entry"]')).toBeVisible();
  });

  test('should filter schedules by criteria', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Use instructor filter
    await page.selectOption('[data-testid="instructor-filter"]', { label: 'Juan Pérez' });
    
    // Should show only Juan Pérez's classes
    await page.waitForSelector('[data-testid="schedule-entry"]');
    const entries = page.locator('[data-testid="schedule-entry"]');
    await expect(entries).toContainText('Juan Pérez');
    
    // Use program filter
    await page.selectOption('[data-testid="program-filter"]', { label: 'ADSI' });
    
    // Should show only ADSI classes
    await expect(entries).toContainText('ADSI');
  });

  test('should export schedule data', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    
    // Select export format
    await page.click('text=Excel');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('horarios');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('should handle schedule validation', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Try to create invalid schedule (past time)
    await page.click('[data-testid="time-slot-monday-0600"]'); // 6 AM
    await page.selectOption('[name="courseId"]', { label: 'Programación Web' });
    await page.selectOption('[name="instructorId"]', { label: 'Juan Pérez' });
    await page.selectOption('[name="classroomId"]', { label: 'Aula 101' });
    
    // Set date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.fill('[name="date"]', yesterday.toISOString().split('T')[0]);
    
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=no puede ser en el pasado')).toBeVisible();
  });

  test('should show schedule statistics', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Should display statistics panel
    await expect(page.locator('[data-testid="schedule-stats"]')).toBeVisible();
    
    // Should show various metrics
    await expect(page.locator('text=Total de Clases')).toBeVisible();
    await expect(page.locator('text=Instructores Activos')).toBeVisible();
    await expect(page.locator('text=Aulas Ocupadas')).toBeVisible();
    await expect(page.locator('text=Conflictos')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Focus on schedule matrix
    await page.click('[data-testid="schedule-matrix"]');
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    
    // Press Enter to select time slot
    await page.keyboard.press('Enter');
    
    // Should open schedule form
    await expect(page.locator('[data-testid="schedule-form"]')).toBeVisible();
    
    // Should be able to navigate form with Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="courseId"]:focus')).toBeVisible();
  });

  test('should auto-save draft schedules', async ({ page }) => {
    await page.goto('/scheduling/schedules');
    
    // Start creating schedule
    await page.click('[data-testid="time-slot-monday-0800"]');
    await page.selectOption('[name="courseId"]', { label: 'Programación Web' });
    await page.selectOption('[name="instructorId"]', { label: 'Juan Pérez' });
    
    // Wait for auto-save indicator
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Guardado automáticamente');
    
    // Refresh page
    await page.reload();
    
    // Should restore draft
    await page.click('[data-testid="time-slot-monday-0800"]');
    await expect(page.locator('[name="courseId"]')).toHaveValue('programacion-web');
  });
});

test.describe('Schedule Collaboration', () => {
  test('should show real-time updates from other users', async ({ page, context }) => {
    // Open two pages to simulate collaboration
    const page2 = await context.newPage();
    
    // Login on both pages
    await page.goto('/login');
    await page.fill('input[name="username"]', 'coordinator@sena.edu.co');
    await page.fill('input[name="password"]', 'Coordinator123!');
    await page.click('button[type="submit"]');
    
    await page2.goto('/login');
    await page2.fill('input[name="username"]', 'admin@sena.edu.co');
    await page2.fill('input[name="password"]', 'Admin123!');
    await page2.click('button[type="submit"]');
    
    // Navigate to schedules on both pages
    await page.goto('/scheduling/schedules');
    await page2.goto('/scheduling/schedules');
    
    // Create schedule on page2
    await page2.click('[data-testid="time-slot-monday-0800"]');
    await page2.selectOption('[name="courseId"]', { label: 'Base de Datos' });
    await page2.selectOption('[name="instructorId"]', { label: 'María García' });
    await page2.click('button[type="submit"]');
    
    // Should see update on page1
    await expect(page.locator('[data-testid="schedule-entry"]')).toContainText('Base de Datos');
    
    // Should show user indicator
    await expect(page.locator('[data-testid="active-users"]')).toContainText('2 usuarios activos');
  });

  test('should show cursor positions of other users', async ({ page, context }) => {
    const page2 = await context.newPage();
    
    // Setup both pages
    await Promise.all([
      setupUserSession(page, 'coordinator@sena.edu.co', 'Coordinator123!'),
      setupUserSession(page2, 'admin@sena.edu.co', 'Admin123!')
    ]);
    
    // Navigate to schedules
    await Promise.all([
      page.goto('/scheduling/schedules'),
      page2.goto('/scheduling/schedules')
    ]);
    
    // Move cursor on page2
    await page2.hover('[data-testid="time-slot-tuesday-0900"]');
    
    // Should see cursor indicator on page1
    await expect(page.locator('[data-testid="user-cursor"]')).toBeVisible();
  });
});

// Helper function
async function setupUserSession(page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/);
}