#!/bin/bash

# Script para poblar la base de datos con datos de ejemplo
# Útil para desarrollo y pruebas

echo "🎯 Poblando base de datos Schedium con datos de ejemplo..."

DB_CONTAINER="schedium-mysql"
DB_NAME="schedium"
DB_USER="root"
DB_PASSWORD="rootpassword"
SAMPLE_DATA_FILE="./scripts/database/sample-data.sql"

# Verificar que el contenedor esté activo
echo "📦 Verificando contenedor MySQL..."
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Error: El contenedor MySQL no está activo."
    echo "Ejecuta: docker-compose up -d mysql"
    exit 1
fi

# Verificar que el archivo de datos exista
if [ ! -f "$SAMPLE_DATA_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de datos de ejemplo: $SAMPLE_DATA_FILE"
    exit 1
fi

echo "✅ Contenedor MySQL activo"
echo "✅ Archivo de datos encontrado"
echo ""

# Mostrar estado actual
echo "📊 Estado actual de la base de datos:"
echo "   - Campus: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM campus;" "$DB_NAME" -sN 2>/dev/null)"
echo "   - Departamentos: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM department;" "$DB_NAME" -sN 2>/dev/null)"
echo "   - Programas: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM program;" "$DB_NAME" -sN 2>/dev/null)"
echo "   - Instructores: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM instructor;" "$DB_NAME" -sN 2>/dev/null)"
echo "   - Ambientes: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM classroom;" "$DB_NAME" -sN 2>/dev/null)"
echo "   - Fichas: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM student_group;" "$DB_NAME" -sN 2>/dev/null)"
echo ""

# Preguntar confirmación
read -p "¿Quieres continuar y poblar la base de datos con datos de ejemplo? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada por el usuario"
    exit 1
fi

echo "📥 Aplicando datos de ejemplo..."

# Ejecutar el script de datos de ejemplo
docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SAMPLE_DATA_FILE"

# Verificar si fue exitoso
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Datos de ejemplo aplicados exitosamente!"
    echo ""
    
    # Mostrar resumen final
    echo "📊 Resumen de datos insertados:"
    echo "   🏢 Campus: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM campus;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   🏫 Departamentos: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM department;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   📚 Programas: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM program;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   👨‍🏫 Instructores: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM instructor;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   🏛️ Ambientes: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM classroom;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   👥 Fichas: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM student_group;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   👤 Usuarios académicos: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM user WHERE role_id > 1;" "$DB_NAME" -sN 2>/dev/null)"
    echo "   ⚙️ Configuraciones: $(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM academic_schedule_config;" "$DB_NAME" -sN 2>/dev/null)"
    echo ""
    
    echo "🎉 Base de datos poblada y lista para desarrollo!"
    echo ""
    echo "📋 Datos de acceso para pruebas:"
    echo "   👤 Coordinador Sistemas: pedro.ramirez@schedium.edu.co"
    echo "   👤 Coordinador Admin: sandra.torres@schedium.edu.co"
    echo "   👤 Coordinador Salud: luis.vargas@schedium.edu.co"
    echo "   🔑 Contraseña para todos: password"
    echo ""
    echo "📊 Para verificar en DBeaver:"
    echo "   Host: localhost | Puerto: 3307 | DB: schedium"
    echo "   Usuario: schedule | Contraseña: HorariosSena1"
    
else
    echo ""
    echo "❌ Error al aplicar los datos de ejemplo"
    echo "Revisa los logs para más detalles"
    exit 1
fi