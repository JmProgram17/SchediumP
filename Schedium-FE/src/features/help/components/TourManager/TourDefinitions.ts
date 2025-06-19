/**
 * Tour Definitions - Predefined interactive tours for Schedium
 * Comprehensive onboarding and feature discovery tours
 */

import { TourDefinition } from '../../hooks/useInteractiveTours'

// Onboarding tour for new users
export const welcomeTour: TourDefinition = {
  id: 'welcome-onboarding',
  name: 'Bienvenido a Schedium',
  description: 'Tour introductorio para nuevos usuarios del sistema',
  category: 'onboarding',
  estimatedDuration: 8,
  priority: 'high',
  version: '1.0.0',
  conditions: {
    showForNewUsers: true,
    maxCompletions: 1
  },
  steps: [
    {
      id: 'welcome-intro',
      title: '¡Bienvenido a Schedium! 🎉',
      text: `
        <div class="tour-content">
          <p>¡Hola! Te daremos un recorrido rápido por las funciones principales de Schedium.</p>
          <p>Este tour te tomará aproximadamente <strong>8 minutos</strong> y te ayudará a:</p>
          <ul>
            <li>✅ Navegar por la interfaz</li>
            <li>✅ Crear y gestionar horarios</li>
            <li>✅ Usar las herramientas principales</li>
            <li>✅ Acceder a la ayuda cuando la necesites</li>
          </ul>
          <p><em>Puedes cancelar este tour en cualquier momento presionando ESC.</em></p>
        </div>
      `,
      buttons: [
        {
          text: 'Comenzar Tour',
          action: 'next',
          classes: 'btn btn-primary btn-lg'
        },
        {
          text: 'Saltar por ahora',
          action: 'cancel',
          classes: 'btn btn-link'
        }
      ],
      arrow: false,
      showCancelLink: false
    },
    {
      id: 'navigation-sidebar',
      title: 'Panel de Navegación',
      text: `
        <p>Este es tu <strong>panel de navegación principal</strong>. Desde aquí puedes acceder a:</p>
        <ul>
          <li>📅 <strong>Horarios:</strong> Crear y gestionar programaciones</li>
          <li>👥 <strong>Instructores:</strong> Gestión de personal docente</li>
          <li>🏫 <strong>Aulas:</strong> Administración de espacios</li>
          <li>📊 <strong>Dashboard:</strong> Análisis y métricas</li>
          <li>⚙️ <strong>Configuración:</strong> Ajustes del sistema</li>
        </ul>
        <p>💡 <em>Tip: Puedes contraer este panel haciendo clic en el botón de menú.</em></p>
      `,
      attachTo: {
        element: '[data-tour="main-sidebar"]',
        on: 'right'
      },
      highlightClass: 'tour-highlight-sidebar'
    },
    {
      id: 'header-tools',
      title: 'Barra de Herramientas',
      text: `
        <p>En la parte superior encontrarás las <strong>herramientas más utilizadas</strong>:</p>
        <ul>
          <li>🔍 <strong>Búsqueda global:</strong> Encuentra cualquier elemento rápidamente</li>
          <li>🔔 <strong>Notificaciones:</strong> Alertas y actualizaciones importantes</li>
          <li>👤 <strong>Perfil:</strong> Tu cuenta y configuración personal</li>
          <li>❓ <strong>Ayuda:</strong> Acceso rápido a tours y documentación</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="header-toolbar"]',
        on: 'bottom'
      }
    },
    {
      id: 'schedule-matrix',
      title: 'Matriz de Horarios',
      text: `
        <p>Esta es la <strong>matriz de horarios</strong>, el corazón de Schedium:</p>
        <ul>
          <li>📋 <strong>Vista semanal:</strong> Todos los horarios de un vistazo</li>
          <li>🖱️ <strong>Drag & Drop:</strong> Arrastra clases para moverlas</li>
          <li>⚡ <strong>Tiempo real:</strong> Cambios sincronizados instantáneamente</li>
          <li>🔍 <strong>Filtros:</strong> Busca por instructor, aula o programa</li>
        </ul>
        <p>💡 <em>Tip: Usa Ctrl+Z para deshacer cambios y Ctrl+Y para rehacer.</em></p>
      `,
      attachTo: {
        element: '[data-tour="schedule-matrix"]',
        on: 'top'
      },
      beforeShow: async () => {
        // Navigate to schedules page if not already there
        if (!window.location.pathname.includes('/schedules')) {
          window.history.pushState({}, '', '/schedules')
        }
      }
    },
    {
      id: 'quick-actions',
      title: 'Acciones Rápidas',
      text: `
        <p>Los <strong>botones de acción rápida</strong> te permiten:</p>
        <ul>
          <li>➕ <strong>Nueva Clase:</strong> Crear una clase rápidamente</li>
          <li>📥 <strong>Importar:</strong> Subir horarios desde Excel/CSV</li>
          <li>📤 <strong>Exportar:</strong> Descargar horarios en varios formatos</li>
          <li>🔄 <strong>Sincronizar:</strong> Actualizar datos en tiempo real</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="quick-actions"]',
        on: 'left'
      }
    },
    {
      id: 'help-center',
      title: 'Centro de Ayuda',
      text: `
        <p>¿Necesitas ayuda? El <strong>Centro de Ayuda</strong> incluye:</p>
        <ul>
          <li>🎯 <strong>Tours interactivos:</strong> Como este que estás viendo</li>
          <li>📚 <strong>Base de conocimientos:</strong> Artículos y guías</li>
          <li>🎥 <strong>Video tutoriales:</strong> Demostraciones paso a paso</li>
          <li>💬 <strong>Soporte en vivo:</strong> Chat con nuestro equipo</li>
          <li>🐛 <strong>Reportar problemas:</strong> Envía feedback directamente</li>
        </ul>
        <p>💡 <em>Tip: Presiona F1 en cualquier momento para acceso rápido a la ayuda.</em></p>
      `,
      attachTo: {
        element: '[data-tour="help-button"]',
        on: 'bottom'
      }
    },
    {
      id: 'tour-complete',
      title: '¡Tour Completado! 🎊',
      text: `
        <div class="tour-completion">
          <p>¡Excelente! Has completado el tour de bienvenida.</p>
          <p><strong>Próximos pasos recomendados:</strong></p>
          <ol>
            <li>🚀 <strong>Tour de Creación de Horarios:</strong> Aprende a crear tu primer horario</li>
            <li>⚡ <strong>Tour de Funciones Avanzadas:</strong> Descubre herramientas de poder</li>
            <li>📊 <strong>Tour del Dashboard:</strong> Explora análisis y métricas</li>
          </ol>
          <p>¿Te gustaría continuar con alguno de estos tours?</p>
        </div>
      `,
      buttons: [
        {
          text: 'Tour de Horarios',
          action: 'custom',
          classes: 'btn btn-primary',
          onClick: () => {
            // Start schedule creation tour
            console.log('Starting schedule creation tour')
          }
        },
        {
          text: 'Explorar por mi cuenta',
          action: 'complete',
          classes: 'btn btn-secondary'
        }
      ],
      arrow: false
    }
  ]
}

