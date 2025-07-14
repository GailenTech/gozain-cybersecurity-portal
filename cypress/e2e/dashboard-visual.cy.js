describe('Dashboard Visual', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000);
  });

  it('Debe mostrar el Dashboard con estilos correctos', () => {
    // Verificar URL
    cy.url().should('include', '#/dashboard');
    
    // Verificar título
    cy.contains('h2', 'Dashboard de Inventario').should('exist');
    
    // Verificar tarjetas de estadísticas
    cy.get('.card.text-bg-primary').contains('Total Activos').should('exist');
    cy.get('.card.text-bg-success').contains('Activos Activos').should('exist');
    cy.get('.card.text-bg-warning').contains('En Mantenimiento').should('exist');
    cy.get('.card.text-bg-danger').contains('Críticos').should('exist');
    
    // Verificar sección de acciones rápidas
    cy.get('.card').contains('h5', 'Acciones Rápidas').should('exist');
    cy.get('#btnNuevoActivoDashboard').should('exist');
    cy.get('#btnVerInventario').should('exist');
    
    // Tomar screenshot para verificación visual
    cy.screenshot('dashboard-completo');
  });
  
  it('Debe navegar correctamente a Inventario', () => {
    // Click en Ver Inventario
    cy.get('#btnVerInventario').click();
    
    // Verificar que navegó
    cy.url().should('include', '#/inventario');
    cy.contains('h2', 'Inventario de Activos').should('exist');
  });
  
  it('Debe abrir modal de Nuevo Activo', () => {
    // Click en Nuevo Activo
    cy.get('#btnNuevoActivoDashboard').click();
    
    // Verificar modal
    cy.get('#modalActivo').should('be.visible');
    cy.get('#modalActivoTitle').should('contain', 'Nuevo Activo');
    
    // Cerrar modal
    cy.get('#modalActivo .btn-close').click();
  });
});