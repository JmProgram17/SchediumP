"""
Dashboard Service - Servicio para métricas y datos del dashboard
"""

from datetime import datetime, time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from app.repositories.infrastructure import ClassroomRepository
from app.repositories.scheduling import ClassScheduleRepository
from app.repositories.hr import InstructorRepository
from app.repositories.academic import StudentGroupRepository
from app.models.scheduling import ClassSchedule, DayTimeBlock, Day, TimeBlock
from app.models.infrastructure import Classroom
from app.models.hr import Instructor
from app.models.academic import StudentGroup


class DashboardService:
    """Servicio para obtener métricas y datos del dashboard"""
    
    def __init__(self, db: Session):
        self.db = db
        self.classroom_repo = ClassroomRepository(db)
        self.schedule_repo = ClassScheduleRepository(db)
        self.instructor_repo = InstructorRepository(db)
        self.group_repo = StudentGroupRepository(db)

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """
        Obtiene todas las métricas principales del dashboard
        """
        return {
            "ocupacion_general": self.get_ocupacion_general(),
            "ambientes_activos": self.get_ambientes_activos(),
            "instructores_en_clase": self.get_instructores_en_clase(),
            "alertas_pendientes": self.get_alertas_pendientes()
        }

    def get_ocupacion_general(self) -> Dict[str, Any]:
        """
        Calcula la ocupación general de ambientes
        """
        try:
            # Obtener total de aulas
            total_aulas = self.db.query(func.count(Classroom.classroom_id)).scalar() or 0
            
            if total_aulas == 0:
                return {
                    "porcentaje": 0,
                    "aulas_ocupadas": 0,
                    "aulas_totales": 0,
                    "tendencia": "neutral"
                }

            # Obtener aulas ocupadas actualmente (usando día y hora actual)
            current_time = datetime.now().time()
            current_day = datetime.now().strftime('%A').upper()
            
            # Los días se almacenan en inglés en la base de datos
            day_mapping = {
                'MONDAY': 'Monday',
                'TUESDAY': 'Tuesday', 
                'WEDNESDAY': 'Wednesday',
                'THURSDAY': 'Thursday',
                'FRIDAY': 'Friday',
                'SATURDAY': 'Saturday',
                'SUNDAY': 'Sunday'
            }
            
            db_day = day_mapping.get(current_day, 'Monday')
            
            # Contar aulas con clases activas en este momento
            aulas_ocupadas = self.db.query(func.count(func.distinct(ClassSchedule.classroom_id)))\
                .join(Classroom, ClassSchedule.classroom_id == Classroom.classroom_id)\
                .join(DayTimeBlock, ClassSchedule.day_time_block_id == DayTimeBlock.day_time_block_id)\
                .join(Day, DayTimeBlock.day_id == Day.day_id)\
                .join(TimeBlock, DayTimeBlock.time_block_id == TimeBlock.time_block_id)\
                .filter(
                    and_(
                        Day.name == db_day,
                        TimeBlock.start_time <= current_time,
                        TimeBlock.end_time > current_time
                    )
                ).scalar() or 0

            porcentaje = round((aulas_ocupadas / total_aulas) * 100, 1)

            return {
                "porcentaje": porcentaje,
                "aulas_ocupadas": aulas_ocupadas,
                "aulas_totales": total_aulas,
                "tendencia": "positive" if porcentaje >= 70 else "neutral"
            }

        except Exception as e:
            print(f"Error calculando ocupación general: {e}")
            return {
                "porcentaje": 0,
                "aulas_ocupadas": 0,
                "aulas_totales": 0,
                "tendencia": "neutral"
            }

    def get_ambientes_activos(self) -> Dict[str, Any]:
        """
        Obtiene el número de ambientes activos
        """
        try:
            # Total de ambientes registrados
            total_ambientes = self.db.query(func.count(Classroom.classroom_id)).scalar() or 0

            # Ambientes con al menos una clase programada (en cualquier horario)
            ambientes_con_clases = self.db.query(func.count(func.distinct(ClassSchedule.classroom_id)))\
                .join(Classroom, ClassSchedule.classroom_id == Classroom.classroom_id).scalar() or 0

            porcentaje_uso = round((ambientes_con_clases / total_ambientes) * 100, 1) if total_ambientes > 0 else 0

            return {
                "total": ambientes_con_clases,
                "total_disponibles": total_ambientes,
                "porcentaje_uso": porcentaje_uso,
                "tendencia": "positive" if porcentaje_uso >= 80 else "neutral"
            }

        except Exception as e:
            print(f"Error calculando ambientes activos: {e}")
            return {
                "total": 0,
                "total_disponibles": 0,
                "porcentaje_uso": 0,
                "tendencia": "neutral"
            }

    def get_instructores_en_clase(self) -> Dict[str, Any]:
        """
        Obtiene el número de instructores actualmente en clase
        """
        try:
            # Total de instructores activos
            total_instructores = self.db.query(func.count(Instructor.instructor_id))\
                .filter(Instructor.active == True).scalar() or 0

            # Instructores actualmente en clase
            current_time = datetime.now().time()
            current_day = datetime.now().strftime('%A').upper()
            
            day_mapping = {
                'MONDAY': 'Monday',
                'TUESDAY': 'Tuesday', 
                'WEDNESDAY': 'Wednesday',
                'THURSDAY': 'Thursday',
                'FRIDAY': 'Friday',
                'SATURDAY': 'Saturday',
                'SUNDAY': 'Sunday'
            }
            
            db_day = day_mapping.get(current_day, 'Monday')
            
            instructores_en_clase = self.db.query(func.count(func.distinct(ClassSchedule.instructor_id)))\
                .join(Instructor, ClassSchedule.instructor_id == Instructor.instructor_id)\
                .join(DayTimeBlock, ClassSchedule.day_time_block_id == DayTimeBlock.day_time_block_id)\
                .join(Day, DayTimeBlock.day_id == Day.day_id)\
                .join(TimeBlock, DayTimeBlock.time_block_id == TimeBlock.time_block_id)\
                .filter(
                    and_(
                        Day.name == db_day,
                        TimeBlock.start_time <= current_time,
                        TimeBlock.end_time > current_time,
                        Instructor.active == True
                    )
                ).scalar() or 0

            porcentaje_activo = round((instructores_en_clase / total_instructores) * 100, 1) if total_instructores > 0 else 0

            return {
                "total": instructores_en_clase,
                "total_instructores": total_instructores,
                "porcentaje_activo": porcentaje_activo,
                "tendencia": "neutral"
            }

        except Exception as e:
            print(f"Error calculando instructores en clase: {e}")
            return {
                "total": 0,
                "total_instructores": 0,
                "porcentaje_activo": 0,
                "tendencia": "neutral"
            }

    def get_alertas_pendientes(self) -> Dict[str, Any]:
        """
        Calcula las alertas pendientes del sistema
        """
        try:
            alertas = {
                "fichas_sin_instructor": 0,
                "ambientes_sin_asignar": 0,
                "instructores_sobrecargados": 0,
                "conflictos_horarios": 0
            }

            # 1. Fichas/grupos sin instructor asignado
            fichas_sin_instructor = self.db.query(func.count(StudentGroup.group_id))\
                .outerjoin(ClassSchedule, StudentGroup.group_id == ClassSchedule.group_id)\
                .filter(
                    and_(
                        StudentGroup.active == True,
                        ClassSchedule.instructor_id.is_(None)
                    )
                ).scalar() or 0

            alertas["fichas_sin_instructor"] = fichas_sin_instructor

            # 2. Clases programadas sin ambiente asignado
            clases_sin_ambiente = self.db.query(func.count(ClassSchedule.schedule_id))\
                .filter(ClassSchedule.classroom_id.is_(None)).scalar() or 0

            alertas["ambientes_sin_asignar"] = clases_sin_ambiente

            # 3. Instructores sobrecargados (simplificado)
            # Para MVP, usamos una consulta simple - contar total de clases por instructor
            instructores_sobrecargados = 0  # TODO: Implementar con la estructura correcta DayTimeBlock
            alertas["instructores_sobrecargados"] = instructores_sobrecargados

            # 4. Conflictos de horarios (simplificado)
            # Para MVP, usamos una consulta simple
            conflictos = 0  # TODO: Implementar con la estructura correcta DayTimeBlock
            alertas["conflictos_horarios"] = conflictos

            total_alertas = sum(alertas.values())

            return {
                "total": total_alertas,
                "detalle": alertas,
                "tendencia": "negative" if total_alertas > 5 else "positive" if total_alertas == 0 else "neutral"
            }

        except Exception as e:
            print(f"Error calculando alertas pendientes: {e}")
            return {
                "total": 0,
                "detalle": {
                    "fichas_sin_instructor": 0,
                    "ambientes_sin_asignar": 0,
                    "instructores_sobrecargados": 0,
                    "conflictos_horarios": 0
                },
                "tendencia": "neutral"
            }

    def get_ocupacion_por_campus(self) -> List[Dict[str, Any]]:
        """
        Obtiene la ocupación agrupada por campus
        """
        try:
            # Para MVP, simplificamos la consulta de ocupación por campus
            # TODO: Implementar con la estructura correcta DayTimeBlock, Day, TimeBlock
            
            from app.models.infrastructure import Campus
            
            # Obtener lista básica de campus con total de aulas
            campus_list = self.db.query(Campus.name, func.count(Classroom.classroom_id))\
                .outerjoin(Classroom, Campus.campus_id == Classroom.campus_id)\
                .group_by(Campus.campus_id, Campus.name)\
                .all()

            ocupacion_campus = []
            for campus_name, total_aulas in campus_list:
                # Para MVP, usamos valores simulados para ocupación
                # En producción esto se calcularía con la estructura DayTimeBlock
                ocupadas = min(total_aulas, max(0, int(total_aulas * 0.6)))  # 60% ocupación simulada
                porcentaje = round((ocupadas / total_aulas) * 100, 1) if total_aulas > 0 else 0
                
                ocupacion_campus.append({
                    "campus": campus_name,
                    "total_aulas": total_aulas or 0,
                    "aulas_ocupadas": ocupadas,
                    "porcentaje_ocupacion": porcentaje
                })

            return ocupacion_campus

        except Exception as e:
            print(f"Error calculando ocupación por campus: {e}")
            return []

    def get_dias_disponibles(self) -> List[Dict[str, Any]]:
        """
        Obtiene los días de la semana configurados en el sistema
        """
        try:
            from app.models.scheduling import Day
            
            dias = self.db.query(Day.day_id, Day.name)\
                .order_by(Day.day_id)\
                .all()
            
            return [
                {
                    "day_id": dia.day_id,
                    "name": dia.name,
                    "short_name": self._get_short_day_name(dia.name)
                }
                for dia in dias
            ]
            
        except Exception as e:
            print(f"Error obteniendo días disponibles: {e}")
            return []
    
    def get_bloques_tiempo(self) -> List[Dict[str, Any]]:
        """
        Obtiene los bloques de tiempo configurados en el sistema
        """
        try:
            from app.models.scheduling import TimeBlock
            
            bloques = self.db.query(TimeBlock.time_block_id, TimeBlock.start_time, TimeBlock.end_time)\
                .order_by(TimeBlock.start_time)\
                .all()
            
            return [
                {
                    "time_block_id": bloque.time_block_id,
                    "start_time": str(bloque.start_time),
                    "end_time": str(bloque.end_time),
                    "display_name": f"{bloque.start_time.strftime('%H:%M')}"
                }
                for bloque in bloques
            ]
            
        except Exception as e:
            print(f"Error obteniendo bloques de tiempo: {e}")
            return []

    def get_mapa_calor_ocupacion(self) -> Dict[str, Any]:
        """
        Obtiene los datos del mapa de calor de ocupación semanal
        """
        try:
            from app.models.scheduling import Day, TimeBlock, DayTimeBlock
            
            # Obtener días y bloques de tiempo
            dias = self.get_dias_disponibles()
            bloques = self.get_bloques_tiempo()
            
            # Crear matriz de ocupación
            ocupacion_data = []
            
            for dia in dias:
                dia_ocupacion = []
                for bloque in bloques:
                    # Contar clases programadas para este día y bloque específico
                    ocupadas = self.db.query(func.count(ClassSchedule.class_schedule_id))\
                        .join(DayTimeBlock, ClassSchedule.day_time_block_id == DayTimeBlock.day_time_block_id)\
                        .join(Day, DayTimeBlock.day_id == Day.day_id)\
                        .join(TimeBlock, DayTimeBlock.time_block_id == TimeBlock.time_block_id)\
                        .filter(
                            Day.day_id == dia["day_id"],
                            TimeBlock.time_block_id == bloque["time_block_id"]
                        ).scalar() or 0
                    
                    # Contar total de aulas disponibles
                    total_aulas = self.db.query(func.count(Classroom.classroom_id)).scalar() or 1
                    
                    # Calcular porcentaje de ocupación (0-100)
                    porcentaje = min(100, round((ocupadas / total_aulas) * 100))
                    
                    dia_ocupacion.append({
                        "day_id": dia["day_id"],
                        "time_block_id": bloque["time_block_id"],
                        "ocupacion": porcentaje,
                        "clases_programadas": ocupadas,
                        "total_aulas": total_aulas
                    })
                
                ocupacion_data.append(dia_ocupacion)
            
            return {
                "dias": dias,
                "bloques_tiempo": bloques,
                "ocupacion_matriz": ocupacion_data
            }
            
        except Exception as e:
            print(f"Error calculando mapa de calor: {e}")
            return {
                "dias": [],
                "bloques_tiempo": [],
                "ocupacion_matriz": []
            }

    def _get_short_day_name(self, day_name: str) -> str:
        """
        Convierte nombres de días en inglés a abreviaciones en español
        """
        mapping = {
            'Monday': 'Lun',
            'Tuesday': 'Mar',
            'Wednesday': 'Mié',
            'Thursday': 'Jue',
            'Friday': 'Vie',
            'Saturday': 'Sáb',
            'Sunday': 'Dom'
        }
        return mapping.get(day_name, day_name[:3])
    
    def get_proxima_hora(self) -> Dict[str, Any]:
        """
        Obtiene información sobre lo que sucederá en la próxima hora
        """
        try:
            from datetime import timedelta
            current_time = datetime.now().time()
            current_day = datetime.now().strftime('%A')
            
            # Calcular el rango de la próxima hora
            next_hour = (datetime.now() + timedelta(hours=1)).time()
            
            # Obtener el bloque de tiempo actual y siguiente
            current_block = self.db.query(TimeBlock)\
                .filter(
                    TimeBlock.start_time <= current_time,
                    TimeBlock.end_time > current_time
                ).first()
            
            next_block = self.db.query(TimeBlock)\
                .filter(
                    TimeBlock.start_time <= next_hour,
                    TimeBlock.end_time > next_hour
                ).first()
            
            # Obtener día actual
            day = self.db.query(Day).filter(Day.name == current_day).first()
            
            if not day:
                # Si no hay día configurado, retornar valores vacíos
                return {
                    "clases_inician": 0,
                    "clases_terminan": 0,
                    "aulas_se_liberan": 0,
                    "proxima_hora": next_hour.strftime('%H:%M')
                }
            
            # Contar clases que inician en la próxima hora
            clases_inician = 0
            if next_block and current_block and next_block.time_block_id != current_block.time_block_id:
                # Buscar clases que empiezan en el próximo bloque
                clases_inician = self.db.query(func.count(ClassSchedule.class_schedule_id))\
                    .join(DayTimeBlock, ClassSchedule.day_time_block_id == DayTimeBlock.day_time_block_id)\
                    .filter(
                        DayTimeBlock.day_id == day.day_id,
                        DayTimeBlock.time_block_id == next_block.time_block_id
                    ).scalar() or 0
            
            # Contar clases que terminan en la próxima hora
            clases_terminan = 0
            if current_block:
                # Buscar clases actuales que no continúan en el próximo bloque
                clases_actuales = self.db.query(ClassSchedule.classroom_id)\
                    .join(DayTimeBlock, ClassSchedule.day_time_block_id == DayTimeBlock.day_time_block_id)\
                    .filter(
                        DayTimeBlock.day_id == day.day_id,
                        DayTimeBlock.time_block_id == current_block.time_block_id
                    ).all()
                
                if next_block and clases_actuales:
                    # Ver cuáles no continúan
                    aulas_actuales = [c.classroom_id for c in clases_actuales]
                    
                    aulas_continuan = self.db.query(ClassSchedule.classroom_id)\
                        .join(DayTimeBlock, ClassSchedule.day_time_block_id == DayTimeBlock.day_time_block_id)\
                        .filter(
                            DayTimeBlock.day_id == day.day_id,
                            DayTimeBlock.time_block_id == next_block.time_block_id,
                            ClassSchedule.classroom_id.in_(aulas_actuales)
                        ).all()
                    
                    aulas_que_continuan = [c.classroom_id for c in aulas_continuan]
                    clases_terminan = len([a for a in aulas_actuales if a not in aulas_que_continuan])
            
            # Calcular aulas que se liberan
            aulas_se_liberan = clases_terminan  # Cada clase que termina libera un aula
            
            return {
                "clases_inician": clases_inician,
                "clases_terminan": clases_terminan,
                "aulas_se_liberan": aulas_se_liberan,
                "proxima_hora": next_hour.strftime('%H:%M')
            }
            
        except Exception as e:
            print(f"Error calculando próxima hora: {e}")
            return {
                "clases_inician": 0,
                "clases_terminan": 0,
                "aulas_se_liberan": 0,
                "proxima_hora": "--:--"
            }
    
    def get_distribucion_programas(self, tipo: str = 'cadena') -> Dict[str, Any]:
        """
        Obtiene la distribución de programas agrupados por cadena o nivel
        
        Args:
            tipo: 'cadena' o 'nivel' para agrupar por cadena de formación o nivel de formación
        """
        try:
            from app.models.academic import Program, StudentGroup
            
            if tipo == 'cadena':
                # Agrupar por cadena de formación usando Chain
                from app.models.academic import Chain
                
                distribucion = self.db.query(
                    Chain.name,
                    func.count(func.distinct(StudentGroup.group_id)).label('total')
                )\
                .join(Program, Chain.chain_id == Program.chain_id)\
                .join(StudentGroup, Program.program_id == StudentGroup.program_id)\
                .filter(StudentGroup.active == True)\
                .group_by(Chain.name)\
                .all()
                
                # Calcular total para porcentajes
                total_grupos = sum(item.total for item in distribucion)
                
                # Formatear resultado
                data = []
                for item in distribucion:
                    if item.name and item.total > 0:
                        porcentaje = round((item.total / total_grupos) * 100, 1) if total_grupos > 0 else 0
                        data.append({
                            "name": item.name,
                            "value": porcentaje,
                            "count": item.total
                        })
                
                # Ordenar por porcentaje descendente
                data.sort(key=lambda x: x['value'], reverse=True)
                
                # Limitar a top 6 y agrupar el resto en "Otros"
                if len(data) > 6:
                    otros_value = sum(item['value'] for item in data[6:])
                    otros_count = sum(item['count'] for item in data[6:])
                    data = data[:6]
                    if otros_value > 0:
                        data.append({
                            "name": "Otros",
                            "value": round(otros_value, 1),
                            "count": otros_count
                        })
                
            else:  # tipo == 'nivel'
                # Agrupar por nivel de formación usando Level
                from app.models.academic import Level
                
                distribucion = self.db.query(
                    Level.study_type,
                    func.count(func.distinct(StudentGroup.group_id)).label('total')
                )\
                .join(Program, Level.level_id == Program.level_id)\
                .join(StudentGroup, Program.program_id == StudentGroup.program_id)\
                .filter(StudentGroup.active == True)\
                .group_by(Level.study_type)\
                .all()
                
                # Calcular total para porcentajes
                total_grupos = sum(item.total for item in distribucion)
                
                # Formatear resultado
                data = []
                for item in distribucion:
                    if item.study_type and item.total > 0:
                        porcentaje = round((item.total / total_grupos) * 100, 1) if total_grupos > 0 else 0
                        data.append({
                            "name": item.study_type,
                            "value": porcentaje,
                            "count": item.total
                        })
                
                # Ordenar por porcentaje descendente
                data.sort(key=lambda x: x['value'], reverse=True)
            
            return {
                "tipo": tipo,
                "distribucion": data,
                "total_grupos": total_grupos,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error calculando distribución de programas: {e}")
            return {
                "tipo": tipo,
                "distribucion": [],
                "total_grupos": 0,
                "timestamp": datetime.now().isoformat()
            }