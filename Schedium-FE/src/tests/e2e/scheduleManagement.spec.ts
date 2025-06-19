/**
 * E2E Tests for Schedule Management - Playwright end-to-end testing
 * Complete user journey testing with real browser interactions
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const testSchedule = {
  title: 'E2E Test Schedule',
  description: 'Schedule created during E2E testing',
  instructor: 'Dr. Smith',
  classroom: 'Room A-101',
  program: 'Computer Science',
  day: 'monday',
  startTime: '09:00',
  endTime: '10:30'
}

const testUser = {
  email: 'coordinator@schedium.test',
  password: 'test123456',
  role: 'coordinator'
}

// Page object for Schedule Management
class SchedulePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/schedules')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForMatrix() {
    await this.page.waitForSelector('[data-testid="schedule-matrix"]', { timeout: 10000 })
  }

  async openNewScheduleDialog() {
    await this.page.click('button:has-text("New Schedule")')
    await this.page.waitForSelector('dialog[aria-label*="Create Schedule"]')
  }

  async fillScheduleForm(schedule: typeof testSchedule) {
    // Fill basic information
    await this.page.fill('input[name="title"]', schedule.title)
    await this.page.fill('textarea[name="description"]', schedule.description)
    
    // Select dropdowns
    await this.page.selectOption('select[name="program"]', { label: schedule.program })
    await this.page.selectOption('select[name="instructor"]', { label: schedule.instructor })
    await this.page.selectOption('select[name="classroom"]', { label: schedule.classroom })
    await this.page.selectOption('select[name="dayOfWeek"]', schedule.day)
    
    // Time inputs
    await this.page.fill('input[name="startTime"]', schedule.startTime)
    await this.page.fill('input[name="endTime"]', schedule.endTime)
  }

  async saveSchedule() {
    await this.page.click('button:has-text("Save Schedule")')
  }

  async findScheduleCard(title: string) {
    return this.page.locator(`[data-testid="schedule-card"]:has-text("${title}")`)
  }

  async openContextMenu(scheduleTitle: string) {
    const scheduleCard = await this.findScheduleCard(scheduleTitle)
    await scheduleCard.click({ button: 'right' })
    await this.page.waitForSelector('role=menu')
  }

  async dragScheduleToSlot(scheduleTitle: string, targetDay: string, targetTime: string) {
    const scheduleCard = await this.findScheduleCard(scheduleTitle)
    const targetSlot = this.page.locator(`[data-testid="time-slot-${targetDay}-${targetTime.replace(':', '-')}"]`)
    
    await scheduleCard.dragTo(targetSlot)
  }

  async getConflictIndicators() {
    return this.page.locator('[data-testid*="conflict-indicator"]')
  }

  async openConflictResolution() {
    await this.page.click('[data-testid="conflict-indicator"]')
    await this.page.waitForSelector('dialog[aria-label*="Resolve Conflict"]')
  }
}

// Page object for Authentication
class AuthPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login')
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')
    
    // Wait for navigation to dashboard
    await this.page.waitForURL('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('text=Logout')
    await this.page.waitForURL('/login')
  }
}

test.describe('Schedule Management E2E', () => {
  let schedulePage: SchedulePage
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    schedulePage = new SchedulePage(page)
    authPage = new AuthPage(page)
    
    // Login before each test
    await authPage.login(testUser.email, testUser.password)
  })

  test.afterEach(async ({ page }) => {
    // Clean up - delete test schedules
    try {
      await schedulePage.goto()
      await schedulePage.waitForMatrix()
      
      const testScheduleCard = await schedulePage.findScheduleCard(testSchedule.title)
      if (await testScheduleCard.count() > 0) {
        await schedulePage.openContextMenu(testSchedule.title)
        await page.click('text=Delete')
        await page.click('button:has-text("Confirm")')
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  test('should create a new schedule successfully', async ({ page }) => {
    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/schedule-matrix-initial.png' })

    // Open new schedule dialog
    await schedulePage.openNewScheduleDialog()

    // Take screenshot of form
    await page.screenshot({ path: 'test-results/new-schedule-form.png' })

    // Fill and submit form
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()

    // Wait for success notification
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Verify schedule appears in matrix
    const scheduleCard = await schedulePage.findScheduleCard(testSchedule.title)
    await expect(scheduleCard).toBeVisible()

    // Verify schedule details
    await expect(scheduleCard.locator('text=' + testSchedule.instructor)).toBeVisible()
    await expect(scheduleCard.locator('text=' + testSchedule.classroom)).toBeVisible()

    // Take screenshot of result
    await page.screenshot({ path: 'test-results/schedule-created.png' })
  })

  test('should validate form inputs and show errors', async ({ page }) => {
    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    await schedulePage.openNewScheduleDialog()

    // Try to save empty form
    await schedulePage.saveSchedule()

    // Verify validation errors
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Instructor is required')).toBeVisible()
    await expect(page.locator('text=Classroom is required')).toBeVisible()

    // Dialog should remain open
    await expect(page.locator('dialog[aria-label*="Create Schedule"]')).toBeVisible()

    // Take screenshot of validation errors
    await page.screenshot({ path: 'test-results/validation-errors.png' })
  })

  test('should edit an existing schedule', async ({ page }) => {
    // First create a schedule
    await schedulePage.goto()
    await schedulePage.waitForMatrix()
    
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()
    
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Now edit it
    await schedulePage.openContextMenu(testSchedule.title)
    await page.click('text=Edit')

    // Wait for edit dialog
    await page.waitForSelector('dialog[aria-label*="Edit Schedule"]')

    // Modify title
    const modifiedTitle = testSchedule.title + ' (Modified)'
    await page.fill('input[name="title"]', modifiedTitle)

    // Change time
    await page.fill('input[name="startTime"]', '10:00')
    await page.fill('input[name="endTime"]', '11:30')

    // Save changes
    await page.click('button:has-text("Save Changes")')

    // Verify update notification
    await expect(page.locator('text=Schedule updated successfully')).toBeVisible()

    // Verify changes in matrix
    const updatedCard = await schedulePage.findScheduleCard(modifiedTitle)
    await expect(updatedCard).toBeVisible()
    
    // Original card should not exist
    const originalCard = await schedulePage.findScheduleCard(testSchedule.title)
    await expect(originalCard).not.toBeVisible()

    // Take screenshot of updated schedule
    await page.screenshot({ path: 'test-results/schedule-edited.png' })
  })

  test('should move schedule via drag and drop', async ({ page }) => {
    // Create test schedule
    await schedulePage.goto()
    await schedulePage.waitForMatrix()
    
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()
    
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Take screenshot before drag
    await page.screenshot({ path: 'test-results/before-drag.png' })

    // Drag schedule to different time slot
    await schedulePage.dragScheduleToSlot(testSchedule.title, 'tuesday', '11:00')

    // Wait for move operation to complete
    await page.waitForTimeout(1000)

    // Take screenshot after drag
    await page.screenshot({ path: 'test-results/after-drag.png' })

    // Verify schedule moved to Tuesday column
    const tuesdayColumn = page.locator('[data-testid="day-column-tuesday"]')
    await expect(tuesdayColumn.locator(`text=${testSchedule.title}`)).toBeVisible()

    // Verify it's no longer in Monday column
    const mondayColumn = page.locator('[data-testid="day-column-monday"]')
    await expect(mondayColumn.locator(`text=${testSchedule.title}`)).not.toBeVisible()
  })

  test('should detect and resolve conflicts', async ({ page }) => {
    // Create first schedule
    await schedulePage.goto()
    await schedulePage.waitForMatrix()
    
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()
    
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Create conflicting schedule
    const conflictingSchedule = {
      ...testSchedule,
      title: 'Conflicting Schedule',
      startTime: '09:30', // Overlaps with first schedule
      endTime: '11:00'
    }

    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(conflictingSchedule)
    await schedulePage.saveSchedule()

    // Should detect conflict
    await expect(page.locator('text=Conflict detected')).toBeVisible()

    // Wait for conflict indicators to appear
    await page.waitForSelector('[data-testid*="conflict-indicator"]', { timeout: 5000 })

    // Take screenshot of conflict state
    await page.screenshot({ path: 'test-results/conflict-detected.png' })

    // Open conflict resolution
    await schedulePage.openConflictResolution()

    // Verify conflict details
    await expect(page.locator('text=overlapping schedules')).toBeVisible()

    // Apply first suggestion
    await page.click('button:has-text("Apply"):first')

    // Wait for resolution
    await expect(page.locator('text=Conflict resolved')).toBeVisible()

    // Conflict indicators should disappear
    const conflictIndicators = await schedulePage.getConflictIndicators()
    await expect(conflictIndicators).toHaveCount(0)

    // Take screenshot of resolved state
    await page.screenshot({ path: 'test-results/conflict-resolved.png' })
  })

  test('should filter schedules by instructor', async ({ page }) => {
    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    // Create schedules with different instructors
    const schedule1 = { ...testSchedule, title: 'Schedule 1', instructor: 'Dr. Smith' }
    const schedule2 = { ...testSchedule, title: 'Schedule 2', instructor: 'Prof. Johnson', day: 'tuesday' }

    // Create first schedule
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(schedule1)
    await schedulePage.saveSchedule()
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Create second schedule
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(schedule2)
    await schedulePage.saveSchedule()
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Apply instructor filter
    await page.selectOption('select[name="instructorFilter"]', { label: 'Dr. Smith' })

    // Wait for filter to apply
    await page.waitForTimeout(1000)

    // Verify only Dr. Smith's schedules are visible
    await expect(page.locator('text=Schedule 1')).toBeVisible()
    await expect(page.locator('text=Schedule 2')).not.toBeVisible()

    // Clear filter
    await page.selectOption('select[name="instructorFilter"]', { label: 'All Instructors' })

    // Both schedules should be visible again
    await expect(page.locator('text=Schedule 1')).toBeVisible()
    await expect(page.locator('text=Schedule 2')).toBeVisible()

    // Take screenshot of filtered view
    await page.screenshot({ path: 'test-results/filtered-schedules.png' })
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    // Intercept API calls and simulate network error
    await page.route('**/api/v1/schedules', route => {
      route.abort('failed')
    })

    // Try to create schedule
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()

    // Should show error message
    await expect(page.locator('text=Network error')).toBeVisible()
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()

    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/network-error.png' })

    // Remove network intercept
    await page.unroute('**/api/v1/schedules')

    // Retry should work
    await page.click('button:has-text("Retry")')
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()
  })

  test('should work correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    // Take screenshot of mobile view
    await page.screenshot({ path: 'test-results/mobile-matrix.png' })

    // Mobile should show different layout
    await expect(page.locator('[data-testid="mobile-schedule-list"]')).toBeVisible()

    // Test mobile interactions
    await page.click('button:has-text("New Schedule")')
    
    // Mobile form should be full screen
    const dialog = page.locator('dialog')
    await expect(dialog).toHaveClass(/mobile-fullscreen/)

    // Fill form on mobile
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()

    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Take screenshot of mobile success state
    await page.screenshot({ path: 'test-results/mobile-success.png' })
  })

  test('should support keyboard navigation', async ({ page }) => {
    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    // Focus on matrix
    await page.focus('[data-testid="schedule-matrix"]')

    // Use keyboard navigation
    await page.keyboard.press('Tab') // Focus first schedule
    await page.keyboard.press('Enter') // Select schedule
    
    // Should show selection
    const selectedCard = page.locator('[data-testid="schedule-card"].selected')
    await expect(selectedCard).toBeVisible()

    // Use arrow keys to navigate
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')

    // Context menu with keyboard
    await page.keyboard.press('F10') // Context menu key
    await expect(page.locator('role=menu')).toBeVisible()

    // Navigate menu with arrows
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Take screenshot of keyboard navigation
    await page.screenshot({ path: 'test-results/keyboard-navigation.png' })
  })

  test('should maintain state during page reload', async ({ page }) => {
    await schedulePage.goto()
    await schedulePage.waitForMatrix()

    // Create schedule
    await schedulePage.openNewScheduleDialog()
    await schedulePage.fillScheduleForm(testSchedule)
    await schedulePage.saveSchedule()
    
    await expect(page.locator('text=Schedule created successfully')).toBeVisible()

    // Apply filter
    await page.selectOption('select[name="instructorFilter"]', { label: 'Dr. Smith' })

    // Reload page
    await page.reload()
    await schedulePage.waitForMatrix()

    // Schedule should still be there
    await expect(page.locator(`text=${testSchedule.title}`)).toBeVisible()

    // Filter should be maintained (if implemented)
    const filterValue = await page.inputValue('select[name="instructorFilter"]')
    expect(filterValue).toBe('1') // Dr. Smith's ID
  })
})

test.describe('Performance Tests', () => {
  test('should load schedule matrix within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/schedules')
    await page.waitForSelector('[data-testid="schedule-matrix"]')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics: any = {}
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.FCP = entry.startTime
            }
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.LCP = entry.startTime
            }
          })
          
          resolve(metrics)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000)
      })
    })
    
    console.log('Performance metrics:', metrics)
  })

  test('should handle large number of schedules efficiently', async ({ page }) => {
    // Mock API to return large dataset
    await page.route('**/api/v1/schedules', route => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        id: `schedule-${i}`,
        title: `Schedule ${i}`,
        startTime: '09:00',
        endTime: '10:30',
        dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5],
        instructorId: `instructor-${i % 10}`,
        classroomId: `classroom-${i % 5}`,
      }))
      
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      })
    })

    const startTime = Date.now()
    
    await page.goto('/schedules')
    await page.waitForSelector('[data-testid="schedule-matrix"]')
    
    const loadTime = Date.now() - startTime
    
    // Should still load within reasonable time with large dataset
    expect(loadTime).toBeLessThan(5000)
    
    // Take screenshot of large dataset
    await page.screenshot({ path: 'test-results/large-dataset.png' })
  })
})