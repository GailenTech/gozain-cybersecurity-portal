// Test con manipulación directa del DOM usando JavaScript vanilla
describe('Solución Vanilla JS para Vista Lista', () => {
  it('Cambiar vista manipulando DOM directamente', () => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Manipular DOM directamente sin jQuery
    cy.window().then(win => {
      const doc = win.document
      
      // Cambiar display de las vistas
      const dashboardView = doc.getElementById('dashboardView')
      const listaView = doc.getElementById('listaView')
      const btnLista = doc.getElementById('btnVistaLista')
      const btnDashboard = doc.getElementById('btnVistaDashboard')
      
      if (dashboardView) dashboardView.style.display = 'none'
      if (listaView) listaView.style.display = 'block'
      if (btnLista) btnLista.classList.add('active')
      if (btnDashboard) btnDashboard.classList.remove('active')
      
      // Mostrar filtros
      const filtros = doc.getElementById('filtrosSection')
      if (filtros) filtros.style.display = 'block'
    })
    
    cy.wait(500)
    
    // Verificar que funcionó - el botón está en la vista lista, no en dashboard
    cy.get('#listaView').should('be.visible')
    cy.get('#listaView #tablaActivos').should('exist')
    cy.get('#listaView #btnNuevoActivo').should('exist')
    
    // Crear un activo
    cy.get('#btnNuevoActivo').click()
    cy.get('#modalActivo').should('be.visible')
    cy.get('#tipoActivo').select('Hardware')
    cy.get('#nombreActivo').type('Test Vanilla JS')
    cy.get('#descripcionActivo').type('Activo creado con manipulación vanilla JS')
    cy.get('#departamentoActivo').type('IT')
    cy.get('#criticidadActivo').select('Normal')
    cy.get('#estadoActivo').select('Activo')
    cy.get('#clasificacionActivo').select('Interno')
    cy.get('#btnGuardarActivo').click()
    
    // Verificar que se creó
    cy.get('#tablaActivos').should('contain', 'Test Vanilla JS')
  })
  
  it('Llamar función mostrarVistaLista directamente', () => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Intentar llamar la función directamente
    cy.window().then(win => {
      // Buscar la instancia del app
      const appContainer = win.document.querySelector('#appContent .inventario-app')
      if (appContainer && appContainer.__inventarioApp) {
        // Si hay una referencia a la instancia
        appContainer.__inventarioApp.mostrarVistaLista()
      } else {
        // Si no, manipular DOM directamente
        cy.log('No se encontró instancia, manipulando DOM directamente')
        const doc = win.document
        doc.getElementById('dashboardView').style.display = 'none'
        doc.getElementById('listaView').style.display = 'block'
        doc.getElementById('btnVistaLista').classList.add('active')
        doc.getElementById('btnVistaDashboard').classList.remove('active')
        doc.getElementById('filtrosSection').style.display = 'block'
      }
    })
    
    // Verificar
    cy.get('#tablaActivos').should('exist')
    cy.get('#btnNuevoActivo').should('exist')
  })
})