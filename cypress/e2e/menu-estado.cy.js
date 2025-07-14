describe('Estado del Menú', () => {
  it('Debe mantener el estado activo del menú correctamente', () => {
    // Login
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000);
    
    // Verificar que Dashboard está activo por defecto
    cy.get('#appMenu li[data-menu-id="dashboard"]').should('exist');
    cy.get('#appMenu li[data-menu-id="dashboard"] .nav-link').should('have.class', 'active');
    
    // Navegar a Inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.wait(500);
    
    // Verificar que Inventario está activo
    cy.get('#appMenu li[data-menu-id="inventario"] .nav-link').should('have.class', 'active');
    cy.get('#appMenu li[data-menu-id="dashboard"] .nav-link').should('not.have.class', 'active');
    
    // Navegar a Reportes
    cy.get('#appMenu').contains('Reportes').click();
    cy.wait(500);
    
    // Verificar que Reportes está activo
    cy.get('#appMenu li[data-menu-id="reportes"] .nav-link').should('have.class', 'active');
    cy.get('#appMenu li[data-menu-id="inventario"] .nav-link').should('not.have.class', 'active');
    
    // Volver a Dashboard
    cy.get('#appMenu').contains('Dashboard').click();
    cy.wait(500);
    
    // Verificar que Dashboard está activo nuevamente
    cy.get('#appMenu li[data-menu-id="dashboard"] .nav-link').should('have.class', 'active');
    cy.get('#appMenu li[data-menu-id="reportes"] .nav-link').should('not.have.class', 'active');
    
    // Tomar screenshot del estado final
    cy.screenshot('menu-estado-final');
  });
  
  it('Debe mantener estado después de recargar la página', () => {
    // Login y navegar
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000);
    
    // Navegar a Inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.url().should('include', '#/inventario');
    
    // Recargar la página
    cy.reload();
    
    // Esperar que se recargue
    cy.wait(2000);
    
    // Verificar que volvió al módulo correcto
    cy.url().should('include', 'inventario');
    
    // Verificar que la ruta se mantuvo
    cy.url().should('include', '#/inventario');
  });
});