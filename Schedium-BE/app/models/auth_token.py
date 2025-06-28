"""
Modelo para tokens de autenticación (Magic Links, Password Reset, etc.)
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime, timedelta
import secrets
import hashlib


class AuthToken(Base):
    """
    Tokens para diferentes flujos de autenticación:
    - Magic Links para establecer contraseña inicial
    - Reset password tokens
    - Email verification tokens
    """
    __tablename__ = "auth_tokens"

    token_id = Column(Integer, primary_key=True, index=True)
    
    # Token hasheado (nunca guardar token plano)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    
    # Tipo de token
    token_type = Column(String(50), nullable=False)  # 'magic_link', 'password_reset', 'email_verification'
    
    # Usuario asociado
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    user = relationship("User", back_populates="auth_tokens")
    
    # Metadatos del token
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    is_used = Column(Boolean, default=False, nullable=False)
    
    # Información adicional como JSON string
    metadata = Column(Text, nullable=True)  # JSON: {'is_first_login': True, 'created_by_admin': 123}
    
    # Auditoría
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    creator = relationship("User", foreign_keys=[created_by])
    
    # IP y User Agent de creación (seguridad)
    created_ip = Column(String(45), nullable=True)  # IPv6 ready
    created_user_agent = Column(Text, nullable=True)
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> tuple[str, str]:
        """
        Genera un token seguro y su hash
        Returns: (token_plain, token_hash)
        """
        token_plain = secrets.token_urlsafe(length)
        token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
        return token_plain, token_hash
    
    @staticmethod
    def hash_token(token_plain: str) -> str:
        """Hashea un token plano"""
        return hashlib.sha256(token_plain.encode()).hexdigest()
    
    def is_expired(self) -> bool:
        """Verifica si el token ha expirado"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Verifica si el token es válido (no usado y no expirado)"""
        return not self.is_used and not self.is_expired()
    
    def mark_as_used(self):
        """Marca el token como usado"""
        self.is_used = True
        self.used_at = datetime.utcnow()
    
    @classmethod
    def create_magic_link_token(
        cls, 
        user_id: int, 
        created_by: int,
        hours_valid: int = 48,
        is_first_login: bool = True,
        created_ip: str = None,
        created_user_agent: str = None
    ):
        """
        Crea un token de magic link para establecer contraseña
        """
        token_plain, token_hash = cls.generate_secure_token()
        
        expires_at = datetime.utcnow() + timedelta(hours=hours_valid)
        
        metadata = {
            'is_first_login': is_first_login,
            'created_by_admin': created_by,
            'hours_valid': hours_valid
        }
        
        return cls(
            token_hash=token_hash,
            token_type='magic_link',
            user_id=user_id,
            expires_at=expires_at,
            metadata=str(metadata),  # En producción usar json.dumps
            created_by=created_by,
            created_ip=created_ip,
            created_user_agent=created_user_agent
        ), token_plain
    
    @classmethod
    def create_password_reset_token(
        cls,
        user_id: int,
        hours_valid: int = 24,
        created_ip: str = None,
        created_user_agent: str = None
    ):
        """
        Crea un token para reset de contraseña
        """
        token_plain, token_hash = cls.generate_secure_token()
        
        expires_at = datetime.utcnow() + timedelta(hours=hours_valid)
        
        metadata = {
            'hours_valid': hours_valid,
            'self_requested': True
        }
        
        return cls(
            token_hash=token_hash,
            token_type='password_reset',
            user_id=user_id,
            expires_at=expires_at,
            metadata=str(metadata),
            created_ip=created_ip,
            created_user_agent=created_user_agent
        ), token_plain