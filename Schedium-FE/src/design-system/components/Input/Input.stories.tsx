import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with label, error states, and icon support. Part of the SENA CGMLTI design system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the input field',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'The type of the input field',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
}

export const WithError: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    error: 'This field is required',
    defaultValue: '',
  },
}

export const Required: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit this',
    disabled: true,
    defaultValue: 'This is disabled',
  },
}

export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    defaultValue: 'secretpassword',
  },
}

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
}

export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter email',
    type: 'email',
    rightIcon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    ),
  },
}

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    label: 'Medium Input',
    placeholder: 'Medium size',
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
}

export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    placeholder: 'This input takes full width',
  },
  parameters: {
    layout: 'padded',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input size="sm" label="Small" placeholder="Small input" />
      <Input size="md" label="Medium" placeholder="Medium input" />
      <Input size="lg" label="Large" placeholder="Large input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available input sizes displayed together for comparison.',
      },
    },
  },
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="First Name"
        placeholder="Enter your first name"
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
        leftIcon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
        error="Password must be at least 8 characters"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of how inputs might be used in a form with validation.',
      },
    },
  },
}