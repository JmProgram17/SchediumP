"""
Academic domain repositories.
Handles database operations for academic entities.
"""

from typing import List, Optional
import re

from sqlalchemy import and_, or_, String
from sqlalchemy.orm import Session, joinedload

from app.core.pagination import Page, PaginationParams, paginate
from app.models.academic import Chain, Level, Nomenclature, Program, StudentGroup
from app.models.hr import Department
from app.repositories.base import BaseRepository
from app.schemas.academic import (
    ChainCreate,
    ChainUpdate,
    LevelCreate,
    LevelUpdate,
    NomenclatureCreate,
    NomenclatureUpdate,
    ProgramCreate,
    ProgramUpdate,
    StudentGroupCreate,
    StudentGroupUpdate,
)


class LevelRepository(BaseRepository[Level, LevelCreate, LevelUpdate]):
    """Repository for academic levels."""

    def __init__(self, db: Session):
        super().__init__(Level, db)

    def get_by_study_type(self, study_type: str) -> Optional[Level]:
        """Get level by study type."""
        return self.db.query(Level).filter(Level.study_type == study_type).first()

    def get_programs_count(self, level_id: int) -> int:
        """Get count of programs for this level."""
        from app.models.academic import Program

        return self.db.query(Program).filter(Program.level_id == level_id).count()


class ChainRepository(BaseRepository[Chain, ChainCreate, ChainUpdate]):
    """Repository for program chains."""

    def __init__(self, db: Session):
        super().__init__(Chain, db)

    def get_by_name(self, name: str) -> Optional[Chain]:
        """Get chain by name."""
        return self.db.query(Chain).filter(Chain.name == name).first()

    def get_programs_count(self, chain_id: int) -> int:
        """Get count of programs in this chain."""
        from app.models.academic import Program

        return self.db.query(Program).filter(Program.chain_id == chain_id).count()


class NomenclatureRepository(
    BaseRepository[Nomenclature, NomenclatureCreate, NomenclatureUpdate]
):
    """Repository for nomenclatures."""

    def __init__(self, db: Session):
        super().__init__(Nomenclature, db)

    def get_by_code(self, code: str) -> Optional[Nomenclature]:
        """Get nomenclature by code."""
        return self.db.query(Nomenclature).filter(Nomenclature.code == code).first()

    def get_active(self) -> List[Nomenclature]:
        """Get all active nomenclatures."""
        return self.db.query(Nomenclature).filter(Nomenclature.active.is_(True)).all()

    def get_programs_count(self, nomenclature_id: int) -> int:
        """Get count of programs using this nomenclature."""
        from app.models.academic import Program

        return (
            self.db.query(Program)
            .filter(Program.nomenclature_id == nomenclature_id)
            .count()
        )


