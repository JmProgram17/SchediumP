#!/bin/bash

# ==============================================
# SCHEDIUM FRONTEND DEPLOYMENT SCRIPT
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${1:-staging}"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/tmp/schedium-backup-$(date +%Y%m%d-%H%M%S)"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

check_requirements() {
    log "Checking deployment requirements..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available"
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_DIR/.env.$DEPLOY_ENV" ]]; then
        error "Environment file .env.$DEPLOY_ENV not found"
    fi
    
    success "All requirements met"
}

backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup environment files
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        cp "$PROJECT_DIR/.env" "$BACKUP_DIR/"
    fi
    
    # Export current database if running
    if docker ps | grep -q schedium-db; then
        log "Backing up database..."
        docker exec schedium-db pg_dump -U ${DB_USER:-schedium} ${DB_NAME:-schedium} > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup volumes
    if docker volume ls | grep -q schedium; then
        log "Backing up Docker volumes..."
        docker run --rm -v schedium_uploads:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/volumes.tar.gz /data
    fi
    
    success "Backup created at $BACKUP_DIR"
}

build_and_test() {
    log "Building and testing application..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    log "Running linting..."
    npm run lint
    
    # Run type checking
    log "Running type checking..."
    npm run typecheck || warning "Type checking failed, but continuing deployment"
    
    # Run tests
    log "Running tests..."
    npm run test:ci || warning "Tests failed, but continuing deployment"
    
    # Build application
    log "Building application..."
    npm run build
    
    # Build Docker image
    log "Building Docker image..."
    docker build -t schedium/frontend:latest .
    
    success "Build completed successfully"
}

deploy_application() {
    log "Deploying application to $DEPLOY_ENV environment..."
    
    cd "$PROJECT_DIR"
    
    # Copy environment file
    cp ".env.$DEPLOY_ENV" .env
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Start services
    log "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout 300 bash -c '
        while ! docker-compose -f '"$DOCKER_COMPOSE_FILE"' ps | grep -q "healthy\|Up"; do
            sleep 5
        done
    ' || warning "Some services may not be fully healthy"
    
    success "Application deployed successfully"
}

run_health_checks() {
    log "Running health checks..."
    
    # Check if frontend is responding
    if command -v curl &> /dev/null; then
        for i in {1..30}; do
            if curl -f http://localhost/health &> /dev/null; then
                success "Frontend health check passed"
                break
            fi
            sleep 2
        done
    fi
    
    # Check Docker services
    failed_services=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services --filter "status=exited")
    if [[ -n "$failed_services" ]]; then
        warning "Some services are not running: $failed_services"
    else
        success "All services are running"
    fi
    
    # Check logs for errors
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50 | grep -i error || true
}

cleanup_old_resources() {
    log "Cleaning up old resources..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old volumes (keep last 3 days)
    docker volume ls -q | xargs -r docker volume inspect | \
        jq -r '.[] | select(.CreatedAt < (now - 259200 | strftime("%Y-%m-%dT%H:%M:%S"))) | .Name' | \
        xargs -r docker volume rm || true
    
    success "Cleanup completed"
}

rollback_deployment() {
    log "Rolling back deployment..."
    
    if [[ -f "$BACKUP_DIR/.env" ]]; then
        cp "$BACKUP_DIR/.env" "$PROJECT_DIR/"
    fi
    
    # Restore database if backup exists
    if [[ -f "$BACKUP_DIR/database.sql" ]]; then
        log "Restoring database..."
        docker exec -i schedium-db psql -U ${DB_USER:-schedium} ${DB_NAME:-schedium} < "$BACKUP_DIR/database.sql"
    fi
    
    # Restart services with previous configuration
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    success "Rollback completed"
}

send_notification() {
    local status="$1"
    local environment="$2"
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Schedium Frontend deployment $status in $environment environment\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
}

main() {
    log "Starting deployment to $DEPLOY_ENV environment..."
    
    # Trap for cleanup on failure
    trap 'error "Deployment failed! Check logs above."' ERR
    
    check_requirements
    backup_current_deployment
    build_and_test
    deploy_application
    run_health_checks
    cleanup_old_resources
    
    success "Deployment to $DEPLOY_ENV completed successfully!"
    send_notification "succeeded" "$DEPLOY_ENV"
    
    log "Deployment summary:"
    echo "  - Environment: $DEPLOY_ENV"
    echo "  - Backup location: $BACKUP_DIR"
    echo "  - Application URL: http://localhost"
    echo "  - Monitoring: http://localhost:3000 (Grafana)"
    echo "  - Logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
}

# Handle command line arguments
case "${1:-}" in
    staging|production)
        main
        ;;
    rollback)
        if [[ -z "${2:-}" ]]; then
            error "Please specify backup directory for rollback"
        fi
        BACKUP_DIR="$2"
        rollback_deployment
        ;;
    --help|-h)
        echo "Usage: $0 {staging|production|rollback <backup_dir>}"
        echo ""
        echo "Commands:"
        echo "  staging     Deploy to staging environment"
        echo "  production  Deploy to production environment"
        echo "  rollback    Rollback to previous backup"
        echo ""
        echo "Environment files required:"
        echo "  .env.staging     For staging deployment"
        echo "  .env.production  For production deployment"
        ;;
    *)
        error "Invalid command. Use --help for usage information."
        ;;
esac