// Schedule creation tour
export const scheduleCreationTour: TourDefinition = {
  id: 'schedule-creation',
  name: 'Creación de Horarios',
  description: 'Aprende a crear y gestionar horarios paso a paso',
  category: 'feature_discovery',
  estimatedDuration: 12,
  priority: 'high',
  version: '1.0.0',
  prerequisites: ['welcome-onboarding'],
  steps: [
    {
      id: 'schedule-intro',
      title: 'Creación de Horarios 📅',
      text: `
        <p>En este tour aprenderás a <strong>crear horarios efectivamente</strong>:</p>
        <ul>
          <li>➕ Crear nuevas clases</li>
          <li>🎯 Asignar instructores y aulas</li>
          <li>⚠️ Resolver conflictos automáticamente</li>
          <li>💾 Guardar y publicar horarios</li>
        </ul>
        <p>Tiempo estimado: <strong>12 minutos</strong></p>
      `,
      arrow: false
    },
    {
      id: 'create-new-class',
      title: 'Crear Nueva Clase',
      text: `
        <p>Haz clic en <strong>"Nueva Clase"</strong> para comenzar.</p>
        <p>Este botón abre el formulario de creación donde podrás:</p>
        <ul>
          <li>📝 Definir los detalles de la clase</li>
          <li>👨‍🏫 Seleccionar instructor</li>
          <li>🏫 Elegir aula</li>
          <li>⏰ Establecer horarios</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="new-class-button"]',
        on: 'bottom'
      },
      advanceOn: {
        selector: '[data-tour="new-class-button"]',
        event: 'click'
      }
    },
    {
      id: 'class-form-basic',
      title: 'Información Básica',
      text: `
        <p>Completa la <strong>información básica</strong> de la clase:</p>
        <ul>
          <li>📚 <strong>Nombre:</strong> Título descriptivo de la clase</li>
          <li>📖 <strong>Descripción:</strong> Detalles adicionales (opcional)</li>
          <li>🎯 <strong>Programa:</strong> A qué programa académico pertenece</li>
          <li>👥 <strong>Grupo:</strong> Grupo de estudiantes asignado</li>
        </ul>
        <p>💡 <em>Tip: Usa nombres descriptivos que sean fáciles de identificar.</em></p>
      `,
      attachTo: {
        element: '[data-tour="class-basic-info"]',
        on: 'right'
      }
    },
    {
      id: 'instructor-selection',
      title: 'Selección de Instructor',
      text: `
        <p>Selecciona el <strong>instructor</strong> para esta clase:</p>
        <ul>
          <li>🔍 <strong>Búsqueda inteligente:</strong> Busca por nombre o especialidad</li>
          <li>✅ <strong>Disponibilidad:</strong> Solo muestra instructores disponibles</li>
          <li>📊 <strong>Carga de trabajo:</strong> Ve la carga actual de cada instructor</li>
          <li>⚠️ <strong>Conflictos:</strong> Alertas automáticas de solapamientos</li>
        </ul>
        <p>💡 <em>Tip: Los instructores marcados en verde están disponibles.</em></p>
      `,
      attachTo: {
        element: '[data-tour="instructor-selector"]',
        on: 'left'
      }
    },
    {
      id: 'classroom-selection',
      title: 'Selección de Aula',
      text: `
        <p>Elige el <strong>aula</strong> más apropiada:</p>
        <ul>
          <li>🏫 <strong>Capacidad:</strong> Verifica que tenga suficiente espacio</li>
          <li>💻 <strong>Equipamiento:</strong> Revisa el equipamiento disponible</li>
          <li>📍 <strong>Ubicación:</strong> Considera la proximidad entre clases</li>
          <li>✅ <strong>Disponibilidad:</strong> Solo aulas libres en el horario</li>
        </ul>
        <p>💡 <em>Tip: Las aulas se filtran automáticamente por disponibilidad.</em></p>
      `,
      attachTo: {
        element: '[data-tour="classroom-selector"]',
        on: 'left'
      }
    },
    {
      id: 'time-scheduling',
      title: 'Programación de Horarios',
      text: `
        <p>Define <strong>cuándo y cuánto tiempo</strong> durará la clase:</p>
        <ul>
          <li>📅 <strong>Día de la semana:</strong> Selecciona uno o múltiples días</li>
          <li>⏰ <strong>Hora de inicio:</strong> Momento exacto de inicio</li>
          <li>⏱️ <strong>Duración:</strong> Tiempo total de la clase</li>
          <li>🔄 <strong>Recurrencia:</strong> Si se repite semanalmente</li>
        </ul>
        <p>⚠️ <em>El sistema detectará automáticamente conflictos de horario.</em></p>
      `,
      attachTo: {
        element: '[data-tour="time-scheduler"]',
        on: 'top'
      }
    },
    {
      id: 'conflict-detection',
      title: 'Detección de Conflictos',
      text: `
        <p>Schedium detecta automáticamente <strong>conflictos</strong>:</p>
        <ul>
          <li>👨‍🏫 <strong>Instructor ocupado:</strong> Ya tiene clase a esa hora</li>
          <li>🏫 <strong>Aula ocupada:</strong> Espacio no disponible</li>
          <li>👥 <strong>Grupo ocupado:</strong> Estudiantes en otra clase</li>
          <li>⚠️ <strong>Solapamientos:</strong> Horarios que se superponen</li>
        </ul>
        <p>💡 <em>Las sugerencias de resolución aparecen automáticamente.</em></p>
      `,
      attachTo: {
        element: '[data-tour="conflict-detector"]',
        on: 'right'
      }
    },
    {
      id: 'save-and-publish',
      title: 'Guardar y Publicar',
      text: `
        <p>Una vez que todo esté correcto:</p>
        <ul>
          <li>💾 <strong>Guardar borrador:</strong> Guarda sin publicar</li>
          <li>📢 <strong>Guardar y publicar:</strong> Hace visible para todos</li>
          <li>📋 <strong>Vista previa:</strong> Revisa antes de publicar</li>
          <li>📧 <strong>Notificar:</strong> Envía alertas a los involucrados</li>
        </ul>
        <p>✅ <em>¡Listo! Tu clase ha sido creada exitosamente.</em></p>
      `,
      attachTo: {
        element: '[data-tour="save-publish-buttons"]',
        on: 'top'
      }
    }
  ]
}

// Advanced features tour
export const advancedFeaturesTour: TourDefinition = {
  id: 'advanced-features',
  name: 'Funciones Avanzadas',
  description: 'Descubre herramientas poderosas para usuarios expertos',
  category: 'feature_discovery',
  estimatedDuration: 15,
  priority: 'medium',
  version: '1.0.0',
  prerequisites: ['welcome-onboarding', 'schedule-creation'],
  requiredRole: ['administrator', 'coordinator'],
  steps: [
    {
      id: 'advanced-intro',
      title: 'Funciones Avanzadas 🚀',
      text: `
        <p>Descubre las <strong>herramientas avanzadas</strong> de Schedium:</p>
        <ul>
          <li>🤖 Programación automática con IA</li>
          <li>📊 Análisis de optimización</li>
          <li>🔄 Sincronización en tiempo real</li>
          <li>📈 Reportes personalizados</li>
          <li>⚙️ Automatizaciones</li>
        </ul>
      `,
      arrow: false
    },
    {
      id: 'ai-scheduling',
      title: 'Programación Automática con IA',
      text: `
        <p>La <strong>IA de Schedium</strong> puede:</p>
        <ul>
          <li>🧠 <strong>Optimizar horarios:</strong> Encuentra la mejor distribución</li>
          <li>⚡ <strong>Resolver conflictos:</strong> Soluciones automáticas</li>
          <li>📊 <strong>Balancear cargas:</strong> Distribuye trabajo equitativamente</li>
          <li>🎯 <strong>Sugerir mejoras:</strong> Recomendaciones inteligentes</li>
        </ul>
        <p>💡 <em>Activa el modo IA desde el menú de herramientas.</em></p>
      `,
      attachTo: {
        element: '[data-tour="ai-tools"]',
        on: 'bottom'
      }
    },
    {
      id: 'bulk-operations',
      title: 'Operaciones en Lote',
      text: `
        <p>Gestiona <strong>múltiples elementos</strong> simultáneamente:</p>
        <ul>
          <li>✅ <strong>Selección múltiple:</strong> Ctrl+clic para seleccionar</li>
          <li>📝 <strong>Edición masiva:</strong> Cambia propiedades de varias clases</li>
          <li>🗑️ <strong>Eliminación en lote:</strong> Borra múltiples elementos</li>
          <li>📋 <strong>Copiar/Pegar:</strong> Duplica horarios completos</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="bulk-tools"]',
        on: 'left'
      }
    },
    {
      id: 'real-time-collaboration',
      title: 'Colaboración en Tiempo Real',
      text: `
        <p>Trabaja <strong>simultáneamente</strong> con tu equipo:</p>
        <ul>
          <li>👥 <strong>Usuarios conectados:</strong> Ve quién está trabajando</li>
          <li>👁️ <strong>Cursores en vivo:</strong> Observa cambios en tiempo real</li>
          <li>💬 <strong>Comentarios:</strong> Comunícate directamente en el horario</li>
          <li>🔒 <strong>Bloqueo de edición:</strong> Evita conflictos de cambios</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="collaboration-panel"]',
        on: 'right'
      }
    },
    {
      id: 'custom-reports',
      title: 'Reportes Personalizados',
      text: `
        <p>Crea <strong>reportes a medida</strong> de tus necesidades:</p>
        <ul>
          <li>📊 <strong>Constructor visual:</strong> Arrastra y suelta campos</li>
          <li>🎨 <strong>Plantillas:</strong> Formatos prediseñados</li>
          <li>📅 <strong>Programación:</strong> Reportes automáticos</li>
          <li>📧 <strong>Distribución:</strong> Envío automático por email</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="reports-section"]',
        on: 'top'
      }
    }
  ]
}

