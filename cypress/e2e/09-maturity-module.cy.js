describe('Módulo de Madurez en Ciberseguridad', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    // Navigate to Maturity module through the tool selector
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()
    cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
    cy.wait(2000) // Esperar a que cargue el módulo
  })

  it('Debe mostrar el módulo de madurez en el selector', () => {
    // Volver al selector para verificar que está disponible
    cy.get('#toolSelectorButton').click()
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').should('be.visible')
    
    // Verificar que tiene el icono correcto
    cy.contains('.tool-card', 'Madurez en Ciberseguridad')
      .find('i.bi-shield-check')
      .should('be.visible')
  })

  it('Debe cargar correctamente el dashboard principal', () => {
    // Verificar que se carga el módulo
    cy.get('.madurez-app').should('be.visible')
    
    // Verificar título
    cy.contains('Madurez en Ciberseguridad').should('be.visible')
    
    // Verificar estadísticas principales
    cy.get('#statTotal').should('be.visible')
    cy.get('#statCompletadas').should('be.visible')
    cy.get('#statProgreso').should('be.visible')
    cy.get('#statPuntuacion').should('be.visible')
    
    // Verificar botones de vista
    cy.get('#btnVistaLista').should('be.visible')
    cy.get('#btnVistaDashboard').should('be.visible')
    
    // Verificar que está en dashboard por defecto
    cy.get('#btnVistaDashboard').should('have.class', 'active')
  })

  it('Debe permitir crear una nueva evaluación', () => {
    // Click on new assessment button
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    // Wait for modal
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    
    // Fill form
    cy.get('#nombreEvaluacion').clear().type('Evaluación E2E Test')
    cy.get('#descripcionEvaluacion').clear().type('Test automatizado de evaluación')
    cy.get('#objetivo6m').clear().type('2.5')
    cy.get('#objetivo1a').clear().type('3.0')
    cy.get('#objetivo2a').clear().type('4.0')
    
    // Create assessment
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Verify it appears in the list
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.contains('Evaluación E2E Test').should('be.visible')
    
    // Verificar estado
    cy.get('tbody tr').first().within(() => {
      cy.get('.badge').should('contain', 'Abierto')
    })
  })

  it('Debe navegar correctamente por el cuestionario', () => {
    // Create assessment using UI steps
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Test Navegación')
    cy.get('#descripcionEvaluacion').clear().type('Test de navegación')
    cy.get('#objetivo6m').clear().type('2.5')
    cy.get('#objetivo1a').clear().type('3.0')
    cy.get('#objetivo2a').clear().type('4.0')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and open questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Verificar que se carga el cuestionario
    cy.get('.questionnaire-view').should('be.visible')
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // Verificar progreso inicial
    cy.get('.progress-bar').should('have.css', 'width').and('contain', '14.285') // 1/7 ≈ 14.3%
    
    // Responder primera pregunta del primer dominio
    cy.get('.pregunta-container').first().within(() => {
      cy.get('input[value="3"]').check({ force: true })
    })
    
    // Verificar que no se puede avanzar sin responder todas
    cy.get('#btnSiguiente').click()
    cy.get('.toast-body').should('contain', 'responde todas las preguntas')
    
    // Responder todas las preguntas del dominio 1
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
    })
    
    // Avanzar al dominio 2
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    // Verificar progreso actualizado
    cy.get('.progress-bar').should('have.css', 'width').and('contain', '28.571') // 2/7 ≈ 28.6%
    
    // Verificar botón anterior funciona
    cy.get('#btnAnterior').click()
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // Volver al dominio 2
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    // Responder y avanzar al dominio 3 para verificar navegación continua
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="2"]').check({ force: true })
    })
    
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 3 de 7').should('be.visible')
  })

  it('Debe completar un cuestionario completo y mostrar resultados', () => {
    // Create assessment using UI steps
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Test Completo')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and complete questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.completeMaturityQuestionnaire()
    
    // Verificar que volvió a la lista
    cy.get('#listaView').should('be.visible')
    
    // Verificar que el estado cambió a completado
    cy.contains('Test Completo').parent().parent().within(() => {
      cy.get('.badge').should('contain', 'Completado')
      cy.get('strong').should('exist') // Puntuación visible
    })
    
    // Verificar estadísticas actualizadas
    cy.get('#statCompletadas').should('not.contain', '0')
  })

  it('Debe mostrar dashboard de resultados con visualizaciones', () => {
    // First create an assessment using UI steps
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Test Dashboard')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and complete questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.completeMaturityQuestionnaire()
    
    // Acceder al dashboard de resultados
    cy.verifyMaturityDashboard()
    
    // Verificar elementos específicos del dashboard
    cy.contains('Dashboard - Test Dashboard').should('be.visible')
    cy.contains('Completado el').should('be.visible')
    
    // Verificar métricas principales
    cy.contains('Puntuación Total').should('be.visible')
    cy.contains('Dominios Evaluados').should('be.visible')
    cy.contains('Área Más Débil').should('be.visible')
    
    // Verificar que los charts están presentes
    cy.get('#radarChart').should('be.visible')
    cy.get('#gapsChart').should('be.visible')
    cy.get('#roadmapChart').should('be.visible')
    
    // Verificar detalles por dominio
    cy.contains('Detalles por Dominio').should('be.visible')
    cy.get('.dominio-detalle').should('have.length', 7)
  })

  it('Debe permitir firmar una evaluación', () => {
    // Create and complete assessment using UI steps
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Test Firma')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and complete questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.completeMaturityQuestionnaire()
    
    // Verificar botón de firma está disponible
    cy.get('button[onclick*="firmarEvaluacion"]').should('be.visible')
    
    // Firmar evaluación
    cy.signMaturityAssessment('Juan Pérez')
    
    // Verificar que el estado cambió
    cy.contains('Test Firma').parent().parent().within(() => {
      cy.get('.badge').should('contain', 'Firmado')
    })
  })

  it('Debe mostrar histórico de evaluaciones', () => {
    // First create an assessment using UI steps
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Histórico Test 1')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and complete questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.completeMaturityQuestionnaire()
    
    // Ir a histórico
    cy.verifyMaturityHistory()
    
    // Verificar elementos del histórico
    cy.contains('Total Evaluaciones').should('be.visible')
    cy.contains('Puntuación Actual').should('be.visible')
    cy.contains('Evaluaciones Completadas').should('be.visible')
    
    // Verificar que aparece la evaluación
    cy.contains('Histórico Test 1').should('be.visible')
  })

  it('Debe mantener navegación coherente entre vistas', () => {
    // Test navigation from dashboard
    cy.get('#btnVistaDashboard').click()
    cy.get('#dashboardView').should('be.visible')
    
    // Change to list
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    
    // Usar menú lateral para navegación
    cy.get('[data-menu-item="dashboard"]').click()
    cy.get('#dashboardView').should('be.visible')
    
    cy.get('[data-menu-item="evaluaciones"]').click()
    cy.get('#listaView').should('be.visible')
    
    // Verificar que los botones de vista reflejan el estado actual
    cy.get('#btnVistaLista').should('have.class', 'active')
    cy.get('#btnVistaDashboard').should('not.have.class', 'active')
  })

  it('Debe filtrar evaluaciones correctamente', () => {
    // Create assessments with different states using UI steps
    // First assessment
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Eval Filtro 1')
    cy.get('#btnCrearEvaluacion').click()
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    
    // Second assessment
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Eval Filtro 2')
    cy.get('#btnCrearEvaluacion').click()
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    
    // Complete one
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    cy.completeMaturityQuestionnaire()
    
    // Probar filtros
    cy.get('#filtroEstado').select('completado')
    cy.get('#btnFiltrar').click()
    
    // Debe mostrar solo evaluaciones completadas
    cy.get('tbody tr .badge').each(($badge) => {
      cy.wrap($badge).should('contain', 'Completado')
    })
    
    // Resetear filtro
    cy.get('#filtroEstado').select('')
    cy.get('#btnFiltrar').click()
    
    // Debe mostrar todas las evaluaciones
    cy.get('tbody tr').should('have.length.at.least', 2)
  })

  it('No debe mostrar errores en consola durante la navegación', () => {
    cy.checkNoConsoleErrors()
    
    // Basic navigation
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('#btnVistaDashboard').click()
    cy.get('#dashboardView').should('be.visible')
    
    // Create assessment using UI steps
    cy.get('body').then($body => {
      if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Test Console Errors')
    cy.get('#btnCrearEvaluacion').click()
    
    // Verify no errors
    cy.checkNoConsoleErrors()
  })
})