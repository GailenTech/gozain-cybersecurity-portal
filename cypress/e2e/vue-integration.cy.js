describe('Integración Vue - Inventario', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
  })

  it('Debe cargar el módulo inventario con Vue', () => {
    // Hacer clic en inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Verificar que Vue se carga
    cy.window().then((win) => {
      expect(win.Vue).to.exist
      expect(win.Vuex).to.exist
    })
    
    // Verificar que el componente Vue se renderiza
    cy.get('.inventario-app', {timeout: 10000}).should('exist')
    
    // Verificar que el dashboard se muestra por defecto
    cy.get('.inventario-dashboard-view').should('exist')
    cy.contains('Dashboard de Inventario').should('be.visible')
  })

  it('Debe mostrar las estadísticas en el dashboard', () => {
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('.inventario-dashboard-view', {timeout: 5000}).should('exist')
    
    // Verificar tarjetas de estadísticas
    cy.get('.card').contains('Total Activos').should('exist')
    cy.get('.card').contains('Activos Activos').should('exist')
    cy.get('.card').contains('En Mantenimiento').should('exist')
    cy.get('.card').contains('Críticos').should('exist')
  })

  it('Debe cambiar entre vistas', () => {
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('.inventario-dashboard-view', {timeout: 5000}).should('exist')
    
    // Cambiar a vista de lista
    cy.get('#btnVerInventario').click()
    cy.get('.inventario-list-view').should('exist')
    cy.contains('Inventario de Activos').should('be.visible')
    
    // Verificar tabla
    cy.get('#tablaActivos').should('exist')
  })

  it('Debe abrir y cerrar el modal de nuevo activo', () => {
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('.inventario-dashboard-view', {timeout: 5000}).should('exist')
    
    // Abrir modal
    cy.get('#btnNuevoActivoDashboard').click()
    cy.get('#modalActivo').should('be.visible')
    cy.get('#modalActivoTitle').should('contain', 'Nuevo Activo')
    
    // Cerrar modal
    cy.get('#modalActivo .btn-close').click()
    cy.get('#modalActivo').should('not.exist')
  })
})