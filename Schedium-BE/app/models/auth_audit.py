"""
Modelo para auditoría de métodos de autenticación
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime


class AuthMethodAudit(Base):
    """
    Auditoría de todos los métodos de autenticación utilizados
    para crear usuarios y gestionar contraseñas
    """
    __tablename__ = "auth_method_audit"

    audit_id = Column(Integer, primary_key=True, index=True)
    
    # Usuario objetivo (el usuario que se está creando/modificando)
    target_user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    target_user = relationship("User", foreign_keys=[target_user_id])
    
    # Usuario que ejecuta la acción (admin/coordinador)
    admin_user_id = Column(Integer, ForeignKey("user.user_id"), nullable=True)
    admin_user = relationship("User", foreign_keys=[admin_user_id])
    
    # Método utilizado
    auth_method = Column(String(50), nullable=False)  # 'magic_link', 'temp_email', 'visible_password'
    
    # Acción realizada
    action = Column(String(50), nullable=False)  # 'user_creation', 'password_reset', 'password_change'
    
    # Resultado
    success = Column(Boolean, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Razón por la que se usó este método
    reason = Column(String(255), nullable=True)  # 'email_service_down', 'user_preference', 'emergency'
    
    # Información adicional como JSON
    audit_metadata = Column(JSON, nullable=True)  # {'password_length': 16, 'email_sent': True, 'expires_at': '...'}
    
    # Banderas especiales
    visible_password_shown = Column(Boolean, default=False)  # Si se mostró contraseña al admin
    password_changed = Column(Boolean, default=False)  # Si el usuario ya cambió la contraseña
    password_change_timestamp = Column(DateTime, nullable=True)
    
    # Información de la sesión
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    session_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Índices para consultas eficientes
    __table_args__ = (
        {"extend_existing": True}
    )
    
    @classmethod
    def log_user_creation(
        cls,
        target_user_id: int,
        admin_user_id: int,
        auth_method: str,
        success: bool = True,
        reason: str = None,
        visible_password_shown: bool = False,
        audit_metadata: dict = None,
        ip_address: str = None,
        user_agent: str = None,
        session_id: str = None,
        error_message: str = None
    ):
        """
        Registra la creación de un usuario con método específico
        """
        return cls(
            target_user_id=target_user_id,
            admin_user_id=admin_user_id,
            auth_method=auth_method,
            action='user_creation',
            success=success,
            reason=reason,
            visible_password_shown=visible_password_shown,
            audit_metadata=audit_metadata,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            error_message=error_message
        )
    
    @classmethod
    def log_password_reset(
        cls,
        target_user_id: int,
        admin_user_id: int = None,
        auth_method: str = 'magic_link',
        success: bool = True,
        reason: str = None,
        audit_metadata: dict = None,
        ip_address: str = None,
        user_agent: str = None,
        error_message: str = None
    ):
        """
        Registra un reset de contraseña
        """
        return cls(
            target_user_id=target_user_id,
            admin_user_id=admin_user_id,
            auth_method=auth_method,
            action='password_reset',
            success=success,
            reason=reason,
            audit_metadata=audit_metadata,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message
        )
    
    def mark_password_changed(self):
        """
        Marca que el usuario cambió su contraseña
        """
        self.password_changed = True
        self.password_change_timestamp = datetime.utcnow()
    
    def get_time_to_password_change(self) -> int:
        """
        Obtiene el tiempo en horas que tardó el usuario en cambiar su contraseña
        """
        if not self.password_changed or not self.password_change_timestamp:
            return None
        
        delta = self.password_change_timestamp - self.created_at
        return int(delta.total_seconds() / 3600)  # Horas


class AuthMethodStats(Base):
    """
    Estadísticas agregadas de métodos de autenticación
    Tabla para consultas rápidas de métricas
    """
    __tablename__ = "auth_method_stats"

    stats_id = Column(Integer, primary_key=True, index=True)
    
    # Período de las estadísticas
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    period_type = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    
    # Método
    auth_method = Column(String(50), nullable=False)
    
    # Métricas
    total_attempts = Column(Integer, default=0)
    successful_attempts = Column(Integer, default=0)
    failed_attempts = Column(Integer, default=0)
    
    # Métricas específicas
    visible_passwords_shown = Column(Integer, default=0)
    passwords_changed_count = Column(Integer, default=0)
    avg_time_to_password_change = Column(Integer, nullable=True)  # En horas
    
    # Metadatos adicionales
    stats_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    @property
    def success_rate(self) -> float:
        """Calcula la tasa de éxito"""
        if self.total_attempts == 0:
            return 0.0
        return (self.successful_attempts / self.total_attempts) * 100
    
    @property
    def password_change_rate(self) -> float:
        """Calcula la tasa de cambio de contraseñas"""
        if self.successful_attempts == 0:
            return 0.0
        return (self.passwords_changed_count / self.successful_attempts) * 100