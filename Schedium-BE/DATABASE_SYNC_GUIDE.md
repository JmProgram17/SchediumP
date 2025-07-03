# 📚 Guía de Sincronización Completa de Base de Datos

Esta guía explica cómo compartir y sincronizar la base de datos COMPLETA (estructura + datos) entre desarrolladores.

## 🎯 Para el que EXPORTA (Tú)

### 1. Exportar la base de datos completa
```bash
cd Schedium-BE
./scripts/export_full_database.sh
```

Esto creará dos archivos en `database_backup/`:
- `schedium_full_backup_YYYYMMDD_HHMMSS.sql.gz` (con timestamp)
- `schedium_latest_backup.sql.gz` (copia del último backup)

### 2. Compartir el backup
**Opción A: Subir a GitHub** (recomendado si < 100MB)
```bash
git add database_backup/schedium_latest_backup.sql.gz
git commit -m "feat: backup completo de base de datos"
git push
```

**Opción B: Compartir por Drive/WeTransfer** (si es muy grande)
- Sube el archivo `.sql.gz` a Google Drive o similar
- Comparte el enlace con tu compañero

## 🎯 Para el que IMPORTA (Tu amigo)

### 1. Clonar el repositorio
```bash
git clone [url-del-repositorio]
cd Schedium/Schedium-BE
```

### 2. Obtener el backup
**Si está en GitHub:**
```bash
git pull
# El archivo ya estará en database_backup/schedium_latest_backup.sql.gz
```

**Si está en Drive:**
```bash
# Descargar el archivo y colocarlo en:
mkdir -p database_backup
# Colocar el archivo descargado en database_backup/
```

### 3. Importar la base de datos completa
```bash
# Asegurarse de estar en Schedium-BE
cd Schedium-BE

# Opción 1: Importar el último backup
./scripts/import_full_database.sh

# Opción 2: Importar un archivo específico
./scripts/import_full_database.sh ruta/al/archivo.sql.gz
```

## ✅ Verificación

Después de importar, verifica en DBeaver:
- **Host:** localhost
- **Puerto:** 3307
- **Base de datos:** schedium
- **Usuario:** schedule
- **Contraseña:** HorariosSena1

Deberías ver:
- ✅ Todas las tablas con sus datos
- ✅ Relación coordinador-usuario en la tabla `department`
- ✅ Todos los triggers y vistas
- ✅ Todos los usuarios, cursos, horarios, etc.

## 🚨 Notas Importantes

1. **El script de importación ELIMINA todos los datos anteriores** antes de importar
2. **Asegúrate de hacer backup** si tienes datos locales importantes
3. **El archivo .sql.gz está comprimido** para reducir el tamaño
4. **Los scripts manejan automáticamente** la compresión/descompresión

## 🚨 Migraciones Específicas No Aplicadas

Si después de importar la base de datos, tu amigo ve que:
- ❌ La tabla `classroom` AÚN tiene el campo `classroom_type`
- ❌ La tabla `quarter` NO tiene campos como `quarter_number`, `academic_year`, etc.

**Ejecutar este comando para forzar las migraciones faltantes:**
```bash
./scripts/force_missing_migrations.sh
```

Este script aplicará manualmente:
1. ✅ Remover `classroom_type` de la tabla `classroom`
2. ✅ Agregar campos adicionales a la tabla `quarter`

## 🔧 Solución de Problemas

### Error: "El contenedor MySQL no está activo"
```bash
docker-compose up -d mysql
# Esperar 10 segundos
./scripts/export_full_database.sh
```

### Error: "No se encontró el archivo de backup"
Verifica que:
1. El archivo esté en `database_backup/`
2. El nombre sea correcto
3. Tengas permisos de lectura

### La base de datos no se ve igual
1. Verifica que no haya errores durante la importación
2. Revisa los logs: `docker-compose logs mysql`
3. Asegúrate de usar el backup más reciente

## 📅 Mejores Prácticas

1. **Exporta regularmente** cuando hagas cambios importantes
2. **Versiona los backups** con fechas descriptivas
3. **Documenta cambios importantes** en los commits
4. **Coordina con el equipo** antes de grandes cambios de esquema