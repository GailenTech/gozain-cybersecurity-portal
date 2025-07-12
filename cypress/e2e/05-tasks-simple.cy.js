describe('Gestión de Tareas - Versión Simplificada', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    
    // Navegar a impactos
    cy.contains('.tool-card', 'Impactos de Negocio').click();
    cy.wait(2000);
  });

  it('Debe mostrar la vista de tareas', () => {
    // Navegar a tareas
    cy.get('[data-menu-item="tareas"]').click();
    cy.wait(1000);
    
    // Verificar que se muestra la vista de tareas
    cy.get('#vistaContainer').should('be.visible');
    cy.contains('h3', 'Tareas Pendientes').should('be.visible');
    
    // Verificar elementos básicos de la interfaz
    cy.get('#tablaTareas').should('exist');
    cy.get('#btnActualizarTareas').should('be.visible');
  });

  it('Debe crear un impacto y generar tareas', () => {
    // Crear impacto de alta de empleado
    cy.createImpact('alta_empleado', {
      nombre_completo: 'Test Employee Simple',
      departamento: 'IT',
      cargo: 'Developer',
      fecha_inicio: '2024-12-31',
      modalidad: 'Presencial',
      equipo_movil: true
    });
    
    // Verificar que el impacto se creó
    cy.get('#modalDetalleImpacto').should('be.visible');
    cy.get('#modalDetalleImpacto').should('contain', 'Test Employee Simple');
    
    // Procesar el impacto
    cy.get('#btnProcesarImpacto').click();
    cy.on('window:confirm', () => true);
    cy.wait(2000);
    
    // Cerrar modal
    cy.get('#modalDetalleImpacto .btn-secondary').click({ force: true });
    cy.wait(1000);
    
    // Ir a tareas
    cy.get('[data-menu-item="tareas"]').click();
    cy.wait(1000);
    
    // Verificar que hay tareas
    cy.get('#tablaTareas tbody tr').should('have.length.greaterThan', 0);
    cy.get('#statTareasPendientes').invoke('text').then((text) => {
      expect(parseInt(text)).to.be.greaterThan(0);
    });
  });

  it('Debe actualizar la lista de tareas', () => {
    // Ir directamente a tareas
    cy.get('[data-menu-item="tareas"]').click();
    cy.wait(1000);
    
    // Click en actualizar
    cy.get('#btnActualizarTareas').click();
    
    // Verificar que se actualiza la vista
    cy.get('#tablaTareas').should('be.visible');
  });
});