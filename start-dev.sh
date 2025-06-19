#!/bin/bash

# Schedium Development Server
# Ejecuta tanto el backend como el frontend en modo desarrollo

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
    echo -e "\n${YELLOW}🛑 Deteniendo servidores...${NC}"
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🚀 Iniciando Schedium en modo desarrollo${NC}"
echo -e "${BLUE}=====================================\n${NC}"

# Verificar si estamos en el directorio correcto
if [[ ! -d "Schedium-BE" ]] || [[ ! -d "Schedium-FE" ]]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde el directorio raíz de Schedium${NC}"
    echo -e "${RED}   Asegúrate de estar en el directorio que contiene Schedium-BE y Schedium-FE${NC}"
    exit 1
fi

# Función para verificar dependencias
check_dependencies() {
    echo -e "${BLUE}🔍 Verificando dependencias...${NC}"
    
    # Verificar Python para backend
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 no está instalado${NC}"
        exit 1
    fi
    
    # Verificar Node.js para frontend
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ Node.js/npm no está instalado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependencias verificadas${NC}\n"
}

# Función para iniciar backend
start_backend() {
    echo -e "${BLUE}🚀 Iniciando Backend en puerto 8000...${NC}"
    cd Schedium-BE
    
    # Verificar si existe virtual environment
    if [[ ! -d "venv" ]]; then
        echo -e "${YELLOW}📦 Creando virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activar virtual environment
    source venv/bin/activate
    
    # Instalar dependencias básicas
    pip install uvicorn fastapi 2>/dev/null || true
    
    # Iniciar servidor
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}   🌐 API disponible en: http://localhost:8000${NC}"
    echo -e "${GREEN}   📚 Documentación en: http://localhost:8000/docs${NC}\n"
}

# Función para iniciar frontend
start_frontend() {
    echo -e "${BLUE}🚀 Iniciando Frontend en puerto 3000...${NC}"
    cd Schedium-FE
    
    # Configurar variables de entorno para desarrollo
    export VITE_API_URL=http://localhost:8000
    export VITE_APP_ENV=development
    
    # Verificar que node_modules existe
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
        npm install
    fi
    
    # Iniciar servidor de desarrollo
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
    echo -e "${GREEN}   🌐 Aplicación disponible en: http://localhost:3000${NC}\n"
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado de los servidores:${NC}"
    echo -e "${GREEN}├── Backend (FastAPI):  http://localhost:8000${NC}"
    echo -e "${GREEN}├── API Docs:          http://localhost:8000/docs${NC}"
    echo -e "${GREEN}└── Frontend (React):  http://localhost:3000${NC}\n"
    
    echo -e "${YELLOW}💡 Comandos útiles:${NC}"
    echo -e "${YELLOW}   Ctrl+C                 - Detener ambos servidores${NC}"
    echo -e "${YELLOW}   http://localhost:8000/health - Verificar estado del backend${NC}"
    echo -e "${YELLOW}   http://localhost:8000/docs   - Documentación de la API${NC}\n"
}

# Función principal
main() {
    check_dependencies
    
    echo -e "${BLUE}🎬 Iniciando servidores...${NC}\n"
    
    start_backend
    sleep 3  # Esperar a que el backend se inicie
    
    start_frontend
    sleep 2  # Esperar a que el frontend se inicie
    
    show_status
    
    echo -e "${GREEN}🎉 ¡Schedium está ejecutándose!${NC}"
    echo -e "${YELLOW}⏳ Esperando conexiones... (Ctrl+C para detener)${NC}\n"
    
    # Esperar hasta que se presione Ctrl+C
    wait
}

# Ejecutar función principal
main