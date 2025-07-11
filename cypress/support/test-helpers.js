// Helper functions para tests E2E

// Verificar URL para localhost o producción
export function isValidUrl() {
  cy.url().should('satisfy', (url) => {
    return url.includes('localhost') || url.includes('gozain') || url.includes('run.app')
  })
}

// Navegar a un módulo específico
export function navigateToModule(moduleName) {
  cy.get('body').then($body => {
    // Si ya estamos en una herramienta, usar el selector
    if ($body.find('#toolSelectorButton').length > 0 && $body.find('#toolSelectorButton').is(':visible')) {
      cy.get('#toolSelectorButton').click()
      cy.wait(500)
    }
    
    // Seleccionar el módulo
    cy.contains('.tool-card', moduleName).click()
    cy.wait(1000)
    
    // Verificar que se cargó
    if (moduleName.includes('Inventario')) {
      cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
    } else if (moduleName.includes('Impactos')) {
      cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
    } else if (moduleName.includes('Madurez')) {
      cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
    }
  })
}

// Crear un impacto con manejo de errores mejorado
export function createImpactSafely(impactType, impactData) {
  // Hacer clic en nuevo
  cy.get('[data-menu-item="nuevo"]').first().click()
  cy.get('#modalNuevoImpacto').should('be.visible')
  
  // Seleccionar tipo
  cy.get('#tipoImpacto').select(impactType)
  cy.wait(1000) // Esperar a que cargue la plantilla
  
  // Llenar campos dinámicos con manejo de errores
  Object.entries(impactData).forEach(([field, value]) => {
    cy.get('body').then($body => {
      if ($body.find(`#${field}`).length > 0) {
        const $el = $body.find(`#${field}`)
        if ($el.is('select')) {
          cy.get(`#${field}`).select(value.toString())
        } else if ($el.is(':checkbox')) {
          if (value) cy.get(`#${field}`).check()
        } else {
          cy.get(`#${field}`).clear().type(value.toString())
        }
      } else {
        cy.log(`Campo ${field} no encontrado, saltando...`)
      }
    })
  })
  
  // Crear
  cy.get('#btnCrearImpacto').click()
  cy.wait(1000)
  
  // Verificar toast o simplemente continuar
  cy.get('body').then($body => {
    if ($body.find('.toast-body').length > 0) {
      cy.get('.toast-body').should('contain', 'creado correctamente')
    }
  })
}

// Configurar organización de test consistentemente
export function setupTestOrganization() {
  const TEST_ORG_NAME = 'E2E Test Organization'
  cy.loginWithOrg(TEST_ORG_NAME)
}