describe('Navegación General', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000) // Esperar carga completa
  })

  it('Debe mostrar la página de bienvenida correctamente', () => {
    // Verificar URL correcta
    cy.url().should('satisfy', (url) => {
      return url.includes('localhost') || url.includes('gozain')
    })
    
    // Verificar elementos principales
    cy.get('#organizationButton').should('be.visible')
    
    // El welcomeScreen puede o no estar visible dependiendo del estado
    cy.get('body').then($body => {
      if ($body.find('#welcomeScreen').length > 0) {
        cy.get('#welcomeScreen').should('be.visible')
        cy.get('#organizationName').should('contain', 'Seleccionar Organización')
      } else {
        // Ya hay una organización seleccionada
        cy.get('.tool-selector-container').should('be.visible')
      }
    })
    
    // Verificar versión
    cy.get('#versionInfo').should('contain', 'v0.0.')
  })

  it('Debe permitir trabajar con organizaciones', () => {
    // Click en selector de organización
    cy.get('#organizationButton').click()
    cy.wait(1000)
    
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

  it('Debe mostrar el selector de herramientas', () => {
    // Usar loginWithOrg para simplicidad
    cy.loginWithOrg('E2E Test Organization')
    
    // Verificar que se muestra el selector de herramientas
    cy.get('.tool-selector-container').should('be.visible')
    cy.contains('Seleccione una herramienta').should('be.visible')
    
    // Verificar las 3 herramientas disponibles
    cy.get('.tool-card').should('have.length', 3)
    cy.contains('.tool-name', 'Inventario de Activos').should('be.visible')
    cy.contains('.tool-name', 'Impactos de Negocio').should('be.visible')
    cy.contains('.tool-name', 'Madurez en Ciberseguridad').should('be.visible')
  })

  it('Debe navegar entre herramientas correctamente', () => {
    // Usar loginWithOrg para simplicidad
    cy.loginWithOrg('E2E Test Organization')
    
    // Ir a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Verificar que estamos en inventario
    cy.get('#appMenu').should('be.visible')
    cy.get('#currentToolName').should('contain', 'Inventario de Activos')
    cy.get('body').should('have.attr', 'data-app-theme', 'inventario')
    
    // Volver al selector
    cy.get('#toolSelectorButton').click()
    cy.wait(1000)
    
    // Ir a impactos
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
    
    // Verificar cambio
    cy.get('#currentToolName').should('contain', 'Impactos de Negocio')
    cy.get('body').should('have.attr', 'data-app-theme', 'impactos')
  })

  it('Debe mantener la organización seleccionada al navegar', () => {
    // Crear y seleccionar una organización específica
    const orgName = 'Test Nav Org ' + Date.now()
    cy.loginWithOrg(orgName)
    
    // Verificar nombre de organización
    cy.get('#organizationName').should('contain', orgName)
    
    // Navegar a inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Verificar que se mantiene la organización
    cy.get('#organizationName').should('contain', orgName)
    
    // Cambiar a impactos
    cy.get('#toolSelectorButton').click()
    cy.wait(1000)
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
    
    // Verificar que aún se mantiene
    cy.get('#organizationName').should('contain', orgName)
  })

  it('Debe cambiar de organización correctamente', () => {
    // Primera organización
    cy.loginWithOrg('E2E Test Organization')
    cy.get('#organizationName').should('contain', 'E2E Test Organization')
    
    // Navegar a una herramienta
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    cy.get('#currentToolName').should('contain', 'Inventario de Activos')
    
    // Cambiar a otra organización existente
    cy.get('#organizationButton').click()
    cy.wait(1000)
    
    // Seleccionar otra organización de la lista (diferente a E2E Test Organization)
    cy.get('#organizationList .list-group-item').then($items => {
      // Buscar una organización diferente
      const otherOrg = $items.toArray().find(el => !el.textContent.includes('E2E Test Organization'))
      if (otherOrg) {
        cy.wrap(otherOrg).click()
        cy.wait(2000)
        
        // Verificar que cambió la organización
        cy.get('#organizationName').should('not.contain', 'E2E Test Organization')
        cy.get('.tool-selector-container').should('be.visible')
      } else {
        // Si no hay otra org, crear una y seleccionarla
        cy.get('#btnNewOrganization').click()
        const newOrgName = 'Org Cambio Test ' + Date.now()
        cy.get('#newOrgName').type(newOrgName)
        cy.get('#btnCreateOrganization').click()
        cy.wait(2000)
        
        // Seleccionar la nueva
        cy.get('#organizationList .list-group-item').contains(newOrgName).click()
        cy.wait(1000)
        
        // Verificar cambio
        cy.get('#organizationName').should('contain', newOrgName)
        cy.get('.tool-selector-container').should('be.visible')
      }
    })
  })

  it('Debe completar un flujo completo de navegación sin errores', () => {
    // Login
    cy.loginWithOrg('E2E Test Organization')
    
    // Navegar por todas las herramientas
    const tools = [
      { name: 'Inventario de Activos', theme: 'inventario' },
      { name: 'Impactos de Negocio', theme: 'impactos' },
      { name: 'Madurez en Ciberseguridad', theme: 'madurez' }
    ]
    
    tools.forEach((tool, index) => {
      // Si no es la primera, volver al selector
      if (index > 0) {
        cy.get('#toolSelectorButton').click()
        cy.wait(1000)
      }
      
      // Navegar a la herramienta
      cy.get('.tool-card').contains(tool.name).click()
      cy.wait(2000)
      
      // Verificar que llegamos correctamente
      cy.get('#currentToolName').should('contain', tool.name)
      cy.get('body').should('have.attr', 'data-app-theme', tool.theme)
      cy.get('#appMenu').should('be.visible')
    })
    
    // Volver al inicio
    cy.get('#toolSelectorButton').click()
    cy.wait(1000)
    cy.get('.tool-selector-container').should('be.visible')
  })
})