# Schedium - Guía de Integración Completa

Este documento explica cómo ejecutar el sistema completo de Schedium (Backend + Frontend) en modo desarrollo.

## 🚀 Inicio Rápido

### Linux/macOS
```bash
./start-dev.sh
```

### Windows
```batch
start-dev.bat
```

## 📋 Prerequisitos

### Backend (FastAPI)
- **Python 3.9+**
- **MySQL/MariaDB** (para la base de datos)
- **Redis** (opcional, para rate limiting)

### Frontend (React + Vite)
- **Node.js 18+**
- **npm** o **yarn**

## 🔧 Configuración Inicial

### 1. Base de Datos
```bash
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE schedium_dev;
CREATE USER 'schedium'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON schedium_dev.* TO 'schedium'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Variables de Entorno del Backend
Crear `.env` en `Schedium-BE/`:
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=schedium
DB_PASSWORD=tu_password
DB_NAME=schedium_dev

# Security
SECRET_KEY=tu_secret_key_muy_seguro
ALGORITHM=HS256

# Environment
APP_ENV=development
DEBUG=true

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0
```

### 3. Variables de Entorno del Frontend
Crear `.env` en `Schedium-FE/`:
```bash
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

## 🏃‍♂️ Ejecutar en Desarrollo

### Opción 1: Script Automático (Recomendado)

**Linux/macOS:**
```bash
# Hacer el script ejecutable (solo la primera vez)
chmod +x start-dev.sh

# Ejecutar
./start-dev.sh
```

**Windows:**
```batch
# Doble clic o desde CMD
start-dev.bat
```

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd Schedium-BE
source venv/bin/activate  # Linux/macOS
# o
venv\Scripts\activate.bat  # Windows

# Instalar dependencias (primera vez)
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd Schedium-FE

# Instalar dependencias (primera vez)
npm install

# Configurar variables de entorno
export VITE_API_URL=http://localhost:8000  # Linux/macOS
# o
set VITE_API_URL=http://localhost:8000     # Windows

# Iniciar servidor de desarrollo
npm run dev
```

## 🌐 URLs de Acceso

Una vez iniciados ambos servidores:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Aplicación principal |
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs** | http://localhost:8000/docs | Documentación Swagger |
| **Health Check** | http://localhost:8000/health | Estado del backend |

## 🔍 Verificación

### 1. Backend Funcionando
```bash
curl http://localhost:8000/health
# Debería retornar: {"status": "healthy"}
```

### 2. Frontend Conectando al Backend
- Abrir http://localhost:3000
- Verificar en Developer Tools → Network que las peticiones van a `localhost:8000`

### 3. Base de Datos Conectada
```bash
# En el directorio del backend
cd Schedium-BE
source venv/bin/activate
python scripts/test_connection.py
```

## 🛠️ Comandos Útiles

### Backend
```bash
cd Schedium-BE

# Ejecutar tests
make test

# Formatear código
make format

# Validar código
make lint

# Crear migración
make migrate-create

# Reset base de datos
make db-reset

# Crear usuario admin
make db-create-admin
```

### Frontend
```bash
cd Schedium-FE

# Ejecutar tests
npm test

# Build para producción
npm run build

# Linter
npm run lint

# Type checking
npm run type-check
```

## 🐳 Docker (Alternativa)

Si prefieres usar Docker:

```bash
# Ejecutar todo con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📊 Monitoreo

### Logs del Backend
Los logs se guardan en `Schedium-BE/logs/`

### Performance del Frontend
- Web Vitals integrados
- Métricas en Developer Tools
- Sentry para errores (configurar SENTRY_DSN)

## 🔧 Troubleshooting

### Backend no inicia
1. Verificar conexión a base de datos
2. Verificar variables de entorno en `.env`
3. Verificar que el puerto 8000 esté libre

### Frontend no conecta al Backend
1. Verificar que VITE_API_URL esté configurado
2. Verificar CORS en backend
3. Verificar que backend esté ejecutándose

### Errores de CORS
Asegurar que en `Schedium-BE/.env`:
```
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Puerto ocupado
```bash
# Verificar qué proceso usa el puerto
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Matar proceso si es necesario
kill -9 <PID>
```

## 📝 Notas de Desarrollo

- **Hot Reload**: Ambos servidores soportan recarga automática en desarrollo
- **API Docs**: Siempre disponible en http://localhost:8000/docs
- **TypeScript**: Frontend tiene type-checking automático
- **Tests**: Ejecutar tests frecuentemente con `make test` (backend) y `npm test` (frontend)

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agrega nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

---

**¿Problemas?** Revisar logs en:
- Backend: `Schedium-BE/logs/`
- Frontend: Developer Tools → Console
- Sistema: Logs del script de inicio