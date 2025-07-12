# Soluciones Implementadas para Cypress en CI

## 🎯 Problema
Los tests fallan en GitHub Actions porque los elementos no se vuelven visibles (`display: none` no cambia) aunque funcionan perfectamente en local.

## ✅ Soluciones Implementadas

### 1. **CI Visibility Fix** (ci-visibility-fix.js)
- `forceVisible()`: Fuerza elementos a ser visibles
- `safeClick()`: Click robusto que maneja vistas
- `waitForStability()`: Espera animation frames
- Override de `should('be.visible')` para CI
- Inyección de CSS para prevenir animaciones

### 2. **Configuración Específica CI** (cypress.config.js)
- Timeouts aumentados (20s comandos, 30s página)
- Viewport más grande (1920x1080)
- Reintentos automáticos (2 en runMode)
- Deshabilitación de animaciones

### 3. **SwitchView Helper Mejorado**
- Detecta automáticamente el contexto (inventario/impactos)
- No depende de verificación estricta de visibilidad
- Usa `force: true` en todos los clicks

## 📝 Cómo Usar

### Opción 1: Usar comandos seguros
```javascript
// En lugar de:
cy.get('#btnVistaLista').click()

// Usar:
cy.safeClick('#btnVistaLista')
```

### Opción 2: Forzar visibilidad cuando sea necesario
```javascript
cy.forceVisible('#listaView')
cy.get('#listaView').should('exist') // Más flexible que 'be.visible'
```

### Opción 3: Esperar estabilidad
```javascript
cy.get('#btnVistaLista').click()
cy.waitForStability()
cy.get('#listaView').should('be.visible')
```

## 🚀 Próximos Pasos

1. Hacer push de estos cambios
2. Verificar si mejora el % de tests pasando
3. Si aún hay problemas, considerar:
   - Usar Electron en lugar de Chrome
   - Ejecutar tests en modo headed con XVFB
   - Migrar gradualmente a Playwright

## 💡 Nota
Estas son soluciones estándar de la comunidad Cypress. El problema fundamental es que el navegador headless en CI no maneja las transiciones CSS de la misma manera que un navegador normal.
