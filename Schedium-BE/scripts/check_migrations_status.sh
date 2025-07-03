#!/bin/bash

# Script para verificar el estado de las migraciones de Alembic
# y comparar con la estructura actual de la base de datos

echo "🔍 Verificando estado de migraciones de Schedium..."

DB_CONTAINER="schedium-mysql"
DB_NAME="schedium"
DB_USER="root"
DB_PASSWORD="rootpassword"

# Verificar que el contenedor esté activo
echo "📦 Verificando contenedor MySQL..."
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Error: El contenedor MySQL no está activo."
    echo "Ejecuta: docker-compose up -d mysql"
    exit 1
fi

echo "✅ Contenedor MySQL activo"
echo ""

# Mostrar migraciones aplicadas
echo "📋 Migraciones aplicadas en Alembic:"
docker-compose run --rm api alembic history --verbose
echo ""

# Mostrar migración actual
echo "🎯 Migración actual:"
docker-compose run --rm api alembic current --verbose
echo ""

# Verificar estructura específica de tablas críticas
echo "🏗️ Verificando estructura de tablas críticas:"
echo ""

echo "📊 Tabla CLASSROOM (no debería tener classroom_type):"
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DESC classroom;" "$DB_NAME" 2>/dev/null
echo ""

echo "📊 Tabla QUARTER (debería tener campos adicionales):"
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DESC quarter;" "$DB_NAME" 2>/dev/null
echo ""

echo "📊 Tabla DEPARTMENT (debería tener coordinator_id):"
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DESC department;" "$DB_NAME" 2>/dev/null
echo ""

# Verificar migraciones pendientes
echo "⏳ Verificando si hay migraciones pendientes:"
PENDING=$(docker-compose run --rm api alembic heads 2>/dev/null)
CURRENT=$(docker-compose run --rm api alembic current 2>/dev/null)

if [ "$PENDING" = "$CURRENT" ]; then
    echo "✅ Todas las migraciones están aplicadas"
else
    echo "⚠️ HAY MIGRACIONES PENDIENTES"
    echo "Ejecuta: docker-compose run --rm api alembic upgrade head"
fi

echo ""
echo "🎉 Verificación completa!"
echo ""
echo "📋 Checklist de verificación:"
echo "   [ ] Classroom NO tiene campo 'classroom_type'"
echo "   [ ] Quarter tiene campos: quarter_number, academic_year, description, is_active"
echo "   [ ] Department tiene campo 'coordinator_id'"
echo "   [ ] No hay migraciones pendientes"