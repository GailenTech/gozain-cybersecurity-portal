describe('Inventario Básico', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    // Esperar a que Vue se cargue
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible');
  });

  it('Navegación básica funciona', () => {
    // Dashboard por defecto - buscar elementos del dashboard
    cy.contains('Total Activos', { timeout: 10000 }).should('exist');
    cy.contains('Operativos').should('exist');
    
    // Navegar a Inventario
    cy.get('#appMenu li[data-menu-id="inventario"] a').click();
    cy.url().should('include', '#/inventario');
    cy.get('#btnNuevoActivo').should('exist');
    
    // Navegar a Dashboard
    cy.get('#appMenu li[data-menu-id="dashboard"] a').click();
    cy.url().should('include', '#/dashboard');
    cy.contains('Total Activos').should('exist');
  });

  it('Modales funcionan correctamente', () => {
    // Ir a inventario primero
    cy.get('#appMenu li[data-menu-id="inventario"] a').click();
    cy.url().should('include', '#/inventario');
    
    // Abrir modal de nuevo activo
    cy.get('#appMenu li[data-menu-id="nuevo"] a').click();
    cy.get('.modal', { timeout: 5000 }).should('be.visible');
    cy.get('.modal-header').contains('Nuevo Activo').should('exist');
    
    // Cerrar con X
    cy.get('.modal:visible .modal-header .btn-close').first().click();
    cy.get('.modal').should('not.be.visible');
    cy.get('.modal-backdrop').should('not.exist');
    
    // Abrir de nuevo
    cy.get('#appMenu li[data-menu-id="nuevo"] a').click();
    cy.get('.modal').should('be.visible');
    
    // Cerrar con Cancelar
    cy.get('.modal:visible .modal-footer button').contains('Cancelar').click();
    cy.get('.modal').should('not.be.visible');
    cy.get('.modal-backdrop').should('not.exist');
    
    // Verificar que podemos interactuar con el menú
    cy.get('#appMenu li[data-menu-id="dashboard"] a').should('be.visible').click();
    cy.url().should('include', '#/dashboard');
  });

  it('Mantiene estado después de recargar', () => {
    // Navegar a inventario
    cy.get('#appMenu li[data-menu-id="inventario"] a').click();
    cy.url().should('include', '#/inventario');
    
    // Recargar página
    cy.reload();
    
    // Verificar que sigue en inventario - esperar a que se cargue Vue
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '#/inventario');
    cy.get('#btnNuevoActivo').should('exist');
    cy.get('#appMenu li[data-menu-id="inventario"] .nav-link').should('have.class', 'active');
  });
});