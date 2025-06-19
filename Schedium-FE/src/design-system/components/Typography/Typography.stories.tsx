import type { Meta, StoryObj } from '@storybook/react'
import { Typography, Heading, Text, Label, Code } from './Typography'

const meta: Meta<typeof Typography> = {
  title: 'Design System/Typography',
  component: Typography,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive typography system with responsive scaling, semantic variants, and accessibility features. Includes heading, text, and utility components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-large', 'body', 'body-small', 'body-xs', 'label', 'button', 'caption', 'overline', 'code'],
      description: 'Typography variant/style',
    },
    color: {
      control: 'select',
      options: ['default', 'muted', 'subtle', 'primary', 'secondary', 'success', 'warning', 'error', 'inverse'],
      description: 'Text color theme',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    as: {
      control: 'text',
      description: 'HTML element to render as',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Este es un ejemplo de tipografía del sistema de diseño Schedium.',
  },
}

export const AllHeadings: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="h1">Heading 1 - Sistema de Gestión Académica</Typography>
      <Typography variant="h2">Heading 2 - SENA CGMLTI</Typography>
      <Typography variant="h3">Heading 3 - Módulos del Sistema</Typography>
      <Typography variant="h4">Heading 4 - Gestión de Usuarios</Typography>
      <Typography variant="h5">Heading 5 - Configuración Avanzada</Typography>
      <Typography variant="h6">Heading 6 - Detalles Específicos</Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All heading variants from H1 to H6 with responsive scaling.',
      },
    },
  },
}

export const AllBodyText: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <Typography variant="body-large">
        <strong>Texto grande:</strong> Este es un párrafo con texto grande, ideal para introducciones importantes o contenido destacado que necesita mayor visibilidad y legibilidad.
      </Typography>
      <Typography variant="body">
        <strong>Texto base:</strong> Este es el tamaño de texto estándar para el contenido principal del sistema. Optimizado para legibilidad y accesibilidad en pantallas de cualquier tamaño.
      </Typography>
      <Typography variant="body-small">
        <strong>Texto pequeño:</strong> Utilizado para información secundaria, descripciones adicionales o contenido de apoyo que complementa el texto principal.
      </Typography>
      <Typography variant="body-xs">
        <strong>Texto extra pequeño:</strong> Para metadatos, etiquetas, timestamps y otra información contextual que necesita ser discreta.
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different body text sizes for various content hierarchies.',
      },
    },
  },
}

export const AllColors: Story = {
  render: () => (
    <div className="space-y-3">
      <Typography color="default">Color por defecto - texto principal</Typography>
      <Typography color="muted">Color atenuado - texto secundario</Typography>
      <Typography color="subtle">Color sutil - texto terciario</Typography>
      <Typography color="primary">Color primario - enlaces y acciones</Typography>
      <Typography color="secondary">Color secundario - elementos destacados</Typography>
      <Typography color="success">Color de éxito - confirmaciones</Typography>
      <Typography color="warning">Color de advertencia - alertas</Typography>
      <Typography color="error">Color de error - errores y peligros</Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available color variants for different semantic meanings.',
      },
    },
  },
}

export const AllAlignments: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography align="left">Texto alineado a la izquierda</Typography>
      <Typography align="center">Texto centrado</Typography>
      <Typography align="right">Texto alineado a la derecha</Typography>
      <Typography align="justify">
        Texto justificado: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text alignment options for different layout needs.',
      },
    },
  },
}

export const UtilityVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="label">Etiqueta de formulario</Typography>
      <Typography variant="button">Texto de botón</Typography>
      <Typography variant="caption">Texto de descripción o caption</Typography>
      <Typography variant="overline">Texto overline</Typography>
      <Typography variant="code">código de ejemplo</Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Utility typography variants for specific use cases.',
      },
    },
  },
}

// Convenience component stories
export const HeadingComponent: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={1}>Componente Heading Nivel 1</Heading>
      <Heading level={2}>Componente Heading Nivel 2</Heading>
      <Heading level={3}>Componente Heading Nivel 3</Heading>
      <Heading level={4}>Componente Heading Nivel 4</Heading>
      <Heading level={5}>Componente Heading Nivel 5</Heading>
      <Heading level={6}>Componente Heading Nivel 6</Heading>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Convenience Heading component with level prop for semantic HTML.',
      },
    },
  },
}

export const TextComponent: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <Text size="large">Componente Text tamaño grande para contenido destacado.</Text>
      <Text size="base">Componente Text tamaño base para contenido principal.</Text>
      <Text size="small">Componente Text tamaño pequeño para información secundaria.</Text>
      <Text size="xs">Componente Text tamaño extra pequeño para metadatos.</Text>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Convenience Text component with size prop for body text.',
      },
    },
  },
}

export const SpecialtyComponents: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label>Etiqueta de formulario:</Label>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Componente Label para etiquetas de formularios
        </p>
      </div>
      <div>
        <p>Código en línea: <Code>npm install</Code></p>
        <div className="mt-2">
          <Code>const ejemplo = "código en bloque";</Code>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Specialized components for labels and code formatting.',
      },
    },
  },
}

export const RealWorldExample: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6">
      {/* Article Header */}
      <header className="space-y-3">
        <Typography variant="overline" color="primary">
          Sistema de Gestión Académica
        </Typography>
        <Heading level={1}>
          Manual de Usuario - Schedium SENA CGMLTI
        </Heading>
        <Typography variant="body-large" color="muted">
          Guía completa para la gestión de programas académicos, estudiantes e instructores en el Centro de Gestión de Mercados, Logística y Tecnologías de la Información.
        </Typography>
      </header>

      {/* Article Content */}
      <article className="space-y-4">
        <Heading level={2}>Introducción al Sistema</Heading>
        <Text>
          Schedium es una plataforma integral diseñada específicamente para optimizar la gestión académica en el SENA CGMLTI. El sistema permite administrar de manera eficiente los procesos educativos, desde la inscripción de aprendices hasta la certificación de competencias.
        </Text>

        <Heading level={3}>Características Principales</Heading>
        <Text>
          La plataforma incluye módulos especializados para diferentes aspectos de la gestión académica, garantizando un flujo de trabajo eficiente y trazabilidad completa de los procesos formativos.
        </Text>

        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <Heading level={4} color="primary">
            Importante
          </Heading>
          <Text size="small" color="muted">
            Este manual está actualizado para la versión 2.0 del sistema. Para consultas técnicas, contacte al equipo de soporte.
          </Text>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <Typography variant="caption">
          Última actualización: Diciembre 2024 | Versión del sistema: <Code>v2.0.1</Code>
        </Typography>
      </footer>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world example showing typography components in a typical document layout.',
      },
    },
  },
}

export const ResponsiveShowcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Heading level={1}>
          Tipografía Responsiva
        </Heading>
        <Text size="large" color="muted">
          Los tamaños de texto se adaptan automáticamente a diferentes tamaños de pantalla
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Heading level={3}>Móvil</Heading>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <Text size="small" color="muted">
              En dispositivos móviles, los títulos son más compactos para optimizar el espacio disponible y mantener la legibilidad.
            </Text>
          </div>
        </div>

        <div className="space-y-4">
          <Heading level={3}>Escritorio</Heading>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <Text size="small" color="muted">
              En pantallas más grandes, la tipografía tiene más espacio para respirar y crear jerarquías visuales más prominentes.
            </Text>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of responsive typography behavior across device sizes.',
      },
    },
  },
}