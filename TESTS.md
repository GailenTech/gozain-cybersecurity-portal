# Suite de Tests E2E - Sistema Gozain

## Descripción General

Este documento describe la suite completa de tests end-to-end (E2E) implementada con Cypress para validar todas las funcionalidades del sistema Gozain.

## Estructura de Tests

### 1. Setup Inicial (`00-setup.cy.js`)
- Verificación de la aplicación
- Configuración inicial del entorno de tests
- Limpieza de datos previos

### 2. Navegación General (`01-navigation.cy.js`)
- Gestión de organizaciones
- Cambio entre herramientas
- Navegación por menús
- Persistencia de estado

### 3. Módulo de Inventario (`02-inventory.cy.js`)
- CRUD de activos
- Filtrado y búsqueda
- Importación/exportación
- Vista dashboard vs lista

### 4. Módulo de Impactos (`03-impacts.cy.js`)
- Creación de impactos
- Procesamiento de impactos
- Vista de timeline
- Integración con inventario

### 5. Tests de Integración (`04-integration.cy.js`)
- Flujo entre módulos
- Sincronización de datos
- Notificaciones entre apps

### 6. Gestión de Tareas (`05-tasks.cy.js`)
- Visualización de tareas
- Completar tareas individuales
- Acciones masivas
- Integración con impactos

### 7. Flujo Completo (`06-full-journey.cy.js`)
- User journey completo
- Desde crear organización hasta completar tareas
- Validación de persistencia

### 8. Problemas Reportados (`07-reported-issues.cy.js`)
- Tests específicos para problemas conocidos
- Documentación de funcionalidades faltantes
- Casos de uso no implementados

## Ejecutar Tests

### Entorno Local

```bash
# Prerequisito: Servidor corriendo en localhost:8080
./test_local.sh

# En otra terminal:

# Ejecutar todos los tests
./run-tests-local.sh

# Modo interactivo (con interfaz gráfica)
./run-tests-local.sh --headed

# Test específico
./run-tests-local.sh --spec 05-tasks.cy.js

# Solo problemas reportados
./run-tests-local.sh --issues

# Solo gestión de tareas
./run-tests-local.sh --tasks

# Flujo completo
./run-tests-local.sh --journey
```

### Entorno Producción

```bash
# Ejecutar contra producción
./run-tests.sh
```

## Problemas Conocidos

### 1. Gestión de Tareas

#### Completar Tarea Individual
- **Problema**: El botón check muestra mensaje de éxito pero no actualiza el estado
- **Test**: `07-reported-issues.cy.js` - "Completar tarea con el check no funciona"
- **Estado**: No implementado - las tareas se generan dinámicamente

#### Completar Múltiples Tareas
- **Problema**: La acción masiva no persiste cambios
- **Test**: `07-reported-issues.cy.js` - "Completar seleccionadas no persiste"
- **Estado**: Funcionalidad simulada sin backend real

#### Posponer Tareas
- **Problema**: El botón existe pero no tiene funcionalidad
- **Test**: `07-reported-issues.cy.js` - "Botón posponer no tiene funcionalidad"
- **Estado**: UI presente sin lógica implementada

### 2. Persistencia

- Las tareas no se almacenan en el backend
- Se generan dinámicamente desde impactos procesados
- No hay sincronización real entre módulos

### 3. Funcionalidades Faltantes

- No hay edición de tareas
- Sin filtros en vista de tareas
- Sin vista de calendario
- Sin notificaciones de vencimiento
- Sin asignación de responsables

## Estructura de Datos de Test

Los tests utilizan datos predefinidos en `cypress/fixtures/test-data.json`:

```json
{
  "organizations": [...],
  "assets": [...],
  "impacts": {
    "templates": {
      "alta_empleado": {...},
      "baja_empleado": {...},
      "cambio_sistema": {...}
    }
  }
}
```

## Comandos Personalizados

### Cypress Commands (`cypress/support/commands.js`)

- `cy.resetData()` - Limpia todos los datos
- `cy.createTestOrganization()` - Crea organización de prueba
- `cy.selectOrganization(id)` - Selecciona una organización
- `cy.selectTool(toolId)` - Cambia de herramienta
- `cy.createAsset(data)` - Crea un activo
- `cy.createImpact(type, data)` - Crea un impacto

## Mejores Prácticas

1. **Aislamiento**: Cada test debe ser independiente
2. **Limpieza**: Usar `cy.resetData()` en `beforeEach`
3. **Esperas**: Usar comandos Cypress, no `cy.wait(ms)`
4. **Selectores**: Preferir `data-cy` attributes
5. **Aserciones**: Ser específico en las validaciones

## Cobertura de Tests

### Áreas Cubiertas ✅
- Navegación principal
- CRUD básico en ambos módulos
- Filtros y búsquedas
- Cambio entre vistas
- Procesamiento de impactos
- Interfaz de tareas

### Áreas Pendientes ❌
- Autenticación y permisos
- Manejo de errores del servidor
- Validaciones de formularios complejas
- Performance y carga
- Accesibilidad (a11y)
- Responsive design

## Próximos Pasos

1. **Implementar Backend de Tareas**
   - API REST para CRUD de tareas
   - Persistencia en base de datos
   - Estados y transiciones

2. **Mejorar Integración**
   - Webhooks entre módulos
   - Actualización en tiempo real
   - Sistema de notificaciones

3. **Ampliar Cobertura**
   - Tests de accesibilidad
   - Tests de performance
   - Tests de seguridad

## Reportar Problemas

Para reportar nuevos problemas o solicitar features:

1. Ejecutar test específico del área
2. Documentar comportamiento esperado vs actual
3. Agregar test en `07-reported-issues.cy.js`
4. Crear issue en el repositorio

## Mantenimiento

- Actualizar fixtures cuando cambien los datos
- Revisar selectores si cambia el HTML
- Mantener tests independientes
- Documentar nuevos comandos custom