// Dashboard tour
export const dashboardTour: TourDefinition = {
  id: 'dashboard-analytics',
  name: 'Dashboard y Análisis',
  description: 'Explora métricas, análisis y visualizaciones de datos',
  category: 'feature_discovery',
  estimatedDuration: 10,
  priority: 'medium',
  version: '1.0.0',
  steps: [
    {
      id: 'dashboard-intro',
      title: 'Dashboard de Análisis 📊',
      text: `
        <p>El <strong>dashboard</strong> te proporciona insights valiosos:</p>
        <ul>
          <li>📈 Métricas en tiempo real</li>
          <li>📊 Visualizaciones interactivas</li>
          <li>⚠️ Alertas y notificaciones</li>
          <li>📉 Tendencias y patrones</li>
        </ul>
      `,
      beforeShow: async () => {
        if (!window.location.pathname.includes('/dashboard')) {
          window.history.pushState({}, '', '/dashboard')
        }
      }
    },
    {
      id: 'metrics-overview',
      title: 'Métricas Principales',
      text: `
        <p>Las <strong>métricas principales</strong> incluyen:</p>
        <ul>
          <li>👥 <strong>Usuarios activos:</strong> Quién está usando el sistema</li>
          <li>📅 <strong>Clases programadas:</strong> Total de clases creadas</li>
          <li>⚠️ <strong>Conflictos detectados:</strong> Problemas por resolver</li>
          <li>🏫 <strong>Utilización de aulas:</strong> Eficiencia de espacios</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="metrics-cards"]',
        on: 'bottom'
      }
    },
    {
      id: 'interactive-charts',
      title: 'Gráficos Interactivos',
      text: `
        <p>Los <strong>gráficos interactivos</strong> te permiten:</p>
        <ul>
          <li>🖱️ <strong>Explorar datos:</strong> Haz clic para ver detalles</li>
          <li>🔍 <strong>Filtrar información:</strong> Enfócate en lo que importa</li>
          <li>📅 <strong>Cambiar períodos:</strong> Ve diferentes rangos de tiempo</li>
          <li>📤 <strong>Exportar datos:</strong> Descarga en varios formatos</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="interactive-charts"]',
        on: 'top'
      }
    },
    {
      id: 'alerts-panel',
      title: 'Panel de Alertas',
      text: `
        <p>El <strong>panel de alertas</strong> te mantiene informado:</p>
        <ul>
          <li>🚨 <strong>Alertas críticas:</strong> Problemas que requieren atención inmediata</li>
          <li>⚠️ <strong>Advertencias:</strong> Situaciones que podrían necesitar revisión</li>
          <li>ℹ️ <strong>Información:</strong> Actualizaciones y novedades</li>
          <li>✅ <strong>Confirmaciones:</strong> Acciones completadas exitosamente</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="alerts-panel"]',
        on: 'left'
      }
    }
  ]
}

// Troubleshooting tour
export const troubleshootingTour: TourDefinition = {
  id: 'troubleshooting-guide',
  name: 'Solución de Problemas',
  description: 'Aprende a resolver problemas comunes paso a paso',
  category: 'troubleshooting',
  estimatedDuration: 8,
  priority: 'low',
  version: '1.0.0',
  steps: [
    {
      id: 'troubleshooting-intro',
      title: 'Solución de Problemas 🔧',
      text: `
        <p>Aprende a <strong>resolver problemas comunes</strong>:</p>
        <ul>
          <li>⚠️ Conflictos de horarios</li>
          <li>🔄 Problemas de sincronización</li>
          <li>🐛 Errores del sistema</li>
          <li>📞 Cuándo contactar soporte</li>
        </ul>
      `
    },
    {
      id: 'conflict-resolution',
      title: 'Resolver Conflictos de Horarios',
      text: `
        <p>Cuando aparece un <strong>conflicto de horario</strong>:</p>
        <ol>
          <li>🔍 <strong>Identifica el problema:</strong> Lee el mensaje de error</li>
          <li>🎯 <strong>Revisa las sugerencias:</strong> El sistema ofrece soluciones</li>
          <li>✏️ <strong>Aplica la corrección:</strong> Haz clic en "Resolver"</li>
          <li>✅ <strong>Verifica el resultado:</strong> Confirma que está solucionado</li>
        </ol>
      `,
      attachTo: {
        element: '[data-tour="conflict-resolution"]',
        on: 'right'
      }
    },
    {
      id: 'sync-issues',
      title: 'Problemas de Sincronización',
      text: `
        <p>Si los datos no se actualizan:</p>
        <ol>
          <li>🔄 <strong>Refresca manualmente:</strong> Clic en el botón de sincronizar</li>
          <li>📡 <strong>Verifica conexión:</strong> Revisa tu conexión a internet</li>
          <li>🚪 <strong>Cierra y reabre:</strong> Recarga la página del navegador</li>
          <li>🆘 <strong>Contacta soporte:</strong> Si persiste el problema</li>
        </ol>
      `,
      attachTo: {
        element: '[data-tour="sync-button"]',
        on: 'bottom'
      }
    },
    {
      id: 'error-reporting',
      title: 'Reportar Errores',
      text: `
        <p>Para <strong>reportar un problema</strong>:</p>
        <ol>
          <li>📷 <strong>Captura de pantalla:</strong> Toma una imagen del error</li>
          <li>📝 <strong>Describe el problema:</strong> Explica qué estabas haciendo</li>
          <li>📧 <strong>Envía el reporte:</strong> Usa el botón de feedback</li>
          <li>⏰ <strong>Espera respuesta:</strong> Te contactaremos pronto</li>
        </ol>
        <p>💡 <em>Tip: Incluye todos los detalles posibles para una solución más rápida.</em></p>
      `,
      attachTo: {
        element: '[data-tour="feedback-button"]',
        on: 'left'
      }
    }
  ]
}

// Export all tour definitions
export const allTours: TourDefinition[] = [
  welcomeTour,
  scheduleCreationTour,
  advancedFeaturesTour,
  dashboardTour,
  troubleshootingTour
]

// Tour categories for organization
export const tourCategories = {
  onboarding: allTours.filter(t => t.category === 'onboarding'),
  feature_discovery: allTours.filter(t => t.category === 'feature_discovery'),
  troubleshooting: allTours.filter(t => t.category === 'troubleshooting'),
  advanced: allTours.filter(t => t.category === 'advanced')
}