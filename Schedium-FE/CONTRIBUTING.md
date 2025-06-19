# Guía de Contribución

¡Gracias por tu interés en contribuir a Schedium Frontend! Esta guía te ayudará a entender cómo puedes contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Testing](#testing)

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que respetes este código.

## 🔄 Proceso de Desarrollo

1. **Fork el repositorio** y clónalo localmente
2. **Crea una rama** para tu feature/fix: `git checkout -b feature/nombre-descriptivo`
3. **Desarrolla** tu cambio siguiendo los estándares del proyecto
4. **Escribe/actualiza tests** según sea necesario
5. **Asegúrate que los tests pasen**: `npm run test`
6. **Commit** tus cambios siguiendo las convenciones
7. **Push** tu rama y crea un Pull Request

## 💻 Estándares de Código

### TypeScript
- Usar tipado estricto (no `any`)
- Definir tipos/interfaces explícitos
- Usar `type` para uniones y `interface` para objetos

### React
- Componentes funcionales con hooks
- Props tipadas con interfaces
- Usar custom hooks para lógica reutilizable

### Estilos
- Tailwind CSS para estilos
- Clases utilitarias sobre CSS custom
- Responsive design (mobile-first)

### Estructura de archivos
```
feature/
├── components/
│   └── FeatureComponent.tsx
├── hooks/
│   └── useFeature.ts
├── services/
│   └── feature.service.ts
├── types/
│   └── feature.types.ts
└── __tests__/
    └── FeatureComponent.test.tsx
```

## 📝 Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

### Formato
```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[pie opcional]
```

### Tipos permitidos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan funcionalidad)
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Añadir o modificar tests
- `chore`: Cambios en el proceso de build o herramientas
- `revert`: Revertir un commit anterior

### Ejemplos:
```bash
feat(auth): add JWT refresh token functionality
fix(scheduling): resolve conflict detection issue
docs(readme): update installation instructions
```

## 🔀 Pull Requests

### Antes de crear un PR:
1. Actualiza tu rama con main: `git pull origin main`
2. Resuelve cualquier conflicto
3. Ejecuta los tests: `npm run test`
4. Ejecuta el linter: `npm run lint`
5. Verifica los tipos: `npm run typecheck`

### Descripción del PR:
```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Los tests pasan
- [ ] El código sigue los estándares del proyecto
- [ ] La documentación ha sido actualizada
- [ ] No hay console.logs innecesarios

## Screenshots (si aplica)
```

## 🧪 Testing

### Escribir tests para:
- Componentes nuevos
- Hooks personalizados
- Servicios y utilidades
- Casos edge

### Estructura de tests:
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { /* ... */ }
    
    // Act
    render(<Component {...props} />)
    
    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Coverage mínimo:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## 🐛 Reportar Bugs

Usa las plantillas de issues en GitHub para reportar bugs, incluyendo:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si es relevante
- Información del entorno

## 💡 Sugerir Funcionalidades

Para sugerir nuevas funcionalidades:
1. Verifica que no exista un issue similar
2. Crea un issue con la etiqueta `enhancement`
3. Describe el caso de uso
4. Explica la solución propuesta

## ❓ Preguntas

Si tienes preguntas:
1. Revisa la documentación existente
2. Busca en issues cerrados
3. Crea un issue con la etiqueta `question`

¡Gracias por contribuir a Schedium! 🎉