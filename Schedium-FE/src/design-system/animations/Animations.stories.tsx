import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { 
  AnimatedContainer,
  StaggeredList,
  StaggeredItem,
  PageTransition,
  AnimatedButton,
  AnimatedCard,
  ModalBackdrop,
  ModalContent,
  LoadingSkeleton,
  Toast,
  Collapsible,
  AnimatedField,
  AnimatePresence
} from './index'
import { Button } from '../components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'

const meta: Meta = {
  title: 'Design System/Animations',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Sistema de Animaciones Schedium

Sistema completo de animaciones optimizadas con Framer Motion, diseñado para ser performante y accesible.

## Características Principales

- **Respeta Reduced Motion**: Automáticamente desactiva animaciones complejas para usuarios con preferencias de accesibilidad
- **Optimizado para Performance**: Usa GPU acceleration y evita animaciones de layout costosas
- **Consistente**: Configuraciones predefinidas para mantener coherencia visual
- **Modular**: Componentes y hooks reutilizables para diferentes casos de uso

## Componentes Disponibles

- **AnimatedContainer**: Contenedor base con múltiples tipos de animación
- **StaggeredList/Item**: Para listas con animaciones escalonadas
- **PageTransition**: Transiciones entre páginas/rutas
- **AnimatedButton/Card**: Elementos interactivos con hover/tap states
- **Modal**: Animaciones para modales y overlays
- **Toast**: Notificaciones animadas
- **Collapsible**: Contenido que se expande/contrae
- **LoadingSkeleton**: Animaciones de carga
        `,
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicAnimations: Story = {
  render: () => {
    const [trigger, setTrigger] = useState(0)

    return (
      <div className="space-y-8">
        <div className="text-center">
          <Button onClick={() => setTrigger(prev => prev + 1)}>
            Reactivar Animaciones
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatedContainer 
            key={`fadeIn-${trigger}`}
            animation="fadeIn" 
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Fade In</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aparición suave con cambio de opacidad
            </p>
          </AnimatedContainer>

          <AnimatedContainer 
            key={`slideUp-${trigger}`}
            animation="slideUp" 
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Slide Up</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deslizamiento desde abajo
            </p>
          </AnimatedContainer>

          <AnimatedContainer 
            key={`slideLeft-${trigger}`}
            animation="slideLeft" 
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Slide Left</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deslizamiento desde la derecha
            </p>
          </AnimatedContainer>

          <AnimatedContainer 
            key={`slideRight-${trigger}`}
            animation="slideRight" 
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Slide Right</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deslizamiento desde la izquierda
            </p>
          </AnimatedContainer>

          <AnimatedContainer 
            key={`slideDown-${trigger}`}
            animation="slideDown" 
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Slide Down</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deslizamiento desde arriba
            </p>
          </AnimatedContainer>

          <AnimatedContainer 
            key={`scaleIn-${trigger}`}
            animation="scaleIn" 
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Scale In</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escalamiento con efecto spring
            </p>
          </AnimatedContainer>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Animaciones básicas disponibles en el sistema. Cada una optimizada para diferentes casos de uso.',
      },
    },
  },
}

export const StaggeredAnimations: Story = {
  render: () => {
    const [showList, setShowList] = useState(true)

    const items = [
      'Gestión de Usuarios',
      'Programas Académicos', 
      'Horarios y Programación',
      'Reportes y Analytics',
      'Configuración del Sistema'
    ]

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Button onClick={() => setShowList(!showList)}>
            {showList ? 'Ocultar' : 'Mostrar'} Lista
          </Button>
        </div>

        <AnimatePresence>
          {showList && (
            <StaggeredList key="staggered-list" className="space-y-3">
              {items.map((item, index) => (
                <StaggeredItem key={index}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-medium">{item}</span>
                      </div>
                    </CardContent>
                  </Card>
                </StaggeredItem>
              ))}
            </StaggeredList>
          )}
        </AnimatePresence>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Animaciones escalonadas para listas. Cada elemento aparece con un pequeño delay para crear un efecto visual fluido.',
      },
    },
  },
}

export const InteractiveElements: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Botones Animados</h3>
        <div className="flex gap-4">
          <AnimatedButton 
            variant="hover"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Hover Effect
          </AnimatedButton>
          <AnimatedButton 
            variant="scale"
            className="px-4 py-2 bg-secondary-600 text-white rounded-lg"
          >
            Scale Effect
          </AnimatedButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tarjetas Animadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedCard className="transition-shadow">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Card Animada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pasa el cursor para ver el efecto de elevación animado.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard className="transition-shadow">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Otra Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Las animaciones son consistentes en todo el sistema.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Elementos interactivos con animaciones al hacer hover y al hacer clic.',
      },
    },
  },
}

export const ModalAnimations: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>
          Abrir Modal
        </Button>

        <ModalBackdrop isOpen={isOpen} className="bg-black/50 flex items-center justify-center">
          <ModalContent className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Modal Animado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Este modal aparece con animaciones suaves de escala y opacidad. 
              El backdrop también se anima para crear una transición fluida.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Aceptar
              </Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Animaciones para modales y overlays con backdrop animado y contenido que escala.',
      },
    },
  },
}

export const ToastNotification: Story = {
  render: () => {
    const [showToast, setShowToast] = useState(false)

    const triggerToast = () => {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }

    return (
      <div>
        <Button onClick={triggerToast}>
          Mostrar Notificación
        </Button>

        <Toast isVisible={showToast}>
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>¡Operación realizada con éxito!</span>
            </div>
          </div>
        </Toast>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Notificaciones toast que se animan desde el lado derecho de la pantalla.',
      },
    },
  },
}

export const CollapsibleContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="max-w-md">
        <Button onClick={() => setIsOpen(!isOpen)} className="mb-4">
          {isOpen ? 'Contraer' : 'Expandir'} Contenido
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Esta es información básica que siempre está visible.
            </p>
            
            <Collapsible isOpen={isOpen}>
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold">Detalles Adicionales</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este contenido se expande y contrae con animaciones suaves.
                  La altura se ajusta automáticamente al contenido.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Versión del sistema: 2.0.1</li>
                  <li>• Última actualización: Diciembre 2024</li>
                  <li>• Usuarios activos: 1,247</li>
                  <li>• Base de datos: PostgreSQL</li>
                </ul>
              </div>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Contenido plegable con animaciones de altura automática.',
      },
    },
  },
}

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Skeleton Loading</h3>
        <Card>
          <CardContent className="p-4">
            <LoadingSkeleton lines={4} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <LoadingSkeleton lines={1} />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton lines={3} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Estados de carga con skeletons animados que simulan el contenido final.',
      },
    },
  },
}

export const FormFieldAnimations: Story = {
  render: () => {
    const [hasError, setHasError] = useState(false)

    return (
      <div className="max-w-md space-y-6">
        <div>
          <Button onClick={() => setHasError(!hasError)}>
            {hasError ? 'Quitar' : 'Simular'} Error
          </Button>
        </div>

        <AnimatedField hasError={hasError}>
          <Card className={hasError ? 'border-error-500' : ''}>
            <CardContent className="p-4">
              <label className="block text-sm font-medium mb-2">
                Campo de Formulario
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg ${
                  hasError 
                    ? 'border-error-500 focus:ring-error-500' 
                    : 'border-gray-300 focus:ring-primary-500'
                } focus:outline-none focus:ring-2`}
                placeholder="Escribe algo aquí..."
              />
              {hasError && (
                <p className="text-sm text-error-600 mt-1">
                  Este campo es requerido
                </p>
              )}
            </CardContent>
          </Card>
        </AnimatedField>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Campos de formulario con animaciones de error que llaman la atención sin ser intrusivas.',
      },
    },
  },
}

