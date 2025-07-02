#!/bin/bash

# Script de prueba para verificar que las migraciones automáticas funcionan

echo "🧪 Probando Sistema de Migraciones Automáticas"
echo "=============================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar que estamos en el directorio correcto
if [ ! -f "alembic.ini" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde el directorio Schedium-BE${NC}"
    exit 1
fi

echo ""
echo "1️⃣ Verificando módulo de migraciones..."
python -c "from app.core.migrations import init_migrations; print('✅ Módulo cargado correctamente')" || {
    echo -e "${RED}❌ Error al cargar módulo de migraciones${NC}"
    exit 1
}

echo ""
echo "2️⃣ Verificando configuración de Alembic..."
python -c "
from app.core.migrations import get_alembic_config
try:
    config = get_alembic_config()
    print('✅ Configuración de Alembic OK')
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"

echo ""
echo "3️⃣ Verificando estado actual de migraciones..."
python scripts/ensure_all_migrations.py

echo ""
echo "4️⃣ Probando ejecución de migraciones..."
python -c "
from app.core.migrations import init_migrations
result = init_migrations()
if result:
    print('✅ Migraciones ejecutadas exitosamente')
else:
    print('⚠️  Algunas migraciones pueden haber fallado')
"

echo ""
echo -e "${GREEN}✅ Prueba completada!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "   - Para desarrollo local: ./scripts/startup_with_migrations.sh"
echo "   - Para Docker: docker-compose up"
echo "   - Las migraciones se ejecutarán automáticamente en ambos casos"