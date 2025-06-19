# Schedium - Sistema de Gestión de Horarios Académicos

Sistema completo de gestión y programación de horarios académicos desarrollado para el SENA CGMLTI, con backend en FastAPI y frontend en React.

## 📋 Descripción

Schedium es una solución integral para la gestión de horarios académicos que permite:

- **Gestión de Horarios**: Programación inteligente evitando conflictos
- **Control de Instructores**: Seguimiento de horas y disponibilidad
- **Administración de Ambientes**: Asignación optimizada de espacios
- **Gestión de Fichas**: Control completo del ciclo de vida estudiantil
- **Sistema de Roles**: Control de acceso basado en permisos (RBAC)

## 🏗️ Arquitectura

El proyecto está dividido en dos componentes principales:

```
Schedium/
├── Schedium-BE/          # Backend - FastAPI
├── Schedium-FE/          # Frontend - React + TypeScript
└── README.md            # Este archivo
```

### Backend (Schedium-BE)
- **Framework**: FastAPI con SQLAlchemy 2.0
- **Base de datos**: MySQL 8.0
- **Autenticación**: JWT + OAuth2
- **Arquitectura**: Hexagonal (Clean Architecture)
- **Contenedores**: Docker + Docker Compose

### Frontend (Schedium-FE)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS + Design System personalizado
- **Estado**: Zustand + React Query
- **Routing**: React Router 6
- **Testing**: Vitest + Testing Library

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ y npm 9+
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd Schedium
```

2. **Configurar el backend**
```bash
cd Schedium-BE
cp .env.example .env
# Editar .env con tus configuraciones
docker-compose up -d
```

3. **Configurar el frontend**
```bash
cd ../Schedium-FE
npm install
npm run dev
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Documentación API: http://localhost:8001/docs

## 📚 Documentación

### Backend
Ver [Schedium-BE/README.md](./Schedium-BE/README.md) para:
- Instalación detallada
- Configuración de base de datos
- Documentación de API
- Arquitectura y patrones de diseño

### Frontend
Ver [Schedium-FE/README.md](./Schedium-FE/README.md) para:
- Configuración de desarrollo
- Estructura de componentes
- Testing y calidad
- Deployment

## 🛠️ Desarrollo

### Comandos útiles

**Backend:**
```bash
cd Schedium-BE
docker-compose up -d          # Iniciar servicios
docker-compose logs -f api    # Ver logs
docker-compose down           # Detener servicios
```

**Frontend:**
```bash
cd Schedium-FE
npm run dev                   # Servidor de desarrollo
npm run test                  # Ejecutar tests
npm run build                 # Build de producción
npm run lint                  # Linting
```

### Flujo de desarrollo

1. Crear rama desde `main`
2. Desarrollar feature/fix
3. Ejecutar tests y linting
4. Crear Pull Request
5. Code review
6. Merge a `main`

## 🧪 Testing

### Backend
```bash
cd Schedium-BE
pytest --cov=app
```

### Frontend
```bash
cd Schedium-FE
npm run test                  # Unit tests
npm run test:integration      # Integration tests
npm run test:e2e             # E2E tests
```

## 🚀 Deployment

### Desarrollo
Los servicios se ejecutan localmente con Docker Compose para el backend y Vite dev server para el frontend.

### Producción
Ver archivos específicos de deployment en cada directorio:
- Backend: `Schedium-BE/DEPLOYMENT.md`
- Frontend: `Schedium-FE/docker-compose.prod.yml`

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estándares de código

- **Backend**: Black, isort, flake8, mypy
- **Frontend**: ESLint, Prettier, TypeScript strict
- **Commits**: Conventional Commits
- **Testing**: Cobertura mínima 80%

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Johan Rivas** - *Arquitecto Principal*
- **Julian Castellanos** - *Desarrollador Principal*

## 🆘 Soporte

Para reportar problemas o solicitar características:

1. Verificar issues existentes
2. Crear nuevo issue con plantilla
3. Proporcionar información detallada

---

© 2024 SENA CGMLTI. Todos los derechos reservados.