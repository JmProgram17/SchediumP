import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Input } from './Input'
import { 
  renderWithA11y, 
  expectNoA11yViolations,
  testA11yInThemes,
  a11yTestScenarios,
  focusHelpers
} from '@/test/accessibility'

describe('Input Accessibility', () => {
  it('should pass basic accessibility tests', async () => {
    const { container } = renderWithA11y(
      <Input label="Email" placeholder="Enter your email" />
    )
    await expectNoA11yViolations(container)
  })

  it('should pass form-specific accessibility tests', async () => {
    const { container } = renderWithA11y(
      <Input label="Email" placeholder="Enter your email" />
    )
    await a11yTestScenarios.forms(container)
  })

  it('should pass accessibility tests in both themes', async () => {
    await testA11yInThemes(() => 
      renderWithA11y(<Input label="Theme Test" />)
    )
  })

  it('should have proper label association', () => {
    renderWithA11y(<Input label="Full Name" />)
    
    const input = screen.getByLabelText('Full Name')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should handle required fields accessibly', async () => {
    const { container } = renderWithA11y(
      <Input label="Required Field" required />
    )
    
    const input = screen.getByLabelText(/Required Field/)
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-required', 'true')
    
    await expectNoA11yViolations(container)
  })

  it('should handle error states accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Email" 
        error="Please enter a valid email address"
        defaultValue="invalid-email"
      />
    )
    
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    
    // Error should be associated with input
    const errorMessage = screen.getByText('Please enter a valid email address')
    expect(errorMessage).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-describedby')
    
    await expectNoA11yViolations(container)
  })

  it('should handle success states accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Username" 
        success="Username is available"
        defaultValue="john_doe"
      />
    )
    
    const input = screen.getByLabelText('Username')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    
    const successMessage = screen.getByText('Username is available')
    expect(successMessage).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should be keyboard accessible', () => {
    renderWithA11y(<Input label="Test Input" />)
    
    const input = screen.getByLabelText('Test Input')
    input.focus()
    
    focusHelpers.expectElementToHaveFocus(input)
    focusHelpers.expectElementToBeInTabOrder(input)
  })

  it('should handle disabled state accessibly', async () => {
    const { container } = renderWithA11y(
      <Input label="Disabled Input" disabled defaultValue="Cannot edit" />
    )
    
    const input = screen.getByLabelText('Disabled Input')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-disabled', 'true')
    
    await expectNoA11yViolations(container)
  })

  it('should handle different input types accessibly', async () => {
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url'] as const
    
    for (const type of inputTypes) {
      const { container } = renderWithA11y(
        <Input label={`${type} input`} type={type} />
      )
      
      const input = screen.getByLabelText(`${type} input`)
      expect(input).toHaveAttribute('type', type)
      
      await expectNoA11yViolations(container)
    }
  })

  it('should handle icons accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Search"
        leftIcon={
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          <button type="button" aria-label="Clear search">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        }
      />
    )
    
    const input = screen.getByLabelText('Search')
    expect(input).toBeInTheDocument()
    
    // Left icon should be decorative
    const leftIcon = container.querySelector('[aria-hidden="true"]')
    expect(leftIcon).toBeInTheDocument()
    
    // Right icon (clear button) should be accessible
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should handle description text accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Password"
        description="Must be at least 8 characters long"
        type="password"
      />
    )
    
    const input = screen.getByLabelText('Password')
    const description = screen.getByText('Must be at least 8 characters long')
    
    expect(input).toHaveAttribute('aria-describedby')
    expect(description).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should handle placeholder text accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Email Address"
        placeholder="example@company.com"
      />
    )
    
    const input = screen.getByLabelText('Email Address')
    expect(input).toHaveAttribute('placeholder', 'example@company.com')
    
    // Placeholder should not be the only way to identify the field
    expect(input).toHaveAccessibleName()
    
    await expectNoA11yViolations(container)
  })

  it('should handle all sizes accessibly', async () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    for (const size of sizes) {
      const { container } = renderWithA11y(
        <Input label={`${size} Input`} size={size} />
      )
      await expectNoA11yViolations(container)
    }
  })

  it('should work with form context', async () => {
    const { container } = renderWithA11y(
      <form>
        <fieldset>
          <legend>User Information</legend>
          <Input label="First Name" required />
          <Input label="Last Name" required />
          <Input label="Email" type="email" required />
        </fieldset>
      </form>
    )
    
    // Check that all inputs are properly labeled
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should handle autofill attributes accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Email"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
      />
    )
    
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('autocapitalize', 'none')
    expect(input).toHaveAttribute('autocorrect', 'off')
    
    await expectNoA11yViolations(container)
  })

  it('should handle password visibility toggle accessibly', async () => {
    const { container } = renderWithA11y(
      <Input 
        label="Password"
        type="password"
        rightIcon={
          <button type="button" aria-label="Show password">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        }
      />
    )
    
    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = screen.getByLabelText('Show password')
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(toggleButton).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should handle multiple validation states', async () => {
    const { container, rerender } = renderWithA11y(
      <Input label="Username" />
    )
    
    // Initially valid
    await expectNoA11yViolations(container)
    
    // With error
    rerender(
      <Input 
        label="Username" 
        error="Username is required"
        defaultValue=""
      />
    )
    await expectNoA11yViolations(container)
    
    // With success
    rerender(
      <Input 
        label="Username" 
        success="Username is available"
        defaultValue="john_doe"
      />
    )
    await expectNoA11yViolations(container)
  })
})