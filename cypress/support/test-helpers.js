// Helper functions for tests

// Ensure we have a clean state and organization selected
export function ensureOrganizationSelected(orgName = null) {
  cy.get('#organizationName').then($name => {
    const currentOrg = $name.text().trim()
    
    // If no specific org requested and one is already selected, keep it
    if (!orgName && currentOrg !== 'Seleccionar Organización') {
      cy.log(`Using current organization: "${currentOrg}"`)
      return
    }
    
    // If specific org requested and already selected, done
    if (orgName && currentOrg === orgName) {
      cy.log(`Organization "${orgName}" already selected`)
      return
    }
    
    if (currentOrg === 'Seleccionar Organización') {
      cy.log('No organization selected, selecting one')
      // Force click organization button
      cy.get('#organizationButton').click({ force: true })
      cy.wait(1500) // Wait for modal
      
      // Try to find and click organization
      cy.get('body').then($body => {
        // Check if organizations are in a list
        if ($body.find('#organizationList .list-group-item').length > 0) {
          if (orgName) {
            // Try to find specific org
            cy.get('#organizationList .list-group-item').then($items => {
              const found = Array.from($items).some(item => 
                item.textContent.includes(orgName)
              )
              if (found) {
                cy.get('#organizationList .list-group-item')
                  .contains(orgName)
                  .click({ force: true })
              } else {
                cy.log(`Organization "${orgName}" not found, selecting first available`)
                cy.get('#organizationList .list-group-item').first().click({ force: true })
              }
            })
          } else {
            // Just select first available
            cy.get('#organizationList .list-group-item').first().click({ force: true })
          }
        } else {
          cy.log('No organizations found, may need to create one')
        }
      })
    } else if (orgName && currentOrg !== orgName) {
      cy.log(`Different organization selected: "${currentOrg}", trying to change to "${orgName}"`)
      cy.get('#organizationButton').click({ force: true })
      cy.wait(1500)
      
      // Try to find the requested org
      cy.get('#organizationList .list-group-item').then($items => {
        const found = Array.from($items).some(item => 
          item.textContent.includes(orgName)
        )
        if (found) {
          cy.get('#organizationList .list-group-item')
            .contains(orgName)
            .click({ force: true })
        } else {
          cy.log(`Organization "${orgName}" not found, keeping current`)
        }
      })
    }
    
    // Verify we have some organization selected
    cy.get('#organizationName', { timeout: 5000 }).should('not.contain', 'Seleccionar Organización')
  })
}

// Navigate to tool more reliably
export function navigateToToolReliably(toolName) {
  cy.get('body').then($body => {
    // Check if we're already in a tool
    if ($body.find('#sidebarMenu:visible').length > 0) {
      cy.log('Already in a tool, going home first')
      cy.get('#btnHomeTop').click()
      cy.wait(500)
    }
    
    // Wait for tool selector
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    
    // Click tool
    cy.contains('.tool-card', toolName).should('be.visible').click()
    
    // Wait for tool to load
    cy.get('#dashboardView', { timeout: 10000 }).should('be.visible')
  })
}