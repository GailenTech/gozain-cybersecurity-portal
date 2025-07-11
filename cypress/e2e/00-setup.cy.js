describe('Configuración Inicial', () => {
  it('Debe asegurar que existe una organización de prueba', () => {
    cy.visit('/')
    cy.wait(2000)
    
    // Check current state
    cy.get('#organizationName').then($name => {
      const currentOrg = $name.text().trim()
      
      if (currentOrg !== 'Seleccionar Organización') {
        cy.log(`Ya hay una organización seleccionada: ${currentOrg}`)
        return
      }
      
      // Need to create or select organization
      cy.get('#organizationButton').click({ force: true })
      cy.wait(1500)
      
      // Check if there are any organizations
      cy.get('body').then($body => {
        const hasOrgs = $body.find('#organizationList .list-group-item').length > 0
        
        if (!hasOrgs) {
          cy.log('No hay organizaciones, creando una nueva')
          
          // Click new organization button
          cy.get('#btnNewOrganization').click({ force: true })
          cy.wait(500)
          
          // Fill new organization form
          cy.get('#newOrgName').type('Organización Demo')
          cy.get('#btnCreateOrganization').click()
          cy.wait(2000)
          
          // Verify creation
          cy.get('#organizationName').should('contain', 'Organización Demo')
        } else {
          cy.log('Seleccionando primera organización disponible')
          cy.get('#organizationList .list-group-item').first().click({ force: true })
        }
      })
    })
    
    // Verify we have an organization selected
    cy.get('#organizationName').should('not.contain', 'Seleccionar Organización')
    
    // Should show tool selector
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
  })
})