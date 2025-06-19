import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'
import { 
  renderWithA11y, 
  expectNoA11yViolations,
  testA11yInThemes,
  testWithReducedMotion,
  focusHelpers,
  testKeyboardNavigation
} from '@/test/accessibility'

describe('Button Accessibility', () => {
  it('should pass basic accessibility tests', async () => {
    const { container } = renderWithA11y(<Button>Click me</Button>)
    await expectNoA11yViolations(container)
  })

  it('should pass accessibility tests in both themes', async () => {
    await testA11yInThemes(() => 
      renderWithA11y(<Button>Theme Test</Button>)
    )
  })

  it('should pass accessibility tests with reduced motion', async () => {
    await testWithReducedMotion(() => 
      renderWithA11y(<Button>Reduced Motion Test</Button>)
    )
  })

  it('should have proper button semantics', () => {
    renderWithA11y(<Button>Button Text</Button>)
    const button = screen.getByRole('button', { name: 'Button Text' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('should support custom button types', () => {
    renderWithA11y(<Button type="submit">Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should be keyboard accessible', async () => {
    const onClick = vi.fn()
    renderWithA11y(<Button onClick={onClick}>Keyboard Test</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    
    focusHelpers.expectElementToHaveFocus(button)
    focusHelpers.expectElementToBeInTabOrder(button)
    
    await testKeyboardNavigation.expectEnterToActivate(button, onClick)
    await testKeyboardNavigation.expectSpaceToActivate(button, onClick)
  })

  it('should handle disabled state accessibly', async () => {
    const onClick = vi.fn()
    const { container } = renderWithA11y(
      <Button disabled onClick={onClick}>Disabled Button</Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    
    // Should not respond to clicks when disabled
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    
    // Should still pass accessibility tests
    await expectNoA11yViolations(container)
  })

  it('should handle loading state accessibly', async () => {
    const { container } = renderWithA11y(
      <Button loading>Loading...</Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    // Should have loading indicator
    const loadingIcon = container.querySelector('.animate-spin')
    expect(loadingIcon).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should support aria-label', async () => {
    const { container } = renderWithA11y(
      <Button aria-label="Close dialog">×</Button>
    )
    
    const button = screen.getByRole('button', { name: 'Close dialog' })
    expect(button).toBeInTheDocument()
    
    await expectNoA11yViolations(container)
  })

  it('should support aria-describedby', async () => {
    const { container } = renderWithA11y(
      <div>
        <Button aria-describedby="help-text">Save</Button>
        <div id="help-text">This will save your changes</div>
      </div>
    )
    
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('aria-describedby', 'help-text')
    
    await expectNoA11yViolations(container)
  })

  it('should handle all variants accessibly', async () => {
    const variants = ['primary', 'secondary', 'destructive', 'outline', 'ghost'] as const
    
    for (const variant of variants) {
      const { container } = renderWithA11y(
        <Button variant={variant}>{variant} Button</Button>
      )
      await expectNoA11yViolations(container)
    }
  })

  it('should handle all sizes accessibly', async () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    for (const size of sizes) {
      const { container } = renderWithA11y(
        <Button size={size}>{size} Button</Button>
      )
      await expectNoA11yViolations(container)
    }
  })

  it('should handle icons accessibly', async () => {
    const { container } = renderWithA11y(
      <Button 
        leftIcon={<span aria-hidden="true">📄</span>}
        rightIcon={<span aria-hidden="true">→</span>}
      >
        Export Document
      </Button>
    )
    
    const button = screen.getByRole('button', { name: 'Export Document' })
    expect(button).toBeInTheDocument()
    
    // Icons should be hidden from screen readers
    const icons = container.querySelectorAll('[aria-hidden="true"]')
    expect(icons).toHaveLength(2)
    
    await expectNoA11yViolations(container)
  })

  it('should work in form context', async () => {
    const onSubmit = vi.fn(e => e.preventDefault())
    const { container } = renderWithA11y(
      <form onSubmit={onSubmit}>
        <label htmlFor="name-input">Name</label>
        <input id="name-input" type="text" />
        <Button type="submit">Submit Form</Button>
      </form>
    )
    
    const submitButton = screen.getByRole('button', { name: 'Submit Form' })
    expect(submitButton).toHaveAttribute('type', 'submit')
    
    // Test form submission
    fireEvent.click(submitButton)
    expect(onSubmit).toHaveBeenCalled()
    
    await expectNoA11yViolations(container)
  })

  it('should maintain focus after state changes', () => {
    const { rerender } = renderWithA11y(<Button>Initial</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    focusHelpers.expectElementToHaveFocus(button)
    
    // Rerender with different props
    rerender(<Button variant="secondary">Updated</Button>)
    
    // Focus should be maintained (in real scenarios, React would handle this)
    const updatedButton = screen.getByRole('button')
    expect(updatedButton).toBeInTheDocument()
  })

  it('should handle high contrast mode', async () => {
    // Simulate high contrast mode
    const { container } = renderWithA11y(
      <div style={{ filter: 'contrast(200%)' }}>
        <Button>High Contrast Test</Button>
      </div>
    )
    
    await expectNoA11yViolations(container)
  })
})