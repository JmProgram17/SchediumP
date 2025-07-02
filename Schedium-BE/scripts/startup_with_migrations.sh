#!/bin/bash

# Enhanced startup script that ensures all migrations are applied
# This script handles both Docker and local environments

set -e  # Exit on error

echo "🚀 Starting Schedium Backend with Automatic Migrations"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if we're in a Docker container
is_docker() {
    if [ -f /.dockerenv ]; then
        return 0
    else
        return 1
    fi
}

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    
    if is_docker; then
        # In Docker, use environment variables
        DB_HOST="${DB_HOST:-mysql}"
        DB_PORT="${DB_PORT:-3306}"
    else
        # Local environment
        DB_HOST="${DB_HOST:-localhost}"
        DB_PORT="${DB_PORT:-3306}"
    fi
    
    # Wait for database connection
    for i in {1..30}; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo -e "${GREEN}✅ Database is ready!${NC}"
            return 0
        fi
        echo "Waiting for database... ($i/30)"
        sleep 2
    done
    
    echo -e "${RED}❌ Database connection timeout${NC}"
    return 1
}

# Function to run migrations
run_migrations() {
    echo ""
    echo "🔄 Running database migrations..."
    echo "--------------------------------"
    
    # Check current migration status
    echo "📊 Current migration status:"
    alembic current || true
    
    echo ""
    echo "📋 Migration history:"
    alembic history --verbose | head -10 || true
    
    echo ""
    echo "⚡ Applying all pending migrations..."
    
    # Run migrations
    if alembic upgrade head; then
        echo -e "${GREEN}✅ All migrations applied successfully!${NC}"
        
        # Verify final state
        echo ""
        echo "📊 Final migration status:"
        alembic current
        
        return 0
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        echo "Attempting to diagnose the issue..."
        
        # Show detailed error information
        alembic check || true
        
        return 1
    fi
}

# Function to verify critical tables
verify_tables() {
    echo ""
    echo "🔍 Verifying critical table structures..."
    echo "----------------------------------------"
    
    # This will be handled by the Python migration module
    python -c "
from app.core.migrations import verify_migrations
import sys
sys.exit(0 if verify_migrations() else 1)
" || {
        echo -e "${YELLOW}⚠️ Table verification failed, but continuing...${NC}"
    }
}

# Main execution
main() {
    # Wait for database
    if ! wait_for_db; then
        echo -e "${RED}Cannot start without database connection${NC}"
        exit 1
    fi
    
    # Run migrations
    if ! run_migrations; then
        echo -e "${YELLOW}⚠️ Some migrations may have failed${NC}"
        echo "The application will attempt to run migrations during startup"
    fi
    
    # Verify tables
    verify_tables
    
    echo ""
    echo "🎯 Starting application server..."
    echo "================================="
    
    # Start the application
    if is_docker; then
        # In Docker, use uvicorn directly
        exec uvicorn app.main:app \
            --host 0.0.0.0 \
            --port ${PORT:-8000} \
            --reload
    else
        # Local development
        exec python -m uvicorn app.main:app \
            --host 0.0.0.0 \
            --port ${PORT:-8000} \
            --reload
    fi
}

# Run main function
main "$@"