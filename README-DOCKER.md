# 🐳 Schedium - Docker Complete Stack

> **Sistema completo de gestión académica ejecutándose con Docker**

## ⚡ Inicio Super Rápido

```bash
# 1. Setup inicial (solo primera vez)
./scripts/setup.sh

# 2. Iniciar todo el stack
./scripts/docker-start.sh

# 3. Abrir en el navegador
# Frontend: http://localhost:3000
# API: http://localhost:8001/docs
```

## 🎯 ¿Qué Incluye Este Stack?

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Frontend** | 3000 | React + TypeScript + Tailwind |
| **Backend** | 8001 | FastAPI + Python + SQLAlchemy |
| **MySQL** | 3307 | Base de datos principal |
| **Redis** | 6380 | Cache y sesiones |
| **Nginx** | 80 | Reverse proxy (producción) |

## 🚀 Comandos Principales

### Modo Producción
```bash
./scripts/docker-start.sh         # Iniciar
./scripts/docker-start.sh stop    # Detener
./scripts/docker-start.sh logs    # Ver logs
```

### Modo Desarrollo (con Hot Reload)
```bash
./scripts/docker-dev.sh start     # Iniciar desarrollo
./scripts/docker-dev.sh logs      # Ver logs
./scripts/docker-dev.sh shell backend  # Entrar al backend
```

## 📂 Estructura del Proyecto

```
Schedium/
├── docker-compose.yml          # Configuración principal
├── .env.example               # Variables de entorno
├── scripts/
│   ├── setup.sh              # Setup inicial
│   ├── docker-start.sh       # Modo producción
│   └── docker-dev.sh         # Modo desarrollo
├── Schedium-FE/              # Frontend React
│   └── Dockerfile
├── Schedium-BE/              # Backend FastAPI
│   └── Dockerfile
└── DOCKER_GUIDE.md          # Documentación completa
```

## 🔧 Configuración Rápida

### 1. Personalizar Variables (.env)
```bash
# Puertos (si están ocupados)
FRONTEND_PORT=3000
API_PORT=8001
DB_PORT=3307

# Base de datos
DB_PASSWORD=TuPasswordSegura

# API URL para frontend
VITE_API_URL=http://localhost:8001
```

### 2. Ejecutar Setup
```bash
./scripts/setup.sh
```

### 3. Iniciar Servicios
```bash
# Producción
./scripts/docker-start.sh

# O desarrollo (recomendado)
./scripts/docker-dev.sh start
```

## 🛠️ Desarrollo

### Hot Reload Automático
El modo desarrollo incluye:
- ✅ Frontend: Hot reload con Vite
- ✅ Backend: Auto-restart con uvicorn
- ✅ Volúmenes montados para código fuente
- ✅ Logs detallados

### Comandos Útiles
```bash
# Reiniciar solo el backend
./scripts/docker-dev.sh restart backend

# Reconstruir frontend tras cambios en package.json
./scripts/docker-dev.sh rebuild frontend

# Crear migración de BD
./scripts/docker-dev.sh create-migration "nueva tabla"

# Aplicar migraciones
./scripts/docker-dev.sh migrate

# Shell del backend para debugging
./scripts/docker-dev.sh shell backend
```

## 📊 Base de Datos

### Acceso Directo
```bash
# Desde línea de comandos
mysql -h localhost -P 3307 -u schedule -p schedium

# Desde container
docker-compose exec mysql mysql -u schedule -p schedium
```

### Datos de Ejemplo
El stack incluye datos de ejemplo automáticamente:
- Usuarios de prueba
- Programas académicos
- Instructores
- Aulas y horarios

## 🔍 Troubleshooting

### Problemas Comunes

**🚨 Puerto en uso**
```bash
# Cambiar en .env
FRONTEND_PORT=3001
API_PORT=8002
```

**🚨 Contenedor no inicia**
```bash
# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
```

**🚨 Base de datos no conecta**
```bash
# Reiniciar solo MySQL
docker-compose restart mysql

# Ver estado de salud
docker-compose ps
```

**🚨 Frontend no carga**
```bash
# Verificar construcción
./scripts/docker-dev.sh rebuild frontend

# Ver logs de Nginx
docker-compose logs frontend
```

### Limpiar Todo y Empezar de Nuevo
```bash
# Detener y limpiar
./scripts/docker-start.sh stop
docker-compose down -v  # ⚠️ Borra datos de BD

# Empezar limpio
./scripts/setup.sh
./scripts/docker-start.sh
```

## 🚀 Puesta en Producción

### Modo Producción Completo
```bash
# Con Nginx reverse proxy
docker-compose --profile production up -d
```

### Variables de Producción
```bash
# En .env
APP_ENV=production
DEBUG=false
SECRET_KEY=clave-muy-segura-aleatoria
BACKEND_CORS_ORIGINS=https://tu-dominio.com
```

## 📱 URLs de Acceso

Después de iniciar:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **App Principal** | http://localhost:3000 | Interfaz de usuario |
| **API Docs** | http://localhost:8001/docs | Swagger UI |
| **API Health** | http://localhost:8001/health | Estado del backend |
| **Redoc** | http://localhost:8001/redoc | Documentación alternativa |

## 📚 Documentación Completa

Para documentación detallada, ver: **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)**

## ⚙️ Requisitos del Sistema

- **Docker Engine**: 20.0+
- **Docker Compose**: 2.0+
- **RAM**: 4GB mínimo
- **Disco**: 10GB libres
- **Puertos**: 3000, 8001, 3307, 6380 disponibles

## 🆘 Soporte Rápido

### Ver Todo el Estado
```bash
./scripts/docker-start.sh status
```

### Logs en Tiempo Real
```bash
./scripts/docker-start.sh logs
# o
./scripts/docker-dev.sh logs
```

### Reinicio Rápido
```bash
./scripts/docker-start.sh restart
```

---

**¿Primera vez con Docker?** No te preocupes, estos scripts hacen todo el trabajo pesado por ti. Solo ejecuta `./scripts/setup.sh` y luego `./scripts/docker-start.sh` 🚀

**¿Desarrollador?** Usa `./scripts/docker-dev.sh start` para hot reload automático en frontend y backend 🔥