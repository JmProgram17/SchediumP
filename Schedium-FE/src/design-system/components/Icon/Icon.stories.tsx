import type { Meta, StoryObj } from '@storybook/react'
import { Icon } from './Icon'
import * as Icons from './icons'

const meta: Meta<typeof Icon> = {
  title: 'Design System/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible icon system with size and color variants. Includes a comprehensive set of pre-built icons for the SENA CGMLTI application.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'The size of the icon',
    },
    color: {
      control: 'select',
      options: ['current', 'primary', 'secondary', 'success', 'warning', 'error', 'muted'],
      description: 'The color theme of the icon',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icons.UserIcon size="xs" />
      <Icons.UserIcon size="sm" />
      <Icons.UserIcon size="md" />
      <Icons.UserIcon size="lg" />
      <Icons.UserIcon size="xl" />
      <Icons.UserIcon size="2xl" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available icon sizes displayed together for comparison.',
      },
    },
  },
}

export const AllColors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icons.UserIcon color="current" />
      <Icons.UserIcon color="primary" />
      <Icons.UserIcon color="secondary" />
      <Icons.UserIcon color="success" />
      <Icons.UserIcon color="warning" />
      <Icons.UserIcon color="error" />
      <Icons.UserIcon color="muted" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available icon colors displayed together for comparison.',
      },
    },
  },
}

export const AuthenticationIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icons.UserIcon size="lg" color="primary" />
        <span className="text-sm">UserIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.LockIcon size="lg" color="primary" />
        <span className="text-sm">LockIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.EyeIcon size="lg" color="primary" />
        <span className="text-sm">EyeIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.EyeOffIcon size="lg" color="primary" />
        <span className="text-sm">EyeOffIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.LogoutIcon size="lg" color="primary" />
        <span className="text-sm">LogoutIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons commonly used for authentication and user management.',
      },
    },
  },
}

export const NavigationIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icons.HomeIcon size="lg" color="primary" />
        <span className="text-sm">HomeIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.MenuIcon size="lg" color="primary" />
        <span className="text-sm">MenuIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.SearchIcon size="lg" color="primary" />
        <span className="text-sm">SearchIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons used for navigation and app structure.',
      },
    },
  },
}

export const ActionIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icons.PlusIcon size="lg" color="success" />
        <span className="text-sm">PlusIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.EditIcon size="lg" color="primary" />
        <span className="text-sm">EditIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.DeleteIcon size="lg" color="error" />
        <span className="text-sm">DeleteIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.SaveIcon size="lg" color="success" />
        <span className="text-sm">SaveIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons for common actions like create, edit, delete, and save.',
      },
    },
  },
}

export const StatusIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icons.CheckIcon size="lg" color="success" />
        <span className="text-sm">CheckIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.XIcon size="lg" color="error" />
        <span className="text-sm">XIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.AlertIcon size="lg" color="warning" />
        <span className="text-sm">AlertIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.InfoIcon size="lg" color="primary" />
        <span className="text-sm">InfoIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons for displaying status and feedback to users.',
      },
    },
  },
}

export const AcademicIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icons.BookIcon size="lg" color="primary" />
        <span className="text-sm">BookIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.CertificateIcon size="lg" color="secondary" />
        <span className="text-sm">CertificateIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.AcademicCapIcon size="lg" color="primary" />
        <span className="text-sm">AcademicCapIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons specifically for academic and educational contexts.',
      },
    },
  },
}

export const ThemeIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icons.SunIcon size="lg" color="warning" />
        <span className="text-sm">SunIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.MoonIcon size="lg" color="primary" />
        <span className="text-sm">MoonIcon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icons.LoadingIcon size="lg" color="primary" />
        <span className="text-sm">LoadingIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons for theme switching and loading states.',
      },
    },
  },
}

export const AllIcons: Story = {
  render: () => {
    const iconComponents = Object.entries(Icons).filter(([key]) => key.endsWith('Icon'))
    
    return (
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4 max-w-4xl">
        {iconComponents.map(([name, IconComponent]) => (
          <div key={name} className="flex flex-col items-center gap-2 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
            <IconComponent size="lg" color="primary" />
            <span className="text-xs text-center break-words">{name}</span>
          </div>
        ))}
      </div>
    )
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Complete collection of all available icons in the system.',
      },
    },
  },
}

export const InContext: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      {/* Form with icons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icons.UserIcon size="md" color="primary" />
          Perfil de Usuario
        </h3>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Icons.EmailIcon size="md" color="muted" />
          <span>usuario@sena.edu.co</span>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Icons.PhoneIcon size="md" color="muted" />
          <span>+57 300 123 4567</span>
        </div>
      </div>

      {/* Action buttons with icons */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Icons.EditIcon size="sm" />
          Editar Perfil
        </button>
        <button className="w-full flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          <Icons.SettingsIcon size="sm" />
          Configuración
        </button>
        <button className="w-full flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700">
          <Icons.LogoutIcon size="sm" />
          Cerrar Sesión
        </button>
      </div>

      {/* Status indicators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <span className="text-sm">Estado del sistema</span>
          <Icons.CheckIcon size="sm" color="success" />
        </div>
        <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <span className="text-sm">Mantenimiento programado</span>
          <Icons.AlertIcon size="sm" color="warning" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of how icons are used in real application contexts.',
      },
    },
  },
}