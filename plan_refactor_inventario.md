# Plan de Refactor: Inventario Dashboard vs Lista

## Rama: `refactor/inventario-dashboard-lista`

## Estado Actual
- [x] Plan creado
- [x] Backup realizado
- [x] Rama creada
- [x] Refactor implementado
- [x] Tests adaptados
- [ ] Tests ejecutados y verificados
- [ ] PR creado

## Archivos modificados
1. `/apps/inventario/index.js` - ✅ Refactor completo
2. `/cypress/e2e/02-inventory.cy.js` - ✅ Tests adaptados
3. `/cypress/support/commands.js` - ✅ switchView eliminado

## Cambios principales
- Dashboard y Lista son vistas completamente independientes
- Navegación a través del menú lateral (no botones de vista)
- Filtros solo en vista lista
- Estadísticas y gráficos solo en dashboard
- Modales se navegan a lista si es necesario

## Próximos pasos
1. Ejecutar tests localmente
2. Verificar 100% passing
3. Deploy a producción
4. Crear PR para merge a main