export const PageTransitionDemo: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState('dashboard')

    const pages = {
      dashboard: {
        title: 'Dashboard',
        content: 'Esta es la página principal del sistema con estadísticas y resúmenes.'
      },
      users: {
        title: 'Usuarios',
        content: 'Gestión completa de usuarios, roles y permisos del sistema.'
      },
      schedule: {
        title: 'Horarios',
        content: 'Programación de clases, asignación de aulas y gestión de conflictos.'
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {Object.keys(pages).map((pageKey) => (
            <Button
              key={pageKey}
              variant={currentPage === pageKey ? 'primary' : 'outline'}
              onClick={() => setCurrentPage(pageKey)}
            >
              {pages[pageKey as keyof typeof pages].title}
            </Button>
          ))}
        </div>

        <div className="h-64 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <PageTransition key={currentPage} className="absolute inset-0">
              <Card variant="elevated" className="h-full">
                <CardHeader>
                  <CardTitle>{pages[currentPage as keyof typeof pages].title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {pages[currentPage as keyof typeof pages].content}
                  </p>
                </CardContent>
              </Card>
            </PageTransition>
          </AnimatePresence>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Transiciones entre páginas que crean una experiencia fluida al navegar.',
      },
    },
  },
}

export const PerformanceNotes: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Optimizaciones de Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">GPU Acceleration</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Todas las animaciones usan propiedades que activan la aceleración GPU (transform, opacity).
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Reduced Motion Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              El sistema respeta automáticamente las preferencias de accesibilidad del usuario.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Will-Change Optimization</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se aplica automáticamente will-change: transform para elementos animados.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Lazy Loading</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Framer Motion se carga de forma lazy para optimizar el bundle inicial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Notas sobre las optimizaciones de performance implementadas en el sistema de animaciones.',
      },
    },
  },
}