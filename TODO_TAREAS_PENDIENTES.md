# 📋 TODO - Tareas Pendientes para Desarrollo Futuro

> **Estado**: Documentación de tareas que pueden implementarse después de completar los módulos urgentes.
> **Última actualización**: 28 de Junio, 2025

## 🎯 Propósito de los Endpoints Pendientes

### 🔐 **Endpoints de Autenticación Híbrida**

#### `POST /auth/users/create-with-strategy`
**Para qué sirve**: Crear usuarios sin que el admin tenga que inventar contraseñas
**Beneficio**: 
- 🔒 **Seguridad**: Admin nunca ve la contraseña del usuario
- 📧 **Automatización**: Usuario recibe email y crea su propia contraseña
- ⚡ **UX**: Proceso más profesional y seguro

**Ejemplo de uso**:
```bash
# En lugar de que admin ponga: "password123"
# El sistema envía email al usuario para que cree su propia contraseña
curl -X POST "/auth/users/create-with-strategy" \
  -d '{"email": "nuevo@empresa.com", "first_name": "Juan"}'
# Respuesta: "Email enviado al usuario para crear contraseña"
```

#### `GET /auth/auth-methods/available`
**Para qué sirve**: Verificar qué métodos de autenticación están funcionando
**Beneficio**:
- 🔍 **Diagnóstico**: Saber si el email está configurado correctamente
- 🎛️ **Configuración**: Frontend muestra opciones disponibles
- 🚨 **Alertas**: Admin sabe cuándo el email no funciona

**Ejemplo de respuesta**:
```json
{
  "magic_link": {"available": true, "reason": null},
  "temp_email": {"available": true, "reason": null}, 
  "visible_password": {"available": true, "reason": "Fallback method"},
  "recommended_method": "magic_link"
}
```

#### `POST /set-password-from-token` y `POST /verify-token`
**Para qué sirve**: Permitir que usuarios creen contraseñas desde enlaces de email
**Beneficio**:
- 🔗 **Magic Links**: Usuario hace clic en email y crea contraseña
- ⏰ **Seguridad**: Enlaces expiran automáticamente
- 🔄 **Onboarding**: Experiencia moderna de registro

### 📊 **Endpoints de Estadísticas y Reportes**

#### `GET /auth/users/stats`
**Para qué sirve**: Obtener métricas agregadas desde la base de datos
**Problema actual**: Frontend calcula estadísticas con datos limitados en memoria
**Beneficio**: 
- 📈 **Performance**: Cálculos optimizados en base de datos
- 📊 **Precisión**: Datos completos, no solo la página actual
- 🚀 **Escalabilidad**: Funciona con miles de usuarios

**Datos que debería retornar**:
```json
{
  "total_users": 1247,
  "active_users": 1156,
  "users_by_role": {
    "Administrator": 3,
    "Coordinator": 12,
    "Secretary": 45,
    "User": 1187
  },
  "recent_logins": 234,
  "users_created_this_month": 89,
  "password_expires_soon": 23
}
```

#### `GET /auth/users/export`
**Para qué sirve**: Exportar TODOS los usuarios desde base de datos
**Problema actual**: Solo exporta usuarios visibles en pantalla (máximo 100)
**Beneficio**:
- 📁 **Completitud**: Todos los usuarios sin límite de paginación
- 🎛️ **Filtros**: Exportar solo activos, por rol, por fecha, etc.
- 📊 **Formatos**: CSV, Excel, PDF con formato profesional

### 🔧 **Endpoints de Administración**

#### `POST /auth/users/{id}/reset-password`
**Para qué sirve**: Admin puede generar nueva contraseña temporal para usuarios
**Problema actual**: Muestra mensaje "próximamente" 
**Casos de uso**:
- 🔑 **Usuario olvidó contraseña**: Admin genera nueva temporal
- 🚨 **Compromiso de seguridad**: Forzar cambio de contraseña
- 👥 **Nuevos empleados**: Generar acceso rápido

**Flujo esperado**:
```bash
POST /auth/users/123/reset-password
# Respuesta: {"temp_password": "Casa-Verde-2024!", "expires_in": "24 hours"}
```

#### `GET /auth/users/check-email/{email}` y `GET /auth/users/check-document/{document}`
**Para qué sirve**: Validar unicidad ANTES de enviar formulario
**Problema actual**: Solo valida formato, permite duplicados
**Beneficio**:
- ✅ **UX**: Usuario sabe inmediatamente si email ya existe
- 🚫 **Prevención**: Evita errores de duplicación
- ⚡ **Performance**: Validación rápida sin enviar formulario completo

