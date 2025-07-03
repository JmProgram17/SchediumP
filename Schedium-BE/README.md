# Schedium Backend API

Sistema de gestión de programación académica desarrollado con FastAPI para optimizar la asignación de horarios, instructores y ambientes educativos.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Desarrollo](#-desarrollo)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Deployment](#-deployment)
- [Contribución](#-contribución)
- [Soporte](#-soporte)
- [Autores](#-autores)
- [Licencia](#-licencia)

## 🚀 Características

### Core Features
- **Gestión de Horarios**: Programación inteligente evitando conflictos
- **Control de Instructores**: Seguimiento de horas y disponibilidad
- **Administración de Ambientes**: Asignación optimizada de espacios
- **Gestión de Fichas**: Control completo del ciclo de vida estudiantil
- **Sistema de Roles**: Control de acceso basado en permisos (RBAC)

### Technical Features
- **FastAPI**: Framework moderno y de alto rendimiento
- **SQLAlchemy 2.0**: ORM robusto con soporte asíncrono
- **Pydantic V2**: Validación de datos y serialización
- **JWT + OAuth2**: Autenticación y autorización segura
- **Docker**: Containerización para desarrollo y producción
- **Alembic**: Migraciones de base de datos versionadas
- **Pytest**: Suite completa de pruebas automatizadas
- **OpenAPI 3.0**: Documentación automática de API

## 🔄 Sincronización de Base de Datos (IMPORTANTE)

Si estás clonando este proyecto por primera vez, es importante sincronizar correctamente la base de datos con todas las migraciones:

```bash
# Opción 1: Usar el script de sincronización (RECOMENDADO)
cd Schedium-BE
./scripts/sync_database.sh

# Opción 2: Sincronización manual
docker-compose down
docker volume rm schedium-be_mysql_data  # Elimina datos anteriores
docker-compose up -d mysql
sleep 15  # Esperar a que MySQL esté listo
docker-compose run --rm api alembic upgrade head
docker-compose up -d
```

### Conexión con DBeaver
- **Host:** localhost (o IP del servidor)
- **Puerto:** 3307 (NO 3306)
- **Base de datos:** schedium
- **Usuario:** schedule
- **Contraseña:** HorariosSena1

## 🎯 Poblado de Base de Datos (DESARROLLO)

Para trabajar con datos de ejemplo durante el desarrollo:

```bash
# Poblar la base de datos con datos de ejemplo completos
cd Schedium-BE
./scripts/populate_sample_data.sh
```

### 📊 Datos de ejemplo incluidos:
- ✅ **3 Campus**: Central, Norte, Sur
- ✅ **3 Coordinaciones**: Sistemas, Administración, Salud
- ✅ **5 Programas**: Sistemas, Redes, Admin Empresas, Aux Enfermería, Atención Prehospitalaria
- ✅ **5 Instructores**: Con diferentes tipos de contrato
- ✅ **5 Ambientes**: Laboratorios y aulas teóricas
- ✅ **5 Fichas**: Grupos de estudiantes activos
- ✅ **Usuarios coordinadores**: Para pruebas de roles
- ✅ **Configuración académica**: Parámetros del sistema

### 🔑 Credenciales de prueba:
- **Coordinador Sistemas**: pedro.ramirez@schedium.edu.co
- **Coordinador Admin**: sandra.torres@schedium.edu.co  
- **Coordinador Salud**: luis.vargas@schedium.edu.co
- **Contraseña**: `password` (para todos)

**Nota**: Los datos de ejemplo son seguros y NO incluyen horarios para evitar conflictos. Son ideales para desarrollo y pruebas.

## 🏗️ Arquitectura

### Patrón de Diseño
El proyecto sigue una arquitectura hexagonal (Clean Architecture) con las siguientes capas:

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │
│          (FastAPI Controllers)          │
├─────────────────────────────────────────┤
│           Application Layer             │
│         (Services & Use Cases)          │
├─────────────────────────────────────────┤
│            Domain Layer                 │
│      (Business Logic & Entities)        │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│    (Database, External Services)        │
└─────────────────────────────────────────┘
```

### Principios de Diseño
- **SOLID**: Principios de diseño orientado a objetos
- **DDD**: Domain-Driven Design para modelado del negocio
- **Repository Pattern**: Abstracción del acceso a datos
- **Dependency Injection**: Inversión de control para testing
- **CQRS**: Separación de comandos y consultas (donde aplique)

## 📋 Requisitos

### Sistema
- Python 3.11 o superior
- MySQL 8.0 o superior
- Redis 6.0+ (para caché y sesiones)
- Docker & Docker Compose (opcional pero recomendado)

### Hardware Recomendado
- RAM: 4GB mínimo (8GB recomendado)
- CPU: 2 cores mínimo (4 cores recomendado)
- Almacenamiento: 10GB disponible

## 🛠️ Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/schedium-backend.git
cd schedium-backend
```

### 2. Configuración con Docker (Recomendado)

```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar configuración (importante: cambiar SECRET_KEY y credenciales de BD)
nano .env

# Construir y ejecutar servicios
docker-compose up -d

# Ejecutar migraciones de base de datos
docker-compose exec api alembic upgrade head

# Verificar logs
docker-compose logs -f api
```

### 3. Instalación Manual

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Actualizar pip
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt

# Para desarrollo también:
pip install -r requirements-dev.txt
```

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```env
# Application
APP_NAME="Schedium API"
APP_VERSION="1.0.0"
APP_ENV="development"  # development, staging, production
DEBUG=True

# API Configuration
API_V1_STR="/api/v1"
PROJECT_NAME="Schedium - Sistema de Programación Académica"

# Security
SECRET_KEY="your-super-secret-key-min-32-chars"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=schedium_user
DB_PASSWORD=secure_password
DB_NAME=schedium_database

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

### Base de Datos

1. Crear base de datos:
```sql
CREATE DATABASE schedium_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'schedium_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON schedium_database.* TO 'schedium_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Ejecutar migraciones:
```bash
# Inicializar Alembic (solo primera vez)
alembic init alembic

# Crear migración inicial
alembic revision --autogenerate -m "Initial migration"

# Aplicar migraciones
alembic upgrade head
```

## 🚀 Uso

### Iniciar el Servidor

#### Desarrollo
```bash
# Con auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Con configuración customizada
python -m app.main
```

#### Producción
```bash
# Con Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Con Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Verificar Funcionamiento

```bash
# Health check
curl http://localhost:8000/health

# API info
curl http://localhost:8000/

# Con httpie (más legible)
http GET localhost:8000/health
```

## 📚 API Documentation

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI Schema**: http://localhost:8000/api/v1/openapi.json

### Endpoints Principales

```http
# Autenticación
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

# Instructores
GET    /api/v1/instructors
POST   /api/v1/instructors
GET    /api/v1/instructors/{id}
PUT    /api/v1/instructors/{id}
DELETE /api/v1/instructors/{id}

# Programación
GET    /api/v1/schedules
POST   /api/v1/schedules
GET    /api/v1/schedules/conflicts
POST   /api/v1/schedules/validate

# Reportes
GET    /api/v1/reports/instructor-workload
GET    /api/v1/reports/classroom-usage
GET    /api/v1/reports/schedule-matrix
```

## 🧪 Testing

### Ejecutar Pruebas

```bash
# Todas las pruebas
pytest

# Con coverage
pytest --cov=app --cov-report=html --cov-report=term-missing

# Pruebas específicas
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/

# Prueba específica
pytest tests/unit/test_auth.py::test_login

# Con output verbose
pytest -v -s

# Pruebas en paralelo
pytest -n auto
```

### Estructura de Pruebas

```
tests/
├── unit/              # Pruebas unitarias
├── integration/       # Pruebas de integración
├── e2e/              # Pruebas end-to-end
├── fixtures/         # Datos de prueba
├── factories/        # Factories para generar datos
└── conftest.py       # Configuración global de pytest
```

## 🔧 Desarrollo

### Estándares de Código

```bash
# Formatear código
black .
isort .

# Linting
flake8
pylint app/

# Type checking
mypy app/

# Todo junto
make lint  # Si tienes Makefile
```

### Pre-commit Hooks

```bash
# Instalar pre-commit
pip install pre-commit

# Configurar hooks
pre-commit install

# Ejecutar manualmente
pre-commit run --all-files
```

### Flujo de Desarrollo

1. Crear rama desde `develop`
2. Desarrollar feature/fix
3. Escribir/actualizar tests
4. Ejecutar linting y tests
5. Commit con mensaje descriptivo
6. Push y crear Pull Request
7. Code review
8. Merge a `develop`

## 📁 Estructura del Proyecto

```
schedium-backend/
├── app/                        # Código principal
│   ├── api/                   # Endpoints y rutas
│   │   ├── v1/               # Versión 1 de la API
│   │   │   ├── endpoints/    # Controllers por dominio
│   │   │   ├── deps.py       # Dependencias comunes
│   │   │   └── router.py     # Router principal
│   │   └── middlewares/      # Middleware personalizado
│   ├── core/                  # Funcionalidad core
│   │   ├── config.py         # Configuración
│   │   ├── security.py       # Utilidades de seguridad
│   │   └── exceptions.py     # Excepciones personalizadas
│   ├── domain/               # Lógica de dominio
│   │   ├── entities/         # Entidades del negocio
│   │   ├── repositories/     # Interfaces de repositorio
│   │   └── services/         # Servicios de dominio
│   ├── infrastructure/       # Implementaciones de infra
│   │   ├── database/         # Configuración de BD
│   │   ├── repositories/     # Implementación de repos
│   │   └── external/         # Servicios externos
│   ├── models/               # Modelos SQLAlchemy
│   ├── schemas/              # Esquemas Pydantic
│   └── utils/                # Utilidades generales
├── alembic/                   # Migraciones
│   ├── versions/             # Archivos de migración
│   └── alembic.ini          # Configuración
├── tests/                     # Suite de pruebas
├── scripts/                   # Scripts de utilidad
│   ├── init_db.py           # Inicializar BD
│   └── seed_data.py         # Datos de prueba
├── docker/                    # Configuración Docker
│   ├── app/                 # Dockerfile de app
│   └── nginx/               # Configuración nginx
├── docs/                      # Documentación
│   ├── api/                 # Documentación de API
│   ├── architecture/        # Decisiones arquitectónicas
│   └── deployment/          # Guías de deployment
├── .github/                   # GitHub Actions
│   └── workflows/           # CI/CD pipelines
├── requirements.txt           # Dependencias de producción
├── requirements-dev.txt       # Dependencias de desarrollo
├── docker-compose.yml         # Orquestación local
├── docker-compose.prod.yml    # Orquestación producción
├── Makefile                   # Comandos de utilidad
├── .env.example              # Plantilla de configuración
├── .gitignore                # Archivos ignorados
├── .pre-commit-config.yaml   # Configuración pre-commit
├── pyproject.toml            # Configuración de proyecto
├── setup.cfg                 # Configuración de herramientas
└── README.md                 # Este archivo
```

## 🚀 Deployment

### Docker Production

```bash
# Build de producción
docker build -t schedium-api:latest .

# Ejecutar con docker-compose (incluye MySQL y Redis)
docker-compose up -d

# Para producción con Nginx (opcional)
docker-compose --profile production up -d

# Escalar horizontalmente
docker-compose up -d --scale api=3

# Comandos útiles Docker
docker-compose logs -f api          # Ver logs de la aplicación
docker-compose exec api bash        # Acceder al contenedor
docker-compose down                  # Detener servicios
docker-compose down -v              # Detener y eliminar volúmenes
```

### Comandos Docker Adicionales

```bash
# Ejecutar migraciones
docker-compose exec api alembic upgrade head

# Crear usuario administrador
docker-compose exec api python scripts/create_admin_user.py

# Verificar estado de la aplicación
docker-compose exec api python scripts/verify_setup.py

# Backup de base de datos
docker-compose exec mysql mysqldump -u root -p schedium > backup.sql

# Restaurar base de datos
docker-compose exec -i mysql mysql -u root -p schedium < backup.sql
```

### Kubernetes

```bash
# Aplicar configuraciones
kubectl apply -f k8s/

# Verificar deployment
kubectl get pods -n schedium
kubectl get services -n schedium
```

### CI/CD Pipeline

El proyecto incluye GitHub Actions para:
- Linting y formateo de código
- Ejecución de tests
- Build de imagen Docker
- Deploy automático a staging/production

## 🤝 Contribución

### Guía de Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estándares de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Formateo, sin cambios de código
- `refactor:` Refactorización de código
- `test:` Añadir o corregir tests
- `chore:` Cambios en build o herramientas

### Code Review Checklist

- [ ] El código sigue los estándares del proyecto
- [ ] Los tests pasan correctamente
- [ ] La documentación está actualizada
- [ ] No hay código comentado o console.logs
- [ ] Las variables tienen nombres descriptivos
- [ ] No hay credenciales hardcodeadas

## 🆘 Soporte

### Reportar Issues

Para reportar bugs o solicitar features:

1. Verificar que no exista un issue similar
2. Usar las plantillas de issue disponibles
3. Proporcionar información detallada:
   - Versión de la API
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Logs relevantes

### Contacto

- **Email**: soporte@schedium.com
- **Documentation**: https://docs.schedium.com
- **Issues**: https://github.com/tu-usuario/schedium-backend/issues

## 👥 Autores

- **Johan Rivas** - *Arquitecto Principal* - [@johanrivas](https://github.com/johanrivas)
- **Julian Castellanos** - *Desarrollador Principal* - [@juliancastellanos](https://github.com/juliancastellanos)

### Colaboradores

Ver la lista completa de [colaboradores](https://github.com/tu-usuario/schedium-backend/contributors) que han participado en este proyecto.
