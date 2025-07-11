describe('Navegación General', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(1000) // Esperar carga inicial
  })

  it('Debe mostrar la página de bienvenida correctamente', () => {
    cy.get('#welcomeScreen').should('be.visible')
    cy.get('#organizationButton').should('be.visible')
    cy.get('#organizationName').should('contain', 'Seleccionar Organización')
    
    // Verificar versión
    cy.get('#versionInfo').should('contain', 'v0.0.')
    
    // El sidebar NO debe estar visible
    cy.get('#sidebarMenu').should('not.exist')
  })

  it('Debe permitir trabajar con organizaciones', () => {
    // Click en selector de organización
    cy.get('#organizationButton').click()
    
    // Verificar modal
    cy.get('#organizationModal').should('be.visible')
    
    // Crear nueva organización
    cy.get('#btnNewOrganization').click()
    cy.get('#newOrgName').type('Test Org ' + Date.now())
    cy.get('#btnCreateOrganization').click()
    
    // Verificar que se seleccionó
    cy.get('#organizationName').should('not.contain', 'Seleccionar Organización')
    cy.get('#organizationName').invoke('text').should('not.be.empty')
  })

  it('Debe mostrar el selector de herramientas', () => {
    // Seleccionar organización existente
    cy.get('#organizationButton').click()
    cy.get('#organizationList .list-group-item').first().click()
    
    // Verificar que se muestra el selector de herramientas
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    cy.contains('Seleccione una herramienta para comenzar').should('be.visible')
    
    // Verificar herramientas disponibles
    cy.contains('.tool-card', 'Inventario de Activos').should('be.visible')
    cy.contains('.tool-card', 'Impactos de Negocio').should('be.visible')
  })

  it('Debe navegar entre herramientas correctamente', () => {
    // Seleccionar organización
    cy.get('#organizationButton').click()
    cy.get('#organizationList .list-group-item').first().click()
    
    // Ir a inventario
    cy.contains('.tool-card', 'Inventario de Activos').click()
    cy.get('#appMenu').should('be.visible')
    cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    cy.get('#currentToolName').should('contain', 'Inventario de Activos')
    
    // Cambiar a impactos usando selector
    cy.get('#toolSelectorButton').click()
    cy.contains('.tool-card', 'Impactos de Negocio').click()
    cy.get('#appMenu').should('be.visible')
    cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    cy.get('#currentToolName').should('contain', 'Impactos de Negocio')
    
    // Verificar cambio de tema
    cy.get('body').should('have.attr', 'data-app-theme', 'impactos')
  })

  it('Debe mantener la organización seleccionada al navegar', () => {
    // Seleccionar organización
    cy.get('#organizationButton').click()
    cy.get('#organizationList .list-group-item').first().then($org => {
      const orgName = $org.find('h6').text()
      cy.wrap($org).click()
      
      // Verificar nombre
      cy.get('#organizationName').should('contain', orgName)
      
      // Navegar a inventario
      cy.contains('.tool-card', 'Inventario de Activos').click()
      
      // Verificar que se mantiene
      cy.get('#organizationName').should('contain', orgName)
      
      // Cambiar herramienta
      cy.get('#toolSelectorButton').click()
      cy.contains('.tool-card', 'Impactos de Negocio').click()
      
      // Verificar que sigue igual
      cy.get('#organizationName').should('contain', orgName)
    })
  })

  it('Debe cambiar de organización correctamente', () => {
    // Crear primera organización
    cy.get('#organizationButton').click()
    cy.get('#btnNewOrganization').click()
    cy.get('#newOrgName').type('Org A')
    cy.get('#btnCreateOrganization').click()
    
    // Ir a inventario
    cy.contains('.tool-card', 'Inventario de Activos').click()
    cy.wait(1000)
    
    // Cambiar a otra organización
    cy.get('#organizationButton').click()
    cy.get('#btnNewOrganization').click()
    cy.get('#newOrgName').type('Org B')
    cy.get('#btnCreateOrganization').click()
    
    // Verificar que volvemos al selector de herramientas
    cy.get('.tool-selector-container').should('be.visible')
    cy.get('#organizationName').should('contain', 'Org B')
  })

  it('Debe completar un flujo completo de navegación sin errores', () => {
    // 1. Seleccionar organización
    cy.get('#organizationButton').click()
    cy.get('#organizationList .list-group-item').first().click()
    
    // 2. Ir a inventario
    cy.contains('.tool-card', 'Inventario de Activos').click()
    
    // 3. Navegar por el menú
    cy.get('[data-menu-item="lista"]').click()
    cy.get('#listaView').should('be.visible')
    
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#modalNuevoActivo').should('be.visible')
    cy.get('.btn-close').click()
    
    // 4. Cambiar a impactos
    cy.get('#toolSelectorButton').click()
    cy.contains('.tool-card', 'Impactos de Negocio').click()
    
    // 5. Navegar en impactos
    cy.get('[data-menu-item="lista"]').click()
    cy.get('#listaView').should('be.visible')
    
    cy.get('[data-menu-item="tareas"]').click()
    cy.get('#tareasView').should('be.visible')
    
    // 6. Volver al dashboard
    cy.get('[data-menu-item="dashboard"]').click()
    cy.get('#dashboardView').should('be.visible')
  })
})