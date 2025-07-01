"""
Dashboard API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.dependencies import get_db
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("/metrics", response_model=Dict[str, Any])
async def get_dashboard_metrics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene todas las métricas principales del dashboard
    
    Returns:
        - ocupacion_general: Porcentaje de ocupación actual
        - ambientes_activos: Número de ambientes en uso
        - instructores_en_clase: Instructores actualmente dando clase
        - alertas_pendientes: Alertas que requieren atención
    """
    try:
        dashboard_service = DashboardService(db)
        metrics = dashboard_service.get_dashboard_metrics()
        
        return {
            "success": True,
            "data": metrics
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo métricas del dashboard: {str(e)}"
        )


@router.get("/ocupacion-general", response_model=Dict[str, Any])
async def get_ocupacion_general(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene la métrica de ocupación general de ambientes
    """
    try:
        dashboard_service = DashboardService(db)
        ocupacion = dashboard_service.get_ocupacion_general()
        
        return {
            "success": True,
            "data": ocupacion
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo ocupación general: {str(e)}"
        )


@router.get("/ambientes-activos", response_model=Dict[str, Any])
async def get_ambientes_activos(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene la métrica de ambientes activos
    """
    try:
        dashboard_service = DashboardService(db)
        ambientes = dashboard_service.get_ambientes_activos()
        
        return {
            "success": True,
            "data": ambientes
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo ambientes activos: {str(e)}"
        )


@router.get("/instructores-activos", response_model=Dict[str, Any])
async def get_instructores_activos(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene la métrica de instructores actualmente en clase
    """
    try:
        dashboard_service = DashboardService(db)
        instructores = dashboard_service.get_instructores_en_clase()
        
        return {
            "success": True,
            "data": instructores
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo instructores activos: {str(e)}"
        )


@router.get("/alertas", response_model=Dict[str, Any])
async def get_alertas_pendientes(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene las alertas pendientes del sistema
    """
    try:
        dashboard_service = DashboardService(db)
        alertas = dashboard_service.get_alertas_pendientes()
        
        return {
            "success": True,
            "data": alertas
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo alertas pendientes: {str(e)}"
        )


@router.get("/ocupacion-campus", response_model=Dict[str, Any])
async def get_ocupacion_por_campus(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene la ocupación agrupada por campus para el heatmap
    """
    try:
        dashboard_service = DashboardService(db)
        ocupacion = dashboard_service.get_ocupacion_por_campus()
        
        return {
            "success": True,
            "data": ocupacion
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo ocupación por campus: {str(e)}"
        )


@router.get("/mapa-calor", response_model=Dict[str, Any])
async def get_mapa_calor_ocupacion(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene los datos del mapa de calor de ocupación semanal
    Incluye días, bloques de tiempo y matriz de ocupación
    """
    try:
        dashboard_service = DashboardService(db)
        mapa_calor_data = dashboard_service.get_mapa_calor_ocupacion()
        
        return {
            "success": True,
            "data": mapa_calor_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo mapa de calor: {str(e)}"
        )


@router.get("/dias", response_model=Dict[str, Any])
async def get_dias_disponibles(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene los días de la semana configurados en el sistema
    """
    try:
        dashboard_service = DashboardService(db)
        dias_data = dashboard_service.get_dias_disponibles()
        
        return {
            "success": True,
            "data": dias_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo días: {str(e)}"
        )


@router.get("/bloques-tiempo", response_model=Dict[str, Any])
async def get_bloques_tiempo(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene los bloques de tiempo configurados en el sistema
    """
    try:
        dashboard_service = DashboardService(db)
        bloques_data = dashboard_service.get_bloques_tiempo()
        
        return {
            "success": True,
            "data": bloques_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo bloques de tiempo: {str(e)}"
        )


@router.get("/proxima-hora", response_model=Dict[str, Any])
async def get_proxima_hora(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene información sobre lo que sucederá en la próxima hora
    
    Returns:
        - clases_inician: Número de clases que comenzarán
        - clases_terminan: Número de clases que finalizarán
        - aulas_se_liberan: Número de aulas que quedarán disponibles
        - proxima_hora: Hora a la que se refiere la información (HH:MM)
    """
    try:
        dashboard_service = DashboardService(db)
        proxima_hora_data = dashboard_service.get_proxima_hora()
        
        return {
            "success": True,
            "data": proxima_hora_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo datos de próxima hora: {str(e)}"
        )


@router.get("/distribucion-programas", response_model=Dict[str, Any])
async def get_distribucion_programas(
    tipo: str = "cadena",
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtiene la distribución de programas para el gráfico donut
    
    Args:
        tipo: 'cadena' para agrupar por cadena de formación, 'nivel' para agrupar por nivel
        
    Returns:
        - tipo: El tipo de agrupación utilizado
        - distribucion: Lista de items con name, value (porcentaje) y count
        - total_grupos: Total de grupos considerados
        - timestamp: Fecha y hora de la consulta
    """
    try:
        # Validar tipo
        if tipo not in ["cadena", "nivel"]:
            raise HTTPException(
                status_code=400,
                detail="El tipo debe ser 'cadena' o 'nivel'"
            )
            
        dashboard_service = DashboardService(db)
        distribucion_data = dashboard_service.get_distribucion_programas(tipo)
        
        return {
            "success": True,
            "data": distribucion_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo distribución de programas: {str(e)}"
        )