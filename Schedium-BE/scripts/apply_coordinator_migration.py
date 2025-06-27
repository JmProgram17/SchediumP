#!/usr/bin/env python3
"""
Script para aplicar la migración de coordinador a departamentos.
Ejecuta la migración 04-add-coordinator-to-department.sql
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path para importar módulos de la app
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import SessionLocal, engine
from app.core.logging import get_logger
logger = get_logger(__name__)


def apply_migration():
    """Aplicar la migración de coordinador a departamentos."""
    
    # Leer el archivo de migración
    migration_file = Path(__file__).parent / "database" / "04-add-coordinator-to-department.sql"
    
    if not migration_file.exists():
        logger.error(f"Archivo de migración no encontrado: {migration_file}")
        return False
    
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Dividir en statements individuales (por comentarios y comandos SQL)
        statements = []
        current_statement = ""
        
        for line in migration_sql.split('\n'):
            line = line.strip()
            
            # Ignorar comentarios y líneas vacías
            if not line or line.startswith('--'):
                continue
            
            current_statement += line + " "
            
            # Si la línea termina con ';', es el final de un statement
            if line.endswith(';'):
                statements.append(current_statement.strip())
                current_statement = ""
        
        # Ejecutar cada statement
        db = SessionLocal()
        try:
            logger.info("🚀 Iniciando migración de coordinador a departamentos...")
            
            for i, statement in enumerate(statements, 1):
                if statement:
                    logger.info(f"📝 Ejecutando statement {i}/{len(statements)}")
                    logger.debug(f"SQL: {statement}")
                    
                    db.execute(text(statement))
                    db.commit()
                    
                    logger.info(f"✅ Statement {i} ejecutado exitosamente")
            
            logger.info("🎉 Migración completada exitosamente!")
            
            # Verificar el resultado
            result = db.execute(text("""
                SELECT 
                    d.department_id,
                    d.name AS department_name,
                    d.coordinator_id,
                    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS coordinator_name,
                    r.name AS coordinator_role
                FROM department d
                LEFT JOIN user u ON d.coordinator_id = u.user_id
                LEFT JOIN role r ON u.role_id = r.role_id
                ORDER BY d.department_id;
            """))
            
            logger.info("📊 Estado actual de departamentos:")
            for row in result:
                coord_info = f"{row.coordinator_name} ({row.coordinator_role})" if row.coordinator_id else "Sin coordinador"
                logger.info(f"  - {row.department_name}: {coord_info}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error ejecutando migración: {e}")
            db.rollback()
            return False
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Error leyendo archivo de migración: {e}")
        return False


def check_migration_needed():
    """Verificar si la migración ya fue aplicada."""
    db = SessionLocal()
    try:
        # Intentar consultar la columna coordinator_id
        result = db.execute(text("SHOW COLUMNS FROM department LIKE 'coordinator_id'"))
        exists = result.fetchone() is not None
        
        if exists:
            logger.info("ℹ️  La migración ya fue aplicada (columna coordinator_id existe)")
            return False
        else:
            logger.info("⚠️  La migración es necesaria (columna coordinator_id no existe)")
            return True
            
    except Exception as e:
        logger.error(f"❌ Error verificando estado de migración: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("🔍 Verificando estado de la migración de coordinador...")
    
    if check_migration_needed():
        logger.info("🚀 Aplicando migración...")
        success = apply_migration()
        
        if success:
            logger.info("✅ Migración aplicada exitosamente!")
            sys.exit(0)
        else:
            logger.error("❌ Error aplicando migración!")
            sys.exit(1)
    else:
        logger.info("ℹ️  No es necesario aplicar la migración.")
        sys.exit(0)