**Ejemplo de uso en frontend**:
```typescript
// Usuario escribe email, frontend verifica automáticamente
const checkEmail = async (email: string) => {
  const response = await api.get(`/auth/users/check-email/${email}`)
  if (response.exists) {
    showError("Este email ya está registrado")
  }
}
```

#### `POST /auth/users/bulk`
**Para qué sirve**: Operaciones masivas con múltiples usuarios
**Problema actual**: Solo se puede activar/desactivar de uno en uno
**Casos de uso**:
- 👥 **Fin de semestre**: Desactivar 200 estudiantes graduados
- 🏢 **Cambio organizacional**: Mover usuarios entre roles
- 🧹 **Limpieza**: Eliminar usuarios inactivos masivamente

**Operaciones esperadas**:
```json
{
  "action": "deactivate",
  "user_ids": [123, 456, 789, ...],
  "reason": "Graduación semestre 2024-2"
}
```

---

## 📅 TODO LIST - Tareas Organizadas por Prioridad

### 🔴 **URGENTE** (Próximas 2 semanas)
> Tareas críticas para funcionalidad básica

- [ ] **Módulo de Programas Académicos**
  - [ ] CRUD completo de programas
  - [ ] Relación con coordinadores
  - [ ] Validaciones de nomenclatura
  - [ ] Estados del programa (activo/inactivo/suspendido)

- [ ] **Módulo de Materias/Asignaturas**
  - [ ] CRUD de materias
  - [ ] Asignación a programas
  - [ ] Prerrequisitos y correquisitos
  - [ ] Créditos académicos

- [ ] **Módulo de Docentes**
  - [ ] CRUD de instructores
  - [ ] Especialidades y competencias
  - [ ] Disponibilidad horaria
  - [ ] Cargas académicas

### 🟡 **IMPORTANTE** (Próximo mes)
> Mejoras significativas que impactan la experiencia

#### **Backend - Endpoints Faltantes**
- [ ] `POST /auth/users/create-with-strategy` - Creación híbrida de usuarios
- [ ] `GET /auth/auth-methods/available` - Verificar métodos disponibles
- [ ] `POST /set-password-from-token` - Crear contraseña desde magic link
- [ ] `POST /verify-token` - Validar tokens de magic link
- [ ] `GET /auth/users/stats` - Estadísticas agregadas de usuarios
- [ ] `POST /auth/users/{id}/reset-password` - Reset password administrativo
- [ ] `GET /auth/users/check-email/{email}` - Verificar email único
- [ ] `GET /auth/users/check-document/{document}` - Verificar documento único
- [ ] `POST /auth/users/bulk` - Operaciones masivas de usuarios
- [ ] `GET /auth/users/export` - Exportación completa de usuarios

#### **Configuración de Email**
- [ ] Configurar SMTP real (Gmail/SendGrid/Mailgun)
- [ ] Plantillas de email profesionales
- [ ] Testing de deliverability
- [ ] Configuración de dominio (SPF/DKIM)

#### **Módulo de Horarios**
- [ ] Grid de horarios visuales
- [ ] Asignación de bloques
- [ ] Conflictos automáticos
- [ ] Vista de instructor y estudiante

### 🟢 **DESEABLE** (Próximos 2-3 meses)
> Mejoras de UX y funcionalidades avanzadas

#### **Frontend - Mejoras de UX**
- [ ] **Filtros avanzados** en listas de usuarios
  - [ ] Por rol, fecha de creación, último login
  - [ ] Estado activo/inactivo
  - [ ] Búsqueda por documento
- [ ] **Vista de tabla** además de cards
- [ ] **Ordenamiento** por columnas (nombre, email, fecha)
- [ ] **Selección masiva** mejorada con checkboxes
- [ ] **Exportación avanzada** con filtros aplicados
- [ ] **Importación de usuarios** desde CSV/Excel

#### **Performance y Escalabilidad**
- [ ] **Virtual scrolling** para listas grandes (+1000 usuarios)
- [ ] **Debounced search** (búsqueda con delay)
- [ ] **Lazy loading** de imágenes de perfil
- [ ] **Paginación infinita** como alternativa
- [ ] **Cache inteligente** con invalidación selectiva
- [ ] **Compresión de imágenes** automática

#### **Seguridad Avanzada**
- [ ] **Auditoría de acciones** (quién hizo qué y cuándo)
- [ ] **Roles y permisos granulares** (RBAC detallado)
- [ ] **Sesiones concurrentes** controladas
- [ ] **2FA opcional** para administradores
- [ ] **Políticas de contraseña** configurables
- [ ] **Login attempts** y bloqueo temporal

