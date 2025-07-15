describe('Migración de Impactos a Vue 3', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  describe('Navegación y Vue Router', () => {
    it('Debe cargar la aplicación con Vue 3', () => {
      // Verificar que la aplicación Vue se monta correctamente
      cy.get('.impactos-module').should('be.visible')
      
      // Verificar estadísticas se renderizan en el dashboard
      cy.get('.dashboard-impactos').should('be.visible')
      cy.get('.card').should('have.length.at.least', 4)
      cy.get('.card-body h1').should('exist')
    })

    it('Debe navegar entre vistas usando Vue Router', () => {
      // Dashboard por defecto
      cy.url().should('include', '#/dashboard')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
      
      // Navegar a lista
      cy.get('[data-menu-item="lista"]').click()
      cy.url().should('include', '#/lista')
      cy.get('[data-menu-item="lista"]').should('have.class', 'active')
      
      // Navegar a tareas
      cy.get('[data-menu-item="tareas"]').click()
      cy.url().should('include', '#/tareas')
      cy.get('[data-menu-item="tareas"]').should('have.class', 'active')
      
      // Volver a dashboard
      cy.get('[data-menu-item="dashboard"]').click()
      cy.url().should('include', '#/dashboard')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    })

    it('Debe mantener el estado de ruta tras recarga', () => {
      // Navegar a lista
      cy.get('[data-menu-item="lista"]').click()
      cy.url().should('include', '#/lista')
      
      // Recargar página
      cy.reload()
      
      // Verificar que vuelve a la misma vista
      cy.get('.impactos-module').should('be.visible')
      cy.url().should('include', '#/lista')
      cy.get('[data-menu-item="lista"]').should('have.class', 'active')
    })
  })

  describe('Dashboard Vue', () => {
    beforeEach(() => {
      cy.get('[data-menu-item="dashboard"]').click()
    })

    it('Debe mostrar estadísticas de impactos', () => {
      cy.get('.card-body h1').should('have.length.at.least', 4)
      
      // Verificar las tarjetas de estadísticas
      cy.get('.card-body').should('contain', 'Procesados Hoy')
      cy.get('.card-body').should('contain', 'Pendientes')
      cy.get('.card-body').should('contain', 'Completados (7 días)')
      cy.get('.card-body').should('contain', 'Tareas Pendientes')
    })

    it('Debe mostrar secciones del dashboard', () => {
      cy.get('.dashboard-impactos').should('be.visible')
      
      // Verificar secciones principales
      cy.get('.card').should('contain', 'Impactos Recientes')
      cy.get('.card').should('contain', 'Actividad Reciente')
    })

    it('Debe permitir crear nuevo impacto desde dashboard', () => {
      cy.get('.cursor-pointer').contains('Nuevo Impacto').should('be.visible')
      cy.get('.cursor-pointer').contains('Nuevo Impacto').parent().click()
      
      // Verificar que se abre el modal
      cy.get('.modal.show').should('be.visible')
      cy.get('.modal-title').should('contain', 'Nuevo Impacto')
      
      // Cerrar modal
      cy.get('.btn-close').click()
      cy.get('.modal.show').should('not.exist')
    })
  })

  describe('Lista de Impactos Vue', () => {
    beforeEach(() => {
      cy.get('[data-menu-item="lista"]').click()
      cy.get('.impactos-lista').should('be.visible')
    })

    it('Debe mostrar filtros de impactos', () => {
      cy.get('.card').should('contain', 'Filtros')
      
      // Verificar filtros disponibles
      cy.get('select').should('contain.value', '')
      cy.get('input[type="date"]').should('have.length', 2)
      cy.get('button').should('contain', 'Filtrar')
    })

    it('Debe mostrar tabla de impactos', () => {
      cy.get('.table-responsive').should('be.visible')
      cy.get('table').should('be.visible')
      
      // Verificar columnas
      cy.get('table thead th').should('contain', 'ID')
      cy.get('table thead th').should('contain', 'Tipo')
      cy.get('table thead th').should('contain', 'Descripción')
      cy.get('table thead th').should('contain', 'Estado')
      cy.get('table thead th').should('contain', 'Acciones')
    })

    it('Debe funcionar los filtros', () => {
      // Seleccionar tipo de impacto
      cy.get('select').first().select('alta_empleado')
      cy.get('button').contains('Filtrar').click()
      
      // Limpiar filtros
      cy.get('button').contains('Limpiar').click()
    })

    it('Debe permitir exportar impactos', () => {
      cy.get('button').contains('Exportar').should('be.visible')
    })
  })

  describe('Tareas Vue', () => {
    beforeEach(() => {
      cy.get('[data-menu-item="tareas"]').click()
      cy.get('.tareas-impactos').should('be.visible')
    })

    it('Debe mostrar página de tareas', () => {
      cy.get('.card').should('contain', 'Tareas Pendientes')
      cy.get('button').should('contain', 'Actualizar')
    })

    it('Debe mostrar tabla de tareas con checkboxes', () => {
      cy.get('table').should('be.visible')
      cy.get('#selectAllTareas').should('exist')
      cy.get('table thead th').should('contain', 'Tarea')
      cy.get('table thead th').should('contain', 'Responsable')
      cy.get('table thead th').should('contain', 'Prioridad')
    })

    it('Debe manejar selección de tareas', () => {
      // Si hay tareas, probar selección
      cy.get('table tbody tr').then($rows => {
        if ($rows.length > 0) {
          cy.get('.tarea-checkbox').first().check()
          cy.get('#accionesMasivas').should('be.visible')
          cy.get('#btnCompletarSeleccionadas').should('be.visible')
          cy.get('#btnPosponer').should('be.visible')
        }
      })
    })
  })

  describe('Menú Lateral Vue', () => {
    it('Debe mostrar elementos del menú específicos de impactos', () => {
      cy.get('#appMenu .nav-link').should('contain', 'Dashboard')
      cy.get('#appMenu .nav-link').should('contain', 'Lista de Impactos')
      cy.get('#appMenu .nav-link').should('contain', 'Tareas')
      cy.get('#appMenu .nav-link').should('contain', 'Nuevo')
    })

    it('Debe actualizar estado activo del menú', () => {
      // Dashboard activo por defecto
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
      
      // Cambiar a lista
      cy.get('[data-menu-item="lista"]').click()
      cy.get('[data-menu-item="lista"]').should('have.class', 'active')
      cy.get('[data-menu-item="dashboard"]').should('not.have.class', 'active')
      
      // Cambiar a tareas
      cy.get('[data-menu-item="tareas"]').click()
      cy.get('[data-menu-item="tareas"]').should('have.class', 'active')
      cy.get('[data-menu-item="lista"]').should('not.have.class', 'active')
    })
  })

  describe('Integración con Sistema', () => {
    it('Debe integrar con el eventBus global', () => {
      // Verificar que el eventBus está disponible
      cy.window().should('have.property', 'gozainCore')
      cy.window().its('gozainCore.services.eventBus').should('exist')
    })

    it('Debe usar la API correctamente', () => {
      // Interceptar llamadas a la API
      cy.intercept('GET', '/api/impactos/estadisticas*', { fixture: 'impactos-stats.json' }).as('getStats')
      
      // Recargar datos
      cy.get('button').contains('Actualizar').click()
      
      // Verificar que se hizo la llamada
      cy.wait('@getStats', { timeout: 10000 })
    })

    it('Debe manejar estados de carga', () => {
      // Interceptar con delay para ver loading state
      cy.intercept('GET', '/api/impactos*', { delay: 1000, body: [] }).as('getImpactos')
      
      cy.get('[data-menu-item="lista"]').click()
      
      // Verificar spinner de carga
      cy.get('.spinner-border').should('be.visible')
      cy.wait('@getImpactos')
      cy.get('.spinner-border').should('not.exist')
    })
  })

  describe('Persistencia de Estado', () => {
    it('Debe guardar ruta en localStorage', () => {
      cy.get('[data-menu-item="lista"]').click()
      
      cy.window()
        .its('localStorage')
        .invoke('getItem', 'gozain_last_route')
        .should('exist')
        .then((storedRoute) => {
          const route = JSON.parse(storedRoute)
          expect(route).to.have.property('module', 'impactos')
          expect(route).to.have.property('path')
          expect(route.path).to.include('/lista')
        })
    })

    it('Debe restaurar estado desde localStorage', () => {
      // Configurar ruta en localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('gozain_last_route', JSON.stringify({
          module: 'impactos',
          path: '/tareas',
          organization: 'e2e_test_organization'
        }))
      })
      
      // Recargar página
      cy.reload()
      
      // Verificar que se restaura la vista
      cy.get('.impactos-module').should('be.visible')
      cy.url().should('include', '#/tareas')
      cy.get('[data-menu-item="tareas"]').should('have.class', 'active')
    })
  })

  describe('Funcionalidad de Modales', () => {
    it('Debe crear un nuevo impacto', () => {
      // Ir a dashboard
      cy.get('[data-menu-item="dashboard"]').click()
      
      // Abrir modal de nuevo impacto
      cy.get('.cursor-pointer').contains('Nuevo Impacto').parent().click()
      cy.get('.modal.show').should('be.visible')
      
      // Llenar formulario
      cy.get('select').first().select('alta_empleado')
      cy.wait(500) // Esperar a que cargue la plantilla
      
      cy.get('textarea').type('Nuevo empleado en el departamento de desarrollo')
      
      // Llenar campos de la plantilla
      cy.get('input[type="text"]').first().type('Ana García')
      cy.get('input[type="text"]').eq(1).type('Desarrollo')
      cy.get('input[type="text"]').eq(2).type('Frontend Developer')
      cy.get('input[type="date"]').type('2025-08-01')
      cy.get('select').last().select('Remoto')
      
      // Guardar
      cy.get('button').contains('Guardar').click()
      
      // Verificar que el modal se cierra
      cy.get('.modal.show').should('not.exist')
      
      // Verificar que aparece en la lista
      cy.get('.card').contains('Impactos Recientes').parent().within(() => {
        cy.get('.list-group-item').should('contain', 'Alta de Empleado')
      })
    })

    it('Debe ver detalle y procesar un impacto', () => {
      // Ir a lista
      cy.get('[data-menu-item="lista"]').click()
      cy.wait(1000)
      
      // Hacer clic en ver detalle del primer impacto pendiente
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').contains('Ver').click()
      })
      
      // Verificar modal de detalle
      cy.get('.modal.show').should('be.visible')
      cy.get('.modal-title').should('contain', 'Detalle del Impacto')
      
      // Si el impacto está pendiente, debe mostrar botón de procesar
      cy.get('.modal-body').then($body => {
        if ($body.text().includes('pendiente')) {
          cy.get('button').contains('Procesar').should('be.visible')
        }
      })
      
      // Cerrar modal
      cy.get('.btn-close').click()
    })
  })
})