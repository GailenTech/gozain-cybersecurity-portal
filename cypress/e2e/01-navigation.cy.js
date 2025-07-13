describe('Navegación General', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('.navbar-brand', {timeout: 5000}).should('be.visible')
  })

  it('Debe mostrar la página de bienvenida correctamente', () => {
    cy.url().should('satisfy', (url) => {
      return url.includes('localhost') || url.includes('gozain')
    })
    
    cy.get('body').then($body => {
      if ($body.find('#welcomeScreen').length > 0) {
        cy.get('#welcomeScreen').should('be.visible')
        cy.get('#organizationButton').should('be.visible')
        cy.get('#organizationName').should('contain', 'Seleccionar Organización')
      } else {
        cy.get('#organizationButton').should('be.visible')
        cy.get('.tool-selector-container').should('be.visible')
      }
    })
    
    cy.get('#versionInfo').should('contain', 'v0.0.')
  })

  it('Debe permitir trabajar con organizaciones', () => {
    cy.get('#organizationButton').click()
    cy.get('#organizationModal').should('have.class', 'show')
    
    // Seleccionar o crear organización
    cy.get('body').then($body => {
      if ($body.find('#organizationList .list-group-item').length === 0) {
        // Crear nueva
        cy.get('#btnNewOrganization').click()
        cy.get('#newOrgName').type('Test Org ' + Date.now())
        cy.get('#btnCreateOrganization').click()
        // El modal de nueva org se cierra y vuelve al principal que también se cierra
      } else {
        // Seleccionar existente
        cy.get('#organizationList .list-group-item').first().click()
      }
    })
    
    // Verificar resultados en lugar de esperar que el modal se cierre
    cy.get('#organizationName', {timeout: 5000}).should('not.contain', 'Seleccionar Organización')
    cy.get('.tool-selector-container').should('be.visible')
  })

  it('Debe mostrar el selector de herramientas después de seleccionar organización', () => {
    // Usar comando helper que ya maneja la organización
    cy.loginWithOrg('Test Navigation Org')
    
    cy.get('.tool-selector-container').should('be.visible')
    cy.contains('Seleccione una herramienta').should('be.visible')
    
    cy.get('.tool-card').should('have.length', 3)
    cy.contains('.tool-name', 'Inventario de Activos').should('be.visible')
    cy.contains('.tool-name', 'Impactos de Negocio').should('be.visible')
    cy.contains('.tool-name', 'Madurez en Ciberseguridad').should('be.visible')
  })

  it('Debe navegar a inventario correctamente', () => {
    cy.loginWithOrg('Test Navigation Org')
    
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Verificar carga del módulo
    cy.get('#appMenu', {timeout: 5000}).should('be.visible')
    cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    cy.get('#currentToolName').should('contain', 'Inventario de Activos')
    cy.get('body').should('have.attr', 'data-app-theme', 'inventario')
  })

  it('Debe cambiar entre herramientas usando el selector', () => {
    cy.loginWithOrg('Test Navigation Org')
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('#appMenu', {timeout: 5000}).should('be.visible')
    
    // Cambiar a impactos
    cy.get('#toolSelectorButton').should('be.visible').click()
    cy.get('.tool-card', {timeout: 3000}).contains('Impactos de Negocio').click()
    
    // Verificar cambio
    cy.get('#currentToolName', {timeout: 5000}).should('contain', 'Impactos de Negocio')
    cy.get('body').should('have.attr', 'data-app-theme', 'impactos')
  })

  it('Debe navegar por los menús del módulo inventario', () => {
    cy.loginWithOrg('Test Navigation Org')
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('#appMenu', {timeout: 5000}).should('be.visible')
    
    // Probar navegación entre vistas
    cy.get('[data-menu-item="inventario"]').click()
    cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
    cy.get('.dashboard-view').should('not.exist')
    
    cy.get('[data-menu-item="dashboard"]').click()
    cy.get('.dashboard-view', {timeout: 3000}).should('be.visible')
    cy.get('.inventario-list-view').should('not.exist')
  })

  it('Debe mantener la organización al cambiar de herramienta', () => {
    const orgName = 'Test Org ' + Date.now()
    cy.loginWithOrg(orgName)
    
    cy.get('#organizationName').should('contain', orgName)
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('#appMenu', {timeout: 5000}).should('be.visible')
    cy.get('#organizationName').should('contain', orgName)
    
    // Cambiar a impactos
    cy.get('#toolSelectorButton').click()
    cy.get('.tool-card', {timeout: 3000}).contains('Impactos de Negocio').click()
    
    // Verificar que se mantiene
    cy.get('#organizationName', {timeout: 5000}).should('contain', orgName)
  })
})