#!/bin/bash

# ==============================================
# SCHEDIUM - DOCKER STARTUP SCRIPT
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

echo -e "${BLUE}🚀 Starting Schedium Docker Stack...${NC}"

# Check if .env file exists, if not copy from example
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Copying from .env.example...${NC}"
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo -e "${GREEN}✅ .env file created. Please review and update the values if needed.${NC}"
fi

# Change to project directory
cd "$PROJECT_ROOT"

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to stop existing containers
stop_existing() {
    echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
    docker-compose down -v 2>/dev/null || true
}

# Function to build and start services
start_services() {
    echo -e "${BLUE}🔨 Building and starting services...${NC}"
    docker-compose up --build -d
}

# Function to wait for services to be healthy
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for MySQL
    echo -e "${YELLOW}📊 Waiting for MySQL...${NC}"
    until docker-compose exec mysql mysqladmin ping -h localhost --silent; do
        sleep 2
        echo -n "."
    done
    echo -e "${GREEN}✅ MySQL is ready${NC}"
    
    # Wait for Redis
    echo -e "${YELLOW}💾 Waiting for Redis...${NC}"
    until docker-compose exec redis redis-cli ping | grep -q PONG; do
        sleep 2
        echo -n "."
    done
    echo -e "${GREEN}✅ Redis is ready${NC}"
    
    # Wait for Backend
    echo -e "${YELLOW}🔧 Waiting for Backend API...${NC}"
    until curl -f http://localhost:8001/health >/dev/null 2>&1; do
        sleep 3
        echo -n "."
    done
    echo -e "${GREEN}✅ Backend API is ready${NC}"
    
    # Wait for Frontend
    echo -e "${YELLOW}🌐 Waiting for Frontend...${NC}"
    until curl -f http://localhost:3000 >/dev/null 2>&1; do
        sleep 2
        echo -n "."
    done
    echo -e "${GREEN}✅ Frontend is ready${NC}"
}

# Function to show status
show_status() {
    echo -e "\n${GREEN}🎉 Schedium is now running!${NC}"
    echo -e "\n${BLUE}📋 Service URLs:${NC}"
    echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "Backend API: ${GREEN}http://localhost:8001${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8001/docs${NC}"
    echo -e "MySQL: ${GREEN}localhost:3307${NC}"
    echo -e "Redis: ${GREEN}localhost:6380${NC}"
    
    echo -e "\n${BLUE}🔧 Useful commands:${NC}"
    echo -e "View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "Stop all: ${YELLOW}docker-compose down${NC}"
    echo -e "Restart: ${YELLOW}docker-compose restart${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Schedium Docker Startup${NC}"
    echo "=========================="
    
    check_docker
    stop_existing
    start_services
    wait_for_services
    show_status
    
    # Ask if user wants to see logs
    echo -e "\n${YELLOW}Would you like to view the logs? (y/n)${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose logs -f
    fi
}

# Handle script arguments
case "${1:-start}" in
    "start")
        main
        ;;
    "stop")
        echo -e "${YELLOW}🛑 Stopping Schedium...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Schedium stopped${NC}"
        ;;
    "restart")
        echo -e "${YELLOW}🔄 Restarting Schedium...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Schedium restarted${NC}"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status}"
        exit 1
        ;;
esac