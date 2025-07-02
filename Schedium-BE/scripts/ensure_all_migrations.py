#!/usr/bin/env python3
"""
Script to ensure all migrations are applied correctly.
Can be run manually or as part of the deployment process.
"""

import sys
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text

from app.config import settings
from app.database import engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_alembic_config():
    """Get Alembic configuration."""
    root_dir = Path(__file__).parent.parent
    alembic_ini = root_dir / "alembic.ini"
    
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(root_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    
    return config


def check_database_connection():
    """Verify database connection."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def get_migration_info():
    """Get detailed migration information."""
    config = get_alembic_config()
    script_dir = ScriptDirectory.from_config(config)
    
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        current_rev = context.get_current_revision()
    
    heads = script_dir.get_heads()
    all_revisions = list(script_dir.walk_revisions())
    
    return {
        "current": current_rev,
        "heads": heads,
        "total_migrations": len(all_revisions),
        "revisions": all_revisions
    }


def display_migration_status():
    """Display current migration status."""
    info = get_migration_info()
    
    print("\n" + "="*60)
    print("📊 MIGRATION STATUS REPORT")
    print("="*60)
    
    print(f"\n🎯 Current Revision: {info['current'] or 'None (fresh database)'}")
    print(f"🏁 Target Revision(s): {', '.join(info['heads'])}")
    print(f"📋 Total Migrations: {info['total_migrations']}")
    
    if info['current'] in info['heads']:
        print("\n✅ Database is up to date!")
    else:
        print("\n⚠️  Database needs migration!")
        
        # Find pending migrations
        pending = []
        found_current = info['current'] is None
        
        for rev in reversed(info['revisions']):
            if found_current:
                pending.append(rev)
            elif rev.revision == info['current']:
                found_current = True
        
        if pending:
            print(f"\n📝 Pending Migrations ({len(pending)}):")
            for rev in pending:
                print(f"   - {rev.revision[:8]}: {rev.doc}")


def verify_critical_tables():
    """Verify that critical tables have the correct structure."""
    checks = []
    
    with engine.connect() as conn:
        # Check classroom table (should NOT have classroom_type)
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'classroom' 
            AND column_name = 'classroom_type'
        """))
        has_classroom_type = result.fetchone() is not None
        checks.append({
            "name": "Classroom table - no classroom_type field",
            "passed": not has_classroom_type,
            "message": "FAILED - classroom_type still exists" if has_classroom_type else "PASSED"
        })
        
        # Check quarter table (should have additional fields)
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'quarter' 
            AND column_name IN ('quarter_number', 'academic_year', 'description', 'is_active')
        """))
        quarter_fields = [row[0] for row in result]
        has_all_quarter_fields = len(quarter_fields) == 4
        checks.append({
            "name": "Quarter table - has all additional fields",
            "passed": has_all_quarter_fields,
            "message": f"PASSED" if has_all_quarter_fields else f"FAILED - missing fields: {set(['quarter_number', 'academic_year', 'description', 'is_active']) - set(quarter_fields)}"
        })
        
        # Check for academic_schedule_config table
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'academic_schedule_config'
        """))
        has_schedule_config = result.fetchone() is not None
        checks.append({
            "name": "Academic schedule config table exists",
            "passed": has_schedule_config,
            "message": "PASSED" if has_schedule_config else "FAILED - table doesn't exist"
        })
    
    print("\n" + "="*60)
    print("🔍 CRITICAL TABLE VERIFICATION")
    print("="*60)
    
    all_passed = True
    for check in checks:
        status = "✅" if check["passed"] else "❌"
        print(f"\n{status} {check['name']}")
        print(f"   {check['message']}")
        if not check["passed"]:
            all_passed = False
    
    return all_passed


def run_migrations(fake_if_needed=False):
    """Run all pending migrations."""
    print("\n" + "="*60)
    print("🚀 RUNNING MIGRATIONS")
    print("="*60)
    
    try:
        config = get_alembic_config()
        command.upgrade(config, "head")
        print("\n✅ All migrations completed successfully!")
        return True
    except Exception as e:
        logger.error(f"\n❌ Migration failed: {e}")
        
        if fake_if_needed:
            print("\n🔧 Attempting to mark migrations as applied (fake)...")
            try:
                # This would require manual intervention
                print("⚠️  Manual intervention required:")
                print("   Run: alembic stamp head")
                print("   This will mark all migrations as applied without running them")
            except Exception as fe:
                logger.error(f"Failed to fake migrations: {fe}")
        
        return False


def main():
    """Main execution function."""
    print("\n🎯 Schedium Database Migration Manager")
    print("=====================================")
    
    # Check database connection
    if not check_database_connection():
        print("\n❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Display current status
    display_migration_status()
    
    # Verify critical tables
    tables_ok = verify_critical_tables()
    
    # Check if migrations are needed
    info = get_migration_info()
    if info['current'] not in info['heads']:
        print("\n" + "="*60)
        print("⚡ APPLYING PENDING MIGRATIONS")
        print("="*60)
        
        if run_migrations():
            # Re-verify after migration
            print("\n🔍 Post-migration verification...")
            display_migration_status()
            verify_critical_tables()
        else:
            print("\n❌ Migration failed!")
            print("\n💡 Troubleshooting tips:")
            print("   1. Check database connection and permissions")
            print("   2. Review migration files for errors")
            print("   3. Check if tables were manually modified")
            print("   4. Consider running: alembic downgrade -1 && alembic upgrade head")
            sys.exit(1)
    
    print("\n✅ All checks completed!")
    
    if not tables_ok:
        print("\n⚠️  Warning: Some table structures don't match expected schema")
        print("   The application may not function correctly")


if __name__ == "__main__":
    main()