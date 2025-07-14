describe('Dashboard de Ciberseguridad', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible');
  });

  it('Muestra métricas de seguridad', () => {
    // Verificar que estamos en el dashboard
    cy.url().should('include', '#/dashboard');
    
    // Verificar métricas principales
    cy.contains('Total Activos').should('exist');
    cy.contains('Operativos').should('exist');
    cy.contains('Críticos').should('exist');
    cy.contains('Sin Responsable').should('exist');
    
    // Verificar sección de clasificación
    cy.contains('Clasificación de Seguridad').should('exist');
    cy.get('.badge.bg-dark').contains('Secreto').should('exist');
    cy.get('.badge.bg-danger').contains('Confidencial').should('exist');
    cy.get('.badge.bg-warning').contains('Interno').should('exist');
    cy.get('.badge.bg-success').contains('Público').should('exist');
    
    // Verificar distribución por tipo
    cy.contains('Distribución por Tipo').should('exist');
    
    // Verificar indicadores de riesgo
    cy.contains('Indicadores de Riesgo').should('exist');
    cy.contains('En mantenimiento').should('exist');
    cy.contains('Importantes').should('exist');
    cy.contains('Inactivos').should('exist');
  });

  it('No muestra elementos redundantes', () => {
    // Verificar que NO existen los títulos redundantes
    cy.get('h2').contains('Dashboard de Inventario').should('not.exist');
    cy.contains('Acciones Rápidas').should('not.exist');
  });

  it('Página de inventario sin título redundante', () => {
    // Navegar a inventario
    cy.get('#appMenu li[data-menu-id="inventario"] a').click();
    cy.url().should('include', '#/inventario');
    
    // Verificar que NO existe el título redundante
    // Buscar si existe algún h2 con el texto "Inventario de Activos"
    cy.get('body').then($body => {
      const h2s = $body.find('h2:contains("Inventario de Activos")');
      expect(h2s.length).to.equal(0);
    });
    
    // Pero sí existe el botón de nuevo activo
    cy.get('#btnNuevoActivo').should('exist').and('contain', 'Nuevo Activo');
    
    // Y la tabla de filtros
    cy.get('#filtroTipo').should('exist');
    cy.get('#filtroDepartamento').should('exist');
    cy.get('#filtroBusqueda').should('exist');
  });

  it('Filtros funcionan correctamente', () => {
    // Navegar a inventario
    cy.get('#appMenu li[data-menu-id="inventario"] a').click();
    cy.url().should('include', '#/inventario');
    
    // Probar filtro por tipo
    cy.get('#filtroTipo').select('Hardware');
    
    // Probar filtro por departamento
    cy.get('#filtroDepartamento').select('IT');
    
    // Probar búsqueda
    cy.get('#filtroBusqueda').type('servidor');
    cy.get('#btnBuscar').click();
    
    // Limpiar filtros
    cy.contains('button', 'Limpiar').click();
    
    // Verificar que los filtros se limpiaron
    cy.get('#filtroTipo').should('have.value', '');
    cy.get('#filtroDepartamento').should('have.value', '');
    cy.get('#filtroBusqueda').should('have.value', '');
  });
});