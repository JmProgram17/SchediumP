#!/bin/bash

# ==============================================
# SCHEDIUM - DOCKER DEVELOPMENT SCRIPT
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🛠️  Schedium Development Mode${NC}"

# Change to project directory
cd "$PROJECT_ROOT"

# Create development docker-compose override
create_dev_override() {
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  backend:
    volumes:
      # Mount source code for hot reload
      - ./Schedium-BE/app:/app/app
      - ./Schedium-BE/alembic:/app/alembic
      - ./Schedium-BE/scripts:/app/scripts
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
      - APP_ENV=development
    command: >
      sh -c "
        echo 'Starting in development mode...' &&
        python scripts/create_default_roles.py &&
        python scripts/create_admin_docker.py &&
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
      "
    
  frontend:
    build:
      context: ./Schedium-FE
      dockerfile: Dockerfile.dev
      args:
        - VITE_API_URL=http://localhost:8001
    volumes:
      # Mount source code for hot reload (if using Dockerfile.dev)
      - ./Schedium-FE/src:/app/src
      - ./Schedium-FE/public:/app/public
    environment:
      - VITE_API_URL=http://localhost:8001
      - VITE_APP_ENV=development
      - CHOKIDAR_USEPOLLING=true
EOF
}

# Create development frontend Dockerfile if it doesn't exist
create_dev_frontend_dockerfile() {
    if [ ! -f "$PROJECT_ROOT/Schedium-FE/Dockerfile.dev" ]; then
        cat > "$PROJECT_ROOT/Schedium-FE/Dockerfile.dev" << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
EOF
    fi
}

# Function to start development environment
start_dev() {
    echo -e "${BLUE}🔨 Setting up development environment...${NC}"
    
    # Create override file and dev dockerfile
    create_dev_override
    create_dev_frontend_dockerfile
    
    # Start with development override
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
    
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo -e "\n${BLUE}📋 Development URLs:${NC}"
    echo -e "Frontend (Hot Reload): ${GREEN}http://localhost:3000${NC}"
    echo -e "Backend (Hot Reload): ${GREEN}http://localhost:8001${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8001/docs${NC}"
}

# Function to show development logs
dev_logs() {
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
}

# Function to stop development environment
stop_dev() {
    echo -e "${YELLOW}🛑 Stopping development environment...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    echo -e "${GREEN}✅ Development environment stopped${NC}"
}

# Function to restart specific service
restart_service() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${RED}❌ Please specify a service to restart${NC}"
        echo -e "Available services: ${YELLOW}frontend, backend, mysql, redis${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 Restarting $service...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart "$service"
    echo -e "${GREEN}✅ $service restarted${NC}"
}

# Function to rebuild specific service
rebuild_service() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${RED}❌ Please specify a service to rebuild${NC}"
        echo -e "Available services: ${YELLOW}frontend, backend${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔨 Rebuilding $service...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d "$service"
    echo -e "${GREEN}✅ $service rebuilt${NC}"
}

# Function to enter container shell
shell() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${RED}❌ Please specify a service for shell access${NC}"
        echo -e "Available services: ${YELLOW}frontend, backend, mysql, redis${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🐚 Entering $service shell...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec "$service" sh
}

# Function to run database migrations
migrate() {
    echo -e "${BLUE}📊 Running database migrations...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python -m alembic upgrade head
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Function to create new migration
create_migration() {
    local message=$1
    if [ -z "$message" ]; then
        echo -e "${RED}❌ Please provide a migration message${NC}"
        echo -e "Usage: $0 create-migration \"your migration message\""
        exit 1
    fi
    
    echo -e "${BLUE}📊 Creating new migration: $message${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python -m alembic revision --autogenerate -m "$message"
    echo -e "${GREEN}✅ Migration created${NC}"
}

# Main execution
case "${1:-start}" in
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "logs")
        dev_logs
        ;;
    "restart")
        restart_service "$2"
        ;;
    "rebuild")
        rebuild_service "$2"
        ;;
    "shell")
        shell "$2"
        ;;
    "migrate")
        migrate
        ;;
    "create-migration")
        create_migration "$2"
        ;;
    "status")
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
        ;;
    *)
        echo -e "${BLUE}Schedium Development Commands:${NC}"
        echo "  start                    - Start development environment"
        echo "  stop                     - Stop development environment"
        echo "  logs                     - View logs"
        echo "  restart <service>        - Restart specific service"
        echo "  rebuild <service>        - Rebuild specific service"
        echo "  shell <service>          - Enter service shell"
        echo "  migrate                  - Run database migrations"
        echo "  create-migration <msg>   - Create new migration"
        echo "  status                   - Show container status"
        echo ""
        echo -e "${YELLOW}Services: frontend, backend, mysql, redis${NC}"
        exit 1
        ;;
esac