# Suite de Tests E2E para Gozain

## Descripción

Esta suite de tests automatizados utiliza Cypress para validar el funcionamiento completo del sistema Gozain, incluyendo navegación, gestión de inventario, manejo de impactos y flujos de integración.

## Estructura de Tests

```
cypress/
├── e2e/
│   ├── 00-setup.cy.js         # Configuración inicial
│   ├── 01-navigation.cy.js    # Tests de navegación general
│   ├── 02-inventory.cy.js     # Tests del módulo de inventario
│   ├── 03-impacts.cy.js       # Tests del módulo de impactos
│   └── 04-integration.cy.js   # Tests de integración
├── fixtures/
│   └── test-data.json         # Datos de prueba
├── support/
│   ├── commands.js            # Comandos personalizados
│   ├── e2e.js                 # Configuración global
│   └── test-helpers.js        # Funciones auxiliares
└── cypress.config.js          # Configuración de Cypress
```

## Instalación

```bash
npm install
```

## Ejecución de Tests

### Modo Interactivo (con interfaz gráfica)
```bash
npm run cypress:open
```

### Modo Headless (línea de comandos)
```bash
# Ejecutar todos los tests
npm run cypress:run

# Ejecutar contra producción
npm run cypress:run:prod

# Ejecutar contra local
npm run cypress:run:local
```

### Ejecutar tests específicos
```bash
# Solo navegación
npm run cypress:run:prod -- --spec "cypress/e2e/01-navigation.cy.js"

# Solo inventario
npm run cypress:run:prod -- --spec "cypress/e2e/02-inventory.cy.js"
```

### Script completo
```bash
./run-tests.sh
```

## Comandos Personalizados

### `cy.selectOrganization(orgName)`
Selecciona una organización específica o la primera disponible.

### `cy.loginWithOrg(orgName)`
Inicia sesión con una organización y navega al selector de herramientas.

### `cy.navigateToTool(toolName)`
Navega a una herramienta específica desde el selector.

### `cy.createAsset(assetData)`
Crea un nuevo activo con los datos proporcionados.

### `cy.createImpact(impactType, impactData)`
Crea un nuevo impacto del tipo especificado.

### `cy.filterAssets(filters)`
Aplica filtros en la vista de lista de activos.

### `cy.switchView(view)`
Cambia entre vistas (dashboard/lista).

## Helpers

### `ensureOrganizationSelected(orgName)`
Asegura que hay una organización seleccionada antes de continuar.

### `navigateToToolReliably(toolName)`
Navega a una herramienta de forma confiable, manejando diferentes estados.

## Datos de Prueba

Los datos de prueba están en `cypress/fixtures/test-data.json` e incluyen:
- Activos de ejemplo
- Impactos de ejemplo
- Configuraciones de filtros

## Notas Importantes

1. **Timeouts**: Algunos tests pueden tardar debido a animaciones de Bootstrap. Se han agregado waits estratégicos.

2. **Force clicks**: Se usa `{ force: true }` en algunos clicks debido a problemas con modales de Bootstrap.

3. **Estado persistente**: El sistema recuerda la última organización seleccionada, por lo que los tests deben manejar esto.

4. **Orden de ejecución**: Se recomienda ejecutar `00-setup.cy.js` primero para asegurar que existe al menos una organización.

## Troubleshooting

### Modal no visible
Si los tests fallan porque el modal no es visible, verificar:
- Que se esté esperando suficiente tiempo para animaciones
- Usar `{ force: true }` en clicks problemáticos

### Organización no encontrada
Si falla la selección de organización:
- Ejecutar primero el test de setup
- Verificar que existe al menos una organización en el sistema

### Timeouts
Si los tests exceden el tiempo:
- Aumentar timeouts en comandos específicos
- Verificar la velocidad de respuesta del servidor

## Resultados

- **Videos**: Guardados en `cypress/videos/`
- **Screenshots**: Guardados en `cypress/screenshots/` (solo en caso de fallo)
- **Reportes**: Disponibles en la consola al ejecutar los tests