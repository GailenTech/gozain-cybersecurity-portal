describe('Funcionalidad de Inventario', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization');
    cy.get('.tool-card').contains('Inventario de Activos').click();
    cy.wait(1000);
    
    // Navegar a la página de inventario
    cy.get('#appMenu').contains('Inventario de Activos').click();
    cy.url().should('include', '#/inventario');
  });

  describe('Visualización de Activos', () => {
    it('Debe mostrar la tabla de activos', () => {
      cy.get('#tablaActivos').should('exist');
      cy.get('#tablaActivos thead').should('exist');
      cy.get('#tablaActivos tbody tr').should('have.length.greaterThan', 0);
    });

    it('Debe mostrar información completa de activos', () => {
      cy.get('#tablaActivos tbody tr').first().within(() => {
        cy.get('td').should('have.length.greaterThan', 5);
        // Verificar columnas esperadas
        cy.get('td').eq(0).should('not.be.empty'); // ID
        cy.get('td').eq(1).should('not.be.empty'); // Nombre
        cy.get('td').eq(2).should('not.be.empty'); // Tipo
        cy.get('td').eq(3).should('not.be.empty'); // Estado
      });
    });
  });

  describe('Filtrado de Activos', () => {
    it('Debe filtrar por tipo de activo', () => {
      // Obtener cantidad inicial
      cy.get('#tablaActivos tbody tr').then($rows => {
        const initialCount = $rows.length;
        
        // Aplicar filtro
        cy.get('#filtroTipo').select('Hardware');
        cy.get('#btnFiltrar').click();
        
        // Verificar que hay resultados filtrados
        cy.get('#tablaActivos tbody tr').should('have.length.lessThan', initialCount + 1);
        
        // Verificar que todos son del tipo correcto
        cy.get('#tablaActivos tbody tr').each($row => {
          cy.wrap($row).find('td').eq(2).should('contain', 'Hardware');
        });
      });
    });

    it('Debe filtrar por departamento', () => {
      cy.get('#filtroDepartamento').type('TI');
      cy.get('#btnFiltrar').click();
      
      // Verificar que los resultados contienen el departamento
      cy.get('#tablaActivos tbody tr').each($row => {
        cy.wrap($row).find('td').eq(4).should('contain', 'TI');
      });
    });

    it('Debe limpiar filtros', () => {
      // Aplicar filtros
      cy.get('#filtroTipo').select('Software');
      cy.get('#filtroDepartamento').type('Ventas');
      cy.get('#btnFiltrar').click();
      
      // Limpiar filtros
      cy.get('#btnLimpiarFiltros').click();
      
      // Verificar que los filtros están vacíos
      cy.get('#filtroTipo').should('have.value', '');
      cy.get('#filtroDepartamento').should('have.value', '');
    });

    it('Debe buscar por texto', () => {
      // Buscar un término específico
      cy.get('#busquedaActivos').type('servidor');
      cy.get('#btnBuscar').click();
      
      // Verificar que los resultados contienen el término
      cy.get('#tablaActivos tbody tr').should('have.length.greaterThan', 0);
      cy.get('#tablaActivos tbody tr').first().should('contain', 'servidor');
    });
  });

  describe('CRUD de Activos', () => {
    it('Debe crear un nuevo activo', () => {
      // Abrir modal
      cy.get('#btnNuevoActivo').click();
      cy.wait(200);
      
      // Llenar formulario
      cy.get('#modalActivo #nombre').type('Laptop Test ' + Date.now());
      cy.get('#modalActivo #tipo').select('Hardware');
      cy.get('#modalActivo #estado').select('Activo');
      cy.get('#modalActivo #departamento').type('Desarrollo');
      cy.get('#modalActivo #responsable').type('Juan Pérez');
      cy.get('#modalActivo #clasificacion').select('Interno');
      cy.get('#modalActivo #criticidad').select('Normal');
      cy.get('#modalActivo #descripcion').type('Laptop de prueba para desarrollo');
      
      // Guardar
      cy.get('#modalActivo').contains('button', 'Guardar').click();
      
      // Verificar que se cerró el modal
      cy.wait(500);
      cy.get('#modalActivo.show').should('not.exist');
      
      // Verificar que el activo aparece en la tabla
      cy.get('#tablaActivos').should('contain', 'Laptop Test');
    });

    it('Debe editar un activo existente', () => {
      // Click en editar del primer activo
      cy.get('#tablaActivos tbody tr').first().find('.btn-editar').click();
      cy.wait(200);
      
      // Verificar que se abrió el modal en modo edición
      cy.get('#modalActivoTitle').should('contain', 'Editar Activo');
      
      // Modificar algunos campos
      cy.get('#modalActivo #estado').select('En mantenimiento');
      cy.get('#modalActivo #descripcion').clear().type('Actualizado para mantenimiento');
      
      // Guardar
      cy.get('#modalActivo').contains('button', 'Guardar').click();
      
      // Verificar que se actualizó
      cy.wait(500);
      cy.get('#tablaActivos tbody tr').first().should('contain', 'En mantenimiento');
    });

    it('Debe eliminar un activo', () => {
      // Obtener el nombre del primer activo
      cy.get('#tablaActivos tbody tr').first().find('td').eq(1).then($td => {
        const nombreActivo = $td.text();
        
        // Click en eliminar
        cy.get('#tablaActivos tbody tr').first().find('.btn-eliminar').click();
        
        // Confirmar eliminación
        cy.on('window:confirm', () => true);
        
        // Verificar que ya no aparece
        cy.wait(500);
        cy.get('#tablaActivos').should('not.contain', nombreActivo);
      });
    });
  });

  describe('Importación de Activos', () => {
    it('Debe mostrar preview al seleccionar archivo', () => {
      cy.get('#appMenu').contains('Importar').click();
      cy.wait(200);
      
      // Crear archivo CSV de prueba
      const csvContent = 'nombre,tipo,estado,departamento\nServidor Test,Hardware,Activo,TI';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      
      // Seleccionar archivo
      cy.get('#archivoImportar').selectFile({
        contents: Cypress.Buffer.from(csvContent),
        fileName: 'test.csv',
        mimeType: 'text/csv'
      });
      
      // Verificar preview
      cy.get('#previewImportar').should('exist');
      cy.get('#tablaPreview').should('exist');
    });
  });

  describe('Exportación de Activos', () => {
    it('Debe exportar activos filtrados', () => {
      // Aplicar filtro
      cy.get('#filtroTipo').select('Software');
      cy.get('#btnFiltrar').click();
      
      // Interceptar exportación
      cy.intercept('GET', '**/api/inventario/activos/export*', {
        statusCode: 200,
        body: 'CSV data',
        headers: {
          'content-type': 'text/csv'
        }
      }).as('exportRequest');
      
      // Exportar
      cy.get('#btnExportar').click();
      
      // Verificar que se envió con filtros
      cy.wait('@exportRequest').then((interception) => {
        expect(interception.request.url).to.include('tipo=Software');
      });
    });
  });

  describe('Validaciones', () => {
    it('Debe validar campos requeridos en nuevo activo', () => {
      cy.get('#btnNuevoActivo').click();
      cy.wait(200);
      
      // Intentar guardar sin llenar campos requeridos
      cy.get('#modalActivo').contains('button', 'Guardar').click();
      
      // Verificar que muestra validación
      cy.get('#modalActivo #nombre:invalid').should('exist');
    });

    it('Debe mostrar mensaje cuando no hay resultados', () => {
      // Buscar algo que no existe
      cy.get('#busquedaActivos').type('xyznoexiste123');
      cy.get('#btnBuscar').click();
      
      // Verificar mensaje
      cy.get('#tablaActivos').should('contain', 'No se encontraron activos');
    });
  });
});