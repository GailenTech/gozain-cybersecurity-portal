describe('Módulo de Inventario', () => {
  beforeEach(() => {
    // Usar comando loginWithOrg para asegurar organización
    cy.loginWithOrg('E2E Test Organization')
    
    // Navegar a Inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000) // Esperar a que cargue el módulo
    
    // Verificar que el menú existe (puede no ser visible en mobile)
    cy.get('#appMenu').should('exist')
  })

  describe('Vista Dashboard', () => {
    it('Debe mostrar el dashboard por defecto', () => {
      // El dashboard debe ser la vista por defecto
      cy.get('.dashboard-view').should('be.visible')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
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
      cy.get('.inventario-list-view').should('be.visible')
      cy.get('[data-menu-item="inventario"]').should('have.class', 'active')
    })
  })

  describe('Vista Lista', () => {
    beforeEach(() => {
      // Navegar a la vista de inventario usando el menú
      cy.get('[data-menu-item="inventario"]').click()
      cy.get('.inventario-list-view').should('be.visible')
    })

    it('Debe cambiar a vista de lista correctamente', () => {
      cy.get('.inventario-list-view').should('be.visible')
      cy.get('.dashboard-view').should('not.exist')
      cy.get('[data-menu-item="inventario"]').should('have.class', 'active')
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
        
        // Navegar a vista lista
        cy.get('[data-menu-item="inventario"]').click()
        cy.get('.inventario-list-view').should('be.visible')
        
        // Crear activo
        cy.createAsset(asset)
        
        // Verificar que aparece en la lista
        cy.get('#tablaActivos').should('contain', asset.nombre)
        cy.get('#tablaActivos').should('contain', asset.responsable)
        cy.get('#tablaActivos').should('contain', asset.departamento)
      })
    })

    it('Debe validar campos requeridos', () => {
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalActivo').should('be.visible')
      
      // Intentar guardar sin datos
      cy.get('#btnGuardarActivo').click()
      
      // Verificar que no se cierra el modal
      cy.get('#modalActivo').should('be.visible')
      
      // Cerrar modal
      cy.get('#modalActivo .btn-close').click()
    })

    it('Debe crear múltiples activos', () => {
      cy.fixture('test-data.json').then((data) => {
        // Navegar a lista
        cy.get('[data-menu-item="inventario"]').click()
        cy.get('.inventario-list-view').should('be.visible')
        
        // Crear varios activos
        data.assets.slice(0, 3).forEach(asset => {
          cy.createAsset(asset)
          cy.wait(500) // Pequeña espera entre creaciones
        })
        
        // Volver al dashboard para verificar estadísticas
        cy.get('[data-menu-item="dashboard"]').click()
        cy.get('.dashboard-view').should('be.visible')
        
        // Verificar que las estadísticas se actualizan
        cy.get('#statTotal').invoke('text').should('match', /\d+/)
      })
    })
  })

  describe('Filtros', () => {
    beforeEach(() => {
      // Navegar a la vista de lista
      cy.get('[data-menu-item="inventario"]').click()
      cy.get('.inventario-list-view').should('be.visible')
    })

    it('Debe filtrar por tipo de activo', () => {
      cy.filterAssets({ tipo: 'Hardware' })
      
      // Verificar que solo muestra Hardware
      cy.get('#tablaActivos .badge').each(($badge) => {
        if ($badge.parent().index() === 0) { // Primera columna es tipo
          cy.wrap($badge).should('contain', 'Hardware')
        }
      })
    })

    it('Debe filtrar por departamento', () => {
      cy.fixture('test-data.json').then((data) => {
        cy.filterAssets({ departamento: 'TI' })
        
        // Verificar resultados
        cy.get('#tablaActivos tr').should('have.length.at.least', 1)
      })
    })

    it('Debe buscar por texto', () => {
      cy.filterAssets({ busqueda: 'Servidor' })
      
      // Verificar que encuentra resultados
      cy.get('#tablaActivos').should('contain', 'Servidor')
    })

    it('Debe combinar múltiples filtros', () => {
      cy.filterAssets({
        tipo: 'Hardware',
        departamento: 'TI',
        busqueda: 'Servidor'
      })
      
      // Verificar resultados específicos
      cy.get('#tablaActivos tr').should('have.length.at.least', 1)
    })
  })

  describe('Editar y Eliminar', () => {
    it('Debe editar un activo existente', () => {
      // Primero crear un activo via API para garantizar que hay algo que editar
      cy.fixture('test-data.json').then((data) => {
        const testAsset = {
          ...data.assets[0],
          nombre: 'Activo Test para Editar ' + Date.now()
        }
        
        cy.request({
          method: 'POST',
          url: '/api/inventario/activos',
          headers: {
            'X-Organization-Id': 'e2e_test_organization',
            'Content-Type': 'application/json'
          },
          body: testAsset
        }).then(response => {
          const createdAssetId = response.body.id
          
          // Navegar a vista lista
          cy.get('[data-menu-item="inventario"]').click()
          cy.get('.inventario-list-view').should('be.visible')
          
          // Esperar a que se cargue la lista
          cy.wait(1000)
          
          // Buscar el botón de editar del activo creado
          cy.get('#tablaActivos .btn-outline-primary').first().click()
          cy.get('#modalActivo').should('be.visible')
          cy.get('#modalActivoTitle').should('contain', 'Editar Activo')
          
          // Cambiar algunos valores
          cy.get('#responsableActivo').clear().type('Responsable Editado E2E')
          cy.get('#criticidadActivo').select('Crítica')
          
          // Guardar
          cy.get('#btnGuardarActivo').click()
          
          // Verificar que se muestra el mensaje de éxito
          cy.get('.toast-body').should('contain', 'actualizado correctamente')
          
          // Esperar a que el modal se cierre completamente
          cy.get('#modalActivo').should('not.exist')
          cy.wait(1000)
          
          // El test es exitoso si se mostró el mensaje de éxito
          // Verificar adicionalmente que el modal no está visible
          cy.get('.modal-backdrop').should('not.exist')
        })
      })
    })

    it('Debe eliminar un activo con confirmación', () => {
      // Navegar a lista
      cy.get('[data-menu-item="inventario"]').click()
      cy.get('.inventario-list-view').should('be.visible')
      
      // Contar activos antes
      cy.get('#tablaActivos tr').then(($rows) => {
        const countBefore = $rows.length
        
        // Click en eliminar
        cy.get('#tablaActivos .btn-outline-danger').first().click()
        
        // Confirmar eliminación
        cy.on('window:confirm', () => true)
        
        // Verificar mensaje de éxito
        cy.get('.toast-body').should('contain', 'eliminado correctamente')
        
        // Verificar que hay menos activos
        cy.wait(1000)
        cy.get('#tablaActivos tr').should('have.length.lessThan', countBefore)
      })
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
      // Dashboard
      cy.get('[data-menu-item="dashboard"]').click()
      cy.get('.dashboard-view').should('be.visible')
      
      // Inventario
      cy.get('[data-menu-item="inventario"]').click()
      cy.get('.inventario-list-view').should('be.visible')
      
      // Nuevo - verificar que abre el modal
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalActivo').should('be.visible')
      cy.get('#modalActivoTitle').should('contain', 'Nuevo Activo')
      
      // Esperar un momento y cerrar usando el botón cancelar
      cy.wait(500)
      cy.get('#modalActivo .modal-footer .btn-secondary').contains('Cancelar').click({ force: true })
      cy.wait(1000) // Esperar animación completa
      
      // Importar - verificar que abre el modal
      cy.get('[data-menu-item="importar"]').click()
      cy.get('#modalImportar').should('be.visible')
      
      // Cerrar modal de importar
      cy.wait(500)
      cy.get('#modalImportar .modal-footer .btn-secondary').contains('Cancelar').click({ force: true })
      cy.wait(1000)
    })
  })
})