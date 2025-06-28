"""
Servicio para manejar la estrategia híbrida de autenticación
"""

import secrets
import string
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.auth import User
from app.models.auth_token import AuthToken
from app.models.auth_audit import AuthMethodAudit
from app.core.security import get_password_hash
from app.services.email_service import EmailService
from app.config import settings


class AuthStrategyService:
    """
    Servicio que implementa la estrategia híbrida de autenticación:
    1. Magic Link (preferido)
    2. Contraseña temporal por email (fallback)
    3. Contraseña visible (emergencia)
    """
    
    def __init__(self, db: Session, email_service: EmailService = None):
        self.db = db
        self.email_service = email_service or EmailService()
        
        # Palabras para contraseñas memorables
        self.memorable_words = {
            'adjectives': ['Azul', 'Verde', 'Roja', 'Grande', 'Nueva', 'Alta', 'Bella', 'Dulce'],
            'nouns': ['Casa', 'Mesa', 'Libro', 'Flor', 'Luna', 'Sol', 'Mar', 'Rio'],
            'years': ['2024', '2025', '2026']
        }
    
    def generate_secure_password(
        self, 
        length: int = 16, 
        memorable: bool = False,
        include_symbols: bool = True,
        exclude_ambiguous: bool = True
    ) -> str:
        """
        Genera una contraseña segura
        """
        if memorable:
            return self._generate_memorable_password()
        
        chars = {
            'uppercase': string.ascii_uppercase,
            'lowercase': string.ascii_lowercase,
            'digits': string.digits,
            'symbols': '!@#$%^&*()_+-=[]{}|;:,.<>?'
        }
        
        # Excluir caracteres ambiguos
        if exclude_ambiguous:
            chars['uppercase'] = chars['uppercase'].replace('O', '').replace('I', '')
            chars['lowercase'] = chars['lowercase'].replace('o', '').replace('l', '')
            chars['digits'] = chars['digits'].replace('0', '').replace('1', '')
        
        # Construir conjunto de caracteres
        charset = chars['uppercase'] + chars['lowercase'] + chars['digits']
        if include_symbols:
            charset += chars['symbols']
        
        # Generar contraseña asegurando al menos un carácter de cada tipo
        password = []
        password.append(secrets.choice(chars['uppercase']))
        password.append(secrets.choice(chars['lowercase']))
        password.append(secrets.choice(chars['digits']))
        if include_symbols:
            password.append(secrets.choice(chars['symbols']))
        
        # Completar el resto
        for _ in range(length - len(password)):
            password.append(secrets.choice(charset))
        
        # Mezclar
        secrets.SystemRandom().shuffle(password)
        return ''.join(password)
    
    def _generate_memorable_password(self) -> str:
        """
        Genera contraseña memorable tipo "Casa-Azul-2024!"
        """
        adj = secrets.choice(self.memorable_words['adjectives'])
        noun = secrets.choice(self.memorable_words['nouns'])
        year = secrets.choice(self.memorable_words['years'])
        return f"{noun}-{adj}-{year}!"
    
    def check_available_methods(self) -> Dict[str, Any]:
        """
        Verifica qué métodos de autenticación están disponibles
        """
        email_available = self.email_service.is_available()
        
        return {
            'magic_link': {
                'available': email_available,
                'reason': None if email_available else 'Servicio de email no disponible'
            },
            'temp_email': {
                'available': email_available,
                'reason': None if email_available else 'Servicio de email no disponible'
            },
            'visible_password': {
                'available': True,
                'reason': 'Método de emergencia'
            },
            'recommended_method': 'magic_link' if email_available else 'visible_password'
        }
    
    def decide_auth_method(
        self,
        user_email: str,
        admin_preference: Optional[str] = None,
        is_urgent: bool = False,
        email_service_available: bool = None
    ) -> str:
        """
        Decide qué método de autenticación usar
        """
        if email_service_available is None:
            email_service_available = self.email_service.is_available()
        
        # Validar email del usuario
        user_has_valid_email = bool(user_email and '@' in user_email)
        
        # Si el admin especificó un método, intentar usarlo
        if admin_preference:
            if admin_preference == 'visible_password':
                return 'visible_password'
            
            if not email_service_available or not user_has_valid_email:
                return 'visible_password'
            
            return admin_preference
        
        # Decisión automática
        if not email_service_available or not user_has_valid_email:
            return 'visible_password'
        
        # Si es urgente, usar método más rápido
        if is_urgent:
            return 'temp_email'
        
        # Por defecto, usar el más seguro
        return 'magic_link'
    
    def create_user_with_strategy(
        self,
        user_data: Dict[str, Any],
        admin_user_id: int,
        preferred_method: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, Dict[str, Any]]:
        """
        Crea un usuario usando la estrategia híbrida
        """
        # Crear usuario sin contraseña
        user = User(
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            document_number=user_data['document_number'],
            role_id=user_data['role_id'],
            active=user_data.get('active', True),
            # Sin contraseña inicialmente
            hashed_password='',  # Se establecerá después
            must_change_password=True
        )
        
        self.db.add(user)
        self.db.flush()  # Para obtener el ID
        
        # Decidir método
        method = self.decide_auth_method(
            user_email=user_data['email'],
            admin_preference=preferred_method
        )
        
        # Aplicar método
        auth_result = None
        audit_data = {
            'target_user_id': user.user_id,
            'admin_user_id': admin_user_id,
            'auth_method': method,
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        try:
            if method == 'magic_link':
                auth_result = self._apply_magic_link_method(user, admin_user_id, ip_address, user_agent)
            elif method == 'temp_email':
                auth_result = self._apply_temp_email_method(user, admin_user_id)
            else:  # visible_password
                auth_result = self._apply_visible_password_method(user)
            
            # Auditar éxito
            audit = AuthMethodAudit.log_user_creation(
                success=True,
                visible_password_shown=(method == 'visible_password'),
                metadata=auth_result.get('metadata', {}),
                **audit_data
            )
            
        except Exception as e:
            # Auditar fallo
            audit = AuthMethodAudit.log_user_creation(
                success=False,
                error_message=str(e),
                **audit_data
            )
            self.db.add(audit)
            raise
        
        self.db.add(audit)
        self.db.commit()
        
        return user, auth_result
    
    def _apply_magic_link_method(
        self, 
        user: User, 
        admin_user_id: int,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """
        Aplica el método de Magic Link
        """
        # Crear token
        token_record, token_plain = AuthToken.create_magic_link_token(
            user_id=user.user_id,
            created_by=admin_user_id,
            hours_valid=48,
            is_first_login=True,
            created_ip=ip_address,
            created_user_agent=user_agent
        )
        
        self.db.add(token_record)
        self.db.flush()
        
        # Enviar email
        magic_link = f"{settings.FRONTEND_URL}/set-password?token={token_plain}&first=true"
        
        email_sent = self.email_service.send_magic_link_email(
            to_email=user.email,
            user_name=user.first_name,
            magic_link=magic_link,
            expires_hours=48
        )
        
        if not email_sent:
            raise Exception("No se pudo enviar el email con el magic link")
        
        return {
            'success': True,
            'method': 'magic_link',
            'message': 'Magic link enviado al email del usuario',
            'instructions': 'El usuario recibirá un enlace por email para crear su contraseña. El enlace expira en 48 horas.',
            'expires_at': token_record.expires_at.isoformat(),
            'metadata': {
                'token_id': token_record.token_id,
                'email_sent': True,
                'expires_hours': 48
            }
        }
    
    def _apply_temp_email_method(self, user: User, admin_user_id: int) -> Dict[str, Any]:
        """
        Aplica el método de contraseña temporal por email
        """
        temp_password = self.generate_secure_password(
            length=16,
            include_symbols=True,
            exclude_ambiguous=True
        )
        
        # Establecer contraseña temporal
        user.hashed_password = get_password_hash(temp_password)
        user.must_change_password = True
        user.password_expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Enviar email
        email_sent = self.email_service.send_temporary_password_email(
            to_email=user.email,
            user_name=user.first_name,
            temporary_password=temp_password,
            expires_days=7
        )
        
        if not email_sent:
            raise Exception("No se pudo enviar el email con la contraseña temporal")
        
        return {
            'success': True,
            'method': 'temp_email',
            'message': 'Contraseña temporal enviada por email',
            'instructions': 'El usuario recibirá su contraseña temporal por email. Debe cambiarla en su primer inicio de sesión.',
            'expires_at': user.password_expires_at.isoformat(),
            'metadata': {
                'email_sent': True,
                'password_length': 16,
                'expires_days': 7
            }
        }
    
    def _apply_visible_password_method(self, user: User) -> Dict[str, Any]:
        """
        Aplica el método de contraseña visible (emergencia)
        """
        temp_password = self.generate_secure_password(
            length=12,
            memorable=True
        )
        
        # Establecer contraseña temporal
        user.hashed_password = get_password_hash(temp_password)
        user.must_change_password = True
        user.password_expires_at = datetime.utcnow() + timedelta(hours=24)
        
        return {
            'success': True,
            'method': 'visible_password',
            'temporary_password': temp_password,
            'message': 'Contraseña temporal generada',
            'instructions': 'Comparta esta contraseña de forma segura con el usuario. Expira en 24 horas.',
            'warnings': [
                'El servicio de email no está disponible',
                'Esta contraseña es visible para el administrador',
                'El usuario DEBE cambiarla en su primer inicio de sesión',
                'No envíe esta contraseña por canales inseguros'
            ],
            'expires_at': user.password_expires_at.isoformat(),
            'metadata': {
                'password_length': 12,
                'memorable_format': True,
                'expires_hours': 24
            }
        }
    
    def verify_and_use_token(self, token_plain: str) -> Tuple[bool, Optional[User], Optional[str]]:
        """
        Verifica y usa un token (magic link)
        Returns: (valid, user, error_message)
        """
        token_hash = AuthToken.hash_token(token_plain)
        
        token_record = self.db.query(AuthToken).filter(
            AuthToken.token_hash == token_hash,
            AuthToken.token_type == 'magic_link'
        ).first()
        
        if not token_record:
            return False, None, "Token inválido"
        
        if not token_record.is_valid():
            return False, None, "Token expirado o ya usado"
        
        # Marcar como usado
        token_record.mark_as_used()
        
        # Obtener usuario
        user = self.db.query(User).filter(User.user_id == token_record.user_id).first()
        
        self.db.commit()
        
        return True, user, None
    
    def set_password_from_token(
        self, 
        token_plain: str, 
        new_password: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Establece contraseña usando un token válido
        Returns: (success, error_message)
        """
        valid, user, error = self.verify_and_use_token(token_plain)
        
        if not valid:
            return False, error
        
        # Establecer nueva contraseña
        user.hashed_password = get_password_hash(new_password)
        user.must_change_password = False
        user.password_expires_at = None
        user.last_password_change = datetime.utcnow()
        
        # Auditar cambio de contraseña
        audit_entries = self.db.query(AuthMethodAudit).filter(
            AuthMethodAudit.target_user_id == user.user_id,
            AuthMethodAudit.action == 'user_creation'
        ).all()
        
        for audit in audit_entries:
            audit.mark_password_changed()
        
        self.db.commit()
        
        return True, None