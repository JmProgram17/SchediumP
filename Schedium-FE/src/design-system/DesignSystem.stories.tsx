import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './components/Button'
import { Input } from './components/Input'
import { Badge } from './components/Badge'
import { Card, CardHeader, CardTitle, CardContent } from './components/Card'
import { ThemeToggle } from './themes/ThemeToggle'

const meta: Meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Schedium Design System

Bienvenido al sistema de diseño de **Schedium**, la plataforma de gestión académica para SENA CGMLTI.

## Filosofía de Diseño

Nuestro sistema de diseño se basa en los principios de:
- **Consistencia**: Componentes y patrones unificados
- **Accesibilidad**: Cumplimiento con estándares WCAG 2.1 AA  
- **Usabilidad**: Interfaces intuitivas para usuarios de SENA
- **Marca**: Respeto por la identidad visual de SENA

## Componentes Disponibles

- **Button** - Botones con múltiples variantes y estados
- **Input** - Campos de entrada con validación y iconos
- **Badge** - Etiquetas para estados y categorías
- **Card** - Contenedores flexibles para información
        `,
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const AllComponents: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Schedium Design System
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Sistema de gestión académica - SENA CGMLTI
        </p>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Colores de Marca</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 bg-primary-500 rounded-lg"></div>
            <p className="text-sm font-medium">Verde SENA</p>
            <p className="text-xs text-gray-500">#39A900</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-secondary-500 rounded-lg"></div>
            <p className="text-sm font-medium">Naranja SENA</p>
            <p className="text-xs text-gray-500">#FF6B00</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-success-500 rounded-lg"></div>
            <p className="text-sm font-medium">Éxito</p>
            <p className="text-xs text-gray-500">Verde</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-error-500 rounded-lg"></div>
            <p className="text-sm font-medium">Error</p>
            <p className="text-xs text-gray-500">Rojo</p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      {/* Badges */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success" dot>Success</Badge>
          <Badge variant="warning" dot>Warning</Badge>
          <Badge variant="error" dot>Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Inputs</h2>
        <div className="max-w-md space-y-4">
          <Input 
            label="Email" 
            placeholder="Ingresa tu email" 
            type="email"
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          <Input 
            label="Contraseña" 
            placeholder="Ingresa tu contraseña" 
            type="password"
            error="La contraseña es requerida"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Card Simple</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido de la tarjeta estándar.</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Card Elevada</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Tarjeta con sombra elevada para mayor prominencia.</p>
              <div className="mt-3 flex gap-2">
                <Badge variant="success" size="sm">Activo</Badge>
                <Badge variant="primary" size="sm">SENA</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Example Application */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Ejemplo de Aplicación</h2>
        <Card variant="elevated" className="max-w-md">
          <CardHeader>
            <CardTitle>Perfil de Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre:</span>
                <span className="text-sm">Juan Pérez García</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rol:</span>
                <Badge variant="primary" size="sm">Instructor</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado:</span>
                <Badge variant="success" size="sm" dot>Activo</Badge>
              </div>
              <Button variant="primary" size="sm" fullWidth>
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vista completa del sistema de diseño Schedium con todos los componentes principales.',
      },
    },
  },
}