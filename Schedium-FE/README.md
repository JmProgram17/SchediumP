# Schedium Frontend

Sistema de Gestión Académica para SENA CGMLTI - Frontend Application

## 🚀 Descripción

Schedium es una aplicación web moderna para la gestión académica del SENA CGMLTI. Este repositorio contiene el frontend de la aplicación, desarrollado con React, TypeScript y Vite.

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (opcional, para desarrollo con contenedores)

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd Schedium-FE
```

2. Instalar dependencias:
```bash
npm install
```

3. Copiar el archivo de configuración de ejemplo:
```bash
cp .env.example .env
```

4. Configurar las variables de entorno en `.env` según sea necesario.

## 🚀 Desarrollo

### Ejecutar en modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Ejecutar con Docker:
```bash
docker-compose up
```

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run test` - Ejecuta las pruebas unitarias
- `npm run test:coverage` - Ejecuta las pruebas con reporte de cobertura
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier
- `npm run typecheck` - Verifica los tipos de TypeScript

## 🏗️ Arquitectura

El proyecto sigue una arquitectura hexagonal/clean architecture con la siguiente estructura:

```
src/
├── components/     # Componentes reutilizables
├── features/       # Módulos de funcionalidades
├── services/       # Servicios y API clients
├── hooks/          # Custom React hooks
├── utils/          # Utilidades y helpers
├── types/          # Definiciones de tipos TypeScript
├── constants/      # Constantes de la aplicación
├── config/         # Configuración
└── test/          # Utilidades de testing
```

## 🧪 Testing

### Ejecutar pruebas:
```bash
npm run test
```

### Ejecutar pruebas con UI:
```bash
npm run test:ui
```

### Ejecutar pruebas con cobertura:
```bash
npm run test:coverage
```

## 🔧 Tecnologías Principales

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **React Router** - Enrutamiento
- **TanStack Query** - Gestión de estado del servidor
- **Zustand** - Gestión de estado local
- **Tailwind CSS** - Framework CSS
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **Vitest** - Testing framework
- **MSW** - Mock de APIs

## 🤝 Contribuir

Por favor, lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviarnos pull requests.

## 🔒 Seguridad

Para reportar vulnerabilidades de seguridad, por favor lee [SECURITY.md](SECURITY.md).

## 📄 Licencia

Este proyecto es propiedad del SENA CGMLTI.