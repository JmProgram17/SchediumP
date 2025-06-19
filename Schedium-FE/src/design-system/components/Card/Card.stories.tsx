import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardContent } from './Card'
import { Badge } from '../Badge'
import { Button } from '../Button'

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with header, title, and content sections. Part of the SENA CGMLTI design system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated'],
      description: 'The visual style variant of the card',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <p>This is a simple card with just content.</p>
      </CardContent>
    </Card>
  ),
}

export const WithHeader: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This card has a header with a title and some content below.</p>
      </CardContent>
    </Card>
  ),
}

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This card has an elevated shadow for more visual prominence.</p>
      </CardContent>
    </Card>
  ),
}

export const UserProfile: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Perfil de Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre:</span>
            <span className="text-sm">Juan Pérez García</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
            <span className="text-sm">juan.perez@sena.edu.co</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rol:</span>
            <Badge variant="primary" size="sm">Instructor</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado:</span>
            <Badge variant="success" size="sm" dot>Activo</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a card used for displaying user profile information.',
      },
    },
  },
}

export const SystemStatus: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Estado del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Base de Datos</span>
            <Badge variant="success" size="sm">Activo</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">API Gateway</span>
            <Badge variant="success" size="sm">Activo</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Cache Redis</span>
            <Badge variant="warning" size="sm">Lento</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Sistema de Archivos</span>
            <Badge variant="error" size="sm">Error</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a card used for displaying system status information.',
      },
    },
  },
}

export const CourseCard: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Desarrollo de Software</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Programa técnico en desarrollo de aplicaciones web y móviles.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary" size="sm">Web</Badge>
            <Badge variant="secondary" size="sm">JavaScript</Badge>
            <Badge variant="outline" size="sm">React</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Duración: 18 meses</span>
            <Badge variant="success" size="sm">Activo</Badge>
          </div>
          <Button variant="primary" size="sm" fullWidth>
            Ver Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a card used for displaying course information.',
      },
    },
  },
}

export const ActionCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button variant="primary" size="sm" fullWidth>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Nuevo Curso
          </Button>
          <Button variant="secondary" size="sm" fullWidth>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Gestionar Usuarios
          </Button>
          <Button variant="outline" size="sm" fullWidth>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Ver Reportes
          </Button>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a card used for quick actions or navigation.',
      },
    },
  },
}

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Estudiantes Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">1,247</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">+12% desde el mes pasado</p>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Cursos Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">43</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">En 8 programas técnicos</p>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Instructores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">87</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Certificados activos</p>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Certificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-warning-600 dark:text-warning-400">342</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Emitidas este año</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Example of cards used in a dashboard grid layout for displaying metrics.',
      },
    },
  },
}