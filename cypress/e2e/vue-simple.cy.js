describe('Vue Simple - Debug', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
  })

  it('Debe cargar Vue correctamente', () => {
    
    // Verificar que Vue y Vuex están cargados
    cy.window().then((win) => {
      cy.log('Verificando Vue...')
      expect(win.Vue).to.exist
      expect(win.Vue.version).to.exist
      cy.log(`Vue version: ${win.Vue.version}`)
      
      cy.log('Verificando Vuex...')
      expect(win.Vuex).to.exist
    })
    
    // Hacer clic en inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Esperar un poco para ver logs en consola
    cy.wait(2000)
    
    // Verificar que aparece algo de Vue
    cy.contains('Inventario Vue').should('exist')
  })
})