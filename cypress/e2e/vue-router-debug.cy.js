describe('Vue Router Debug', () => {
  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      cy.spy(win.console, 'log').as('consoleLog')
      cy.spy(win.console, 'error').as('consoleError')
    })
    
    cy.loginWithOrg('E2E Test Organization')
  })

  it('Debe cargar el módulo con router', () => {
    // Interceptar carga del módulo
    cy.intercept('GET', '**/index-vue-router.js').as('loadModule')
    cy.intercept('GET', '**/InventarioRouter.js').as('loadRouter')
    cy.intercept('GET', '**/DashboardPage.js').as('loadDashboard')
    
    // Click en inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Verificar que los archivos se cargan
    cy.wait('@loadModule').then((interception) => {
      cy.log('Module loaded:', interception.response.statusCode)
    })
    
    // Esperar un poco
    cy.wait(2000)
    
    // Verificar errores
    cy.get('@consoleError').then((spy) => {
      const calls = spy.getCalls()
      if (calls.length > 0) {
        calls.forEach(call => {
          cy.log('Console error:', call.args.join(' '))
        })
      }
    })
    
    // Verificar contenido
    cy.get('#appContainer').then($el => {
      cy.log('Container HTML:', $el.html().substring(0, 500))
    })
    
    // Tomar screenshot
    cy.screenshot('vue-router-loading-state')
  })
})