### 🟣 **EXPERIMENTAL** (Futuro lejano)
> Ideas innovadoras para considerar

#### **Inteligencia Artificial**
- [ ] **Sugerencias de horarios** con IA
- [ ] **Detección de conflictos** inteligente
- [ ] **Optimización automática** de recursos
- [ ] **Predicción de demanda** de materias

#### **Integraciones**
- [ ] **Single Sign-On (SSO)** con Google/Microsoft
- [ ] **Integración con LDAP/Active Directory**
- [ ] **API REST pública** para integraciones
- [ ] **Webhooks** para eventos importantes
- [ ] **Integración con sistemas de notas** externos

#### **Mobile y PWA**
- [ ] **App móvil nativa** (React Native)
- [ ] **PWA** (Progressive Web App)
- [ ] **Notificaciones push**
- [ ] **Modo offline** básico

---

## 🎯 Explicación del Impacto de Cada Endpoint

### **Autenticación Híbrida - Impacto Alto**
```
Sin implementar:
❌ Admin tiene que inventar contraseñas
❌ Contraseñas débiles por comodidad 
❌ Admin ve contraseñas de usuarios
❌ Proceso manual de comunicar credenciales

Con implementación:
✅ Usuario crea su propia contraseña fuerte
✅ Proceso automático por email
✅ Mayor seguridad organizacional
✅ Experiencia profesional
```

### **Estadísticas Reales - Impacto Medio**
```
Sin implementar:
❌ Solo muestra datos de página actual
❌ Cálculos incorrectos con paginación
❌ Performance lenta con muchos usuarios

Con implementación:
✅ Datos precisos de toda la base
✅ Métricas útiles para administración
✅ Performance optimizada
```

### **Validaciones de Unicidad - Impacto Medio**
```
Sin implementar:
❌ Usuarios pueden registrarse con email duplicado
❌ Errores confusos después de enviar formulario
❌ Datos inconsistentes

Con implementación:
✅ Validación en tiempo real
✅ UX fluida y clara
✅ Integridad de datos garantizada
```

### **Operaciones Masivas - Impacto Bajo**
```
Sin implementar:
❌ Tareas repetitivas y lentas
❌ Propenso a errores humanos
❌ Administración ineficiente

Con implementación:
✅ Administración eficiente
✅ Menor posibilidad de errores
✅ Escalabilidad para organizaciones grandes
```

---

## 🚀 Recomendación de Priorización

### **Implementar AHORA** (después de módulos urgentes):
1. ✅ **Endpoints de autenticación híbrida** - Mejora seguridad significativamente
2. ✅ **Validaciones de unicidad** - Previene problemas de datos
3. ✅ **Configuración de email real** - Habilita flujos automáticos

### **Implementar en 1-2 meses**:
4. ✅ **Estadísticas reales** - Mejora experiencia de administración
5. ✅ **Reset password administrativo** - Funcionalidad esperada por admins
6. ✅ **Exportación completa** - Requerimiento común

### **Implementar cuando haya tiempo**:
7. ✅ **Operaciones masivas** - Útil para organizaciones grandes
8. ✅ **Filtros avanzados** - Mejora UX
9. ✅ **Mejoras de performance** - Optimización

---

## 📊 Estimaciones de Tiempo

| Tarea | Tiempo Estimado | Complejidad |
|-------|----------------|-------------|
| Endpoints autenticación híbrida | 2-3 días | Media |
| Configuración email real | 1 día | Baja |
| Validaciones unicidad | 1 día | Baja |
| Estadísticas backend | 1 día | Baja |
| Reset password admin | 1 día | Baja |
| Exportación completa | 1 día | Baja |
| Operaciones masivas | 2 días | Media |
| Filtros avanzados frontend | 2 días | Media |
| **TOTAL ESTIMADO** | **12-14 días** | - |

---

## 🎯 Conclusión

Los endpoints pendientes no son **críticos** para el funcionamiento básico, pero **mejoran significativamente** la experiencia y seguridad del sistema. El módulo de usuarios funciona perfectamente para testing y uso básico **ahora mismo**.

**Recomendación**: Enfocarse en completar los módulos urgentes (Programas, Materias, Docentes, Horarios) y después regresar a pulir el módulo de usuarios con estos endpoints adicionales.

**Prioridad máxima para el futuro**: Autenticación híbrida por temas de seguridad.