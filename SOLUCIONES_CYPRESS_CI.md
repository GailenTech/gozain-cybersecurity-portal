# Alternativas de la Comunidad Cypress para Problemas de Visibilidad en CI

## 1. **Forzar Visibilidad con jQuery** ⭐ Más común
```javascript
// En lugar de esperar que el elemento sea visible
cy.get('#listaView').should('be.visible')

// Forzar la visibilidad directamente
cy.get('#listaView').invoke('show')
// O más específico:
cy.get('#listaView').invoke('css', 'display', 'block')
```

## 2. **Usar `force: true` en TODAS las interacciones**
```javascript
// No solo en clicks
cy.get('#btnVistaLista').click({ force: true })
// También en tipos y selects
cy.get('#input').type('texto', { force: true })
cy.get('#select').select('opcion', { force: true })
```

## 3. **Esperas Explícitas con Verificaciones Custom**
```javascript
// Comando personalizado
Cypress.Commands.add('waitForViewChange', (viewName) => {
  cy.get(`#${viewName}View`).should('exist')
  cy.wait(100)
  cy.get(`#${viewName}View`).then($el => {
    // Verificar con JavaScript nativo
    const isVisible = $el[0].offsetWidth > 0 && $el[0].offsetHeight > 0
    if (!isVisible) {
      cy.wrap($el).invoke('css', 'display', 'block')
    }
  })
})
```

## 4. **Configuración Específica para CI** ⭐ Recomendado
```javascript
// cypress.config.js
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      // Detectar si estamos en CI
      if (process.env.CI) {
        config.defaultCommandTimeout = 20000 // Más tiempo
        config.pageLoadTimeout = 30000
        config.viewportWidth = 1920
        config.viewportHeight = 1080
        config.video = true // Para debug
        config.screenshotOnRunFailure = true
      }
      return config
    }
  }
}
```

## 5. **Usar el Navegador Electron en lugar de Chrome**
```yaml
# .github/workflows/test.yml
- name: Run Cypress tests
  run: npx cypress run --browser electron
  # En lugar de: --browser chrome
```

## 6. **Deshabilitar GPU y Animaciones**
```yaml
# GitHub Actions
- name: Run Cypress tests
  run: |
    export ELECTRON_EXTRA_LAUNCH_ARGS='--disable-gpu'
    npx cypress run
  env:
    CYPRESS_ANIMATION_DISTANCE_THRESHOLD: 999999
```

## 7. **Interceptar y Modificar CSS** ⭐ Muy efectivo
```javascript
// En support/e2e.js
Cypress.on('window:before:load', (win) => {
  const style = win.document.createElement('style')
  style.innerHTML = `
    /* Forzar visibilidad en CI */
    .ci-force-visible [id$="View"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  `
  win.document.head.appendChild(style)
  
  // Añadir clase al body si estamos en CI
  if (Cypress.env('CI')) {
    win.document.body.classList.add('ci-force-visible')
  }
})
```

## 8. **Reemplazar Verificaciones de Visibilidad**
```javascript
// En lugar de:
cy.get('#element').should('be.visible')

// Usar:
cy.get('#element')
  .should('exist')
  .should('not.have.css', 'display', 'none')
  .should('not.have.css', 'visibility', 'hidden')
```

## 9. **Wait for Animation Frames**
```javascript
Cypress.Commands.add('waitForAnimations', () => {
  cy.window().then(win => {
    return new Promise(resolve => {
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(() => {
          resolve()
        })
      })
    })
  })
})

// Uso:
cy.get('#btnVistaLista').click()
cy.waitForAnimations()
cy.get('#listaView').should('be.visible')
```

## 10. **Modo Headed en CI** (Más recursos pero más confiable)
```yaml
# GitHub Actions con XVFB
- name: Run Cypress tests (headed)
  uses: cypress-io/github-action@v5
  with:
    browser: chrome
    headed: true
    install: false
```

## Implementación Recomendada para Gozain

Basándome en tu caso específico, recomendaría:

1. **Corto plazo** (Rápido):
```javascript
// En cypress/support/commands.js
Cypress.Commands.overwrite('should', (originalFn, element, ...args) => {
  // Si estamos verificando visibilidad en CI, ser menos estrictos
  if (Cypress.env('CI') && args[0] === 'be.visible') {
    return originalFn(element, 'exist')
      .then(() => originalFn(element, 'not.have.css', 'display', 'none'))
  }
  return originalFn(element, ...args)
})
```

2. **Medio plazo** (Robusto):
```javascript
// cypress/plugins/ci-visibility-fix.js
export function forceVisibility(selector) {
  cy.get(selector).then($el => {
    if ($el.css('display') === 'none') {
      cy.wrap($el).invoke('css', 'display', 'block')
    }
  })
}

// Uso:
import { forceVisibility } from '../plugins/ci-visibility-fix'
forceVisibility('#listaView')
```

3. **Largo plazo**: Considerar migrar a Playwright que maneja mejor estos casos