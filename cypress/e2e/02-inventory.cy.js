describe('Módulo de Inventario - Optimizado', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
    
    // Esperar a que el módulo cargue completamente
    cy.get('#appMenu', {timeout: 5000}).should('exist')
    cy.get('.dashboard-view, .inventario-list-view', {timeout: 5000}).should('exist')
  })

  describe('Vista Dashboard', () => {
    it('Debe mostrar el dashboard por defecto', () => {
      cy.get('.dashboard-view').should('be.visible')
    })

    it('Debe mostrar las estadísticas correctamente', () => {
      cy.get('#statTotal').should('exist')
      cy.get('#statActivos').should('exist')
      cy.get('#statMantenimiento').should('exist')
      cy.get('#statCriticos').should('exist')
    })

    it('Debe mostrar los gráficos del dashboard', () => {
      cy.get('.dashboard-view').within(() => {
        cy.contains('Activos por Tipo').should('be.visible')
        cy.contains('Activos por Departamento').should('be.visible')
        cy.get('canvas').should('have.length.at.least', 2)
      })
    })
    
    it('Debe mostrar acciones rápidas', () => {
      cy.get('#btnVerInventario').should('be.visible')
      cy.get('#btnImportarDashboard').should('be.visible')
      cy.get('#btnReportesDashboard').should('be.visible')
    })
    
    it('Debe navegar a inventario desde acción rápida', () => {
      cy.get('#btnVerInventario').click()
      cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
      cy.get('#filtroTipo').should('be.visible')
    })
  })

  describe('Vista Lista', () => {
    beforeEach(() => {
      // Solo hacer clic si no estamos ya en la vista de lista
      cy.get('body').then($body => {
        if (!$body.find('.inventario-list-view').length) {
          cy.get('#btnVerInventario').click()
        }
      })
      cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
    })

    it('Debe cambiar a vista de lista correctamente', () => {
      cy.get('.inventario-list-view').should('be.visible')
      cy.get('.dashboard-view').should('not.exist')
      cy.get('#tablaActivos').should('be.visible')
    })

    it('Debe mostrar la tabla de activos', () => {
      cy.get('#tablaActivos').should('be.visible')
      cy.get('table thead th').should('contain', 'Tipo')
      cy.get('table thead th').should('contain', 'Nombre')
      cy.get('table thead th').should('contain', 'Responsable')
      cy.get('table thead th').should('contain', 'Departamento')
      cy.get('table thead th').should('contain', 'Estado')
      cy.get('table thead th').should('contain', 'Criticidad')
    })
    
    it('Debe mostrar filtros en la vista de lista', () => {
      cy.get('#filtroTipo').should('be.visible')
      cy.get('#filtroDepartamento').should('be.visible')
      cy.get('#filtroBusqueda').should('be.visible')
      cy.get('#btnBuscar').should('be.visible')
    })
  })

  describe('Crear Activos', () => {
    it('Debe crear un nuevo activo correctamente', () => {
      cy.fixture('test-data.json').then((data) => {
        const asset = data.assets[0]
        
        cy.get('#btnVerInventario').click()
        cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
        
        cy.createAsset(asset)
        
        // Verificar sin wait
        cy.get('#tablaActivos').should('contain', asset.nombre)
        cy.get('#tablaActivos').should('contain', asset.responsable)
        cy.get('#tablaActivos').should('contain', asset.departamento)
      })
    })

    it('Debe validar campos requeridos', () => {
      cy.get('#btnVerInventario').click()
      cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
      
      cy.get('#btnNuevoActivo').click()
      // Esperar a que el modal se muestre completamente
      cy.get('#modalActivo').should('have.class', 'show')
      cy.get('#modalActivo').should('be.visible')
      
      // Intentar guardar sin datos
      cy.get('#btnGuardarActivo').click()
      
      // Verificar que no se cierra el modal
      cy.get('#modalActivo').should('be.visible')
      
      // Cerrar modal
      cy.get('#modalActivo .btn-close').click()
      // Verificar que volvemos a la lista
      cy.get('.inventario-list-view').should('be.visible')
    })

    it('Debe crear múltiples activos', () => {
      cy.fixture('test-data.json').then((data) => {
        cy.get('#btnVerInventario').click()
        cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
        
        // Crear varios activos sin waits
        data.assets.slice(0, 3).forEach(asset => {
          cy.createAsset(asset)
        })
        
        // Verificar en tabla
        cy.get('#tablaActivos tr').should('have.length.at.least', 3)
        
        // Navegar de vuelta al dashboard
        cy.get('[data-menu-item="dashboard"]').click()
        cy.get('.dashboard-view', {timeout: 3000}).should('be.visible')
        
        // Verificar estadísticas
        cy.get('#statTotal').invoke('text').should('match', /\d+/)
      })
    })
  })

  describe('Filtros', () => {
    beforeEach(() => {
      cy.get('#btnVerInventario').click()
      cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
    })

    it('Debe filtrar por tipo de activo', () => {
      cy.filterAssets({ tipo: 'Hardware' })
      
      // Usar intercept para esperar respuesta
      cy.get('#tablaActivos .badge').each(($badge) => {
        if ($badge.parent().index() === 0) {
          cy.wrap($badge).should('contain', 'Hardware')
        }
      })
    })

    it('Debe filtrar por departamento', () => {
      cy.filterAssets({ departamento: 'TI' })
      cy.get('#tablaActivos tr').should('have.length.at.least', 1)
    })

    it('Debe buscar por texto', () => {
      cy.filterAssets({ busqueda: 'Servidor' })
      cy.get('#tablaActivos').should('contain', 'Servidor')
    })

    it('Debe combinar múltiples filtros', () => {
      cy.filterAssets({
        tipo: 'Hardware',
        departamento: 'TI',
        busqueda: 'Servidor'
      })
      
      cy.get('#tablaActivos tr').should('have.length.at.least', 1)
    })
  })

  describe('Editar y Eliminar', () => {
    it('Debe permitir editar un activo y guardar los cambios', () => {
      const uniqueName = `Activo Editable ${Date.now()}`
      const updatedResponsable = 'Responsable Actualizado E2E'
      
      // Intercept para esperar guardado
      cy.intercept('POST', '/api/inventario/activos').as('createAsset')
      cy.intercept('PUT', '/api/inventario/activos/*').as('updateAsset')
      
      cy.get('#btnVerInventario').click()
      cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
      
      // Crear activo
      cy.get('#btnNuevoActivo').click()
      cy.get('#modalActivo').should('have.class', 'show')
      cy.get('#modalActivo').should('be.visible')
      cy.get('#tipoActivo').select('Hardware')
      cy.get('#estadoActivo').select('Activo')
      cy.get('#nombreActivo').type(uniqueName)
      cy.get('#responsableActivo').type('Responsable Original')
      cy.get('#departamentoActivo').type('TI')
      cy.get('#btnGuardarActivo').click()
      
      // Esperar creación
      cy.wait('@createAsset')
      cy.get('#modalActivo').should('not.have.class', 'show')
      
      // Buscar y editar
      cy.get('#tablaActivos').contains(uniqueName)
        .parent('tr')
        .within(() => {
          cy.get('.btn-outline-primary').click()
        })
      
      cy.get('#modalActivoTitle').should('contain', 'Editar Activo')
      cy.get('#nombreActivo').should('have.value', uniqueName)
      
      // Realizar cambios
      cy.get('#responsableActivo').clear().type(updatedResponsable)
      cy.get('#criticidadActivo').select('Crítica')
      cy.get('#estadoActivo').select('En mantenimiento')
      
      cy.get('#btnGuardarActivo').click()
      
      // Esperar actualización
      cy.wait('@updateAsset')
      cy.get('#modalActivo').should('not.have.class', 'show')
      
      // Verificar cambios - dar tiempo para que se actualice la tabla
      cy.get('#tablaActivos', {timeout: 5000}).contains(uniqueName)
        .parent('tr')
        .within(() => {
          cy.contains('Crítica').should('exist')
          cy.contains('En mantenimiento').should('exist')
          // Verificar responsable de la misma manera
          cy.contains(updatedResponsable).should('exist')
        })
    })

    it('Debe solicitar confirmación antes de eliminar un activo', () => {
      const uniqueName = `Activo para Eliminar ${Date.now()}`
      
      cy.intercept('DELETE', '/api/inventario/activos/*').as('deleteAsset')
      
      cy.get('#btnVerInventario').click()
      cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
      
      // Crear activo
      cy.get('#btnNuevoActivo').click()
      cy.get('#modalActivo').should('have.class', 'show')
      cy.get('#modalActivo').should('be.visible')
      cy.get('#tipoActivo').select('Software')
      cy.get('#estadoActivo').select('Activo')
      cy.get('#nombreActivo').type(uniqueName)
      cy.get('#responsableActivo').type('Usuario Test')
      cy.get('#departamentoActivo').type('TI')
      cy.get('#btnGuardarActivo').click()
      
      cy.get('#modalActivo').should('not.have.class', 'show')
      cy.get('#tablaActivos').contains(uniqueName).should('exist')
      
      // Interceptar confirmación
      let confirmShown = false
      cy.on('window:confirm', (str) => {
        confirmShown = true
        expect(str).to.include('eliminar')
        return true
      })
      
      // Eliminar
      cy.get('#tablaActivos').contains(uniqueName)
        .parent('tr')
        .within(() => {
          cy.get('.btn-outline-danger').click()
        })
      
      // Verificar
      cy.wrap(null).then(() => {
        expect(confirmShown).to.be.true
      })
      
      cy.wait('@deleteAsset')
      cy.get('#tablaActivos').contains(uniqueName).should('not.exist')
    })
  })

  describe('Menú del Módulo', () => {
    it('Debe mostrar todas las opciones del menú', () => {
      cy.get('[data-menu-item="dashboard"]').should('be.visible')
      cy.get('[data-menu-item="inventario"]').should('be.visible')
      cy.get('[data-menu-item="nuevo"]').should('be.visible')
      cy.get('[data-menu-item="importar"]').should('be.visible')
      cy.get('[data-menu-item="reportes"]').should('be.visible')
      cy.get('[data-menu-item="auditoria"]').should('be.visible')
    })

    it('Debe navegar entre opciones del menú', () => {
      // Dashboard a inventario
      cy.get('[data-menu-item="inventario"]').click()
      cy.get('.inventario-list-view').should('be.visible')
      
      // Inventario a dashboard
      cy.get('[data-menu-item="dashboard"]').click()
      cy.get('.dashboard-view').should('be.visible')
      
      // Nuevo activo
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalActivo').should('be.visible')
      cy.get('#modalActivo .btn-close').click()
      cy.get('#modalActivo').should('not.have.class', 'show')
      
      // Importar
      cy.get('[data-menu-item="importar"]').click()
      cy.get('#modalImportar').should('be.visible')
      cy.get('#modalImportar .btn-close').click()
      cy.get('#modalImportar').should('not.have.class', 'show')
    })
  })
})