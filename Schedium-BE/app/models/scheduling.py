"""
Scheduling domain models.
Maps schedule, time blocks, days, quarters, and class schedules.
"""

from sqlalchemy import Column, Date, ForeignKey, Integer, String, Time, Boolean, Text, UniqueConstraint, event, CheckConstraint
from sqlalchemy.orm import relationship

from app.models import Base, TimeStampMixin


class Schedule(Base, TimeStampMixin):
    """Schedule (jornada) model."""

    __tablename__ = "schedule"
    __table_args__ = {
        "comment": "Daily schedules for classes (morning, afternoon, evening, etc.)"
    }
    __allow_unmapped__ = True

    schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Relationships
    student_groups = relationship("StudentGroup", back_populates="schedule")

    def __repr__(self) -> str:
        return f"<Schedule(id={self.schedule_id}, name={self.name})>"


class TimeBlock(Base, TimeStampMixin):
    """Time block model."""

    __tablename__ = "time_block"
    __allow_unmapped__ = True

    time_block_id = Column(Integer, primary_key=True, autoincrement=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer)  # Computed column in DB - read only
    name = Column(String(50), nullable=True)
    description = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    day_time_blocks = relationship("DayTimeBlock", back_populates="time_block")

    __table_args__ = (
        UniqueConstraint("start_time", "end_time", name="uq_time_block_times"),
        {"comment": "Time blocks for class scheduling"},
    )

    def __repr__(self) -> str:
        return (
            f"<TimeBlock(id={self.time_block_id}, {self.start_time}-{self.end_time})>"
        )


class Day(Base, TimeStampMixin):
    """Day of week model."""

    __tablename__ = "day"
    __table_args__ = {"comment": "Days of the week"}
    __allow_unmapped__ = True

    day_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(20), nullable=False, unique=True, index=True)
    short_name = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    day_time_blocks = relationship("DayTimeBlock", back_populates="day")

    def __repr__(self) -> str:
        return f"<Day(id={self.day_id}, name={self.name})>"


class DayTimeBlock(Base, TimeStampMixin):
    """Day-TimeBlock relationship model."""

    __tablename__ = "day_time_block"
    __allow_unmapped__ = True

    day_time_block_id = Column(Integer, primary_key=True, autoincrement=True)
    time_block_id = Column(
        Integer,
        ForeignKey("time_block.time_block_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_id = Column(
        Integer, ForeignKey("day.day_id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    time_block = relationship("TimeBlock", back_populates="day_time_blocks")
    day = relationship("Day", back_populates="day_time_blocks")
    class_schedules = relationship("ClassSchedule", back_populates="day_time_block")

    __table_args__ = (
        UniqueConstraint("day_id", "time_block_id", name="uq_day_time_block"),
        {"comment": "Association between days and time blocks for scheduling"},
    )

    def __repr__(self) -> str:
        return f"<DayTimeBlock(id={self.day_time_block_id}, day={self.day_id}, block={self.time_block_id})>"


class Quarter(Base, TimeStampMixin):
    """Academic quarter model."""

    __tablename__ = "quarter"
    __table_args__ = {'extend_existing': True}  # Allow column extension
    __allow_unmapped__ = True

    quarter_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    quarter_number = Column(Integer, nullable=True)  # 1-4
    academic_year = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)

    # Relationships
    class_schedules = relationship("ClassSchedule", back_populates="quarter")

    __table_args__ = (
        UniqueConstraint("start_date", "end_date", name="uq_quarter_dates"),
        {"comment": "Academic quarters for scheduling"},
    )

    def __repr__(self) -> str:
        return f"<Quarter(id={self.quarter_id}, name={self.name})>"


class ClassSchedule(Base, TimeStampMixin):
    """Class schedule (cronograma) model - Central entity."""

    __tablename__ = "class_schedule"
    __allow_unmapped__ = True

    class_schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    subject = Column(String(255), nullable=False)
    quarter_id = Column(
        Integer, ForeignKey("quarter.quarter_id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_time_block_id = Column(
        Integer,
        ForeignKey("day_time_block.day_time_block_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    group_id = Column(
        Integer,
        ForeignKey("student_group.group_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    instructor_id = Column(
        Integer,
        ForeignKey("instructor.instructor_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    classroom_id = Column(
        Integer,
        ForeignKey("classroom.classroom_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    # Relationships
    quarter = relationship("Quarter", back_populates="class_schedules")
    day_time_block = relationship("DayTimeBlock", back_populates="class_schedules")
    group = relationship("StudentGroup", back_populates="class_schedules")
    instructor = relationship("Instructor", back_populates="class_schedules")
    classroom = relationship("Classroom", back_populates="class_schedules")

    __table_args__ = (
        UniqueConstraint(
            "day_time_block_id",
            "instructor_id",
            "quarter_id",
            name="uq_schedule_conflict_instructor",
        ),
        UniqueConstraint(
            "day_time_block_id",
            "classroom_id",
            "quarter_id",
            name="uq_schedule_conflict_classroom",
        ),
        UniqueConstraint(
            "day_time_block_id",
            "group_id",
            "quarter_id",
            name="uq_schedule_conflict_group",
        ),
        {
            "comment": "Class schedules linking instructors, groups, classrooms, and time slots"
        },
    )

    def __repr__(self) -> str:
        return f"<ClassSchedule(id={self.class_schedule_id}, subject={self.subject})>"


class AcademicScheduleConfig(Base, TimeStampMixin):
    """Academic schedule configuration model for global scheduling parameters."""

    __tablename__ = "academic_schedule_config"
    __allow_unmapped__ = True

    id = Column(Integer, primary_key=True, autoincrement=True)
    day_start_time = Column(Time, nullable=False, default="06:00:00", comment="Daily academic schedule start time")
    day_end_time = Column(Time, nullable=False, default="22:00:00", comment="Daily academic schedule end time")
    min_class_duration_minutes = Column(Integer, nullable=False, default=60, comment="Minimum class duration in minutes")
    max_class_duration_minutes = Column(Integer, nullable=False, default=240, comment="Maximum class duration in minutes")
    is_active = Column(Boolean, default=True, nullable=False, comment="Whether this configuration is active")

    __table_args__ = (
        CheckConstraint('day_start_time < day_end_time', name='ck_valid_day_times'),
        CheckConstraint('min_class_duration_minutes > 0', name='ck_positive_min_duration'),
        CheckConstraint('max_class_duration_minutes >= min_class_duration_minutes', name='ck_valid_duration_range'),
        {"comment": "Global academic schedule configuration parameters"},
    )

    def __repr__(self) -> str:
        return f"<AcademicScheduleConfig(id={self.id}, start={self.day_start_time}, end={self.day_end_time})>"


# Event to exclude duration_minutes from INSERT/UPDATE statements
@event.listens_for(TimeBlock, 'before_insert')
@event.listens_for(TimeBlock, 'before_update')
def exclude_duration_minutes(mapper, connection, target):
    """Exclude duration_minutes from being inserted/updated as it's a generated column"""
    if hasattr(target, '__dict__') and 'duration_minutes' in target.__dict__:
        del target.__dict__['duration_minutes']
