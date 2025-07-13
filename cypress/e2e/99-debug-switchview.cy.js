// Debug test for switchView issue
describe('Debug switchView', () => {
  it('Investiga el problema de switchView', () => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(3000) // Extra wait
    
    // Log all relevant elements
    cy.window().then(win => {
      const doc = win.document
      
      cy.log('=== DEBUG INFO ===')
      
      // Check if elements exist
      const dashboardView = doc.getElementById('dashboardView')
      const listaView = doc.getElementById('listaView')
      const btnLista = doc.getElementById('btnVistaLista')
      const btnDashboard = doc.getElementById('btnVistaDashboard')
      
      cy.log('dashboardView exists:', !!dashboardView)
      cy.log('listaView exists:', !!listaView)
      cy.log('btnLista exists:', !!btnLista)
      cy.log('btnDashboard exists:', !!btnDashboard)
      
      if (dashboardView) {
        cy.log('dashboardView display:', win.getComputedStyle(dashboardView).display)
      }
      if (listaView) {
        cy.log('listaView display:', win.getComputedStyle(listaView).display)
      }
      
      // Check if there's any JS framework managing the state
      cy.log('window.gozainCore exists:', !!win.gozainCore)
      
      // Try to find the app instance
      const appContent = doc.getElementById('appContent')
      if (appContent) {
        cy.log('appContent exists')
        const inventarioApp = appContent.querySelector('.inventario-app')
        cy.log('inventarioApp element exists:', !!inventarioApp)
        
        // Check for any data attributes or properties
        if (inventarioApp) {
          cy.log('inventarioApp properties:', Object.keys(inventarioApp))
        }
      }
    })
    
    // Now try the DOM manipulation
    cy.window().then(win => {
      const doc = win.document
      
      cy.log('=== ATTEMPTING DOM MANIPULATION ===')
      
      const dashboardView = doc.getElementById('dashboardView')
      const listaView = doc.getElementById('listaView')
      const btnLista = doc.getElementById('btnVistaLista')
      const btnDashboard = doc.getElementById('btnVistaDashboard')
      const filtros = doc.getElementById('filtrosSection')
      
      // Force display changes
      if (dashboardView) {
        dashboardView.style.display = 'none'
        cy.log('Set dashboardView to none')
      }
      if (listaView) {
        listaView.style.display = 'block'
        cy.log('Set listaView to block')
      }
      if (btnLista) {
        btnLista.classList.add('active')
        cy.log('Added active to btnLista')
      }
      if (btnDashboard) {
        btnDashboard.classList.remove('active')
        cy.log('Removed active from btnDashboard')
      }
      if (filtros) {
        filtros.style.display = 'block'
        cy.log('Set filtros to block')
      }
    })
    
    cy.wait(1000)
    
    // Check results
    cy.window().then(win => {
      const doc = win.document
      const listaView = doc.getElementById('listaView')
      
      cy.log('=== AFTER MANIPULATION ===')
      if (listaView) {
        cy.log('listaView display:', win.getComputedStyle(listaView).display)
        cy.log('listaView visibility:', win.getComputedStyle(listaView).visibility)
        cy.log('listaView offsetHeight:', listaView.offsetHeight)
      }
    })
    
    // Try to interact with elements in lista view
    cy.get('#listaView').within(() => {
      cy.get('#tablaActivos').should('exist')
      cy.get('#btnNuevoActivo').should('exist')
    })
  })
})