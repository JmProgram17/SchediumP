# 🐳 Schedium Docker Guide

Esta guía te ayudará a ejecutar Schedium completo usando Docker, incluyendo frontend, backend y base de datos.

## 📋 Prerrequisitos

- Docker Engine 20.0+
- Docker Compose 2.0+
- Al menos 4GB de RAM libre
- Al menos 10GB de espacio en disco

## 🚀 Inicio Rápido

### 1. Configuración Inicial

```bash
# Ejecutar setup inicial (solo la primera vez)
./scripts/setup.sh
```

Este script:
- ✅ Verifica que Docker esté instalado y funcionando
- ✅ Crea el archivo `.env` con configuraciones por defecto
- ✅ Genera una clave secreta aleatoria
- ✅ Crea directorios necesarios
- ✅ Configura Nginx
- ✅ Descarga imágenes Docker requeridas

### 2. Iniciar la Aplicación

```bash
# Modo producción
./scripts/docker-start.sh

# O modo desarrollo (con hot reload)
./scripts/docker-dev.sh start
```

### 3. Acceder a la Aplicación

Una vez iniciado, podrás acceder a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Documentación API**: http://localhost:8001/docs
- **Base de datos MySQL**: localhost:3307
- **Redis**: localhost:6380

## 🛠️ Scripts Disponibles

### `./scripts/setup.sh`
Configuración inicial del proyecto.

```bash
./scripts/setup.sh        # Setup completo
./scripts/setup.sh check   # Solo verificar prerequisitos
./scripts/setup.sh env     # Solo crear archivo .env
```

### `./scripts/docker-start.sh`
Gestión del modo producción.

```bash
./scripts/docker-start.sh         # Iniciar
./scripts/docker-start.sh stop    # Detener
./scripts/docker-start.sh restart # Reiniciar
./scripts/docker-start.sh logs    # Ver logs
./scripts/docker-start.sh status  # Ver estado
```

### `./scripts/docker-dev.sh`
Gestión del modo desarrollo.

```bash
./scripts/docker-dev.sh start                    # Iniciar desarrollo
./scripts/docker-dev.sh stop                     # Detener
./scripts/docker-dev.sh logs                     # Ver logs
./scripts/docker-dev.sh restart <servicio>       # Reiniciar servicio
./scripts/docker-dev.sh rebuild <servicio>       # Reconstruir servicio
./scripts/docker-dev.sh shell <servicio>         # Acceder al shell
./scripts/docker-dev.sh migrate                  # Ejecutar migraciones
./scripts/docker-dev.sh create-migration "msg"   # Crear migración
```

## 🔧 Configuración

### Variables de Entorno

El archivo `.env` contiene todas las configuraciones. Las principales son:

```bash
# Puertos externos
FRONTEND_PORT=3000
API_PORT=8001
DB_PORT=3307

# Base de datos
DB_NAME=schedium
DB_USER=schedule
DB_PASSWORD=HorariosSena1

# Seguridad
SECRET_KEY=tu-clave-secreta-generada

# Frontend
VITE_API_URL=http://localhost:8001
```

### Personalizar Configuración

1. Edita el archivo `.env` según tus necesidades
2. Reinicia los contenedores:
   ```bash
   ./scripts/docker-start.sh restart
   ```

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │    │     Backend     │    │     MySQL       │
│   (React/Vite)  │    │   (FastAPI)     │    │   (Database)    │
│                 │    │                 │    │                 │
│   Port: 3000    │    │   Port: 8001    │    │   Port: 3307    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                 ┌─────────────────┐
                 │                 │
                 │     Redis       │
                 │   (Cache)       │
                 │                 │
                 │   Port: 6380    │
                 │                 │
                 └─────────────────┘
```

## 📊 Servicios

### Frontend (React + Vite)
- **Puerto**: 3000
- **Tecnología**: React 18, TypeScript, Tailwind CSS
- **Servidor**: Nginx en producción, Vite dev server en desarrollo

### Backend (FastAPI)
- **Puerto**: 8001 (8000 interno)
- **Tecnología**: Python 3.11, FastAPI, SQLAlchemy
- **Base de datos**: MySQL 8.0
- **Cache**: Redis

### MySQL
- **Puerto**: 3307 (3306 interno)
- **Versión**: 8.0
- **Base de datos**: `schedium`
- **Usuario**: `schedule`

### Redis
- **Puerto**: 6380 (6379 interno)
- **Uso**: Cache, sesiones, rate limiting

## 🔍 Resolución de Problemas

### Puerto en Uso
Si algún puerto está en uso, modifica el archivo `.env`:

```bash
# Cambiar puertos
FRONTEND_PORT=3001
API_PORT=8002
DB_PORT=3308
```

### Ver Logs
```bash
# Todos los servicios
./scripts/docker-start.sh logs

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reiniciar Servicio Específico
```bash
# Desarrollo
./scripts/docker-dev.sh restart backend
./scripts/docker-dev.sh restart frontend

# Producción
docker-compose restart backend
docker-compose restart frontend
```

