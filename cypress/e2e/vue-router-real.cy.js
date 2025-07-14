describe('Vue Router Real - URLs e Historial', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000); // Esperar que cargue
  });

  it('Debe mostrar Dashboard con URL hash', () => {
    // Debe redirigir a dashboard por defecto
    cy.url().should('include', '#/dashboard');
    cy.contains('Dashboard de Inventario').should('exist');
  });

  it('Debe navegar a Inventario y actualizar URL', () => {
    // Verificar URL inicial
    cy.url().should('include', '#/dashboard');
    
    // Navegar a inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    
    // Verificar que la URL cambió
    cy.url().should('include', '#/inventario');
    cy.contains('h2', 'Inventario de Activos').should('exist');
  });

  it('Debe mantener la navegación con botones del navegador', () => {
    // Navegar a inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.url().should('include', '#/inventario');
    
    // Navegar a reportes
    cy.get('#appMenu').contains('Reportes').click();
    cy.url().should('include', '#/reportes');
    
    // Usar botón atrás del navegador
    cy.go('back');
    cy.url().should('include', '#/inventario');
    cy.contains('h2', 'Inventario de Activos').should('exist');
    
    // Usar botón adelante
    cy.go('forward');
    cy.url().should('include', '#/reportes');
    cy.contains('h2', 'Reportes').should('exist');
  });

  it('Debe navegar directamente por URL', () => {
    // Navegar directamente a inventario por URL
    cy.visit('http://localhost:8080/#/inventario');
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    
    // Debe estar en inventario
    cy.url().should('include', '#/inventario');
    cy.contains('h2', 'Inventario de Activos').should('exist');
  });

  it('Debe mantener URL al abrir modales', () => {
    // Ir a inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.url().should('include', '#/inventario');
    
    // Abrir modal de nuevo activo
    cy.get('#appMenu').contains('Nuevo Activo').click();
    
    // La URL no debe cambiar
    cy.url().should('include', '#/inventario');
    cy.get('#modalActivo').should('be.visible');
    
    // Cerrar modal
    cy.get('#modalActivo .btn-close').click();
    cy.url().should('include', '#/inventario');
  });

  it('Debe actualizar estado activo del menú según la ruta', () => {
    // Dashboard debe estar activo
    cy.url().should('include', '#/dashboard');
    cy.get('#appMenu').contains('Dashboard').parent().should('have.class', 'active');
    
    // Navegar a inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.url().should('include', '#/inventario');
    
    // Inventario debe estar activo ahora
    cy.get('#appMenu').contains('Inventario de Activos').parent().should('have.class', 'active');
    cy.get('#appMenu').contains('Dashboard').parent().should('not.have.class', 'active');
  });
});