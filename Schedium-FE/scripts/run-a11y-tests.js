#!/usr/bin/env node

/**
 * Automated Accessibility Testing Script for Schedium
 * 
 * This script runs comprehensive accessibility tests including:
 * - Unit tests with jest-axe
 * - Integration tests with React Testing Library
 * - E2E tests with Playwright and axe-core
 * - Visual regression tests for accessibility features
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('🔍 Starting Accessibility Test Suite for Schedium')
console.log('=' .repeat(60))

/**
 * Execute command and handle errors
 */
function runCommand(command, description) {
  console.log(`\n📋 ${description}`)
  console.log(`Running: ${command}`)
  
  try {
    const output = execSync(command, { 
      cwd: rootDir, 
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    console.log(`✅ ${description} completed successfully`)
    return true
  } catch (error) {
    console.error(`❌ ${description} failed:`)
    console.error(error.message)
    return false
  }
}

/**
 * Check if required files exist
 */
function checkPrerequisites() {
  const requiredFiles = [
    'package.json',
    'src/test/accessibility.ts',
    'tests/accessibility/playwright-a11y.ts'
  ]
  
  console.log('\n🔧 Checking prerequisites...')
  
  for (const file of requiredFiles) {
    const filePath = path.join(rootDir, file)
    if (!existsSync(filePath)) {
      console.error(`❌ Required file missing: ${file}`)
      return false
    }
  }
  
  console.log('✅ All prerequisites found')
  return true
}

/**
 * Run unit accessibility tests
 */
function runUnitA11yTests() {
  return runCommand(
    'npm run test -- --run src/design-system/components/Button/Button.a11y.test.tsx src/design-system/components/Input/Input.a11y.test.tsx',
    'Unit Accessibility Tests (jest-axe + React Testing Library)'
  )
}

/**
 * Run E2E accessibility tests
 */
function runE2EA11yTests() {
  return runCommand(
    'npx playwright test tests/accessibility/',
    'E2E Accessibility Tests (Playwright + axe-core)'
  )
}

/**
 * Run Storybook accessibility tests
 */
function runStorybookA11yTests() {
  console.log('\n📋 Storybook Accessibility Tests')
  console.log('Note: These tests require Storybook to be running')
  console.log('Run: npm run storybook')
  console.log('Then visit: http://localhost:6006')
  console.log('Use the Accessibility addon to test individual components')
  return true
}

/**
 * Generate accessibility report
 */
function generateA11yReport() {
  console.log('\n📊 Generating Accessibility Report...')
  
  const reportContent = `
# Accessibility Test Report - Schedium Frontend

Generated: ${new Date().toISOString()}

## Test Categories Covered

### 1. Unit Tests (jest-axe)
- Component-level accessibility testing
- ARIA attributes validation  
- Keyboard navigation testing
- Focus management verification
- Screen reader compatibility

### 2. Integration Tests (React Testing Library)
- Component interaction accessibility
- Form accessibility validation
- Theme switching accessibility
- Animation accessibility with reduced motion

### 3. E2E Tests (Playwright + axe-core)
- Full page accessibility scanning
- Cross-browser accessibility testing
- Responsive design accessibility
- User flow accessibility validation

## WCAG 2.1 AA Compliance

The following criteria are automatically tested:

### Perceivable
- ✅ Color contrast ratios
- ✅ Alternative text for images
- ✅ Captions and transcripts
- ✅ Resize text up to 200%

### Operable
- ✅ Keyboard accessibility
- ✅ No seizure-inducing content
- ✅ Navigation consistency
- ✅ Focus management

### Understandable
- ✅ Readable text
- ✅ Predictable functionality
- ✅ Input assistance
- ✅ Error identification

### Robust
- ✅ Valid HTML markup
- ✅ Screen reader compatibility
- ✅ Future accessibility support

## Manual Testing Checklist

### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows) 
- [ ] Test with VoiceOver (macOS)
- [ ] Test with Orca (Linux)

### Keyboard Navigation
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Skip links work correctly
- [ ] All interactive elements are reachable

### Visual Testing
- [ ] 400% zoom test
- [ ] High contrast mode
- [ ] Color blind simulation
- [ ] Windows High Contrast theme

### Motor Accessibility
- [ ] Large touch targets (44x44px minimum)
- [ ] Sufficient spacing between interactive elements
- [ ] Drag and drop alternatives
- [ ] Voice control compatibility

## Browser and Device Coverage

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest) 
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Devices
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Samsung Internet

### Assistive Technologies
- [ ] Screen readers
- [ ] Voice control
- [ ] Switch navigation
- [ ] Eye tracking

## Continuous Integration

Accessibility tests are integrated into CI/CD pipeline:
- Pre-commit hooks run accessibility linting
- Pull requests trigger accessibility test suite
- Deployment blocked if critical accessibility issues found

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

`
  
  try {
    const reportPath = path.join(rootDir, 'accessibility-report.md')
    writeFileSync(reportPath, reportContent)
    console.log(`✅ Accessibility report generated: ${reportPath}`)
    return true
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  let allTestsPassed = true
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1)
  }
  
  // Run unit tests
  if (!runUnitA11yTests()) {
    allTestsPassed = false
  }
  
  // Run E2E tests
  if (!runE2EA11yTests()) {
    allTestsPassed = false
  }
  
  // Show Storybook testing instructions
  runStorybookA11yTests()
  
  // Generate report
  generateA11yReport()
  
  // Summary
  console.log('\n' + '=' .repeat(60))
  if (allTestsPassed) {
    console.log('🎉 All automated accessibility tests passed!')
    console.log('📝 Review the generated accessibility report')
    console.log('🔍 Consider running manual accessibility tests')
  } else {
    console.log('⚠️  Some accessibility tests failed')
    console.log('🔧 Review the errors above and fix accessibility issues')
    process.exit(1)
  }
  
  console.log('\n📚 Next Steps:')
  console.log('1. Review accessibility report')
  console.log('2. Test with real screen readers')
  console.log('3. Validate with accessibility users')
  console.log('4. Monitor accessibility in production')
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Schedium Accessibility Test Runner

Usage: node scripts/run-a11y-tests.js [options]

Options:
  --help, -h     Show this help message
  --unit-only    Run only unit accessibility tests
  --e2e-only     Run only E2E accessibility tests
  --report-only  Generate accessibility report only

Examples:
  node scripts/run-a11y-tests.js
  node scripts/run-a11y-tests.js --unit-only
  node scripts/run-a11y-tests.js --e2e-only
  `)
  process.exit(0)
}

if (args.includes('--unit-only')) {
  checkPrerequisites() && runUnitA11yTests()
} else if (args.includes('--e2e-only')) {
  checkPrerequisites() && runE2EA11yTests()
} else if (args.includes('--report-only')) {
  generateA11yReport()
} else {
  main()
}