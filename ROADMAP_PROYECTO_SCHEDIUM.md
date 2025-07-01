# 📋 ROADMAP COMPLETO - PROYECTO SCHEDIUM

## 🎯 **ESTADO ACTUAL DEL PROYECTO**

### ✅ **LO QUE ESTÁ COMPLETO**
- **Backend**: 85% completo con API REST robusta
- **Frontend**: 85% completo con React + TypeScript
- **Base de Datos**: 90% completa con relaciones sólidas
- **Testing**: 80% completo (Vitest + Playwright + Jest)
- **Autenticación**: Sistema completo con JWT y guards
- **Design System**: Componentes reutilizables con Storybook

### ⚠️ **LO QUE NECESITA ATENCIÓN**
- Integración frontend-backend: 60%
- Dashboard con datos reales
- Consultas page sin conectar a BD
- Sistema de notificaciones académicas
- Módulo de configuración académica

---

## 🎯 **TAREAS PENDIENTES POR PRIORIDAD**

### **🔴 PRIORIDAD CRÍTICA (Semanas 1-2)**

#### **A. Completar Integración Frontend-Backend (20 horas)**
- [ ] **A1. Debugging de consultas que no traen datos**
  - Verificar endpoints que faltan por consumir
  - Revisar conexiones API en módulos existentes
  - Solucionar problemas de autenticación en requests
  - Verificar mapeo de datos entre frontend y backend

- [ ] **A2. Dashboard con datos reales (8 horas)**
  - Conectar métricas del dashboard con endpoints reales
  - Implementar widgets con datos de BD
  - Gráficos y estadísticas en tiempo real
  - Indicadores clave de rendimiento (KPIs)

- [ ] **A3. Página de Consultas funcional (6 horas)**
  - Conectar ConsultasPage.tsx con datos reales
  - Implementar filtros y búsquedas
  - Paginación y ordenamiento
  - Exportación de resultados

- [ ] **A4. Página de Informes operativa (6 horas)**
  - Conectar InformesPage.tsx con reportes reales
  - Implementar generación de reportes
  - Visualizaciones y gráficos
  - Exportación a PDF/Excel

#### **B. Mejoras de Base de Datos (10 horas)**
- [ ] **B1. Campos adicionales útiles**
```sql
-- Student Group enhancements (SIN coordinator_id)
ALTER TABLE student_group ADD COLUMN (
    student_count INT DEFAULT 0,
    status ENUM('planned', 'active', 'suspended', 'completed') DEFAULT 'planned',
    notes TEXT
);

-- Quarter enhancements  
ALTER TABLE quarter ADD COLUMN (
    quarter_number INT,
    academic_year YEAR,
    is_active BOOLEAN DEFAULT FALSE,
    enrollment_deadline DATE
);

-- Campus additional info
ALTER TABLE campus ADD COLUMN (
    contact_person VARCHAR(100),
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active'
);
```

