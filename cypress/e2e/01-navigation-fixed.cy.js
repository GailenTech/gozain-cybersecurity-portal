describe('Navegación General - Fixed', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000) // Esperar carga completa
  })

  it('Debe mostrar la página de bienvenida correctamente', () => {
    // Verificar que estamos en la página correcta
    cy.url().should('include', 'gozain')
    
    // El welcomeScreen debe estar visible o ya tener una org seleccionada
    cy.get('body').then($body => {
      if ($body.find('#welcomeScreen').length > 0) {
        cy.get('#welcomeScreen').should('be.visible')
        cy.get('#organizationButton').should('be.visible')
        cy.get('#organizationName').should('contain', 'Seleccionar Organización')
      } else {
        // Ya hay una organización seleccionada
        cy.get('#organizationButton').should('be.visible')
        cy.get('.tool-selector-container').should('be.visible')
      }
    })
    
    // Verificar versión
    cy.get('#versionInfo').should('contain', 'v0.0.')
  })

  it('Debe permitir trabajar con organizaciones', () => {
    // Click en selector de organización
    cy.get('#organizationButton').click()
    cy.wait(1000) // Esperar animación del modal
    
    // Verificar modal
    cy.get('#organizationModal').should('be.visible')
    
    // Si no hay organizaciones, crear una
    cy.get('#organizationList').then($list => {
      if ($list.find('.list-group-item').length === 0) {
        cy.get('#btnNewOrganization').click()
        cy.get('#newOrgName').type('Test Org ' + Date.now())
        cy.get('#btnCreateOrganization').click()
        cy.wait(2000)
      } else {
        // Seleccionar la primera
        cy.get('#organizationList .list-group-item').first().click()
        cy.wait(1000)
      }
    })
    
    // Verificar que se seleccionó
    cy.get('#organizationName').should('not.contain', 'Seleccionar Organización')
  })

  it('Debe mostrar el selector de herramientas después de seleccionar organización', () => {
    // Asegurar que tenemos una organización
    cy.get('#organizationButton').click()
    cy.wait(1000)
    
    cy.get('body').then($body => {
      if ($body.find('#organizationModal.show').length > 0) {
        cy.get('#organizationList .list-group-item').first().click()
        cy.wait(2000)
      }
    })
    
    // Verificar selector de herramientas
    cy.get('.tool-selector-container').should('be.visible')
    cy.contains('Seleccione una herramienta').should('be.visible')
    
    // Verificar herramientas disponibles
    cy.get('.tool-card').should('have.length', 2)
    cy.contains('.tool-name', 'Inventario de Activos').should('be.visible')
    cy.contains('.tool-name', 'Impactos de Negocio').should('be.visible')
  })

  it('Debe navegar a inventario correctamente', () => {
    // Setup: asegurar organización
    cy.get('#organizationButton').click()
    cy.wait(1000)
    cy.get('#organizationList .list-group-item').first().click()
    cy.wait(2000)
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Verificar que estamos en inventario
    cy.get('#appMenu').should('be.visible')
    cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    cy.get('#currentToolName').should('contain', 'Inventario de Activos')
    cy.get('body').should('have.attr', 'data-app-theme', 'inventario')
  })

  it('Debe cambiar entre herramientas usando el selector', () => {
    // Setup
    cy.get('#organizationButton').click()
    cy.wait(1000)
    cy.get('#organizationList .list-group-item').first().click()
    cy.wait(2000)
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Cambiar a impactos
    cy.get('#toolSelectorButton').should('be.visible').click()
    cy.wait(1000)
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
    
    // Verificar cambio
    cy.get('#currentToolName').should('contain', 'Impactos de Negocio')
    cy.get('body').should('have.attr', 'data-app-theme', 'impactos')
  })

  it('Debe navegar por los menús de cada módulo', () => {
    // Setup
    cy.get('#organizationButton').click()
    cy.wait(1000)
    cy.get('#organizationList .list-group-item').first().click()
    cy.wait(2000)
    
    // Inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Probar navegación
    cy.get('[data-menu-item="lista"]').click()
    cy.get('#listaView').should('be.visible')
    cy.get('#dashboardView').should('not.be.visible')
    
    cy.get('[data-menu-item="dashboard"]').click()
    cy.get('#dashboardView').should('be.visible')
    cy.get('#listaView').should('not.be.visible')
    
    // Cambiar a impactos
    cy.get('#toolSelectorButton').click()
    cy.wait(1000)
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
    
    // Probar navegación en impactos
    cy.get('[data-menu-item="tareas"]').click()
    cy.get('#tareasView').should('be.visible')
    
    cy.get('[data-menu-item="lista"]').click()
    cy.get('#listaView').should('be.visible')
  })

  it('Debe mantener la organización al cambiar de herramienta', () => {
    // Setup con organización específica
    cy.get('#organizationButton').click()
    cy.wait(1000)
    
    // Crear nueva org para asegurar nombre único
    cy.get('#btnNewOrganization').click()
    const orgName = 'Test Org ' + Date.now()
    cy.get('#newOrgName').type(orgName)
    cy.get('#btnCreateOrganization').click()
    cy.wait(2000)
    
    // Verificar nombre
    cy.get('#organizationName').should('contain', orgName)
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    cy.get('#organizationName').should('contain', orgName)
    
    // Cambiar a impactos
    cy.get('#toolSelectorButton').click()
    cy.wait(1000)
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
    
    // Verificar que se mantiene
    cy.get('#organizationName').should('contain', orgName)
  })
})