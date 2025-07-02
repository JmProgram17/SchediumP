#!/bin/bash

# Script para importar la base de datos completa desde un backup
# Restaura TODO: esquema, datos, triggers, vistas, procedimientos, etc.

echo "🔵 Importando base de datos completa de Schedium..."

# Variables
DB_CONTAINER="schedium-mysql"
DB_USER="root"
DB_PASSWORD="rootpassword"
BACKUP_DIR="./database_backup"

# Verificar argumentos
if [ $# -eq 0 ]; then
    # Si no se proporciona archivo, usar el último backup
    BACKUP_FILE="${BACKUP_DIR}/schedium_latest_backup.sql.gz"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: No se encontró el archivo de backup."
        echo "Uso: $0 [archivo_backup.sql.gz]"
        echo "O coloca el backup en: ${BACKUP_DIR}/schedium_latest_backup.sql.gz"
        exit 1
    fi
else
    BACKUP_FILE="$1"
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo $BACKUP_FILE"
    exit 1
fi

echo "📦 Verificando contenedores..."
# Detener todos los contenedores
docker-compose down

# Eliminar volumen de datos anterior
echo "🗑️ Eliminando datos anteriores..."
docker volume rm schedium-be_mysql_data 2>/dev/null || true

# Levantar solo MySQL
echo "🚀 Iniciando MySQL..."
docker-compose up -d mysql

# Esperar a que MySQL esté listo
echo "⏳ Esperando a que MySQL esté listo..."
for i in {1..30}; do
    if docker exec "$DB_CONTAINER" mysqladmin ping -h localhost -u"$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; then
        echo "✅ MySQL está listo!"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Importar la base de datos
echo "💾 Importando base de datos desde $BACKUP_FILE..."

# Determinar si el archivo está comprimido
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Descomprimiendo e importando..."
    gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD"
else
    echo "📥 Importando archivo SQL..."
    docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" < "$BACKUP_FILE"
fi

# Verificar si la importación fue exitosa
if [ $? -eq 0 ]; then
    echo "✅ Base de datos importada exitosamente!"
    
    # Levantar todos los servicios
    echo "🎯 Iniciando todos los servicios..."
    docker-compose up -d
    
    echo ""
    echo "🎉 ¡Listo! Tu amigo ahora tiene exactamente la misma base de datos que tú."
    echo ""
    echo "📊 Para verificar en DBeaver:"
    echo "   Host: localhost"
    echo "   Puerto: 3307"
    echo "   Base de datos: schedium"
    echo "   Usuario: schedule"
    echo "   Contraseña: HorariosSena1"
else
    echo "❌ Error al importar la base de datos"
    exit 1
fi