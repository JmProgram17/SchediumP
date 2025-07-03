#!/bin/bash

# Script para aplicar manualmente las migraciones que no se están ejecutando
# Específicamente: classroom_type removal y quarter additional fields

echo "🔧 Aplicando migraciones faltantes manualmente..."

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

echo "🔍 Verificando estado actual de las tablas..."

# Verificar si classroom_type existe
CLASSROOM_TYPE_EXISTS=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='classroom' AND column_name='classroom_type';" -sN 2>/dev/null)

# Verificar si quarter tiene los campos adicionales
QUARTER_FIELDS=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='quarter' AND column_name IN ('quarter_number', 'academic_year', 'description', 'is_active');" -sN 2>/dev/null)

echo "📊 Estado actual:"
echo "   - classroom_type existe: $([ "$CLASSROOM_TYPE_EXISTS" -gt 0 ] && echo "SÍ ❌" || echo "NO ✅")"
echo "   - quarter campos adicionales: $QUARTER_FIELDS/4 $([ "$QUARTER_FIELDS" -eq 4 ] && echo "✅" || echo "❌")"
echo ""

# Aplicar migración para remover classroom_type si existe
if [ "$CLASSROOM_TYPE_EXISTS" -gt 0 ]; then
    echo "🗑️ Removiendo campo classroom_type de la tabla classroom..."
    docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "ALTER TABLE classroom DROP COLUMN classroom_type;" "$DB_NAME" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Campo classroom_type removido exitosamente"
    else
        echo "❌ Error al remover classroom_type"
    fi
else
    echo "✅ Campo classroom_type ya fue removido"
fi

# Aplicar migración para agregar campos a quarter si no existen
if [ "$QUARTER_FIELDS" -lt 4 ]; then
    echo "➕ Agregando campos faltantes a la tabla quarter..."
    
    # Verificar y agregar cada campo individualmente
    for field in "quarter_number:INT NULL COMMENT 'Quarter number (1-4)'" \
                 "academic_year:INT NULL COMMENT 'Academic year'" \
                 "enrollment_deadline:DATE NULL COMMENT 'Enrollment deadline'" \
                 "description:TEXT NULL COMMENT 'Quarter description'" \
                 "is_active:BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Whether quarter is active'"; do
        
        field_name=$(echo $field | cut -d: -f1)
        field_def=$(echo $field | cut -d: -f2-)
        
        # Verificar si el campo existe
        FIELD_EXISTS=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='quarter' AND column_name='$field_name';" -sN 2>/dev/null)
        
        if [ "$FIELD_EXISTS" -eq 0 ]; then
            echo "   - Agregando campo: $field_name"
            docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "ALTER TABLE quarter ADD COLUMN $field_name $field_def;" "$DB_NAME" 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo "     ✅ Campo $field_name agregado"
            else
                echo "     ❌ Error al agregar $field_name"
            fi
        else
            echo "   - Campo $field_name ya existe ✅"
        fi
    done
else
    echo "✅ Tabla quarter ya tiene todos los campos adicionales"
fi

echo ""
echo "🔍 Verificación final..."

# Verificación final
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DESC classroom;" "$DB_NAME" 2>/dev/null | head -10
echo ""
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DESC quarter;" "$DB_NAME" 2>/dev/null | head -15

echo ""
echo "🎉 Migraciones manuales completadas!"
echo ""
echo "✅ Ahora tu amigo debería tener:"
echo "   - Tabla classroom SIN campo classroom_type"
echo "   - Tabla quarter CON campos: quarter_number, academic_year, description, is_active"