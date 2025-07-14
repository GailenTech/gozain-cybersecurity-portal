describe('Migración de Madurez a Vue 3', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Madurez en Ciberseguridad').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  describe('Navegación y Vue Router', () => {
    it('Debe cargar la aplicación con Vue 3', () => {
      // Verificar que la aplicación Vue se monta correctamente
      cy.get('.madurez-app').should('be.visible')
      cy.get('h4').should('contain', 'Madurez en Ciberseguridad')
      
      // Verificar estadísticas se renderizan
      cy.get('.card').should('have.length.at.least', 4)
      cy.get('.card-body h3').should('exist')
    })

    it('Debe navegar entre vistas usando Vue Router', () => {
      // Dashboard por defecto
      cy.url().should('include', '#/dashboard')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
      
      // Navegar a evaluaciones
      cy.get('[data-menu-item="evaluaciones"]').click()
      cy.url().should('include', '#/evaluaciones')
      cy.get('[data-menu-item="evaluaciones"]').should('have.class', 'active')
      
      // Navegar a historial
      cy.get('[data-menu-item="historico"]').click()
      cy.url().should('include', '#/historial')
      cy.get('[data-menu-item="historico"]').should('have.class', 'active')
      
      // Volver a dashboard
      cy.get('[data-menu-item="dashboard"]').click()
      cy.url().should('include', '#/dashboard')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    })

    it('Debe mantener el estado de ruta tras recarga', () => {
      // Navegar a evaluaciones
      cy.get('[data-menu-item="evaluaciones"]').click()
      cy.url().should('include', '#/evaluaciones')
      
      // Recargar página
      cy.reload()
      
      // Verificar que vuelve a la misma vista
      cy.get('.madurez-app').should('be.visible')
      cy.url().should('include', '#/evaluaciones')
      cy.get('[data-menu-item="evaluaciones"]').should('have.class', 'active')
    })
  })

  describe('Dashboard Vue', () => {
    beforeEach(() => {
      cy.get('[data-menu-item="dashboard"]').click()
    })

    it('Debe mostrar estadísticas de madurez', () => {
      cy.get('.card-body h3').should('have.length', 4)
      
      // Verificar las tarjetas de estadísticas
      cy.get('.card-body').should('contain', 'Total Evaluaciones')
      cy.get('.card-body').should('contain', 'Completadas')
      cy.get('.card-body').should('contain', 'En Progreso')
      cy.get('.card-body').should('contain', 'Puntuación Actual')
    })

    it('Debe mostrar indicadores principales', () => {
      cy.get('.dashboard-madurez').should('be.visible')
      
      // Verificar indicadores específicos
      cy.get('.card').should('contain', 'Nueva Evaluación')
      cy.get('.card').should('contain', 'Nivel de Madurez')
      cy.get('.card').should('contain', 'Evaluaciones Completadas')
    })

    it('Debe permitir crear nueva evaluación desde dashboard', () => {
      cy.get('.cursor-pointer').contains('Nueva Evaluación').should('be.visible')
      // TODO: Implementar test de modal cuando esté disponible
    })

    it('Debe mostrar evaluaciones recientes', () => {
      cy.get('.card').should('contain', 'Evaluaciones Recientes')
      cy.get('.card').should('contain', 'Evolución de Madurez')
    })
  })

  describe('Lista de Evaluaciones Vue', () => {
    beforeEach(() => {
      cy.get('[data-menu-item="evaluaciones"]').click()
      cy.get('.evaluaciones-madurez').should('be.visible')
    })

    it('Debe mostrar filtros de evaluaciones', () => {
      cy.get('.card').should('contain', 'Filtros')
      
      // Verificar filtros disponibles
      cy.get('select').should('exist')
      cy.get('input[type="date"]').should('have.length', 2)
      cy.get('button').should('contain', 'Filtrar')
    })

    it('Debe mostrar tabla de evaluaciones', () => {
      cy.get('.table-responsive').should('be.visible')
      cy.get('table thead th').should('contain', 'Nombre')
      cy.get('table thead th').should('contain', 'Fecha Inicio')
      cy.get('table thead th').should('contain', 'Estado')
      cy.get('table thead th').should('contain', 'Puntuación')
      cy.get('table thead th').should('contain', 'Acciones')
    })

    it('Debe funcionar los filtros', () => {
      // Seleccionar estado
      cy.get('select').first().select('completado')
      cy.get('button').contains('Filtrar').click()
      
      // Limpiar filtros
      cy.get('button').contains('Limpiar').click()
    })

    it('Debe permitir exportar evaluaciones', () => {
      cy.get('button').contains('Exportar').should('be.visible')
    })

    it('Debe permitir crear nueva evaluación', () => {
      cy.get('button').contains('Nueva Evaluación').should('be.visible')
    })
  })

  describe('Historial Vue', () => {
    beforeEach(() => {
      cy.get('[data-menu-item="historico"]').click()
      cy.get('.historial-madurez').should('be.visible')
    })

    it('Debe mostrar página de historial', () => {
      cy.get('h5').should('contain', 'Historial de Evaluaciones')
      cy.get('button').should('contain', 'Exportar')
      cy.get('button').should('contain', 'Actualizar')
    })

    it('Debe mostrar resumen general si hay datos', () => {
      // Si hay evaluaciones, verificar resumen
      cy.get('body').then($body => {
        if ($body.find('.card h3').length > 0) {
          cy.get('.card').should('contain', 'Evaluaciones Completadas')
          cy.get('.card').should('contain', 'Puntuación Actual')
        }
      })
    })

    it('Debe mostrar mensaje cuando no hay historial', () => {
      // Interceptar API para simular sin datos
      cy.intercept('GET', '/api/madurez/assessments/historial*', []).as('getHistorial')
      
      cy.reload()
      cy.get('.historial-madurez').should('be.visible')
      
      cy.wait('@getHistorial')
      cy.get('.text-muted').should('contain', 'No hay historial disponible')
    })
  })

  describe('Cuestionario Vue', () => {
    it('Debe manejar navegación a cuestionario inexistente', () => {
      // Navegar manualmente a un cuestionario que no existe
      cy.visit('/#/madurez/cuestionario/test-123')
      cy.get('.madurez-app').should('be.visible')
      
      // Debe mostrar error o redirigir a evaluaciones
      cy.get('body').then($body => {
        if ($body.find('.text-center').length > 0) {
          cy.get('.text-center').should('contain', 'Error')
        }
      })
    })
  })

  describe('Menú Lateral Vue', () => {
    it('Debe mostrar elementos del menú específicos de madurez', () => {
      cy.get('[data-menu-item="dashboard"]').should('contain', 'Dashboard')
      cy.get('[data-menu-item="evaluaciones"]').should('contain', 'Evaluaciones')
      cy.get('[data-menu-item="nueva"]').should('contain', 'Nueva Evaluación')
      cy.get('[data-menu-item="historico"]').should('contain', 'Histórico')
    })

    it('Debe actualizar estado activo del menú', () => {
      // Dashboard activo por defecto
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
      
      // Cambiar a evaluaciones
      cy.get('[data-menu-item="evaluaciones"]').click()
      cy.get('[data-menu-item="evaluaciones"]').should('have.class', 'active')
      cy.get('[data-menu-item="dashboard"]').should('not.have.class', 'active')
      
      // Cambiar a historial
      cy.get('[data-menu-item="historico"]').click()
      cy.get('[data-menu-item="historico"]').should('have.class', 'active')
      cy.get('[data-menu-item="evaluaciones"]').should('not.have.class', 'active')
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
      cy.intercept('GET', '/api/madurez/estadisticas*', { 
        total: 5, 
        completadas: 3, 
        progreso: 2, 
        puntuacion: 2.8 
      }).as('getStats')
      
      // Recargar datos
      cy.get('button').contains('Actualizar').click()
      
      // Verificar que se hizo la llamada
      cy.wait('@getStats', { timeout: 10000 })
    })

    it('Debe manejar estados de carga', () => {
      // Interceptar con delay para ver loading state
      cy.intercept('GET', '/api/madurez/assessments*', { delay: 1000, body: [] }).as('getAssessments')
      
      cy.get('[data-menu-item="evaluaciones"]').click()
      
      // Verificar spinner de carga
      cy.get('.spinner-border').should('be.visible')
      cy.wait('@getAssessments')
      cy.get('.spinner-border').should('not.exist')
    })
  })

  describe('Persistencia de Estado', () => {
    it('Debe guardar ruta en localStorage', () => {
      cy.get('[data-menu-item="evaluaciones"]').click()
      
      // Verificar que se guarda en localStorage
      cy.window().its('localStorage').invoke('getItem', 'gozain_last_route')
        .should('exist')
        .then((storedRoute) => {
          const route = JSON.parse(storedRoute)
          expect(route).to.have.property('module', 'madurez')
          expect(route).to.have.property('path')
          expect(route.path).to.include('/evaluaciones')
        })
    })

    it('Debe restaurar estado desde localStorage', () => {
      // Configurar ruta en localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('gozain_last_route', JSON.stringify({
          module: 'madurez',
          path: '/historial',
          organization: 'e2e_test_organization'
        }))
      })
      
      // Recargar página
      cy.reload()
      
      // Verificar que se restaura a historial
      cy.get('.historial-madurez', { timeout: 10000 }).should('be.visible')
      cy.get('[data-menu-item="historico"]').should('have.class', 'active')
    })
  })

  describe('Funcionalidades Específicas de Madurez', () => {
    it('Debe mostrar niveles de madurez correctamente', () => {
      cy.get('[data-menu-item="dashboard"]').click()
      
      // Verificar que se muestran niveles de madurez
      cy.get('.card').should('contain', 'Nivel de Madurez')
    })

    it('Debe manejar puntuaciones y scoring', () => {
      cy.get('[data-menu-item="evaluaciones"]').click()
      
      // Verificar formato de puntuaciones en tabla
      cy.get('table').should('be.visible')
      cy.get('table thead th').should('contain', 'Puntuación')
    })

    it('Debe mostrar objetivos de mejora', () => {
      cy.get('[data-menu-item="dashboard"]').click()
      
      // Verificar sección de objetivos si hay datos
      cy.get('body').then($body => {
        if ($body.find('.card').length > 4) {
          cy.get('.card').should('contain', 'Objetivos')
        }
      })
    })
  })
})