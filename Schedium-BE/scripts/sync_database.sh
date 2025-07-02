#!/bin/bash

# Script para sincronizar la base de datos con todas las migraciones
# Útil cuando se clona el proyecto desde cero

echo "🔄 Sincronizando base de datos Schedium..."

# Detener contenedores existentes
echo "📦 Deteniendo contenedores..."
docker-compose down

# Eliminar volumen de datos anterior (opcional - comentar si se quiere preservar datos)
echo "🗑️  Eliminando datos anteriores..."
docker volume rm schedium-be_mysql_data 2>/dev/null || true

# Levantar solo MySQL
echo "🚀 Iniciando MySQL..."
docker-compose up -d mysql

# Esperar a que MySQL esté listo
echo "⏳ Esperando a que MySQL esté listo..."
sleep 15

# Ejecutar migraciones de Alembic
echo "📝 Ejecutando migraciones de Alembic..."
docker-compose run --rm api alembic upgrade head

# Levantar todos los servicios
echo "🎯 Iniciando todos los servicios..."
docker-compose up -d

echo "✅ Base de datos sincronizada correctamente!"
echo ""
echo "📊 Para verificar en DBeaver:"
echo "   Host: localhost"
echo "   Puerto: 3307"
echo "   Base de datos: schedium"
echo "   Usuario: schedule"
echo "   Contraseña: HorariosSena1"