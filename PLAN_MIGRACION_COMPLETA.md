# Plan de Migración Completa - Sistema Gozain

**Fecha inicio**: 14 julio 2025, 22:50
**Objetivo**: Migrar completamente todas las aplicaciones a Vue 3 con tests automáticos en GitHub Actions

## Fase 1: Despliegue y Validación Actual (30 min)
1. **Merge a main y despliegue**
   - Merge de `migration/vue-inventario` a `main`
   - Activar despliegue automático en GCP
   - Validar que inventario funciona en producción

2. **Tests en producción**
   - Ejecutar tests de inventario contra URL de producción
   - Validar URLs recargables en producción
   - Confirmar estado persistente en producción

## Fase 2: Migración de Impactos de Negocio (2-3 horas)
1. **Análisis de funcionalidad existente**
   - Revisar estructura actual en `/apps/impactos`
   - Documentar componentes: dashboard, lista, formularios
   - Analizar tests existentes como especificación

2. **Migración a Vue 3**
   - Crear estructura Vue similar a inventario
   - Implementar páginas: DashboardPage, ImpactosPage, ProcesarPage
   - Migrar componentes: modales, formularios, gráficos
   - Implementar Vue Router con rutas hash

3. **Tests actualizados**
   - Crear tests basados en los existentes (03-impacts.cy.js)
   - Validar: navegación, creación de impactos, procesamiento
   - Tests sin cy.wait() usando esperas implícitas

## Fase 3: Migración de Madurez en Ciberseguridad (2-3 horas)
1. **Análisis de funcionalidad existente**
   - Revisar estructura actual en `/apps/madurez`
   - Documentar cuestionarios y evaluaciones
   - Analizar 5 tests existentes como especificación

2. **Migración a Vue 3**
   - Crear estructura Vue siguiendo patrón establecido
   - Implementar páginas: DashboardPage, CuestionarioPage, HistorialPage
   - Migrar lógica de cuestionarios y scoring
   - Implementar Vue Router con navegación entre evaluaciones

3. **Tests actualizados**
   - Crear tests basados en existentes (09-maturity-*.cy.js)
   - Validar: navegación de cuestionarios, evaluaciones, persistencia
   - Cobertura completa de flujos críticos

## Fase 4: Limpieza y Consolidación (1 hora)
1. **Eliminar código obsoleto**
   - Remover archivos de respaldo de inventario
   - Limpiar tests obsoletos de apps migradas
   - Actualizar registros de aplicaciones en shell

2. **Validación completa**
   - Ejecutar todos los tests nuevos localmente
   - Validar navegación entre todas las apps
   - Confirmar URLs persistentes en todas las apps

## Fase 5: GitHub Actions Completo (1 hora)
1. **Crear workflow de tests**
   - Nuevo workflow que ejecute tests de todas las apps
   - Configuración optimizada sin cy.wait()
   - Tests en paralelo por módulo

2. **Probar con act**
   - Validar workflow localmente con act
   - Ajustar configuración si es necesario
   - Confirmar que todos los tests pasan

3. **Integrar en deploy**
   - Añadir job de tests al workflow de deploy
   - Tests como prerequisito para despliegue
   - Notificaciones de estado

## Criterios de Éxito Por App
- ✅ Vue 3 + Composition API implementado
- ✅ Vue Router con URLs hash funcionando
- ✅ Estado persistente entre recargas
- ✅ Modales abren/cierran correctamente
- ✅ Menú lateral funcional
- ✅ Tests E2E completos sin cy.wait()
- ✅ Funcionalidad original preservada
- ✅ UI limpia sin elementos redundantes

## Entregables Finales
- 3 aplicaciones completamente migradas a Vue 3
- Suite completa de tests E2E (≈15-20 tests)
- GitHub Actions con tests automáticos
- Documentación actualizada
- Sistema completamente funcional en producción

**Timeline Total**: 6-8 horas
**Fecha objetivo finalización**: 15 julio 2025, 07:00