describe('Módulo de Inventario', () => {
  beforeEach(() => {
    // Usar comando loginWithOrg para asegurar organización
    cy.loginWithOrg('E2E Test Organization')
    
    // Navegar a Inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  describe('Vista Dashboard', () => {
    it('Debe mostrar el dashboard por defecto', () => {
      cy.get('#dashboardView').should('be.visible')
      cy.get('#btnVistaDashboard').should('have.class', 'active')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    })

    it('Debe mostrar las estadísticas correctamente', () => {
      cy.get('#statTotal').should('exist')
      cy.get('#statActivos').should('exist')
      cy.get('#statMantenimiento').should('exist')
      cy.get('#statCriticos').should('exist')
    })

    it('Debe mostrar los gráficos del dashboard', () => {
      cy.get('#dashboardView').within(() => {
        cy.contains('Activos por Tipo').should('be.visible')
        cy.contains('Activos por Departamento').should('be.visible')
        cy.get('canvas').should('have.length.at.least', 2)
      })
    })
  })

  describe('Vista Lista', () => {
    beforeEach(() => {
      cy.switchView('lista')
    })

    it('Debe cambiar a vista de lista correctamente', () => {
      cy.get('#listaView').should('be.visible')
      cy.get('#dashboardView').should('not.be.visible')
      cy.get('#btnVistaLista').should('have.class', 'active')
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
  })

  describe('Crear Activos', () => {
    it('Debe crear un nuevo activo correctamente', () => {
      cy.fixture('test-data.json').then((data) => {
        const asset = data.assets[0]
        
        // Cambiar a vista lista para ver el resultado
        cy.switchView('lista')
        
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
        cy.switchView('lista')
        
        // Crear varios activos
        data.assets.slice(0, 3).forEach(asset => {
          cy.createAsset(asset)
          cy.wait(500) // Pequeña espera entre creaciones
        })
        
        // Verificar que las estadísticas se actualizan
        cy.get('#statTotal').invoke('text').should('match', /\d+/)
      })
    })
  })

  describe('Filtros', () => {
    beforeEach(() => {
      cy.switchView('lista')
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
      cy.switchView('lista')
      
      // Click en editar del primer activo
      cy.get('#tablaActivos .btn-outline-primary').first().click()
      cy.get('#modalActivo').should('be.visible')
      cy.get('#modalActivoTitle').should('contain', 'Editar Activo')
      
      // Cambiar algunos valores
      cy.get('#responsableActivo').clear().type('Nuevo Responsable')
      cy.get('#criticidadActivo').select('Crítica')
      
      // Guardar
      cy.get('#btnGuardarActivo').click()
      cy.get('.toast-body').should('contain', 'actualizado correctamente')
      
      // Verificar cambios
      cy.get('#tablaActivos').should('contain', 'Nuevo Responsable')
    })

    it('Debe eliminar un activo con confirmación', () => {
      cy.switchView('lista')
      
      // Contar activos antes
      cy.get('#statTotal').invoke('text').then((totalBefore) => {
        // Click en eliminar
        cy.get('#tablaActivos .btn-outline-danger').first().click()
        
        // Confirmar eliminación
        cy.on('window:confirm', () => true)
        
        // Verificar mensaje de éxito
        cy.get('.toast-body').should('contain', 'eliminado correctamente')
        
        // Verificar que el total disminuyó
        cy.get('#statTotal').invoke('text').should('not.equal', totalBefore)
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
      cy.get('#dashboardView').should('be.visible')
      
      // Inventario
      cy.get('[data-menu-item="inventario"]').click()
      cy.get('#listaView').should('be.visible')
      
      // Nuevo
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalActivo').should('be.visible')
      cy.get('#modalActivo .btn-close').click()
      
      // Importar
      cy.get('[data-menu-item="importar"]').click()
      cy.get('#modalImportar').should('be.visible')
      cy.get('#modalImportar .btn-close').click()
    })
  })
})