describe('Navegación del Cuestionario de Madurez - Validación Específica', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.get('.tool-card').contains('Madurez en Ciberseguridad').click()
    cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
    cy.wait(2000)
  })

  it('Debe permitir avanzar desde la segunda pantalla del cuestionario', () => {
    // Create assessment specific for this test using UI steps
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
    cy.get('#nombreEvaluacion').clear().type('Test Navegación Específico')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to the assessment
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // PANTALLA 1: Verificar que estamos en el primer dominio
    cy.get('.questionnaire-view').should('be.visible')
    cy.contains('Dominio 1 de 7').should('be.visible')
    cy.contains('Protección de acceso').should('be.visible')
    
    // Completar todas las preguntas del primer dominio
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
    })
    
    // Avanzar a la segunda pantalla
    cy.get('#btnSiguiente').should('be.enabled').click()
    cy.wait(500)
    
    // PANTALLA 2: Verificar que llegamos al segundo dominio
    cy.contains('Dominio 2 de 7').should('be.visible')
    cy.contains('Seguridad en dispositivos y redes').should('be.visible')
    
    // Completar todas las preguntas del segundo dominio
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="2"]').check({ force: true })
    })
    
    // PRUEBA CRÍTICA: Avanzar desde la segunda pantalla
    cy.get('#btnSiguiente').should('be.enabled').click()
    cy.wait(500)
    
    // PANTALLA 3: Verificar que llegamos al tercer dominio
    cy.contains('Dominio 3 de 7').should('be.visible')
    cy.contains('Protección de datos').should('be.visible')
    
    // Continuar navegando para asegurar que funciona
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="4"]').check({ force: true })
    })
    
    // Avanzar a la cuarta pantalla
    cy.get('#btnSiguiente').should('be.enabled').click()
    cy.wait(500)
    
    // PANTALLA 4: Verificar cuarto dominio
    cy.contains('Dominio 4 de 7').should('be.visible')
    cy.contains('Prevención de amenazas').should('be.visible')
    
    // Completar y continuar
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="1"]').check({ force: true })
    })
    
    cy.get('#btnSiguiente').should('be.enabled').click()
    cy.wait(500)
    
    // PANTALLA 5: Verificar quinto dominio
    cy.contains('Dominio 5 de 7').should('be.visible')
    cy.contains('Gestión de accesos y permisos').should('be.visible')
    
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
    })
    
    cy.get('#btnSiguiente').should('be.enabled').click()
    cy.wait(500)
    
    // PANTALLA 6: Verificar sexto dominio
    cy.contains('Dominio 6 de 7').should('be.visible')
    cy.contains('Respuesta ante incidentes').should('be.visible')
    
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="2"]').check({ force: true })
    })
    
    cy.get('#btnSiguiente').should('be.enabled').click()
    cy.wait(500)
    
    // PANTALLA 7: Verificar séptimo dominio (último)
    cy.contains('Dominio 7 de 7').should('be.visible')
    cy.contains('Identificación de procesos críticos y activos').should('be.visible')
    
    // En el último dominio debe aparecer el botón "Finalizar"
    cy.get('#btnFinalizar').should('be.visible')
    cy.get('#btnSiguiente').should('not.exist')
    
    // Completar último dominio
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="4"]').check({ force: true })
    })
    
    // Finalizar evaluación
    cy.get('#btnFinalizar').click()
    
    // Manejar confirmación
    cy.on('window:confirm', () => true)
    
    // Verificar finalización exitosa
    cy.get('.toast-body').should('contain', 'completada correctamente')
  })

  it('Debe mantener las respuestas al navegar entre dominios', () => {
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
    cy.get('#nombreEvaluacion').clear().type('Test Persistencia Respuestas')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and open questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Responder primera pregunta con valor específico
    cy.get('.pregunta-container').first().within(() => {
      cy.get('input[value="4"]').check({ force: true })
    })
    
    // Responder segunda pregunta con valor diferente
    cy.get('.pregunta-container').eq(1).within(() => {
      cy.get('input[value="2"]').check({ force: true })
    })
    
    // Completar el resto para poder avanzar
    cy.get('.pregunta-container').each(($pregunta, index) => {
      if (index >= 2) {
        cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
      }
    })
    
    // Avanzar al siguiente dominio
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    // Volver al dominio anterior
    cy.get('#btnAnterior').click()
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // Verificar que las respuestas se mantuvieron
    cy.get('.pregunta-container').first().within(() => {
      cy.get('input[value="4"]').should('be.checked')
    })
    
    cy.get('.pregunta-container').eq(1).within(() => {
      cy.get('input[value="2"]').should('be.checked')
    })
  })

  it('Debe validar respuestas completas antes de avanzar', () => {
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
    cy.get('#nombreEvaluacion').clear().type('Test Validación')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and open questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Intentar avanzar sin responder nada
    cy.get('#btnSiguiente').click()
    cy.get('.toast-body').should('contain', 'responde todas las preguntas')
    
    // Responder solo la primera pregunta
    cy.get('.pregunta-container').first().within(() => {
      cy.get('input[value="3"]').check({ force: true })
    })
    
    // Intentar avanzar (aún faltan preguntas)
    cy.get('#btnSiguiente').click()
    cy.get('.toast-body').should('contain', 'responde todas las preguntas')
    
    // Responder todas las preguntas
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
    })
    
    // Ahora sí debe permitir avanzar
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
  })

  it('Debe funcionar el botón de guardar borrador', () => {
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
    cy.get('#nombreEvaluacion').clear().type('Test Borrador')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and open questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Responder algunas preguntas
    cy.get('.pregunta-container').first().within(() => {
      cy.get('input[value="4"]').check({ force: true })
    })
    
    // Guardar borrador
    cy.get('#btnGuardarBorrador').click()
    cy.get('.toast-body').should('contain', 'Borrador guardado correctamente')
  })

  it.skip('Debe mostrar progreso visual correcto', () => {
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
    cy.get('#nombreEvaluacion').clear().type('Test Progreso')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and open questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Verificar progreso inicial (1/7 = ~14%)
    cy.get('.progress-bar').should('have.attr', 'style').and('contain', '14')
    
    // Verificar badges de progreso - usar selector más específico
    cy.get('.domain-progress .badge.bg-primary').should('have.length', 1) // Dominio actual
    cy.get('.domain-progress .badge.bg-light').should('have.length', 6) // Dominios pendientes
    
    // Completar y avanzar
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
    })
    
    cy.get('#btnSiguiente').click()
    
    // Verificar progreso actualizado (2/7 = ~29%)
    cy.get('.progress-bar').should('have.attr', 'style').and('contain', '28')
    
    // Verificar badges actualizados
    cy.get('.domain-progress .badge.bg-success').should('have.length', 1) // Dominio completado
    cy.get('.domain-progress .badge.bg-primary').should('have.length', 1) // Dominio actual
    cy.get('.domain-progress .badge.bg-light').should('have.length', 5) // Dominios pendientes
  })

  it('Debe permitir navegación con comentarios opcionales', () => {
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
    cy.get('#nombreEvaluacion').clear().type('Test Comentarios')
    cy.get('#btnCrearEvaluacion').click()
    
    // Wait for modal to close
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Go to list and open questionnaire
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Responder preguntas y agregar comentarios
    cy.get('.pregunta-container').each(($pregunta, index) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
      
      // Agregar comentario a la primera pregunta
      if (index === 0) {
        cy.wrap($pregunta).find('textarea').type('Este es un comentario de prueba')
      }
    })
    
    // Avanzar al siguiente dominio
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    // Volver y verificar que el comentario se mantuvo
    cy.get('#btnAnterior').click()
    cy.get('.pregunta-container').first().within(() => {
      cy.get('textarea').should('have.value', 'Este es un comentario de prueba')
    })
  })
})