class ProgramRepository(BaseRepository[Program, ProgramCreate, ProgramUpdate]):
    """Repository for academic programs."""

    def __init__(self, db: Session):
        super().__init__(Program, db)

    def get_with_relations(self, program_id: int) -> Optional[Program]:
        """Get program with all relations loaded."""
        return (
            self.db.query(Program)
            .options(
                joinedload(Program.nomenclature),
                joinedload(Program.chain),
                joinedload(Program.department),
                joinedload(Program.level),
            )
            .filter(Program.program_id == program_id)
            .first()
        )

    def search_programs(
        self,
        params: PaginationParams,
        search: Optional[str] = None,
        department_id: Optional[int] = None,
        level_id: Optional[int] = None,
        chain_id: Optional[int] = None,
    ) -> Page[Program]:
        """Search programs with filters."""
        query = self.db.query(Program).options(
            joinedload(Program.nomenclature),
            joinedload(Program.chain),
            joinedload(Program.department),
            joinedload(Program.level),
        )

        # Apply filters
        if search:
            query = query.filter(
                or_(
                    Program.name.ilike(f"%{search}%"),
                    Nomenclature.code.ilike(f"%{search}%"),
                )
            ).join(Nomenclature, isouter=True)

        if department_id:
            query = query.filter(Program.department_id == department_id)

        if level_id:
            query = query.filter(Program.level_id == level_id)

        if chain_id:
            query = query.filter(Program.chain_id == chain_id)

        return paginate(query, params)

    def get_student_groups_count(self, program_id: int) -> int:
        """Get count of student groups for this program."""
        return (
            self.db.query(StudentGroup)
            .filter(StudentGroup.program_id == program_id)
            .count()
        )

    def check_program_uniqueness(
        self, 
        name: str, 
        nomenclature_id: int, 
        level_id: int, 
        chain_id: int,
        exclude_program_id: Optional[int] = None
    ) -> Optional[Program]:
        """
        Check if a program with the same name, nomenclature, level, and chain already exists.
        
        Args:
            name: Program name
            nomenclature_id: Nomenclature ID
            level_id: Level ID  
            chain_id: Chain ID
            exclude_program_id: Program ID to exclude from check (for updates)
            
        Returns:
            Program if duplicate exists, None otherwise
        """
        print(f"DEBUG REPO: Searching for duplicate with: name='{name}', nomenclature_id={nomenclature_id}, level_id={level_id}, chain_id={chain_id}, exclude_id={exclude_program_id}")
        
        query = (
            self.db.query(Program)
            .filter(
                Program.name == name,
                Program.nomenclature_id == nomenclature_id,
                Program.level_id == level_id,
                Program.chain_id == chain_id
            )
        )
        
        if exclude_program_id:
            query = query.filter(Program.program_id != exclude_program_id)
        
        # Debug: show the SQL query
        print(f"DEBUG REPO: SQL Query: {query}")
        
        result = query.first()
        print(f"DEBUG REPO: Query result: {result}")
        
        return result


