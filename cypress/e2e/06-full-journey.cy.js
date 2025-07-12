describe('Flujo Completo del Sistema', () => {
  beforeEach(() => {
    // Ignorar errores de scripts cross-origin
    cy.on('uncaught:exception', (err, runnable) => {
      return false
    })
  });

  it('Flujo completo: desde crear organización hasta completar tareas', () => {
    // 1. Visitar aplicación
    cy.visit('/');
    cy.get('#welcomeScreen').should('be.visible');
    
    // 2. Crear nueva organización
    cy.get('#organizationButton').click();
    cy.wait(500);
    cy.get('#btnNewOrganization').click();
    cy.wait(500);
    cy.get('#newOrgName').type('Mi Empresa Test');
    cy.get('#btnCreateOrganization').click();
    cy.wait(2000);
    
    // 3. Verificar que se muestra el selector de herramientas
    cy.get('.tool-selector-container').should('be.visible');
    cy.get('.tool-card').should('have.length', 3);
    
    // 4. Seleccionar Inventario
    cy.get('.tool-card').contains('Inventario de Activos').click({ force: true });
    cy.wait(1000);
    
    // 5. Verificar elementos del inventario
    cy.get('#appMenu').should('be.visible');
    cy.get('[data-menu-item="dashboard"]').should('have.class', 'active');
    cy.get('#currentToolName').should('contain', 'Inventario de Activos');
    
    // 6. Crear algunos activos
    cy.get('[data-menu-item="nuevo"]').click();
    
    // Crear laptop
    cy.get('#tipoActivo').select('Hardware');
    cy.get('#nombreActivo').type('Laptop Dell XPS 15');
    cy.get('#descripcionActivo').type('Laptop para desarrollo');
    cy.get('#responsableActivo').type('Juan Pérez');
    cy.get('#departamentoActivo').type('IT');
    cy.get('#clasificacionActivo').select('Confidencial');
    cy.get('#criticidadActivo').select('Crítica');
    cy.get('#btnGuardarActivo').click();
    
    // 7. Verificar que el activo se creó
    cy.get('[data-menu-item="lista"]').click();
    cy.get('#tablaActivos').should('contain', 'Laptop Dell XPS 15');
    
    // 8. Cambiar a módulo de Impactos
    cy.get('#toolSelectorButton').click();
    cy.get('.tool-card').contains('Impactos de Negocio').click();
    
    // 9. Verificar cambio de tema
    cy.get('body').should('have.attr', 'data-app-theme', 'impactos');
    cy.get('.navbar').should('have.css', 'background-color', 'rgb(73, 80, 87)');
    
    // 10. Crear un impacto
    cy.get('[data-menu-item="nuevo"]').click();
    cy.get('#tipoImpacto').select('alta_empleado');
    cy.wait(500);
    
    cy.get('#nombre_completo').type('María García');
    cy.get('#departamento').type('IT');
    cy.get('#cargo').type('Senior Developer');
    cy.get('#fecha_inicio').type('2025-07-15');
    cy.get('#modalidad').select('Presencial');
    cy.get('#equipo_movil').check();
    cy.get('#btnCrearImpacto').click();
    
    // 11. Verificar que el impacto se creó
    cy.wait(1000);
    cy.get('#modalDetalleImpacto').should('be.visible');
    cy.get('#modalDetalleImpacto').should('contain', 'María García');
    
    // 12. Cerrar modal
    cy.get('#modalDetalleImpacto .btn-close').click({ force: true });
    cy.wait(500);
    
    // 13. Verificar que volvimos a la vista de impactos
    cy.get('#currentToolName').should('contain', 'Impactos de Negocio');
    
    // 14. Cambiar de organización
    cy.get('#organizationButton').click();
    cy.wait(500);
    cy.get('#organizationList .list-group-item').first().click();
    cy.wait(1000);
    
    // 15. Verificar que volvemos al selector de herramientas
    cy.get('.tool-selector-container').should('be.visible');
  });

  it('Flujo de filtrado y búsqueda en ambos módulos', () => {
    // Setup inicial
    cy.loginWithOrg('E2E Test Organization');
    
    // Test en Inventario
    cy.contains('.tool-card', 'Inventario de Activos').click();
    
    // Crear varios activos
    const activos = [
      { tipo: 'Hardware', nombre: 'Servidor HP', departamento: 'IT' },
      { tipo: 'Software', nombre: 'Office 365', departamento: 'General' },
      { tipo: 'Hardware', nombre: 'Router Cisco', departamento: 'IT' }
    ];
    
    activos.forEach(activo => {
      cy.get('[data-menu-item="nuevo"]').click();
      cy.get('#tipoActivo').select(activo.tipo);
      cy.get('#nombreActivo').type(activo.nombre);
      cy.get('#departamentoActivo').type(activo.departamento);
      cy.get('#btnGuardarActivo').click();
    });
    
    // Ir a lista y filtrar
    cy.get('[data-menu-item="lista"]').click();
    
    // Filtrar por tipo Hardware
    cy.get('#filtroTipo').select('Hardware');
    cy.get('#btnBuscar').click();
    cy.get('#tablaActivos tbody tr').should('have.length', 2);
    
    // Filtrar por departamento IT
    cy.get('#filtroTipo').select('');
    cy.get('#filtroDepartamento').select('IT');
    cy.get('#btnBuscar').click();
    cy.get('#tablaActivos tbody tr').should('have.length', 2);
    
    // Buscar por texto
    cy.get('#filtroDepartamento').select('');
    cy.get('#filtroBusqueda').type('Cisco');
    cy.get('#btnBuscar').click();
    cy.get('#tablaActivos tbody tr').should('have.length', 1);
    
    // Cambiar a Impactos
    cy.get('#toolSelectorButton').click();
    cy.get('.tool-card').contains('Impactos de Negocio').click();
    
    // Verificar que los filtros están ocultos en dashboard
    cy.get('#filtrosSection').should('not.be.visible');
    
    // Ir a lista de impactos
    cy.get('[data-menu-item="lista"]').click();
    
    // Verificar que los filtros están visibles
    cy.get('#filtrosSection').should('be.visible');
  });

  it('Flujo de navegación entre vistas', () => {
    cy.loginWithOrg('E2E Test Organization');
    cy.contains('.tool-card', 'Inventario de Activos').click();
    
    // Verificar navegación con botones de vista
    cy.get('#btnVistaDashboard').should('have.class', 'active');
    cy.get('#dashboardView').should('be.visible');
    cy.get('#listaView').should('not.be.visible');
    
    // Cambiar a vista lista con botón
    cy.get('#btnVistaLista').click();
    cy.get('#btnVistaLista').should('have.class', 'active');
    cy.get('#btnVistaDashboard').should('not.have.class', 'active');
    cy.get('#listaView').should('be.visible');
    cy.get('#dashboardView').should('not.be.visible');
    
    // Cambiar con menú lateral
    cy.get('[data-menu-item="dashboard"]').click();
    cy.get('#dashboardView').should('be.visible');
    cy.get('#btnVistaDashboard').should('have.class', 'active');
    
    // Verificar sincronización en módulo de impactos
    cy.get('#toolSelectorButton').click();
    cy.get('.tool-card').contains('Impactos de Negocio').click();
    
    // Dashboard por defecto
    cy.get('#btnVistaDashboard').should('have.class', 'active');
    cy.get('[data-menu-item="dashboard"]').should('have.class', 'active');
    
    // Cambiar a lista
    cy.get('#btnVistaLista').click();
    cy.get('[data-menu-item="lista"]').should('have.class', 'active');
    
    // Cambiar a tareas
    cy.get('[data-menu-item="tareas"]').click();
    cy.get('#tareasView').should('be.visible');
    cy.get('#dashboardView').should('not.be.visible');
    cy.get('#listaView').should('not.be.visible');
  });
});