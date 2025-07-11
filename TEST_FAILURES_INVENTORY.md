# Inventario de Fallos en Tests E2E

## Metodología
Ejecutar cada archivo de test individualmente y documentar:
1. Nombre del test
2. Número de tests que pasan/fallan
3. Descripción específica de cada fallo
4. Causa probable
5. Solución propuesta

## Estado por Archivo de Test

### ✅ 00-setup.cy.js
- **Estado**: 1/1 pasando (100%)
- **Tiempo**: 4s

### ✅ 00-test-setup.cy.js  
- **Estado**: 5/5 pasando (100%)
- **Tiempo**: 31s

### ✅ 01-navigation-fixed.cy.js
- **Estado**: 7/7 pasando (100%)
- **Tiempo**: 54s

### ❌ 01-navigation.cy.js
- **Estado**: 1/7 pasando (14%)
- **Fallos**: Test desactualizado, no usa comandos modernos como loginWithOrg

### ❌ 02-inventory.cy.js
- **Estado**: 14/16 pasando (88%)
- **Fallos**: 
  1. "Debe editar un activo existente" - No se actualiza la tabla después de editar
  2. "Debe navegar entre opciones del menú" - Modal no se cierra correctamente

### ❌ 03-impacts.cy.js
- **Estado**: 6/16 pasando (38%)
- **Fallos**: Importación incorrecta corregida, pero varios tests fallan

### ❌ 04-integration.cy.js
- **Estado**: 0/10 pasando (0%)
- **Fallos**: Importación incorrecta corregida, pendiente re-ejecutar

### ❌ 05-tasks.cy.js
- **Estado**: 0/10 pasando (0%)
- **Fallos**: No encuentra campo necesita_equipo en formulario de impacto

### ❌ 06-full-journey.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 07-reported-issues.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 07-tasks-issues-simple.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 08-tasks-working.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 09-maturity-module.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 10-maturity-questionnaire-navigation.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 11-maturity-simple-test.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 12-maturity-navigation-fix-validation.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 13-maturity-navigation-final-check.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 14-business-processes-personal.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 15-business-processes-projects.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 16-business-processes-infrastructure.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 17-business-processes-security.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 18-business-processes-crisis.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

### ❌ 19-all-business-processes.cy.js
- **Estado**: Por ejecutar
- **Fallos**: TBD

## Resumen Total
- **Total de archivos**: 23
- **Archivos pasando 100%**: 3
- **Archivos con fallos**: 20
- **Objetivo**: 23/23 archivos al 100%

## Patrones de Fallos Comunes
1. **Importaciones incorrectas**: Muchos tests importan funciones de `test-helpers` que no existe
2. **Elementos no encontrados**: Tests buscan elementos que no existen en el DOM
3. **Modales no se cierran**: Interfieren con clicks en otros elementos
4. **Cambios no se reflejan**: Actualizaciones en tablas/listas no aparecen inmediatamente