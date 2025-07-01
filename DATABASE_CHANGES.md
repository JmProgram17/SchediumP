# Database Schema Changes - Infrastructure Module

## Overview
This document describes the database schema changes made to the Infrastructure module on 2025-06-29, specifically removing the `capacity` field from classrooms and adding a `name` field to campuses.

## Changes Made

### 1. Campus Table - Added `name` field
**Table:** `campus`
**Change:** Added `name VARCHAR(100) NOT NULL` field

#### Migration Details
- **Migration File:** `20250629_1430-add_name_to_campus_remove_capacity_from_classroom.py`
- **Operation:** `ALTER TABLE campus ADD COLUMN name VARCHAR(100) NOT NULL`
- **Default Value:** For existing records, set `name = CONCAT('Campus ', campus_id)`

#### Files Modified
- **Backend Models:** `app/models/infrastructure.py` - Added `name` column to Campus model
- **Backend Schemas:** `app/schemas/infrastructure.py` - Added `name` field to all Campus schemas
- **Database Schema:** `scripts/database/01-database-schema.sql` - Updated Campus table definition
- **Frontend Types:** Already had `name` field in Campus interface

### 2. Classroom Table - Removed `capacity` field
**Table:** `classroom`
**Change:** Removed `capacity INT NOT NULL` field

#### Migration Details
- **Migration File:** `20250629_1430-add_name_to_campus_remove_capacity_from_classroom.py`
- **Operation:** `ALTER TABLE classroom DROP COLUMN capacity`

#### Files Modified
- **Backend Models:** `app/models/infrastructure.py` - Removed `capacity` column from Classroom model
- **Backend Schemas:** `app/schemas/infrastructure.py` - Removed `capacity` field from all Classroom schemas
- **Backend Services:** 
  - `app/services/infrastructure.py` - Removed capacity filtering and validation
  - `app/services/scheduling.py` - Removed classroom capacity validation
- **Backend Repositories:** `app/repositories/infrastructure.py` - Removed capacity filtering queries
- **Backend API Endpoints:** `app/api/v1/endpoints/infrastructure.py` - Removed capacity query parameters
- **Database Schema:** `scripts/database/01-database-schema.sql` - Updated Classroom table definition
- **Frontend Components:**
  - `src/features/environment/types/index.ts` - Removed `capacity` from Environment interface
  - `src/features/environment/components/EnvironmentList.tsx` - Removed capacity column
  - `src/features/environment/components/EnvironmentModal.tsx` - Removed capacity form field
  - `src/features/environment/hooks/index.ts` - Updated field references
  - `src/features/environment/services/index.ts` - Updated field mappings
  - `src/tests/utils/testUtils.tsx` - Removed capacity from mock data

## Impact Analysis

### 1. Campus Name Addition
**Positive Impacts:**
- Campuses now have human-readable names for better identification
- Improved user experience in dropdowns and listings
- Better data organization and searchability
- Resolves backend service references that were already expecting a `name` field

**Breaking Changes:**
- Any existing API consumers expecting Campus without `name` field will need updates
- Database must be migrated to add the required field

### 2. Classroom Capacity Removal
**Positive Impacts:**
- Simplified classroom management (capacity tracking removed from system requirements)
- Reduced validation complexity in scheduling
- Cleaner data model without capacity-based filtering
- Removed unused capacity-based business logic

**Breaking Changes:**
- Any existing API consumers using capacity filtering will need updates
- Frontend components no longer display or manage capacity
- Scheduling validation no longer considers classroom capacity limits
- Existing capacity data will be permanently lost after migration

## Migration Instructions

### 1. Run Database Migration
```bash
# Apply the migration
cd /path/to/Schedium-BE
alembic upgrade head
```

### 2. Update API Consumers
- Remove any `capacity`, `min_capacity`, `max_capacity` parameters from classroom API calls
- Update Campus creation/update calls to include required `name` field
- Update any client-side logic that relied on capacity-based filtering

### 3. Data Migration Considerations
- Existing campus records will get auto-generated names like "Campus 1", "Campus 2", etc.
- Consider updating these auto-generated names to meaningful values after migration
- Classroom capacity data will be permanently lost - export if needed for historical records

## Rollback Instructions

If rollback is needed, use the migration downgrade:
```bash
cd /path/to/Schedium-BE
alembic downgrade -1
```

**Warning:** Rolling back will:
- Remove the `name` field from all campus records (data will be lost)
- Re-add the `capacity` field to classroom table with default value of 30

## Testing Checklist

### Backend Tests
- [ ] Campus CRUD operations with `name` field
- [ ] Classroom CRUD operations without `capacity` field
- [ ] API endpoints return correct schema
- [ ] Migration runs successfully on clean database
- [ ] Migration rollback works correctly

### Frontend Tests
- [ ] Campus forms require name field
- [ ] Environment forms no longer show capacity
- [ ] Campus dropdowns show name instead of address
- [ ] Environment listings work without capacity column
- [ ] All modals open and save correctly

## Related Files

### Migration Files
- `/alembic/versions/20250629_1430-add_name_to_campus_remove_capacity_from_classroom.py`

### Backend Files Modified
- `app/models/infrastructure.py`
- `app/schemas/infrastructure.py`
- `app/services/infrastructure.py`
- `app/services/scheduling.py`
- `app/repositories/infrastructure.py`
- `app/api/v1/endpoints/infrastructure.py`
- `scripts/database/01-database-schema.sql`

### Frontend Files Modified
- `src/features/environment/types/index.ts`
- `src/features/environment/components/EnvironmentList.tsx`
- `src/features/environment/components/EnvironmentModal.tsx`
- `src/features/environment/hooks/index.ts`
- `src/features/environment/services/index.ts`
- `src/tests/utils/testUtils.tsx`

## Notes
- The campus `name` field was already expected by some backend service logic, so this change aligns the database with existing code expectations
- Classroom capacity removal simplifies the system by removing capacity-based constraints from scheduling logic
- All changes maintain backward compatibility for non-capacity-related operations
- Frontend changes ensure no broken functionality after capacity field removal