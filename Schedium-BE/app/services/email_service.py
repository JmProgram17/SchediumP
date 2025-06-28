"""
Servicio de email para magic links y contraseñas temporales
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from jinja2 import Template

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Servicio para envío de emails relacionados con autenticación
    """
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_use_tls = settings.SMTP_USE_TLS
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
        self.email_enabled = settings.EMAIL_ENABLED
    
    def is_available(self) -> bool:
        """
        Verifica si el servicio de email está configurado y disponible
        """
        try:
            # Verificar si el email está habilitado globalmente
            if not self.email_enabled:
                logger.info("Email service disabled by EMAIL_ENABLED setting")
                return False
            
            # Verificar configuración básica
            if not all([self.smtp_server, self.smtp_username, self.smtp_password]):
                logger.warning("Email service not configured - missing SMTP settings")
                return False
            
            # En desarrollo, podemos hacer un health check básico
            # En producción, esto debería hacer una conexión real al SMTP
            logger.info("Email service is properly configured and enabled")
            return True
            
        except Exception as e:
            logger.error(f"Email service health check failed: {e}")
            return False
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str, 
        text_content: Optional[str] = None
    ) -> bool:
        """
        Envía un email HTML
        """
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Agregar contenido texto plano si se proporciona
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(text_part)
            
            # Agregar contenido HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Enviar email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.smtp_use_tls:
                    server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_magic_link_email(
        self, 
        to_email: str, 
        user_name: str, 
        magic_link: str,
        expires_hours: int = 48
    ) -> bool:
        """
        Envía email con magic link para establecer contraseña
        """
        subject = "Crea tu contraseña - Schedium"
        
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background-color: #f9fafb; }
                .button { 
                    display: inline-block; 
                    background-color: #3b82f6; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    margin: 20px 0;
                }
                .warning { 
                    background-color: #fef3c7; 
                    border: 1px solid #f59e0b; 
                    padding: 15px; 
                    border-radius: 6px; 
                    margin: 20px 0;
                }
                .footer { background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Schedium</h1>
                    <p>Sistema de Gestión Académica</p>
                </div>
                
                <div class="content">
                    <h2>¡Bienvenido/a, {{ user_name }}!</h2>
                    
                    <p>Tu cuenta ha sido creada exitosamente. Para completar tu registro, necesitas crear una contraseña segura.</p>
                    
                    <p style="text-align: center;">
                        <a href="{{ magic_link }}" class="button">
                            🔐 Crear mi Contraseña
                        </a>
                    </p>
                    
                    <div class="warning">
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Este enlace expira en {{ expires_hours }} horas</li>
                            <li>Solo funciona una vez</li>
                            <li>No compartas este enlace con nadie</li>
                        </ul>
                    </div>
                    
                    <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">
                        {{ magic_link }}
                    </p>
                    
                    <hr style="margin: 30px 0;">
                    
                    <h3>Consejos de Seguridad:</h3>
                    <ul>
                        <li>Usa una contraseña única que no uses en otros sitios</li>
                        <li>Incluye mayúsculas, minúsculas, números y símbolos</li>
                        <li>Mínimo 12 caracteres</li>
                        <li>Considera usar un gestor de contraseñas</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Este email fue enviado desde Schedium - Sistema de Gestión Académica</p>
                    <p>Si no solicitaste esta cuenta, puedes ignorar este email.</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        text_template = Template("""
        ¡Bienvenido/a, {{ user_name }}!
        
        Tu cuenta en Schedium ha sido creada exitosamente.
        
        Para crear tu contraseña, visita este enlace:
        {{ magic_link }}
        
        IMPORTANTE:
        - Este enlace expira en {{ expires_hours }} horas
        - Solo funciona una vez
        - No lo compartas con nadie
        
        Consejos de seguridad:
        - Usa una contraseña única
        - Mínimo 12 caracteres
        - Incluye mayúsculas, minúsculas, números y símbolos
        
        ---
        Schedium - Sistema de Gestión Académica
        """)
        
        html_content = html_template.render(
            user_name=user_name,
            magic_link=magic_link,
            expires_hours=expires_hours
        )
        
        text_content = text_template.render(
            user_name=user_name,
            magic_link=magic_link,
            expires_hours=expires_hours
        )
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_temporary_password_email(
        self, 
        to_email: str, 
        user_name: str, 
        temporary_password: str,
        expires_days: int = 7
    ) -> bool:
        """
        Envía email con contraseña temporal
        """
        subject = "Tu contraseña temporal - Schedium"
        
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background-color: #f9fafb; }
                .password-box { 
                    background-color: #1f2937; 
                    color: #f9fafb; 
                    padding: 20px; 
                    border-radius: 8px; 
                    font-family: 'Courier New', monospace; 
                    font-size: 18px; 
                    text-align: center; 
                    letter-spacing: 2px;
                    margin: 20px 0;
                }
                .warning { 
                    background-color: #fef2f2; 
                    border: 1px solid #f87171; 
                    padding: 15px; 
                    border-radius: 6px; 
                    margin: 20px 0;
                }
                .footer { background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Schedium</h1>
                    <p>Sistema de Gestión Académica</p>
                </div>
                
                <div class="content">
                    <h2>Hola, {{ user_name }}</h2>
                    
                    <p>Tu cuenta ha sido creada. Aquí están tus credenciales de acceso:</p>
                    
                    <p><strong>Usuario:</strong> {{ to_email }}</p>
                    <p><strong>Contraseña temporal:</strong></p>
                    
                    <div class="password-box">
                        {{ temporary_password }}
                    </div>
                    
                    <div class="warning">
                        <strong>🚨 MUY IMPORTANTE:</strong>
                        <ul>
                            <li>Esta contraseña expira en {{ expires_days }} días</li>
                            <li>DEBES cambiarla en tu primer inicio de sesión</li>
                            <li>No compartas esta contraseña con nadie</li>
                            <li>Guárdala en un lugar seguro hasta que puedas cambiarla</li>
                        </ul>
                    </div>
                    
                    <h3>¿Cómo iniciar sesión?</h3>
                    <ol>
                        <li>Ve a <a href="https://schedium.edu/login">schedium.edu/login</a></li>
                        <li>Ingresa tu email y la contraseña temporal</li>
                        <li>El sistema te pedirá crear una nueva contraseña</li>
                        <li>Crea una contraseña segura y única</li>
                    </ol>
                    
                    <h3>Consejos para tu nueva contraseña:</h3>
                    <ul>
                        <li>Mínimo 12 caracteres</li>
                        <li>Incluye mayúsculas, minúsculas, números y símbolos</li>
                        <li>Que sea única (no la uses en otros sitios)</li>
                        <li>Considera usar un gestor de contraseñas</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Este email fue enviado desde Schedium - Sistema de Gestión Académica</p>
                    <p>Si no solicitaste esta cuenta, contacta al administrador.</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        text_template = Template("""
        Hola, {{ user_name }}
        
        Tu cuenta en Schedium ha sido creada.
        
        Credenciales de acceso:
        Usuario: {{ to_email }}
        Contraseña temporal: {{ temporary_password }}
        
        MUY IMPORTANTE:
        - Esta contraseña expira en {{ expires_days }} días
        - DEBES cambiarla en tu primer inicio de sesión
        - No la compartas con nadie
        
        Para iniciar sesión:
        1. Ve a schedium.edu/login
        2. Usa tu email y contraseña temporal
        3. Crea una nueva contraseña segura
        
        ---
        Schedium - Sistema de Gestión Académica
        """)
        
        html_content = html_template.render(
            user_name=user_name,
            to_email=to_email,
            temporary_password=temporary_password,
            expires_days=expires_days
        )
        
        text_content = text_template.render(
            user_name=user_name,
            to_email=to_email,
            temporary_password=temporary_password,
            expires_days=expires_days
        )
        
        return self.send_email(to_email, subject, html_content, text_content)