describe('Debug Reload y Estado', () => {
  it('Verifica estado después de navegar y recargar', () => {
    // Login
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000);
    
    // Navegar a Inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.wait(500);
    
    // Verificar navegación
    cy.url().should('include', '#/inventario');
    cy.contains('h2', 'Inventario de Activos').should('exist');
    
    // Verificar que el menú tiene el estado correcto
    cy.get('#appMenu li[data-menu-id="inventario"] .nav-link').should('have.class', 'active');
    
    // Recargar
    cy.reload();
    cy.wait(3000);
    
    // Verificar que mantiene la URL y el estado
    cy.url().should('include', '#/inventario');
    cy.contains('h2', 'Inventario de Activos').should('exist');
    cy.get('#appMenu li[data-menu-id="inventario"] .nav-link').should('have.class', 'active');
  });
});