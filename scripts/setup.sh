#!/bin/bash

# ==============================================
# SCHEDIUM - INITIAL SETUP SCRIPT
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

echo -e "${BLUE}🚀 Schedium Initial Setup${NC}"
echo "=========================="

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker found${NC}"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose found${NC}"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to setup environment file
setup_env() {
    echo -e "\n${BLUE}⚙️  Setting up environment...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
        cp .env.example .env
        
        # Generate a random secret key
        SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || echo "please-change-this-secret-key-in-production")
        
        # Update secret key in .env file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/SECRET_KEY=super-secret-key-change-in-production-please/SECRET_KEY=$SECRET_KEY/" .env
        else
            # Linux
            sed -i "s/SECRET_KEY=super-secret-key-change-in-production-please/SECRET_KEY=$SECRET_KEY/" .env
        fi
        
        echo -e "${GREEN}✅ .env file created with random secret key${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    fi
}

# Function to create necessary directories
create_directories() {
    echo -e "\n${BLUE}📁 Creating necessary directories...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Create directories if they don't exist
    mkdir -p logs/nginx
    mkdir -p Schedium-BE/logs
    mkdir -p Schedium-BE/uploads
    mkdir -p nginx/ssl
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Function to setup nginx configuration
setup_nginx() {
    echo -e "\n${BLUE}🌐 Setting up Nginx configuration...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "nginx/nginx.conf" ]; then
        mkdir -p nginx
        cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
EOF
        echo -e "${GREEN}✅ Nginx configuration created${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx configuration already exists${NC}"
    fi
}

# Function to pull required images
pull_images() {
    echo -e "\n${BLUE}📦 Pulling required Docker images...${NC}"
    
    docker pull mysql:8.0
    docker pull redis:7-alpine
    docker pull nginx:alpine
    docker pull node:20-alpine
    docker pull python:3.11-slim
    
    echo -e "${GREEN}✅ Images pulled successfully${NC}"
}

# Function to test configuration
test_configuration() {
    echo -e "\n${BLUE}🧪 Testing Docker Compose configuration...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Validate docker-compose.yml
    if docker-compose config >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose configuration is valid${NC}"
    else
        echo -e "${RED}❌ Docker Compose configuration has errors${NC}"
        echo -e "${YELLOW}Running validation...${NC}"
        docker-compose config
        exit 1
    fi
}

# Function to show next steps
show_next_steps() {
    echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
    echo -e "\n${BLUE}📋 Next steps:${NC}"
    echo -e "1. Review and update ${YELLOW}.env${NC} file if needed"
    echo -e "2. Start the application:"
    echo -e "   ${YELLOW}./scripts/docker-start.sh${NC}"
    echo -e "\n${BLUE}🛠️  Development mode:${NC}"
    echo -e "   ${YELLOW}./scripts/docker-dev.sh start${NC}"
    echo -e "\n${BLUE}📚 Available scripts:${NC}"
    echo -e "   ${YELLOW}./scripts/docker-start.sh${NC} - Production mode"
    echo -e "   ${YELLOW}./scripts/docker-dev.sh${NC}   - Development mode"
    echo -e "\n${BLUE}🔗 Service URLs (after starting):${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:8001${NC}"
    echo -e "   API Docs: ${GREEN}http://localhost:8001/docs${NC}"
}

# Main execution
main() {
    check_prerequisites
    setup_env
    create_directories
    setup_nginx
    pull_images
    test_configuration
    show_next_steps
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "check")
        check_prerequisites
        test_configuration
        echo -e "${GREEN}✅ All checks passed${NC}"
        ;;
    "env")
        setup_env
        ;;
    "dirs")
        create_directories
        ;;
    "nginx")
        setup_nginx
        ;;
    "pull")
        pull_images
        ;;
    *)
        echo "Usage: $0 {setup|check|env|dirs|nginx|pull}"
        echo ""
        echo "Commands:"
        echo "  setup  - Complete initial setup (default)"
        echo "  check  - Check prerequisites and configuration"
        echo "  env    - Setup environment file only"
        echo "  dirs   - Create directories only"
        echo "  nginx  - Setup nginx configuration only"
        echo "  pull   - Pull Docker images only"
        exit 1
        ;;
esac