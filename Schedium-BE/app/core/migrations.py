"""
Automatic database migrations module.
Ensures all migrations are applied when the application starts.
"""

import logging
import subprocess
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine

from app.config import settings

logger = logging.getLogger(__name__)


def get_alembic_config() -> Config:
    """Get Alembic configuration."""
    root_dir = Path(__file__).parent.parent.parent
    alembic_ini = root_dir / "alembic.ini"
    
    if not alembic_ini.exists():
        raise FileNotFoundError(f"Alembic configuration not found at {alembic_ini}")
    
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(root_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    
    return config


def get_current_revision():
    """Get current database revision."""
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        return context.get_current_revision()


def get_pending_migrations():
    """Get list of pending migrations."""
    config = get_alembic_config()
    script = ScriptDirectory.from_config(config)
    
    current_rev = get_current_revision()
    heads = script.get_heads()
    
    if not current_rev:
        logger.info("No migrations have been applied yet")
        return True
    
    if current_rev in heads:
        logger.info("Database is up to date")
        return False
    
    logger.info(f"Current revision: {current_rev}")
    logger.info(f"Target revision(s): {heads}")
    return True


def run_migrations():
    """Run all pending migrations automatically."""
    try:
        if not get_pending_migrations():
            logger.info("All migrations are already applied")
            return True
        
        logger.info("Running pending migrations...")
        
        # Get Alembic configuration
        config = get_alembic_config()
        
        # Run upgrade to head
        command.upgrade(config, "head")
        
        logger.info("All migrations applied successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to run migrations: {str(e)}")
        logger.error("Attempting to run migrations using subprocess...")
        
        try:
            # Fallback to subprocess method
            result = subprocess.run(
                [sys.executable, "-m", "alembic", "upgrade", "head"],
                cwd=Path(__file__).parent.parent.parent,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info("Migrations applied successfully via subprocess")
                logger.info(result.stdout)
                return True
            else:
                logger.error(f"Migration subprocess failed: {result.stderr}")
                return False
                
        except Exception as sub_e:
            logger.error(f"Subprocess migration also failed: {str(sub_e)}")
            return False


def verify_migrations():
    """Verify that all migrations have been applied correctly."""
    try:
        config = get_alembic_config()
        
        # Check current status
        logger.info("Verifying migration status...")
        
        # Get current revision
        current = get_current_revision()
        
        # Get all revisions
        script = ScriptDirectory.from_config(config)
        heads = script.get_heads()
        
        if current in heads:
            logger.info(f"✅ All migrations applied. Current revision: {current}")
            return True
        else:
            logger.warning(f"⚠️ Database not up to date. Current: {current}, Expected: {heads}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to verify migrations: {str(e)}")
        return False


def init_migrations():
    """Initialize and run migrations on application startup."""
    logger.info("=== Initializing Database Migrations ===")
    
    try:
        # Check if database is accessible
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Database connection successful")
        
        # Run migrations
        if run_migrations():
            # Verify migrations
            if verify_migrations():
                logger.info("=== Migrations completed successfully ===")
                return True
            else:
                logger.warning("=== Migrations may not be complete ===")
                return False
        else:
            logger.error("=== Failed to run migrations ===")
            return False
            
    except Exception as e:
        logger.error(f"=== Migration initialization failed: {str(e)} ===")
        return False