# Búsqueda Mejorada en Grupos Académicos

## Cambios Implementados

### Backend - Repositorio Academic
**Archivo**: `app/repositories/academic.py`

- Actualizado el método `search_groups()` para incluir búsqueda en:
  - ✅ Número de ficha (`StudentGroup.group_number`)
  - ✅ Nombre del programa (`Program.name`)  
  - ✅ Código de nomenclatura (`Nomenclature.code`)
  - ✅ Nombre de jornada (`Schedule.name`)
  - ✅ Tipo de nivel (`Level.study_type`)

### Backend - Endpoint API
**Archivo**: `app/api/v1/endpoints/academic.py`

- Actualizada la descripción del parámetro `search` para reflejar las nuevas capacidades

### Funcionalidad

La búsqueda ahora permite encontrar grupos académicos por cualquiera de estos campos:

1. **Número de ficha**: `2740419`
2. **Nombre del programa**: `Análisis y Desarrollo`
3. **Código de nomenclatura**: `ADSI`, `CONT`, `ING`
4. **Jornada**: `Mañana`, `Tarde`, `Noche`
5. **Nivel**: `Técnico`, `Tecnólogo`

### Ejemplo de Uso

```bash
# Buscar por nomenclatura
GET /api/v1/academic/groups?search=ADSI

# Buscar por jornada
GET /api/v1/academic/groups?search=Mañana

# Buscar por nivel
GET /api/v1/academic/groups?search=Tecnólogo

# Buscar por nombre de programa
GET /api/v1/academic/groups?search=Sistemas
```

## Reinicio Requerido

Después de estos cambios, es necesario reiniciar el servicio API para aplicar las modificaciones:

```bash
docker-compose restart api
```