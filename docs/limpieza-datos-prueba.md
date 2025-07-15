# Gestión de Datos de Prueba E2E

## Actualización: Datos Precargados

A partir de ahora, los tests E2E utilizan datos precargados que se copian automáticamente antes de cada ejecución. Esto hace los tests más rápidos y consistentes.

### Estructura de Datos Precargados

Los datos de prueba están en `cypress/fixtures/test-data/e2e_test_organization/`:

- **inventario.json**: 5 activos de diferentes tipos
- **impactos.json**: 3 impactos (pendientes y procesados)
- **madurez_assessments.json**: 2 evaluaciones de madurez

### Flujo Automático

Cuando ejecutas `npm run test:e2e`:

1. **Limpia** todas las organizaciones de prueba existentes
2. **Copia** los datos precargados a `data/e2e_test_organization`
3. **Ejecuta** los tests con datos consistentes

# Limpieza de Datos de Prueba E2E

## Descripción

Durante la ejecución de tests E2E, se crean organizaciones de prueba que pueden acumularse con el tiempo. Este documento describe cómo mantener limpio el entorno de desarrollo.

## Patrones de Organizaciones de Prueba

Las organizaciones de prueba se identifican por los siguientes patrones:
- `e2e_*` - Organizaciones creadas por tests E2E
- `test_*` - Organizaciones de prueba general
- `*_test` - Sufijo de prueba
- `test_nav_org_*` - Creadas por tests de navegación
- `test_cambio_org*` - Creadas por tests de cambio de organización
- `*cypress*` - Creadas por Cypress

## Herramientas de Limpieza

### 1. Script Python Principal

```bash
python claude_tools/limpiar_datos_e2e.py [opciones]
```

**Opciones:**
- `--dry-run`: Muestra qué se eliminaría sin hacerlo realmente
- `--verbose` o `-v`: Muestra información detallada
- `--force` o `-f`: No pide confirmación
- `--backup`: Crea backup antes de eliminar
- `--data-dir`: Directorio de datos (default: `data`)

**Ejemplos:**

```bash
# Ver qué se eliminaría
python claude_tools/limpiar_datos_e2e.py --dry-run

# Limpiar con confirmación
python claude_tools/limpiar_datos_e2e.py

# Limpiar sin confirmación
python claude_tools/limpiar_datos_e2e.py --force

# Limpiar con backup
python claude_tools/limpiar_datos_e2e.py --backup
```

### 2. Script Shell Rápido

```bash
./clean_test_data.sh
```

Este script activa el entorno virtual y ejecuta la limpieza forzada.

### 3. Integración con NPM

Los tests E2E ahora incluyen limpieza automática:

```bash
# Ejecuta limpieza + tests
npm run test:e2e

# Ejecuta limpieza + tests con navegador visible
npm run test:e2e:headed

# Solo limpieza
npm run clean:test
```

## Flujo de Trabajo Recomendado

### Durante Desarrollo

1. **Antes de ejecutar tests**:
   ```bash
   ./clean_test_data.sh
   ```

2. **Ejecutar tests con limpieza automática**:
   ```bash
   npm run test:e2e
   ```

### Mantenimiento Regular

1. **Ver estado actual**:
   ```bash
   python claude_tools/limpiar_datos_e2e.py --dry-run --verbose
   ```

2. **Limpiar con backup**:
   ```bash
   python claude_tools/limpiar_datos_e2e.py --backup
   ```

## Organizaciones de Producción

El script preserva automáticamente las organizaciones que NO coinciden con los patrones de prueba. Estas se consideran organizaciones de producción o desarrollo válidas.

## Integración CI/CD

En GitHub Actions, la limpieza se puede agregar antes de los tests:

```yaml
- name: Limpiar datos de prueba
  run: python claude_tools/limpiar_datos_e2e.py --force

- name: Ejecutar tests E2E
  run: npm run cypress:run
```

## Solución de Problemas

### Error: "El directorio data no existe"
Asegúrate de estar en el directorio raíz del proyecto.

### Error: "Permission denied"
Ejecuta con permisos adecuados o verifica que el script sea ejecutable:
```bash
chmod +x clean_test_data.sh
chmod +x claude_tools/limpiar_datos_e2e.py
```

### Recuperar datos eliminados
Si usaste `--backup`, los datos están en el directorio `backups/`.

## Mejoras Futuras

1. Configurar edad máxima para organizaciones de prueba
2. Limpieza automática programada
3. Integración con hooks de Git
4. Métricas de uso de espacio