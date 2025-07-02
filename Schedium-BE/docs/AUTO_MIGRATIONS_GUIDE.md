# Guía de Migraciones Automáticas - Schedium

## 🚀 Resumen

Se ha implementado un sistema de migraciones automáticas que garantiza que **TODAS** las migraciones se ejecuten sin excepción al iniciar el proyecto.

## 🔧 Componentes Implementados

### 1. **Módulo de Migraciones Automáticas**
- **Archivo**: `app/core/migrations.py`
- **Funcionalidad**: 
  - Detecta migraciones pendientes
  - Ejecuta todas las migraciones automáticamente
  - Verifica el estado final
  - Maneja errores con fallbacks

### 2. **Integración en el Arranque**
- **Archivo modificado**: `app/main.py`
- **Cambio**: Las migraciones se ejecutan automáticamente en el lifecycle de FastAPI
- **Comportamiento**: 
  - Se ejecutan al iniciar la aplicación
  - Si fallan, la aplicación continúa pero registra advertencias

### 3. **Script de Arranque Mejorado**
- **Archivo**: `scripts/startup_with_migrations.sh`
- **Características**:
  - Espera a que la base de datos esté lista
  - Ejecuta migraciones antes de iniciar la app
  - Verifica el estado final
  - Compatible con Docker y entornos locales

### 4. **Script de Verificación Manual**
- **Archivo**: `scripts/ensure_all_migrations.py`
- **Uso**: Para verificar y forzar migraciones manualmente
- **Características**:
  - Reporte detallado del estado
  - Verificación de tablas críticas
  - Aplicación forzada de migraciones

### 5. **Configuración Docker**
- **Archivo**: `docker-compose.override.yml`
- **Cambio**: Usa el script de arranque mejorado automáticamente

## 📋 Cómo Funciona

### Arranque Normal (Docker Compose)

```bash
# Simplemente ejecuta:
docker-compose up

# Las migraciones se ejecutarán automáticamente en este orden:
# 1. El contenedor espera a que MySQL esté listo
# 2. Ejecuta startup_with_migrations.sh
# 3. El script aplica todas las migraciones pendientes
# 4. La aplicación FastAPI inicia y verifica las migraciones nuevamente
# 5. Si todo está bien, el servicio está listo
```

### Arranque Local

```bash
# Opción 1: Usar el script de arranque
./scripts/startup_with_migrations.sh

# Opción 2: Arranque directo (también ejecuta migraciones)
python -m uvicorn app.main:app --reload
```

### Verificación Manual

```bash
# Verificar estado de migraciones
python scripts/ensure_all_migrations.py

# Verificar con el script bash
./scripts/check_migrations_status.sh
```

## 🛡️ Garantías del Sistema

1. **Ejecución en Dos Puntos**:
   - Script de arranque (antes de iniciar la app)
   - Inicio de FastAPI (como respaldo)

2. **Manejo de Errores**:
   - Si Alembic falla, intenta con subprocess
   - Si todo falla, la app continúa pero registra el error

3. **Verificación**:
   - Después de aplicar, verifica que el estado sea correcto
   - Comprueba tablas críticas

## 🔍 Migraciones que se Garantizan

1. `initial_schema` - Esquema base de datos
2. `remove_capacity_field_from_student` - Elimina campo capacity
3. `add_name_to_campus_remove_capacity_from_classroom` - Ajustes campus/classroom
4. `remove_classroom_type_simple` - **Elimina classroom_type**
5. `add_quarter_additional_fields` - **Agrega campos a quarter**
6. `add_academic_schedule_config` - Configuración académica

## 🐛 Solución de Problemas

### Si las migraciones no se ejecutan:

1. **Verificar logs**:
   ```bash
   docker-compose logs api | grep -i migration
   ```

2. **Ejecutar verificación manual**:
   ```bash
   docker-compose run --rm api python scripts/ensure_all_migrations.py
   ```

3. **Forzar migraciones**:
   ```bash
   docker-compose run --rm api alembic upgrade head
   ```

### Si hay errores de estructura:

1. **Usar el script de corrección**:
   ```bash
   docker-compose run --rm api bash scripts/force_missing_migrations.sh
   ```

2. **Verificar tabla específica**:
   ```bash
   docker exec schedium-mysql mysql -uroot -prootpassword -e "DESC classroom;" schedium
   ```

## ✅ Resultado Esperado

Después de iniciar el proyecto, SIEMPRE tendrás:

- ❌ Tabla `classroom` SIN campo `classroom_type`
- ✅ Tabla `quarter` CON campos: `quarter_number`, `academic_year`, `description`, `is_active`
- ✅ Tabla `academic_schedule_config` presente
- ✅ Todas las demás migraciones aplicadas

## 🚨 Importante

- **NO** es necesario ejecutar migraciones manualmente
- **NO** es necesario modificar la base de datos manualmente
- Todo se ejecuta automáticamente al iniciar el proyecto

## 📝 Para Desarrolladores

Si agregas nuevas migraciones:

1. Crea la migración:
   ```bash
   alembic revision --autogenerate -m "descripcion"
   ```

2. La migración se aplicará automáticamente en el próximo arranque

3. No necesitas modificar ningún script - el sistema las detectará