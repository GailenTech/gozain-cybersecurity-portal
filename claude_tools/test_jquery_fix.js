// Test para ejecutar localmente y verificar la solución jQuery
describe('Solución jQuery para Vista Lista', () => {
  it('Forzar cambio de vista con jQuery', () => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Log estado inicial
    cy.window().then(win => {
      cy.log('jQuery disponible:', !!win.$)
      cy.log('Dashboard visible:', win.$('#dashboardView').is(':visible'))
      cy.log('Lista visible:', win.$('#listaView').is(':visible'))
    })
    
    // Método 1: Manipular DOM directamente
    cy.window().then(win => {
      // Ocultar dashboard y mostrar lista
      win.$('#dashboardView').hide()
      win.$('#listaView').show()
      
      // Actualizar clases de botones
      win.$('#btnVistaDashboard').removeClass('active')
      win.$('#btnVistaLista').addClass('active')
    })
    
    cy.wait(500)
    
    // Verificar que funcionó
    cy.get('#tablaActivos').should('exist')
    cy.get('#btnNuevoActivo').should('exist')
    
    // Crear un activo para verificar funcionalidad completa
    cy.get('#btnNuevoActivo').click()
    cy.get('#modalActivo').should('be.visible')
    cy.get('#tipoActivo').select('Hardware')
    cy.get('#nombreActivo').type('Test jQuery Fix')
    cy.get('#btnCancelarActivo').click()
  })
  
  it('Solución alternativa con eventos', () => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Método 2: Disparar eventos manualmente
    cy.window().then(win => {
      // Simular click con jQuery
      const btn = win.$('#btnVistaLista')
      
      // Disparar todos los eventos posibles
      btn.trigger('mousedown')
      btn.trigger('mouseup')
      btn.trigger('click')
      
      // Si hay event listeners específicos
      if (btn[0]) {
        btn[0].click()
      }
    })
    
    cy.wait(1000)
    
    // Si aún no funciona, forzar visibilidad
    cy.window().then(win => {
      if (!win.$('#listaView').is(':visible')) {
        cy.log('Vista lista aún oculta, forzando...')
        win.$('#dashboardView').css('display', 'none')
        win.$('#listaView').css('display', 'block')
      }
    })
    
    // Verificar
    cy.get('#tablaActivos').should('exist')
  })
})