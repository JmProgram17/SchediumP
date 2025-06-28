#!/usr/bin/env python3
"""
Test script para verificar la configuración de email
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.services.email_service import EmailService

def test_email_configuration():
    """Prueba la configuración de email"""
    
    print("🧪 Probando configuración de email...")
    print(f"EMAIL_ENABLED: {settings.EMAIL_ENABLED}")
    print(f"SMTP_SERVER: {settings.SMTP_SERVER}")
    print(f"SMTP_PORT: {settings.SMTP_PORT}")
    print(f"SMTP_USERNAME: {settings.SMTP_USERNAME}")
    print(f"SMTP_USE_TLS: {settings.SMTP_USE_TLS}")
    print(f"FROM_EMAIL: {settings.FROM_EMAIL}")
    print(f"FROM_NAME: {settings.FROM_NAME}")
    print(f"FRONTEND_URL: {settings.FRONTEND_URL}")
    print()
    
    # Crear servicio de email
    email_service = EmailService()
    
    # Verificar disponibilidad
    is_available = email_service.is_available()
    print(f"📧 Email service is_available(): {is_available}")
    
    if is_available:
        print("✅ Email service está configurado y disponible")
        print("   - Magic Link estará disponible")
        print("   - Temp Email estará disponible") 
        print("   - Método recomendado: magic_link")
    else:
        print("❌ Email service NO está disponible")
        print("   - Solo Visible Password estará disponible")
        print("   - Método recomendado: visible_password")
        
        # Verificar qué falta
        if not settings.EMAIL_ENABLED:
            print("   - EMAIL_ENABLED está en False")
        if not settings.SMTP_SERVER:
            print("   - SMTP_SERVER no está configurado")
        if not settings.SMTP_USERNAME:
            print("   - SMTP_USERNAME no está configurado")
        if not settings.SMTP_PASSWORD:
            print("   - SMTP_PASSWORD no está configurado")
    
    print()
    print("🔧 Para habilitar email:")
    print("1. Edita .env y configura:")
    print("   EMAIL_ENABLED=true")
    print("   SMTP_SERVER=smtp.gmail.com")
    print("   SMTP_USERNAME=tu-email@gmail.com") 
    print("   SMTP_PASSWORD=tu-app-password")
    print("2. Reinicia el backend")
    print("3. Ejecuta este script nuevamente")

if __name__ == "__main__":
    test_email_configuration()