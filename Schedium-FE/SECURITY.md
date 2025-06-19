# Política de Seguridad

## 🔐 Versiones Soportadas

| Versión | Soportada          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reportar una Vulnerabilidad

La seguridad es una prioridad para Schedium. Si descubres una vulnerabilidad de seguridad, por favor repórtala de manera responsable.

### Proceso de Reporte

1. **NO** crees un issue público en GitHub
2. Envía un correo a: [security@sena.edu.co] (ajustar según corresponda)
3. Incluye la siguiente información:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducir el problema
   - Impacto potencial
   - Sugerencias de mitigación (si las tienes)

### Qué Esperar

- **Confirmación**: Recibirás una confirmación dentro de 48 horas
- **Evaluación**: Evaluaremos la vulnerabilidad dentro de 7 días
- **Actualización**: Te mantendremos informado del progreso
- **Resolución**: Trabajaremos en una solución lo antes posible
- **Crédito**: Si lo deseas, te daremos crédito por el descubrimiento

## 🛡️ Mejores Prácticas de Seguridad

### Para Desarrolladores

1. **Dependencias**
   - Mantén las dependencias actualizadas
   - Ejecuta `npm audit` regularmente
   - No uses dependencias con vulnerabilidades conocidas

2. **Secrets y Credenciales**
   - Nunca commits credenciales
   - Usa variables de entorno
   - Revisa `.gitignore` antes de hacer commit

3. **Validación de Datos**
   - Valida toda entrada del usuario
   - Usa Zod para validación de esquemas
   - Sanitiza datos antes de renderizar

4. **Autenticación y Autorización**
   - Implementa refresh tokens correctamente
   - Valida permisos en el cliente Y servidor
   - No almacenes tokens en localStorage

5. **XSS Prevention**
   - Usa DOMPurify para contenido HTML
   - Evita `dangerouslySetInnerHTML`
   - Escapa caracteres especiales

6. **CSRF Protection**
   - Usa tokens CSRF para operaciones sensibles
   - Valida el origen de las peticiones

### Headers de Seguridad

```nginx
# Configurados en nginx.conf
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer-when-downgrade
Content-Security-Policy: [política específica]
```

## 📋 Checklist de Seguridad

Antes de cada release:

- [ ] Ejecutar `npm audit` y resolver vulnerabilidades
- [ ] Revisar dependencias actualizadas
- [ ] Verificar que no hay secrets en el código
- [ ] Validar configuración de CORS
- [ ] Probar autenticación y autorización
- [ ] Verificar headers de seguridad
- [ ] Realizar pruebas de penetración básicas
- [ ] Revisar logs por actividad sospechosa

## 🔍 Herramientas de Seguridad

- **npm audit**: Análisis de vulnerabilidades en dependencias
- **ESLint security plugins**: Detección de patrones inseguros
- **OWASP ZAP**: Pruebas de seguridad automatizadas
- **Chrome DevTools Security**: Análisis de seguridad del sitio

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/security)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

## 🤝 Programa de Recompensas

Actualmente no tenemos un programa formal de bug bounty, pero apreciamos profundamente los reportes de seguridad responsables y consideraremos reconocimientos apropiados caso por caso.

---

Gracias por ayudarnos a mantener Schedium seguro para todos los usuarios.