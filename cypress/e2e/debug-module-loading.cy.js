describe('Debug Module Loading', () => {
  it('Debe verificar que el módulo se carga', () => {
    cy.visit('http://localhost:8080')
    
    // Login con organización
    cy.loginWithOrg('E2E Test Organization')
    
    // Interceptar la carga del módulo
    cy.intercept('GET', '/apps/inventario/index-vue-simple.js').as('loadModule')
    
    // Hacer clic en inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Verificar que el módulo se carga
    cy.wait('@loadModule').then((interception) => {
      cy.log('Module loaded:', interception.request.url)
      expect(interception.response.statusCode).to.equal(200)
    })
    
    // Esperar un poco y verificar el contenido
    cy.wait(2000)
    
    // Tomar screenshot para ver qué se renderiza
    cy.screenshot('module-loaded-state')
    
    // Verificar el contenedor
    cy.get('#appContainer').should('be.visible')
    cy.get('#appContainer').then($el => {
      cy.log('Container HTML:', $el.html())
    })
  })
})