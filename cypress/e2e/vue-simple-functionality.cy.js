describe('Vue Simple - Funcionalidad', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.contains('Inventario Vue - Debug', {timeout: 5000}).should('exist')
  })

  it('Debe mostrar el dashboard por defecto', () => {
    cy.contains('Dashboard').should('exist')
    cy.contains('Vista actual: dashboard').should('exist')
    cy.get('.inventario-dashboard-view').should('exist')
  })

  it('Debe cambiar entre vistas', () => {
    // Verificar dashboard inicial
    cy.get('.inventario-dashboard-view').should('exist')
    
    // Cambiar a lista
    cy.contains('button', 'Ver Lista').click()
    cy.contains('Vista actual: inventario').should('exist')
    cy.get('.inventario-list-view').should('exist')
    cy.contains('Lista de Inventario').should('exist')
    
    // Volver a dashboard
    cy.contains('button', 'Ver Dashboard').click()
    cy.contains('Vista actual: dashboard').should('exist')
    cy.get('.inventario-dashboard-view').should('exist')
  })

  it('Debe mostrar la organización correcta', () => {
    cy.contains('Organización:').parent().should('contain', 'e2e_test_organization')
  })

  it('El botón Test debe funcionar', () => {
    // Stub alert
    cy.window().then(win => {
      cy.stub(win, 'alert').as('alert')
    })
    
    cy.contains('button', 'Test').click()
    cy.get('@alert').should('have.been.calledWith', 'Vue está funcionando!')
  })
})