### Limpiar y Empezar de Nuevo
```bash
# Detener todo
./scripts/docker-start.sh stop

# Limpiar volúmenes (CUIDADO: Borra datos de la BD)
docker-compose down -v

# Limpiar imágenes (opcional)
docker system prune -a

# Empezar de nuevo
./scripts/setup.sh
./scripts/docker-start.sh
```

### Problemas de Permisos
```bash
# Hacer scripts ejecutables
chmod +x scripts/*.sh

# Problema con Docker en Linux
sudo usermod -aG docker $USER
# Luego cerrar sesión y volver a entrar
```

## 🔄 Workflows Comunes

### Desarrollo Diario
```bash
# Iniciar ambiente de desarrollo
./scripts/docker-dev.sh start

# Ver logs en tiempo real
./scripts/docker-dev.sh logs

# Reiniciar backend después de cambios
./scripts/docker-dev.sh restart backend

# Acceder al shell del backend para debugging
./scripts/docker-dev.sh shell backend
```

### Migraciones de Base de Datos
```bash
# Crear nueva migración
./scripts/docker-dev.sh create-migration "descripción del cambio"

# Aplicar migraciones
./scripts/docker-dev.sh migrate
```

### Actualizar Dependencias
```bash
# Reconstruir servicios después de cambios en package.json o requirements.txt
./scripts/docker-dev.sh rebuild frontend
./scripts/docker-dev.sh rebuild backend
```

## 🚀 Despliegue en Producción

### Con Nginx (Recomendado)
```bash
# Usar perfil de producción
docker-compose --profile production up -d

# O sin perfil (solo servicios básicos)
./scripts/docker-start.sh
```

### Variables de Entorno para Producción
```bash
# En .env para producción
APP_ENV=production
DEBUG=false
SECRET_KEY=clave-secreta-muy-fuerte
BACKEND_CORS_ORIGINS=https://tu-dominio.com
```

## 📱 Modo Desarrollo vs Producción

| Característica | Desarrollo | Producción |
|----------------|------------|------------|
| Hot Reload | ✅ | ❌ |
| Source Maps | ✅ | ❌ |
| Minificación | ❌ | ✅ |
| Servidor | Vite Dev Server | Nginx |
| Logs | Detallados | Optimizados |
| Cache | Deshabilitado | Habilitado |

## 🆘 Obtener Ayuda

### Ver Estado de los Contenedores
```bash
docker-compose ps
```

### Inspeccionar Logs de Error
```bash
# Backend errors
docker-compose logs backend | grep ERROR

# Frontend build errors
docker-compose logs frontend
```

### Acceder a la Base de Datos
```bash
# Desde otro contenedor
docker-compose exec mysql mysql -u schedule -p schedium

# Desde el host
mysql -h localhost -P 3307 -u schedule -p schedium
```

### Comandos Docker Útiles
```bash
# Ver uso de recursos
docker stats

# Limpiar espacio
docker system df
docker system prune

# Ver redes
docker network ls

# Ver volúmenes
docker volume ls
```

## 🔒 Seguridad

### Claves y Secretos
- Siempre cambia `SECRET_KEY` en producción
- No subas el archivo `.env` al control de versiones
- Usa contraseñas fuertes para la base de datos

### Puertos
- Solo expone los puertos necesarios
- En producción, considera usar un reverse proxy adicional
- Configura firewall adecuadamente

### Updates
- Mantén las imágenes Docker actualizadas
- Revisa regularmente las dependencias

---

## 📞 Soporte

Si tienes problemas con la configuración de Docker:

1. Revisa los logs: `./scripts/docker-start.sh logs`
2. Verifica el estado: `docker-compose ps`
3. Consulta esta documentación
4. Limpia y reinicia si es necesario

¡Happy coding! 🚀