describe('Navegación Simple sin OAuth', () => {
  
  beforeEach(() => {
    // Para tests E2E, deshabilitar temporalmente la verificación OAuth
    cy.visit('/')
    cy.window().then((win) => {
      // Mock del authService para tests
      win.authService = {
        isAuthenticated: () => true,
        getUser: () => ({
          id: 'test_user',
          email: 'test@example.com',
          nombre: 'Test User',
          organizacion_id: 'test_org'
        }),
        getToken: () => 'mock_token',
        setUser: () => {},
        setTokens: () => {},
        organizationId: 'test_org'
      }
    })
  })
  
  it('Debe mostrar la página principal correctamente', () => {
    cy.contains('Gozain').should('be.visible')
    cy.contains('Seleccionar Organización').should('be.visible')
  })
  
  it('Debe permitir seleccionar una organización', () => {
    // Abrir el modal de organizaciones
    cy.get('#organizationButton').click()
    cy.get('#organizationModal').should('be.visible')
    
    // Si hay organizaciones, seleccionar la primera
    cy.get('#organizationList .list-group-item').then($items => {
      if ($items.length > 0) {
        cy.wrap($items[0]).click()
        // Esperar a que el modal se oculte (puede tomar tiempo)
        cy.wait(2000)
        // Verificar que el modal ya no está visible
        cy.get('#organizationModal:visible').should('not.exist')
      } else {
        // Si no hay, crear una nueva
        cy.get('#btnNewOrganization').click()
        cy.get('#newOrgName').type('Test Organization')
        cy.get('#btnCreateOrganization').click()
      }
    })
  })
  
  it('Debe mostrar las herramientas disponibles', () => {
    // Primero seleccionar una organización si es necesario
    cy.get('#organizationName').then($el => {
      if ($el.text() === 'Seleccionar Organización') {
        cy.get('#organizationButton').click()
        cy.get('#organizationList .list-group-item').first().click()
      }
    })
    
    // Verificar que se muestran las herramientas
    cy.get('.tool-card').should('have.length.at.least', 3)
    cy.contains('Inventario de Activos').should('be.visible')
    cy.contains('Impactos de Negocio').should('be.visible')
    cy.contains('Madurez en Ciberseguridad').should('be.visible')
  })
})