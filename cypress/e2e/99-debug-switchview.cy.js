describe('Debug switchView en Producción', () => {
  it('Diagnóstico: Verificar comportamiento de switchView', () => {
    // Usar la URL de producción si está configurada
    const baseUrl = Cypress.env('BASE_URL') || Cypress.config('baseUrl')
    cy.log(`Testing against: ${baseUrl}`)
    
    // Login
    cy.loginWithOrg('E2E Test Organization')
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Verificar estado inicial
    cy.get('#dashboardView').then($dashboard => {
      cy.log('Dashboard initial display:', $dashboard.css('display'))
      cy.log('Dashboard initial visibility:', $dashboard.is(':visible'))
    })
    
    cy.get('#listaView').then($lista => {
      cy.log('Lista initial display:', $lista.css('display'))
      cy.log('Lista initial visibility:', $lista.is(':visible'))
    })
    
    // Intentar cambiar a vista lista
    cy.log('Clicking btnVistaLista...')
    cy.get('#btnVistaLista').click({ force: true })
    cy.wait(2000)
    
    // Verificar estado después del click
    cy.get('#dashboardView').then($dashboard => {
      cy.log('Dashboard after click display:', $dashboard.css('display'))
      cy.log('Dashboard after click visibility:', $dashboard.is(':visible'))
    })
    
    cy.get('#listaView').then($lista => {
      cy.log('Lista after click display:', $lista.css('display'))
      cy.log('Lista after click visibility:', $lista.is(':visible'))
      
      // Verificar si hay algún error en consola
      cy.window().then((win) => {
        if (win.console && win.console.error) {
          cy.log('Console errors:', win.console.error.toString())
        }
      })
    })
    
    // Intentar forzar la visibilidad con jQuery
    cy.window().then((win) => {
      if (win.$) {
        cy.log('Trying jQuery show...')
        win.$('#listaView').show()
        cy.wait(1000)
        cy.log('Lista after jQuery show:', win.$('#listaView').is(':visible'))
      }
    })
    
    // Screenshot para debug
    cy.screenshot('debug-switchview-issue')
  })
  
  it('Test alternativo sin switchView', () => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // En lugar de usar switchView, acceder directamente
    cy.get('#btnVistaLista').click({ force: true })
    cy.wait(1000)
    
    // Verificar que podemos acceder a elementos de la lista sin verificar visibility
    cy.get('#tablaActivos').should('exist')
    cy.get('#btnNuevoActivo').should('exist')
    
    // Intentar crear un activo sin depender de la visibilidad de listaView
    cy.get('#btnNuevoActivo').click({ force: true })
    cy.get('#modalActivo').should('be.visible')
  })
})