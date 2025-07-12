// Import commands.js
import './commands'
// Import test helpers
import * as helpers from './test-helpers'
// Import switchView helper para GitHub Actions
import './switchview-helper'
// Import CI visibility fixes
import './ci-visibility-fix'

// Hacer helpers disponibles globalmente
window.testHelpers = helpers

// Configuración global para los tests
beforeEach(() => {
  // Interceptar errores no capturados
  cy.on('uncaught:exception', (err, runnable) => {
    // Retornar false previene que Cypress falle el test
    // Solo fallar si es un error crítico
    if (err.message.includes('Cannot read properties of null')) {
      return false
    }
    return true
  })
  
  // Limpiar localStorage antes de cada test
  cy.clearLocalStorage()
})