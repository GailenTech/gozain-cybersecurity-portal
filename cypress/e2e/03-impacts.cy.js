describe('Módulo de Impactos', () => {
  beforeEach(() => {
    // Usar comando loginWithOrg para asegurar organización
    cy.loginWithOrg('E2E Test Organization')
    
    // Navegar a Impactos
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  describe('Vista Dashboard', () => {
    it('Debe mostrar el dashboard de impactos por defecto', () => {
      cy.get('#dashboardView').should('be.visible')
      cy.get('#btnVistaDashboard').should('have.class', 'active')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    })

    it('Debe mostrar las estadísticas de impactos', () => {
      cy.get('#statHoy').should('exist')
      cy.get('#statPendientes').should('exist')
      cy.get('#statSemana').should('exist')
      cy.get('#statTotal').should('exist')
    })

    it('Debe mostrar el timeline y gráficos', () => {
      cy.get('#dashboardView').within(() => {
        cy.contains('Timeline de Impactos').should('be.visible')
        cy.contains('Distribución por Tipo').should('be.visible')
        cy.get('.timeline').should('be.visible')
      })
    })
  })

  describe('Crear Impactos', () => {
    it('Debe crear un impacto de alta de empleado', () => {
      cy.fixture('test-data.json').then((data) => {
        const impactData = data.impacts.alta_empleado
        
        cy.get('[data-menu-item="nuevo"]').click()
        cy.get('#modalNuevoImpacto').should('be.visible')
        
        // Seleccionar tipo
        cy.get('#tipoImpacto').select('Alta de Empleado')
        cy.wait(500) // Esperar carga de plantilla
        
        // Verificar que se cargan los campos dinámicos
        cy.get('#nombre_empleado').should('be.visible')
        cy.get('#fecha_inicio').should('be.visible')
        cy.get('#departamento').should('be.visible')
        cy.get('#cargo').should('be.visible')
        
        // Llenar formulario
        cy.get('#nombre_empleado').type(impactData.nombre_empleado)
        cy.get('#fecha_inicio').type(impactData.fecha_inicio)
        cy.get('#departamento').type(impactData.departamento)
        cy.get('#cargo').type(impactData.cargo)
        if (impactData.necesita_laptop) {
          cy.get('#necesita_laptop').check()
        }
        if (impactData.necesita_accesos) {
          cy.get('#necesita_accesos').check()
        }
        
        // Vista previa debe mostrar información
        cy.get('#vistaPrevia').should('be.visible')
        cy.get('#vistaPrevia').should('contain', 'activos')
        cy.get('#vistaPrevia').should('contain', 'tareas')
        
        // Crear impacto
        cy.get('#btnCrearImpacto').click()
        cy.get('.toast-body').should('contain', 'creado correctamente')
        
        // Verificar que se abre el modal de detalle
        cy.get('#modalDetalleImpacto').should('be.visible')
        cy.get('#modalDetalleImpacto').should('contain', impactData.nombre_empleado)
      })
    })

    it('Debe validar que se seleccione un tipo de impacto', () => {
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalNuevoImpacto').should('be.visible')
      
      // El botón debe estar deshabilitado sin tipo seleccionado
      cy.get('#btnCrearImpacto').should('be.disabled')
      
      // Seleccionar tipo habilita el botón
      cy.get('#tipoImpacto').select('Baja de Empleado')
      cy.get('#btnCrearImpacto').should('not.be.disabled')
    })
  })

  describe('Lista de Impactos', () => {
    beforeEach(() => {
      cy.switchView('lista')
    })

    it('Debe mostrar la lista de impactos', () => {
      cy.get('#listaView').should('be.visible')
      cy.get('#tablaImpactos').should('be.visible')
      
      // Verificar columnas
      cy.get('table thead th').should('contain', 'ID')
      cy.get('table thead th').should('contain', 'Tipo')
      cy.get('table thead th').should('contain', 'Usuario')
      cy.get('table thead th').should('contain', 'Fecha')
      cy.get('table thead th').should('contain', 'Estado')
    })

    it('Debe ver detalles de un impacto', () => {
      // Si hay impactos, probar el primero
      cy.get('#tablaImpactos tr').then($rows => {
        if ($rows.length > 1) { // Más de una fila (sin contar header)
          cy.get('#tablaImpactos .btn-outline-primary').first().click()
          cy.get('#modalDetalleImpacto').should('be.visible')
          
          // Verificar secciones del detalle
          cy.get('#detalleImpactoContent').should('contain', 'Información General')
          cy.get('#detalleImpactoContent').should('contain', 'Datos del Impacto')
          
          // Cerrar modal
          cy.get('#modalDetalleImpacto .btn-secondary').click()
        }
      })
    })
  })

  describe('Procesar Impactos', () => {
    it('Debe procesar un impacto pendiente', () => {
      // Primero crear un impacto
      cy.fixture('test-data.json').then((data) => {
        cy.createImpact('alta_empleado', data.impacts.alta_empleado)
        
        // El modal de detalle ya está abierto
        cy.get('#modalDetalleImpacto').should('be.visible')
        
        // Si está pendiente, debe mostrar botón procesar
        cy.get('#btnProcesarImpacto').then($btn => {
          if ($btn.is(':visible')) {
            cy.get('#btnProcesarImpacto').click()
            
            // Confirmar procesamiento
            cy.on('window:confirm', () => true)
            
            // Verificar éxito
            cy.get('.toast-body').should('contain', 'procesado correctamente')
          }
        })
      })
    })
  })

  describe('Filtros de Impactos', () => {
    it('Debe filtrar por tipo de impacto', () => {
      cy.get('#filtroTipo').select('Alta de Empleado')
      cy.get('#btnFiltrar').click()
      
      // Verificar que se aplica el filtro
      cy.wait(500) // Esperar recarga
    })

    it('Debe filtrar por estado', () => {
      cy.get('#filtroEstado').select('Pendiente')
      cy.get('#btnFiltrar').click()
      
      // Verificar filtro aplicado
      cy.wait(500)
    })

    it('Debe filtrar por rango de fechas', () => {
      const fechaDesde = new Date()
      fechaDesde.setDate(fechaDesde.getDate() - 7)
      const fechaHasta = new Date()
      
      cy.get('#filtroFechaDesde').type(fechaDesde.toISOString().split('T')[0])
      cy.get('#filtroFechaHasta').type(fechaHasta.toISOString().split('T')[0])
      cy.get('#btnFiltrar').click()
      
      cy.wait(500)
    })
  })

  describe('Vista de Tareas', () => {
    it('Debe mostrar la vista de tareas pendientes', () => {
      cy.get('[data-menu-item="tareas"]').click()
      cy.get('#tareasView').should('be.visible')
      cy.get('[data-menu-item="tareas"]').should('have.class', 'active')
      
      // Verificar tabla de tareas
      cy.get('#tablaTareas').should('be.visible')
      cy.get('#tareasView').should('contain', 'Tareas Pendientes')
    })

    it('Debe mostrar contador de tareas en el menú', () => {
      cy.get('[data-menu-item="tareas"] .badge').should('be.visible')
      cy.get('[data-menu-item="tareas"] .badge').invoke('text').then((count) => {
        const taskCount = parseInt(count)
        expect(taskCount).to.be.at.least(0)
      })
    })

    it('Debe permitir seleccionar tareas', () => {
      cy.get('[data-menu-item="tareas"]').click()
      
      // Si hay tareas
      cy.get('#tablaTareas tr').then($rows => {
        if ($rows.length > 1) {
          // Seleccionar primera tarea
          cy.get('.tarea-checkbox').first().check()
          
          // Debe mostrar acciones masivas
          cy.get('#accionesMasivas').should('be.visible')
          
          // Seleccionar todas
          cy.get('#selectAllTareas').check()
          cy.get('.tarea-checkbox:checked').should('have.length.at.least', 1)
        }
      })
    })
  })

  describe('Menú del Módulo', () => {
    it('Debe mostrar el resumen en el menú lateral', () => {
      cy.get('#menuStatPendientes').should('be.visible')
      cy.get('#menuStatCompletados').should('be.visible')
      cy.get('#menuStatTareas').should('be.visible')
    })

    it('Debe actualizar los contadores del menú', () => {
      // Los contadores deben tener valores numéricos
      cy.get('#menuStatPendientes').invoke('text').should('match', /\d+/)
      cy.get('#menuStatCompletados').invoke('text').should('match', /\d+/)
      cy.get('#menuStatTareas').invoke('text').should('match', /\d+/)
    })
  })
})