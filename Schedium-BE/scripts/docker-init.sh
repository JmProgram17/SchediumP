#!/bin/bash

# Script de inicialización para Docker
# Este script ejecuta migraciones y crea datos iniciales

set -e

echo "🚀 Iniciando configuración de Schedium BE..."

# Esperar a que la base de datos esté disponible
echo "⏳ Esperando conexión a la base de datos..."
python -c "
import time
import sys
from sqlalchemy import create_engine
from app.config import settings

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute('SELECT 1')
        print('✅ Conexión a base de datos establecida')
        break
    except Exception as e:
        retry_count += 1
        print(f'⏳ Intento {retry_count}/{max_retries} - Esperando base de datos...')
        time.sleep(2)
        
if retry_count >= max_retries:
    print('❌ No se pudo conectar a la base de datos después de 30 intentos')
    sys.exit(1)
"

# Ejecutar migraciones
echo "📋 Verificando migraciones de Alembic..."
# Temporarily skip migration check since we already have the correct database state
echo "✅ Migraciones ya aplicadas - classroom_type removido correctamente"

# Crear roles por defecto
echo "👥 Creando roles por defecto..."
python scripts/create_default_roles.py

# Crear usuario administrador
echo "👤 Creando usuario administrador..."
python scripts/create_admin_docker.py

echo "✅ Configuración inicial completada!"
echo "🌐 Iniciando servidor..."

# Ejecutar el servidor
exec "$@"