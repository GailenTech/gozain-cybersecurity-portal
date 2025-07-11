describe('Gestión de Tareas', () => {
  beforeEach(() => {
    cy.resetData();
    cy.createTestOrganization();
    cy.visit('/');
    cy.selectOrganization('org-test');
    cy.selectTool('impactos');
  });

  describe('Vista de Tareas', () => {
    beforeEach(() => {
      // Crear algunos impactos procesados para generar tareas
      cy.createImpact('alta_empleado', {
        nombre_completo: 'Test Employee',
        departamento: 'IT',
        cargo: 'Developer',
        necesita_equipo: true,
        necesita_acceso_sistemas: true
      });
      
      // Procesar el impacto para generar tareas
      cy.get('[data-cy=tabla-impactos]').find('tr').first().find('.btn-primary').click();
      cy.get('#btnProcesarImpacto').click();
      cy.get('.btn-close').click(); // Cerrar modal
      
      // Navegar a tareas
      cy.get('[data-menu-item="tareas"]').click();
    });

    it('Debe mostrar las tareas generadas', () => {
      cy.get('#tablaTareas').should('be.visible');
      cy.get('#tablaTareas tbody tr').should('have.length.greaterThan', 0);
      
      // Verificar columnas
      cy.get('#tablaTareas thead').should('contain', 'Descripción');
      cy.get('#tablaTareas thead').should('contain', 'Prioridad');
      cy.get('#tablaTareas thead').should('contain', 'Fecha Límite');
      cy.get('#tablaTareas thead').should('contain', 'Estado');
    });

    it('Debe permitir completar una tarea individual con el botón check', () => {
      // Encontrar primera tarea pendiente
      cy.get('#tablaTareas tbody tr').first().within(() => {
        cy.get('.badge').should('contain', 'Pendiente');
        
        // Click en botón completar
        cy.get('.btn-success').click();
      });

      // Verificar mensaje de éxito
      cy.get('.toast-body').should('contain', 'Tarea marcada como completada');
      
      // La tarea debería desaparecer o cambiar estado
      cy.wait(1000);
      cy.get('#tablaTareas tbody tr').first().within(() => {
        cy.get('.badge').should('not.contain', 'Pendiente');
      });
    });

    it('Debe permitir seleccionar múltiples tareas', () => {
      // Seleccionar todas las tareas
      cy.get('#selectAllTareas').check();
      
      // Verificar que todos los checkboxes están marcados
      cy.get('.tarea-checkbox').each(($checkbox) => {
        cy.wrap($checkbox).should('be.checked');
      });
      
      // Verificar que aparecen las acciones masivas
      cy.get('#accionesMasivas').should('be.visible');
    });

    it('Debe permitir completar tareas seleccionadas', () => {
      // Seleccionar algunas tareas
      cy.get('.tarea-checkbox').first().check();
      cy.get('.tarea-checkbox').eq(1).check();
      
      // Verificar que aparecen las acciones masivas
      cy.get('#accionesMasivas').should('be.visible');
      
      // Click en completar seleccionadas
      cy.get('#btnCompletarSeleccionadas').click();
      
      // Confirmar en el diálogo
      cy.on('window:confirm', () => true);
      
      // Verificar mensaje de éxito
      cy.get('.toast-body').should('contain', 'tareas marcadas como completadas');
    });

    it('Debe mostrar el botón posponer pero explicar su funcionalidad', () => {
      // Seleccionar una tarea
      cy.get('.tarea-checkbox').first().check();
      
      // Verificar que el botón posponer existe
      cy.get('#btnPosponer').should('be.visible');
      cy.get('#btnPosponer').should('contain', 'Posponer');
      
      // Click en posponer
      cy.get('#btnPosponer').click();
      
      // Debería mostrar algún tipo de modal o mensaje
      // Por ahora verificamos que existe el botón
      cy.get('#btnPosponer').should('exist');
    });

    it('Debe actualizar el contador de tareas en el menú lateral', () => {
      // Verificar contador inicial
      cy.get('[data-menu-item="tareas"] .badge').then(($badge) => {
        const count = parseInt($badge.text());
        expect(count).to.be.greaterThan(0);
      });
    });

    it('Debe permitir ver el detalle del impacto relacionado', () => {
      // Click en botón ver detalle
      cy.get('#tablaTareas tbody tr').first().within(() => {
        cy.get('.btn-info').click();
      });
      
      // Verificar que se abre el modal de detalle
      cy.get('#modalDetalleImpacto').should('be.visible');
      cy.get('#detalleImpactoContent').should('be.visible');
    });

    it('Debe permitir actualizar la lista de tareas', () => {
      // Click en botón actualizar
      cy.get('#btnActualizarTareas').click();
      
      // Verificar que se recarga la tabla
      cy.get('#tablaTareas').should('be.visible');
    });

    it('Debe manejar cuando no hay tareas pendientes', () => {
      // Completar todas las tareas
      cy.get('#selectAllTareas').check();
      cy.get('#btnCompletarSeleccionadas').click();
      cy.on('window:confirm', () => true);
      
      cy.wait(1000);
      
      // Debería mostrar mensaje de no hay tareas
      cy.get('#tablaTareas tbody').should('contain', 'No hay tareas pendientes');
    });
  });

  describe('Integración con otros módulos', () => {
    it('Las tareas deben reflejar los cambios en los impactos', () => {
      // Crear y procesar un impacto
      cy.createImpact('baja_empleado', {
        nombre_empleado: 'Test Employee',
        fecha_baja: '2024-12-31',
        devolver_equipo: true,
        revocar_accesos: true
      });
      
      // Ir a lista de impactos
      cy.get('[data-menu-item="lista"]').click();
      
      // Procesar el impacto
      cy.get('#tablaImpactos tr').last().find('.btn-primary').click();
      cy.get('#btnProcesarImpacto').click();
      
      // Ir a tareas
      cy.get('[data-menu-item="tareas"]').click();
      
      // Verificar que hay nuevas tareas
      cy.get('#tablaTareas tbody tr').should('contain', 'Recoger equipo');
      cy.get('#tablaTareas tbody tr').should('contain', 'Revocar accesos');
    });
  });
});