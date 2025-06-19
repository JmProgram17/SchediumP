import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile badge component for displaying status, categories, or labels. Part of the SENA CGMLTI design system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'outline'],
      description: 'The visual style variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the badge',
    },
    dot: {
      control: 'boolean',
      description: 'Whether to show a dot indicator',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
}

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
}

export const WithDot: Story = {
  args: {
    children: 'Active',
    variant: 'success',
    dot: true,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available badge variants displayed together for comparison.',
      },
    },
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available badge sizes displayed together for comparison.',
      },
    },
  },
}

export const WithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" dot>Online</Badge>
      <Badge variant="warning" dot>Away</Badge>
      <Badge variant="error" dot>Offline</Badge>
      <Badge variant="primary" dot>Active</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges with dot indicators for status display.',
      },
    },
  },
}

export const StatusExample: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Sistema de Autenticación</span>
        <Badge variant="success" dot size="sm">Activo</Badge>
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Base de Datos</span>
        <Badge variant="warning" dot size="sm">Mantenimiento</Badge>
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>API Externa</span>
        <Badge variant="error" dot size="sm">Error</Badge>
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Cache Redis</span>
        <Badge variant="outline" size="sm">Deshabilitado</Badge>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Example of badges used for system status indicators.',
      },
    },
  },
}

export const UserRoles: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">Juan Pérez:</span>
        <Badge variant="primary" size="sm">Administrador</Badge>
        <Badge variant="secondary" size="sm">Instructor</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">María González:</span>
        <Badge variant="secondary" size="sm">Aprendiz</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Carlos López:</span>
        <Badge variant="primary" size="sm">Coordinador</Badge>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Example of badges used for displaying user roles.',
      },
    },
  },
}