describe('Vue Basic - Con Store', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.contains('Inventario Vue - Basic', {timeout: 5000}).should('exist')
  })

  it('Debe mostrar la aplicación Vue con store', () => {
    // Verificar elementos básicos
    cy.contains('Inventario Vue - Basic').should('exist')
    cy.contains('Organización: e2e_test_organization').should('exist')
    cy.contains('Vista: dashboard').should('exist')
    
    // Verificar vista inicial
    cy.get('.inventario-dashboard-view').should('exist')
    cy.contains('Dashboard de Inventario').should('exist')
  })

  it('Debe cambiar entre vistas usando el store', () => {
    // Estado inicial
    cy.contains('Vista: dashboard').should('exist')
    cy.get('.inventario-dashboard-view').should('exist')
    
    // Cambiar vista
    cy.contains('button', 'Cambiar Vista').click()
    
    // Verificar cambio
    cy.contains('Vista: inventario').should('exist')
    cy.get('.inventario-list-view').should('exist')
    cy.contains('Lista de Inventario').should('exist')
    
    // Cambiar de vuelta
    cy.contains('button', 'Cambiar Vista').click()
    cy.contains('Vista: dashboard').should('exist')
    cy.get('.inventario-dashboard-view').should('exist')
  })

  it('Debe mantener Vuex funcionando', () => {
    cy.window().then((win) => {
      // Verificar que el store existe
      expect(win.Vuex).to.exist
      
      // El store debería estar disponible en el contexto de Vue
      cy.get('#inventario-vue-root').then(() => {
        // Cambiar vista varias veces para verificar que el store funciona
        for (let i = 0; i < 3; i++) {
          cy.contains('button', 'Cambiar Vista').click()
          cy.wait(100)
        }
        
        // Debería terminar en dashboard (3 cambios desde dashboard)
        cy.contains('Vista: dashboard').should('exist')
      })
    })
  })
})