class StudentGroupRepository(
    BaseRepository[StudentGroup, StudentGroupCreate, StudentGroupUpdate]
):
    """Repository for student groups (fichas)."""

    def __init__(self, db: Session):
        super().__init__(StudentGroup, db)
    
    def _normalize_search_term(self, text: str) -> List[str]:
        """Generate normalized variations of search term for better matching."""
        if not text:
            return []
        
        variations = [text.strip()]
        
        # Remove extra spaces and normalize
        normalized = re.sub(r'\s+', ' ', text.strip())
        if normalized != text:
            variations.append(normalized)
        
        # Accent variations
        accent_map = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n',
            'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'N'
        }
        
        # Without accents
        no_accents = text
        for accented, plain in accent_map.items():
            no_accents = no_accents.replace(accented, plain)
        if no_accents != text:
            variations.append(no_accents)
        
        # Case variations
        variations.extend([
            text.upper(),
            text.lower(),
            text.capitalize(),
            text.title()
        ])
        
        # Remove duplicates while preserving order
        return list(dict.fromkeys(variations))

    def get_by_number(self, group_number: int) -> Optional[StudentGroup]:
        """Get group by number."""
        return (
            self.db.query(StudentGroup)
            .filter(StudentGroup.group_number == group_number)
            .first()
        )

    def get_with_relations(self, group_id: int) -> Optional[StudentGroup]:
        """Get group with all relations loaded."""
        from app.models.scheduling import Schedule
        
        # First get the group with program relations
        group = (
            self.db.query(StudentGroup)
            .options(joinedload(StudentGroup.program))
            .filter(StudentGroup.group_id == group_id)
            .first()
        )
        
        # Manually load the current schedule (always fresh from DB)
        if group and group.schedule_id:
            schedule = self.db.query(Schedule).filter(Schedule.schedule_id == group.schedule_id).first()
            if schedule:
                # Manually attach the schedule to avoid cache issues
                group.schedule = schedule
            
        return group

    def search_groups(
        self,
        params: PaginationParams,
        search: Optional[str] = None,
        program_id: Optional[int] = None,
        schedule_id: Optional[int] = None,
        active: Optional[bool] = None,
        start_date_from: Optional[str] = None,
        start_date_to: Optional[str] = None,
    ) -> Page[StudentGroup]:
        """Search student groups with comprehensive filters."""
        from app.models.scheduling import Schedule
        
        # Base query with eager loading (excluding schedule to handle manually)
        query = self.db.query(StudentGroup).options(
            joinedload(StudentGroup.program).joinedload(Program.nomenclature),
            joinedload(StudentGroup.program).joinedload(Program.level),
            joinedload(StudentGroup.program).joinedload(Program.chain),
        )

        # Apply search filter
        if search and search.strip():
            search_term = search.strip()
            print(f"🔍 [DEBUG] Searching for: '{search_term}'")
            
            # Check if it's a number search
            try:
                number_value = int(search_term)
                is_number = True
                print(f"🔍 [DEBUG] Number search detected for: {search_term}")
                query = query.filter(StudentGroup.group_number == number_value)
            except ValueError:
                is_number = False
                print(f"🔍 [DEBUG] Text search detected for: {search_term}")
                # Join tables for text search
                query = query.outerjoin(Program, StudentGroup.program_id == Program.program_id)
                query = query.outerjoin(Nomenclature, Program.nomenclature_id == Nomenclature.nomenclature_id)
                query = query.outerjoin(Level, Program.level_id == Level.level_id)
                
                # Create search conditions for text
                search_conditions = []
                search_variations = self._normalize_search_term(search_term)
                
                # Program name search (with all variations)
                for variation in search_variations:
                    search_conditions.append(Program.name.ilike(f"%{variation}%"))
                
                # Nomenclature code search (with all variations)
                for variation in search_variations:
                    search_conditions.append(Nomenclature.code.ilike(f"%{variation}%"))
                
                # Schedule name search (with all variations) - using relationship
                for variation in search_variations:
                    search_conditions.append(StudentGroup.schedule.has(Schedule.name.ilike(f"%{variation}%")))
                
                # Level type search (with all variations)
                for variation in search_variations:
                    search_conditions.append(Level.study_type.ilike(f"%{variation}%"))
                
                # Apply OR condition for all search terms
                print(f"🔍 [DEBUG] Text search conditions count: {len(search_conditions)}")
                if search_conditions:
                    query = query.filter(or_(*search_conditions))

        # Apply other filters
        if program_id:
            print(f"🔍 [DEBUG] Filtering by program_id: {program_id}")
            query = query.filter(StudentGroup.program_id == program_id)

        if schedule_id:
            print(f"🔍 [DEBUG] Filtering by schedule_id: {schedule_id}")
            query = query.filter(StudentGroup.schedule_id == schedule_id)

        if active is not None:
            print(f"🔍 [DEBUG] Filtering by active: {active}")
            query = query.filter(StudentGroup.active == active)

        if start_date_from:
            print(f"🔍 [DEBUG] Filtering by start_date_from: {start_date_from}")
            query = query.filter(StudentGroup.start_date >= start_date_from)

        if start_date_to:
            print(f"🔍 [DEBUG] Filtering by start_date_to: {start_date_to}")
            query = query.filter(StudentGroup.start_date <= start_date_to)

        # Log final query (first 500 chars to avoid too much output)
        query_str = str(query)
        print(f"🔍 [DEBUG] Final query: {query_str[:500]}...")
        
        result = paginate(query, params)
        print(f"🔍 [DEBUG] Query returned {len(result.items)} items out of {result.total} total")
        
        # Manually load schedules for all groups
        for item in result.items:
            if item.schedule_id and (not hasattr(item, 'schedule') or item.schedule is None):
                schedule = self.db.query(Schedule).filter(Schedule.schedule_id == item.schedule_id).first()
                item.schedule = schedule
                print(f"🔍 [DEBUG] Manually loaded schedule for group {item.group_number}: {schedule.name if schedule else 'None'}")
        
        return result

    def get_active_groups(self) -> List[StudentGroup]:
        """Get all active student groups."""
        return self.db.query(StudentGroup).filter(StudentGroup.active.is_(True)).all()

    def get_schedules_count(self, group_id: int) -> int:
        """Get count of class schedules for this group."""
        from app.models.scheduling import ClassSchedule

        return (
            self.db.query(ClassSchedule)
            .filter(ClassSchedule.group_id == group_id)
            .count()
        )

    def disable_group(self, group_id: int) -> StudentGroup:
        """Disable a student group (soft delete)."""
        group = self.get_or_404(group_id)
        group.active = False
        self.db.commit()
        self.db.refresh(group)
        return group
