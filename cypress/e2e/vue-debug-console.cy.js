describe('Vue Debug con Console', () => {
  beforeEach(() => {
    // Capturar logs de consola
    cy.on('window:before:load', (win) => {
      cy.spy(win.console, 'log').as('consoleLog')
      cy.spy(win.console, 'error').as('consoleError')
    })
    
    cy.loginWithOrg('E2E Test Organization')
  })

  it('Debe mostrar errores al cargar Vue', () => {
    // Interceptar carga del módulo
    cy.intercept('GET', '**/index-vue-simple.js').as('loadVueModule')
    
    // Hacer clic en inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Esperar carga del módulo
    cy.wait('@loadVueModule', { timeout: 10000 }).then((interception) => {
      cy.log('Module URL:', interception.request.url)
      cy.log('Status:', interception.response.statusCode)
    })
    
    // Dar tiempo para que se ejecute
    cy.wait(3000)
    
    // Verificar logs
    cy.get('@consoleLog').then((spy) => {
      const calls = spy.getCalls()
      calls.forEach(call => {
        cy.log('Console log:', call.args.join(' '))
      })
    })
    
    cy.get('@consoleError').then((spy) => {
      const calls = spy.getCalls()
      calls.forEach(call => {
        cy.log('Console error:', call.args.join(' '))
      })
    })
    
    // Verificar contenido del contenedor
    cy.get('#appContainer').then($el => {
      cy.log('Container content:', $el.text())
      cy.log('Container HTML:', $el.html().substring(0, 200))
    })
    
    // Tomar screenshot
    cy.screenshot('vue-loading-state')
  })
})