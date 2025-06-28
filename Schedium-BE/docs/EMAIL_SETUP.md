# Configuración de Email - Estrategia Híbrida de Autenticación

## Resumen

La estrategia híbrida de autenticación de Schedium utiliza tres métodos para crear usuarios:

1. **Magic Link** (recomendado) - Enlace por email para crear contraseña
2. **Contraseña Temporal por Email** - Envía contraseña temporal al usuario  
3. **Contraseña Visible** (emergencia) - Muestra contraseña al administrador

## Configuración Rápida

### 1. Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del backend:

```bash
# Email/SMTP Configuration
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_USE_TLS=true
FROM_EMAIL=noreply@schedium.edu
FROM_NAME="Schedium - Sistema Académico"

# Frontend URL for magic links
FRONTEND_URL=http://localhost:3000
```

### 2. Configuración para Gmail

#### Paso 1: Habilitar 2FA en tu cuenta de Gmail
1. Ve a tu [Cuenta de Google](https://myaccount.google.com)
2. Seguridad → Verificación en 2 pasos → Activar

#### Paso 2: Generar App Password
1. Cuenta de Google → Seguridad → Verificación en 2 pasos
2. Contraseñas de aplicaciones → Seleccionar app: Mail
3. Seleccionar dispositivo: Otro (nombre personalizado)
4. Escribe "Schedium" y genera la contraseña
5. **Copia esta contraseña** (son 16 caracteres)

#### Paso 3: Actualizar .env
```bash
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password-de-16-caracteres
```

### 3. Configuración para Otros Proveedores

#### Outlook/Hotmail
```bash
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

#### Yahoo Mail
```bash
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

#### ProtonMail
```bash
SMTP_SERVER=127.0.0.1
SMTP_PORT=1025
SMTP_USE_TLS=true
# Requiere ProtonMail Bridge
```

## Verificación de Configuración

### 1. Verificar que el servicio esté activo

```bash
curl -X GET "http://localhost:8001/api/v1/auth/auth-methods/available" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta esperada:
```json
{
  "data": {
    "magic_link": {
      "available": true,
      "reason": null
    },
    "temp_email": {
      "available": true,
      "reason": null
    },
    "visible_password": {
      "available": true,
      "reason": "Método de emergencia"
    },
    "recommended_method": "magic_link"
  }
}
```

### 2. Probar creación de usuario

```bash
curl -X POST "http://localhost:8001/api/v1/auth/users/create-with-strategy" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "document_number": "12345678",
    "role_id": 2,
    "active": true,
    "preferred_method": "magic_link"
  }'
```

## Flujo Completo de Autenticación

### Método 1: Magic Link (Recomendado)

1. **Administrador crea usuario**
   - Frontend llama a `/auth/users/create-with-strategy`
   - Backend decide usar `magic_link`

2. **Sistema envía email**
   - Usuario recibe email con enlace seguro
   - Enlace expira en 48 horas
   - Formato: `http://localhost:3000/set-password?token=ABC123&first=true`

3. **Usuario crea contraseña**
   - Hace clic en el enlace
   - Carga `SetPasswordPage` 
   - Crea contraseña segura
   - Token se marca como usado

4. **Usuario puede iniciar sesión**
   - Usa email y nueva contraseña
   - `must_change_password = false`

### Método 2: Contraseña Temporal por Email

1. **Administrador crea usuario**
   - Sistema genera contraseña temporal
   - Envía email con credenciales

2. **Usuario recibe email**
   - Email: `test@example.com`
   - Contraseña: `Kj9#mP2$dF3qX8nA`
   - Expira en 7 días

3. **Usuario inicia sesión**
   - Usa credenciales temporales
   - Sistema fuerza cambio de contraseña

### Método 3: Contraseña Visible (Emergencia)

1. **Administrador crea usuario**
   - Sistema muestra contraseña memorable
   - Ejemplo: `Casa-Azul-2024!`

2. **Modal de advertencia**
   - ⚠️ Contraseña visible al administrador
   - Debe compartirse de forma segura
   - Expira en 24 horas

3. **Usuario recibe contraseña**
   - Por canal seguro (no WhatsApp/SMS)
   - Debe cambiarla en primer login

## Solución de Problemas

### Error: "Email service not configured"

**Causa**: Faltan variables SMTP
**Solución**: 
```bash
# Verificar que todas estén configuradas
echo $SMTP_SERVER
echo $SMTP_USERNAME  
echo $SMTP_PASSWORD
```

### Error: "Authentication failed"

**Causa**: Credenciales SMTP incorrectas
**Solución**:
1. Verificar email y app password
2. Para Gmail, generar nueva app password
3. Verificar 2FA habilitado

### Error: "Connection refused"

**Causa**: Puerto o servidor SMTP incorrecto
**Solución**:
```bash
# Probar conexión
telnet smtp.gmail.com 587
```

### Email no llega

**Solución**:
1. Verificar carpeta de spam
2. Verificar dirección FROM_EMAIL válida
3. Logs del backend: `tail -f backend.log`

### Magic links no funcionan

**Verificar**:
1. `FRONTEND_URL` correcto en .env
2. SetPasswordPage implementado en frontend
3. Token no expirado (48 horas)

## Configuración de Producción

### Variables Adicionales Recomendadas

```bash
# Producción
APP_ENV=production
EMAIL_ENABLED=true
FROM_EMAIL=noreply@tudominio.com
FROM_NAME="Tu Organización"
FRONTEND_URL=https://tudominio.com

# SMTP Dedicado (recomendado)
SMTP_SERVER=smtp.tudominio.com
SMTP_PORT=587
```

### Proveedores SMTP Recomendados

1. **SendGrid** - 100 emails/día gratis
2. **Mailgun** - 5,000 emails/mes gratis  
3. **Amazon SES** - Muy económico
4. **Postmark** - Excelente deliverability

### Seguridad Adicional

1. **SPF Record**:
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **DKIM**: Configurar en tu proveedor de dominio

3. **DMARC**: 
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@tudominio.com
   ```

## Monitoreo

### Logs Importantes

```bash
# Verificar envío de emails
grep "Email sent successfully" backend.log

# Verificar errores SMTP  
grep "Failed to send email" backend.log

# Verificar tokens creados
grep "Magic link token" backend.log
```

### Métricas Recomendadas

- Tasa de entrega de emails
- Tiempo de respuesta SMTP
- Tokens expirados vs usados
- Métodos de autenticación más utilizados

## Testing

### Herramientas de Testing

1. **MailHog** - SMTP testing server
2. **Mailtrap** - Email testing service
3. **SMTP Test Tools** - Verificar conectividad

### Configuración para Testing

```bash
# Para desarrollo/testing
EMAIL_ENABLED=true
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=test@localhost
```

Con MailHog:
```bash
# Instalar MailHog
go install github.com/mailhog/MailHog@latest

# Ejecutar
mailhog

# Web UI en http://localhost:8025
```