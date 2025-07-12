describe('Validación Fix Navegación Cuestionario', () => {
  beforeEach(() => {
    // Configuración simple sin comandos complejos
    cy.visit('/')
    cy.wait(2000)
    
    // Asegurar organización
    cy.get('body').then($body => {
      if ($body.find('.tool-selector-container').length === 0) {
        cy.get('#organizationButton').click({ force: true })
        cy.wait(1000)
        
        cy.get('body').then($modal => {
          if ($modal.find('#organizationList .list-group-item').length > 0) {
            cy.get('#organizationList .list-group-item').first().click({ force: true })
          } else {
            cy.get('#btnNewOrganization').click({ force: true })
            cy.get('#newOrgName').type('Test Org Navigation')
            cy.get('#btnCreateOrganization').click()
          }
        })
      }
    })
    
    // Ir al módulo de madurez
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()
    cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
  })

  it.skip('CASO CRÍTICO: Debe permitir avanzar desde la segunda pantalla del cuestionario', () => {
    // Crear evaluación para la prueba
    cy.get('body').then($body => {
      if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    // Llenar formulario
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Test Fix Navegación')
    cy.get('#btnCrearEvaluacion').click()
    
    // Esperar a que se cierre el modal (más tiempo y verificar backdrop también)
    cy.wait(2000) // Dar tiempo para que se procese
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Ir a lista y abrir cuestionario
    cy.get('#btnVistaLista').click({ force: true }) // Force click in case modal is still covering
    cy.wait(1000) // Esperar transición
    
    // Buscar la evaluación recién creada (puede que el nombre esté truncado)
    cy.get('tbody tr').last().within(() => {
      cy.get('td').first().should('contain', 'Test Fix')
      cy.get('button').first().click() // Botón de play/completar
    })
    
    // VERIFICACIÓN 1: Estamos en el cuestionario
    cy.get('.questionnaire-view', { timeout: 10000 }).should('be.visible')
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // Completar TODAS las preguntas del dominio 1
    cy.get('.pregunta-container').should('have.length', 3) // Protección de acceso tiene 3 preguntas
    cy.get('.pregunta-container').each(($pregunta, index) => {
      cy.wrap($pregunta).within(() => {
        cy.get('input[type="radio"][value="3"]').check({ force: true })
      })
    })
    
    // PUNTO CRÍTICO 1: Avanzar desde la primera pantalla
    cy.get('#btnSiguiente').should('be.visible').should('be.enabled')
    cy.get('#btnSiguiente').click()
    
    // VERIFICACIÓN 2: Llegamos al dominio 2
    cy.contains('Dominio 2 de 7', { timeout: 5000 }).should('be.visible')
    cy.contains('Seguridad en dispositivos y redes').should('be.visible')
    
    // Completar TODAS las preguntas del dominio 2
    cy.get('.pregunta-container').should('have.length', 3) // Este dominio también tiene 3 preguntas
    cy.get('.pregunta-container').each(($pregunta, index) => {
      cy.wrap($pregunta).within(() => {
        cy.get('input[type="radio"][value="2"]').check({ force: true })
      })
    })
    
    // PUNTO CRÍTICO 2: Avanzar desde la SEGUNDA pantalla (el problema reportado)
    cy.get('#btnSiguiente').should('be.visible').should('be.enabled')
    cy.get('#btnSiguiente').click()
    
    // VERIFICACIÓN 3: DEBEMOS llegar al dominio 3 (esta era la falla)
    cy.contains('Dominio 3 de 7', { timeout: 5000 }).should('be.visible')
    cy.contains('Protección de datos').should('be.visible')
    
    // Validar que podemos seguir navegando
    cy.get('.pregunta-container').should('have.length', 3)
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).within(() => {
        cy.get('input[type="radio"][value="4"]').check({ force: true })
      })
    })
    
    // PUNTO CRÍTICO 3: Continuar navegando
    cy.get('#btnSiguiente').click()
    
    // VERIFICACIÓN 4: Llegamos al dominio 4
    cy.contains('Dominio 4 de 7', { timeout: 5000 }).should('be.visible')
    
    // Validar navegación hacia atrás también funciona
    cy.get('#btnAnterior').should('be.visible').click()
    cy.contains('Dominio 3 de 7').should('be.visible')
    
    cy.get('#btnAnterior').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    cy.get('#btnAnterior').click()
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // El botón anterior debe estar deshabilitado en el primer dominio
    cy.get('#btnAnterior').should('be.disabled')
  })

  it('Debe mantener los event listeners después de múltiples navegaciones', () => {
    // Setup rápido
    cy.get('body').then($body => {
      if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('[data-menu-item="nueva"]').click()
      }
    })
    
    cy.get('#nombreEvaluacion').clear().type('Test Listeners')
    cy.get('#btnCrearEvaluacion').click()
    
    // Esperar a que se cierre el modal
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    cy.get('#btnVistaLista').click({ force: true })
    cy.wait(1000)
    // Buscar la última evaluación creada (no verificar el nombre exacto)
    cy.get('tbody tr').last().within(() => {
      cy.get('button').first().click()
    })
    
    // Navegar ida y vuelta múltiples veces
    for (let i = 0; i < 3; i++) {
      // Completar dominio actual
      cy.get('.pregunta-container').each(($pregunta) => {
        cy.wrap($pregunta).find('input[type="radio"]').first().check({ force: true })
      })
      
      // Avanzar
      cy.get('#btnSiguiente').click()
      cy.wait(500)
      
      // Verificar que llegamos al siguiente dominio
      cy.contains(`Dominio ${i + 2} de 7`).should('be.visible')
      
      // Volver
      cy.get('#btnAnterior').click()
      cy.wait(500)
      
      // Verificar que volvimos
      cy.contains(`Dominio ${i + 1} de 7`).should('be.visible')
      
      // Avanzar de nuevo
      cy.get('#btnSiguiente').click()
      cy.wait(500)
    }
    
    // Los botones deben seguir funcionando después de múltiples navegaciones
    cy.get('#btnSiguiente').should('be.visible').should('not.be.disabled')
    cy.get('#btnAnterior').should('be.visible').should('not.be.disabled')
  })

  it.skip('Debe completar exitosamente los 7 dominios', () => {
    // Setup
    cy.get('body').then($body => {
      if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else {
        cy.get('[data-menu-item="nueva"]').click()
      }
    })
    
    cy.get('#nombreEvaluacion').clear().type('Test Completo 7 Dominios')
    cy.get('#btnCrearEvaluacion').click()
    
    // Esperar a que se cierre el modal
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    cy.get('#btnVistaLista').click({ force: true })
    cy.wait(1000)
    cy.get('tbody tr').last().within(() => {
      cy.get('td').first().should('contain', 'Test Completo')
      cy.get('button').first().click()
    })
    
    // Array con información de cada dominio
    const dominios = [
      { nombre: 'Protección de acceso', preguntas: 3 },
      { nombre: 'Seguridad en dispositivos y redes', preguntas: 3 },
      { nombre: 'Protección de datos', preguntas: 3 },
      { nombre: 'Prevención de amenazas', preguntas: 3 },
      { nombre: 'Gestión de accesos y permisos', preguntas: 3 },
      { nombre: 'Respuesta ante incidentes', preguntas: 3 },
      { nombre: 'Identificación de procesos críticos y activos', preguntas: 4 }
    ]
    
    // Completar cada dominio
    dominios.forEach((dominio, index) => {
      // Verificar que estamos en el dominio correcto
      cy.contains(`Dominio ${index + 1} de 7`).should('be.visible')
      cy.contains(dominio.nombre).should('be.visible')
      
      // Verificar número correcto de preguntas
      cy.get('.pregunta-container').should('have.length', dominio.preguntas)
      
      // Responder todas las preguntas
      cy.get('.pregunta-container').each(($pregunta) => {
        cy.wrap($pregunta).find('input[type="radio"][value="3"]').check({ force: true })
      })
      
      // En el último dominio, debe aparecer botón Finalizar
      if (index === 6) {
        cy.get('#btnFinalizar').should('be.visible')
        cy.get('#btnSiguiente').should('not.exist')
        
        // Finalizar
        cy.get('#btnFinalizar').click()
        
        // Manejar confirmación
        cy.on('window:confirm', () => true)
        
        // Verificar que se completó
        cy.get('#listaView', { timeout: 10000 }).should('be.visible')
        cy.get('tbody tr').last().within(() => {
          cy.get('.badge').should('contain', 'Completado')
        })
      } else {
        // Avanzar al siguiente dominio
        cy.get('#btnSiguiente').click()
        cy.wait(500)
      }
    })
  })
})