describe('Problemas Reportados', () => {
  beforeEach(() => {
    cy.resetData();
    cy.createTestOrganization();
    cy.visit('/');
    cy.selectOrganization('org-test');
  });

  describe('Funcionalidad de Tareas', () => {
    beforeEach(() => {
      cy.selectTool('impactos');
      
      // Crear y procesar un impacto para generar tareas
      cy.get('[data-menu-item="nuevo"]').click();
      cy.get('#tipoImpacto').select('alta_empleado');
      cy.wait(500);
      
      cy.get('#nombre_completo').type('Test User');
      cy.get('#departamento').type('IT');
      cy.get('#cargo').type('Developer');
      cy.get('#necesita_equipo').check();
      cy.get('#necesita_acceso_sistemas').check();
      cy.get('#btnCrearImpacto').click();
      
      cy.wait(1000);
      cy.get('#btnProcesarImpacto').click();
      cy.wait(500);
      
      // Ir a tareas
      cy.get('[data-menu-item="tareas"]').click();
    });

    it('Problema: Completar tarea con el check no funciona correctamente', () => {
      // Verificar estado inicial
      cy.get('#tablaTareas tbody tr').should('exist');
      
      // Intentar completar tarea con botón check
      cy.get('#tablaTareas tbody tr').first().within(() => {
        // Verificar que la tarea está pendiente
        cy.get('.badge').should('contain', 'Pendiente');
        
        // Click en el botón check
        cy.get('.btn-success i.bi-check').parent().click();
      });
      
      // PROBLEMA ESPERADO: La tarea no se completa realmente
      // Solo muestra un mensaje pero no actualiza el estado
      cy.get('.toast-body').should('contain', 'Tarea marcada como completada');
      
      // Verificar que la tarea sigue apareciendo como pendiente
      // (Este es el problema - debería cambiar de estado o desaparecer)
      cy.get('#tablaTareas tbody tr').first().within(() => {
        cy.get('.badge').should('contain', 'Pendiente');
      });
    });

    it('Problema: Completar seleccionadas no persiste cambios', () => {
      // Seleccionar varias tareas
      cy.get('.tarea-checkbox').eq(0).check();
      cy.get('.tarea-checkbox').eq(1).check();
      
      // Guardar cantidad inicial de tareas
      cy.get('#tablaTareas tbody tr').then($rows => {
        const initialCount = $rows.length;
        
        // Completar seleccionadas
        cy.get('#btnCompletarSeleccionadas').click();
        cy.on('window:confirm', () => true);
        
        // Verificar mensaje
        cy.get('.toast-body').should('contain', 'tareas marcadas como completadas');
        
        // PROBLEMA ESPERADO: Las tareas siguen apareciendo
        cy.get('#tablaTareas tbody tr').should('have.length', initialCount);
      });
    });

    it('Problema: Botón posponer no tiene funcionalidad implementada', () => {
      // Seleccionar una tarea
      cy.get('.tarea-checkbox').first().check();
      
      // Click en posponer
      cy.get('#btnPosponer').click();
      
      // PROBLEMA ESPERADO: No pasa nada
      // No hay modal, no hay cambio de fecha, no hay mensaje
      // El botón existe pero no hace nada
      
      // Verificar que no apareció ningún modal
      cy.get('.modal.show').should('not.exist');
      
      // Verificar que no hay cambios en la interfaz
      cy.get('#tablaTareas tbody tr').first().within(() => {
        cy.get('.badge').should('contain', 'Pendiente');
      });
    });
  });

  describe('Problemas de Persistencia', () => {
    it('Las tareas no se almacenan en el backend', () => {
      cy.selectTool('impactos');
      
      // Ir directamente a tareas (sin crear impactos nuevos)
      cy.get('[data-menu-item="tareas"]').click();
      
      // PROBLEMA ESPERADO: Las tareas se generan dinámicamente
      // No hay persistencia real
      cy.get('#tablaTareas tbody').should('contain', 'No hay tareas pendientes');
    });

    it('Los cambios en tareas no afectan otros módulos', () => {
      cy.selectTool('impactos');
      
      // Crear impacto
      cy.createImpact('alta_empleado', {
        nombre_completo: 'Test Integration',
        departamento: 'IT',
        cargo: 'Manager',
        necesita_equipo: true
      });
      
      // Procesar impacto
      cy.get('#tablaImpactos tr').last().find('.btn-primary').click();
      cy.get('#btnProcesarImpacto').click();
      cy.wait(500);
      
      // Ir a inventario para verificar si se creó el activo
      cy.get('#toolSelectorButton').click();
      cy.get('.tool-card').contains('Inventario de Activos').click();
      cy.get('[data-menu-item="lista"]').click();
      
      // Verificar que se creó el activo
      cy.get('#tablaActivos').should('contain', 'Laptop');
      
      // Volver a impactos y "completar" tarea
      cy.get('#toolSelectorButton').click();
      cy.get('.tool-card').contains('Impactos de Negocio').click();
      cy.get('[data-menu-item="tareas"]').click();
      
      cy.get('#tablaTareas tbody tr').contains('equipo').parent().within(() => {
        cy.get('.btn-success').click();
      });
      
      // PROBLEMA ESPERADO: Completar la tarea no actualiza el estado del activo
      // El activo sigue igual en el inventario
    });
  });

  describe('Funcionalidades Faltantes', () => {
    it('No hay forma de editar una tarea', () => {
      cy.selectTool('impactos');
      cy.get('[data-menu-item="tareas"]').click();
      
      // Buscar botones de edición
      cy.get('#tablaTareas tbody tr').first().within(() => {
        // No hay botón de editar
        cy.get('.btn-warning').should('not.exist');
        cy.get('i.bi-pencil').should('not.exist');
      });
    });

    it('No hay filtros en la vista de tareas', () => {
      cy.selectTool('impactos');
      cy.get('[data-menu-item="tareas"]').click();
      
      // Verificar que no hay filtros disponibles
      cy.get('#filtrosSection').should('not.be.visible');
      
      // No hay forma de filtrar por prioridad, estado, fecha, etc.
      cy.get('#filtroPrioridad').should('not.exist');
      cy.get('#filtroEstadoTarea').should('not.exist');
    });

    it('No hay vista de calendario para tareas', () => {
      cy.selectTool('impactos');
      
      // No existe opción de vista calendario
      cy.get('[data-menu-item="calendario"]').should('not.exist');
      cy.get('#btnVistaCalendario').should('not.exist');
    });

    it('Falta integración real con el sistema de notificaciones', () => {
      cy.selectTool('impactos');
      
      // Las tareas vencidas no generan notificaciones
      // No hay indicadores visuales de tareas próximas a vencer
      cy.get('[data-menu-item="tareas"]').click();
      
      // No hay badges o alertas para tareas urgentes
      cy.get('.alert-warning').should('not.exist');
      cy.get('.text-danger').should('not.exist');
    });
  });
});