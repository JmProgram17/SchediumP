#!/bin/bash

# Script para exportar la base de datos completa (estructura + datos)
# Incluye TODO: esquema, datos, triggers, vistas, procedimientos, etc.

echo "🔵 Exportando base de datos completa de Schedium..."

# Variables
DB_CONTAINER="schedium-mysql"
DB_NAME="schedium"
DB_USER="root"
DB_PASSWORD="rootpassword"
OUTPUT_DIR="./database_backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${OUTPUT_DIR}/schedium_full_backup_${TIMESTAMP}.sql"

# Crear directorio de backup si no existe
mkdir -p "$OUTPUT_DIR"

echo "📦 Verificando que el contenedor MySQL esté activo..."
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Error: El contenedor MySQL no está activo. Ejecuta 'docker-compose up -d mysql' primero."
    exit 1
fi

echo "💾 Exportando base de datos completa..."
docker exec "$DB_CONTAINER" mysqldump \
    -u"$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-database \
    --databases "$DB_NAME" \
    --complete-insert \
    --extended-insert \
    --lock-tables=false \
    > "$OUTPUT_FILE"

# Verificar si la exportación fue exitosa
if [ $? -eq 0 ]; then
    # Comprimir el archivo
    echo "🗜️ Comprimiendo backup..."
    gzip "$OUTPUT_FILE"
    OUTPUT_FILE="${OUTPUT_FILE}.gz"
    
    # Obtener tamaño del archivo
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    
    echo "✅ Base de datos exportada exitosamente!"
    echo "📁 Archivo: $OUTPUT_FILE"
    echo "📊 Tamaño: $FILE_SIZE"
    echo ""
    echo "📤 Para compartir con tu compañero:"
    echo "   1. Súbelo a GitHub (si no es muy grande):"
    echo "      git add $OUTPUT_FILE"
    echo "      git commit -m 'feat: backup completo de base de datos'"
    echo "      git push"
    echo ""
    echo "   2. O compártelo por otro medio (Drive, etc.)"
    
    # Crear también un archivo de última versión
    cp "$OUTPUT_FILE" "${OUTPUT_DIR}/schedium_latest_backup.sql.gz"
    echo ""
    echo "💡 También se creó: ${OUTPUT_DIR}/schedium_latest_backup.sql.gz"
else
    echo "❌ Error al exportar la base de datos"
    exit 1
fi