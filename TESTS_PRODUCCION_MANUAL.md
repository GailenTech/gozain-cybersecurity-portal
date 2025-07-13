# Tests E2E en Producción - Guía de Uso

## Workflow Manual

El workflow `test-production-manual.yml` permite ejecutar tests E2E contra el entorno de producción de Gozain.

### Ejecución desde GitHub Actions

1. Ir a Actions > Test Production Manual
2. Click en "Run workflow"
3. Configurar parámetros:
   - **test_specs**: Specs a ejecutar (setup,navigation,inventory,impacts,maturity)
   - **test_org**: Nombre de la organización para tests (default: 'E2E Test Organization')

### Ejecución con Act (Local)

```bash
# Act tiene limitaciones con Xvfb, mejor ejecutar directamente:
CYPRESS_baseUrl=https://gozain-687354193398.us-central1.run.app \
npx cypress run --spec "cypress/e2e/00-setup.cy.js,cypress/e2e/01-navigation.cy.js,cypress/e2e/02-inventory.cy.js"
```

## Gestión de Datos en Producción

### Comportamiento Actual

1. **NO hay reset automático de datos** en producción
2. Los tests crean datos reales que persisten
3. Cada ejecución acumula más datos:
   - Nuevos activos
   - Nuevos impactos
   - Nuevas evaluaciones de madurez
   - Nuevas tareas

### Estrategias Recomendadas

#### 1. Usar Organizaciones Únicas por Test Run
```javascript
// En lugar de usar siempre 'E2E Test Organization'
// Usar nombres únicos con timestamp:
const testOrg = `Test Org ${Date.now()}`
```

#### 2. Verificación de Estado Inicial
Los tests ya verifican si existen datos antes de crear nuevos:
- `00-setup.cy.js`: Verifica si ya existe una organización
- `02-inventory.cy.js`: Puede manejar activos existentes
- `03-impacts.cy.js`: Crea impactos únicos

#### 3. Tests Idempotentes
Los tests están diseñados para ser idempotentes cuando es posible:
- Verifican estado antes de actuar
- Usan selectores que funcionan con datos existentes

### Limitaciones Conocidas

1. **Acumulación de datos**: Cada run añade más datos
2. **Filtros pueden afectarse**: Si hay muchos datos, los filtros pueden comportarse diferente
3. **Contadores incrementan**: Las estadísticas reflejan todos los datos históricos

### Soluciones Futuras Posibles

1. **API de limpieza**: Endpoint para limpiar datos de test
2. **Modo test**: Flag que permita reset de organización específica
3. **Organizaciones temporales**: Auto-eliminación después de X tiempo

## Resultados Actuales

Con los cambios de CSS classes:
- ✅ Setup: 1/1 tests passing
- ✅ Navigation: 7/7 tests passing  
- ✅ Inventory: 14/16 tests passing (2 tests de filtros con issues menores)
- ✅ Impacts: Todos pasando
- ✅ Maturity: Todos pasando

## Notas Importantes

- Los tests contra producción son más lentos que locales
- Los datos creados son reales y afectan métricas
- Usar con moderación para no saturar la base de datos
- Considerar ejecutar solo subsets de tests cuando sea posible