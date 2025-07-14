describe('Navegación Completa del Sistema', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000);
  });

  describe('Navegación del Menú Lateral', () => {
    it('Debe navegar entre Dashboard e Inventario', () => {
      // Verificar Dashboard inicial
      cy.url().should('include', '#/dashboard');
      cy.contains('h2', 'Dashboard de Inventario').should('exist');
      
      // Navegar a Inventario
      cy.get('#appMenu').contains('Inventario de Activos').click();
      cy.url().should('include', '#/inventario');
      cy.contains('h2', 'Inventario de Activos').should('exist');
      
      // Volver a Dashboard
      cy.get('#appMenu').contains('Dashboard').click();
      cy.url().should('include', '#/dashboard');
      cy.contains('h2', 'Dashboard de Inventario').should('exist');
    });

    it('Debe navegar a Reportes', () => {
      cy.get('#appMenu').contains('Reportes').click();
      cy.url().should('include', '#/reportes');
      cy.contains('h2', 'Reportes').should('exist');
      cy.contains('Módulo de reportes en desarrollo').should('exist');
    });

    it('Debe navegar a Auditoría', () => {
      cy.get('#appMenu').contains('Auditoría').click();
      cy.url().should('include', '#/auditoria');
      cy.contains('h2', 'Auditoría').should('exist');
      cy.contains('Módulo de auditoría en desarrollo').should('exist');
    });

    it('Debe mantener estado activo del menú', () => {
      // Dashboard activo por defecto
      cy.get('#appMenu li[data-menu-id="dashboard"] .nav-link').should('have.class', 'active');
      
      // Navegar a Inventario
      cy.get('#appMenu').contains('Inventario de Activos').click();
      cy.get('#appMenu li[data-menu-id="inventario"] .nav-link').should('have.class', 'active');
      cy.get('#appMenu li[data-menu-id="dashboard"] .nav-link').should('not.have.class', 'active');
    });
  });

  describe('Acciones del Menú', () => {
    it('Debe abrir modal de Nuevo Activo desde el menú', () => {
      cy.get('#appMenu').contains('Nuevo Activo').click();
      cy.wait(200); // Esperar animación
      
      cy.get('#modalActivo').should('exist');
      cy.get('#modalActivoTitle').should('contain', 'Nuevo Activo');
      
      // Cerrar con botón X
      cy.get('#modalActivo .btn-close').click();
      cy.wait(200);
      cy.get('#modalActivo.show').should('not.exist');
    });

    it('Debe abrir modal de Importar desde el menú', () => {
      cy.get('#appMenu').contains('Importar').click();
      cy.wait(200);
      
      cy.get('#modalImportar').should('exist');
      cy.get('#modalImportarTitle').should('contain', 'Importar Activos');
      
      // Cerrar con botón Cancelar
      cy.get('#modalImportar').contains('button', 'Cancelar').click();
      cy.wait(200);
      cy.get('#modalImportar.show').should('not.exist');
    });

    it('Debe ejecutar Exportar desde el menú', () => {
      // Interceptar la llamada de exportación
      cy.intercept('GET', '**/api/inventario/activos/export', {
        statusCode: 200,
        body: 'CSV data',
        headers: {
          'content-type': 'text/csv'
        }
      }).as('exportRequest');
      
      cy.get('#appMenu').contains('Exportar').click();
      cy.wait('@exportRequest');
    });
  });

  describe('Navegación con Botones del Navegador', () => {
    it('Debe mantener historial y permitir navegación con botones atrás/adelante', () => {
      // Navegar a varias páginas
      cy.get('#appMenu').contains('Inventario de Activos').click();
      cy.url().should('include', '#/inventario');
      
      cy.get('#appMenu').contains('Reportes').click();
      cy.url().should('include', '#/reportes');
      
      cy.get('#appMenu').contains('Auditoría').click();
      cy.url().should('include', '#/auditoria');
      
      // Navegar atrás
      cy.go('back');
      cy.url().should('include', '#/reportes');
      cy.contains('h2', 'Reportes').should('exist');
      
      cy.go('back');
      cy.url().should('include', '#/inventario');
      cy.contains('h2', 'Inventario de Activos').should('exist');
      
      // Navegar adelante
      cy.go('forward');
      cy.url().should('include', '#/reportes');
      cy.contains('h2', 'Reportes').should('exist');
    });
  });

  describe('Navegación desde Dashboard', () => {
    it('Debe navegar a Inventario con botón Ver Inventario', () => {
      cy.get('#btnVerInventario').click();
      cy.url().should('include', '#/inventario');
      cy.contains('h2', 'Inventario de Activos').should('exist');
    });

    it('Debe abrir modal Nuevo Activo desde Dashboard', () => {
      cy.get('#btnNuevoActivoDashboard').click();
      cy.wait(200);
      
      cy.get('#modalActivo').should('exist');
      cy.get('#modalActivoTitle').should('contain', 'Nuevo Activo');
      
      // Verificar que se puede cerrar
      cy.get('#modalActivo .btn-close').click();
      cy.wait(200);
      cy.get('#modalActivo.show').should('not.exist');
    });
  });

  describe('Persistencia de Estado en Navegación', () => {
    it('Debe mantener filtros al navegar', () => {
      // Ir a inventario
      cy.get('#appMenu').contains('Inventario de Activos').click();
      
      // Aplicar filtro
      cy.get('#filtroTipo').select('Hardware');
      cy.get('#btnFiltrar').click();
      
      // Navegar a otra página
      cy.get('#appMenu').contains('Dashboard').click();
      
      // Volver a inventario
      cy.get('#appMenu').contains('Inventario de Activos').click();
      
      // Verificar que el filtro persiste
      cy.get('#filtroTipo').should('have.value', 'Hardware');
    });
  });
});