- [ ] **B2. Tablas de soporte del sistema**
```sql
-- Configuración institucional
CREATE TABLE institution_config (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sistema de notificaciones
CREATE TABLE notification (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    notification_type ENUM('schedule_conflict', 'quarter_transition', 'deadline_approaching', 'system_alert'),
    title VARCHAR(255),
    message TEXT,
    severity ENUM('info', 'warning', 'error', 'critical'),
    target_user_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Estadísticas de uso
CREATE TABLE usage_stats (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,
    period_start DATE,
    period_end DATE,
    campus_id INT,
    classroom_utilization_percent DECIMAL(5,2),
    instructor_load_average DECIMAL(5,2),
    active_groups_count INT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **C. Sistema de Cálculo de Trimestres (15 horas)**
- [ ] **C1. Función de cálculo automático (8 horas)**
  - Implementar lógica para calcular trimestre actual de una ficha
  - Basado en fecha de inicio + fecha actual
  - Sin crear relaciones circulares
  - Consultas optimizadas

- [ ] **C2. API endpoints para trimestres (4 horas)**
  - Endpoint para obtener trimestre actual de ficha
  - Endpoint para transición entre trimestres
  - Validaciones de negocio

- [ ] **C3. Frontend para cálculo de trimestres (3 horas)**
  - Componente para mostrar trimestre actual
  - Indicadores visuales de progreso
  - Alertas de transición próxima

### **🟡 PRIORIDAD ALTA (Semanas 3-4)**

#### **D. Módulo de Configuración Académica (30 horas)**
- [ ] **D1. Gestión de Trimestres (15 horas)**
  - Página de administración de trimestres
  - CRUD completo con fechas flexibles
  - Sistema de transición entre trimestres
  - Wizard de cambio de trimestre
  - Validaciones de solapamiento de fechas

- [ ] **D2. Archivado Inteligente de Horarios (8 horas)**
  - Sistema para "archivar" horarios sin borrar de BD
  - Campo `is_archived` en class_schedule
  - Proceso automático en transición de trimestre
  - Posibilidad de "desarchivar" si es necesario

- [ ] **D3. Configuración Global del Sistema (7 horas)**
  - Editor de bloques de tiempo
  - Plantillas de configuración predefinidas
  - Reglas de negocio configurables
  - Panel de configuración centralizado

#### **E. Sistema de Notificaciones en TopBar (15 horas)**
- [ ] **E1. Integración con TopBar existente (8 horas)**
  - Conectar sistema de notificaciones con campana
  - Contador de notificaciones no leídas
  - Dropdown con lista de notificaciones
  - Marcado como leído/no leído

- [ ] **E2. Notificaciones Académicas (7 horas)**
  - Alertas de conflictos en horarios
  - Notificaciones de transición de trimestre
  - Avisos de plazos importantes
  - Alertas de sobrecarga de instructores

#### **F. Completar Pantallas Existentes (25 horas)**
- [ ] **F1. Optimizar formularios existentes (10 horas)**
  - Validaciones en tiempo real
  - Manejo de errores mejorado
  - UX de carga y guardado
  - Confirmaciones de acciones

- [ ] **F2. Mejorar listados y tablas (8 horas)**
  - Paginación optimizada
  - Filtros avanzados
  - Ordenamiento por columnas
  - Acciones en lote

- [ ] **F3. Responsive design mobile (7 horas)**
  - Optimizar para dispositivos móviles
  - Touch gestures en scheduling
  - Navegación móvil mejorada
  - Performance en móviles

### **🟢 PRIORIDAD MEDIA (Semanas 5-6)**

#### **G. Funcionalidades Avanzadas (25 horas)**
- [ ] **G1. Wizard de Transición de Trimestre (10 horas)**
  - Asistente paso a paso para cambio de trimestre
  - Verificaciones previas automáticas
  - Resumen de cambios a realizar
  - Proceso de rollback si es necesario

- [ ] **G2. Auto-asignación Inteligente (8 horas)**
  - Algoritmo para sugerir salones disponibles
  - Optimización de uso de recursos
  - Detección de conflictos preventiva
  - Sugerencias de mejoras

- [ ] **G3. Reportes Avanzados (7 horas)**
  - Dashboard de métricas avanzadas
  - Reportes de utilización histórica
  - Análisis de tendencias
  - Exportación avanzada

#### **H. Optimizaciones UX/UI (20 horas)**
- [ ] **H1. Performance y Carga (8 horas)**
  - Optimización de consultas pesadas
  - Lazy loading en listados grandes
  - Caching inteligente
  - Reducción de bundle size

- [ ] **H2. Feedback Visual Mejorado (7 horas)**
  - Animaciones suaves
  - Estados de carga más informativos
  - Tooltips contextuales
  - Indicadores de progreso

- [ ] **H3. Accesibilidad y Usabilidad (5 horas)**
  - Cumplimiento WCAG
  - Navegación por teclado
  - Lectores de pantalla
  - Contraste y legibilidad

### **🔵 PRIORIDAD BAJA (Futuras Mejoras)**

#### **I. Depuración Opcional (8 horas)**
- [ ] **I1. Evaluar campos innecesarios**
  - Revisar si eliminar `classroom_type`
  - Analizar utilidad de tabla `chain`
  - Simplificar `nomenclature` si no se usa
  - Consolidar campos redundantes

#### **J. Funcionalidades Futuras (40 horas)**
- [ ] **J1. Gestión formal de materias (20 horas)**
  - Implementar cuando institución tenga estructura definida
  - Catálogo de cursos y materias
  - Sistema de prerrequisitos
  - Malla curricular

- [ ] **J2. Mejoras de Plataforma (20 horas)**
  - PWA con capacidades offline
  - Sincronización en background
  - Push notifications
  - App móvil nativa

---

## 📊 **ESTIMACIONES DETALLADAS**

### **Resumen por Prioridad:**
- **🔴 Crítica**: 45 horas (Semanas 1-2)
- **🟡 Alta**: 70 horas (Semanas 3-4) 
- **🟢 Media**: 45 horas (Semanas 5-6)
- **🔵 Baja**: 48 horas (Futuro)

### **Total Estimado**: 208 horas

### **Timeline Sugerido:**
- **Mes 1**: Prioridad Crítica + parte de Alta
- **Mes 2**: Completar Alta + Prioridad Media
- **Mes 3**: Optimizaciones y mejoras
- **Futuro**: Funcionalidades avanzadas según necesidades

---

## 🎯 **HITOS IMPORTANTES**

### **Hito 1: Sistema Base Operativo (Semana 2)**
- ✅ Dashboard con datos reales
- ✅ Todas las consultas funcionando
- ✅ Integración frontend-backend completa

### **Hito 2: Gestión Académica Completa (Semana 4)**
- ✅ Módulo de configuración académica
- ✅ Sistema de trimestres operativo
- ✅ Notificaciones funcionando

### **Hito 3: Sistema Optimizado (Semana 6)**
- ✅ Performance optimizada
- ✅ UX pulida y responsiva
- ✅ Reportes avanzados funcionando

---

## 📝 **NOTAS IMPORTANTES**

### **Decisiones Tomadas:**
- ❌ NO agregar `coordinator_id` a student_group (no relevante)
- ✅ Mantener campo abierto para materias hasta que institución esté lista
- ✅ Usar tabla quarter existente para gestión de trimestres
- ✅ Evitar relaciones circulares en cálculo de trimestres
- ✅ Reutilizar TopBar existente para notificaciones

### **Arquitectura Mantenida:**
- React + TypeScript + Vite
- TanStack Query + Zustand
- Tailwind CSS + Framer Motion
- FastAPI + SQLAlchemy
- MySQL + Alembic

### **Próximos Pasos Inmediatos:**
1. **Debugging de integración frontend-backend**
2. **Conectar dashboard con datos reales**
3. **Implementar cálculo de trimestres**
4. **Crear módulo de configuración académica**

---

**🎯 Este roadmap está listo para ejecutarse tarea por tarea. ¿Por dónde quieres empezar?**