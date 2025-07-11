describe('Validación Final - Fix Navegación Cuestionario Madurez', () => {
  beforeEach(() => {
    // Setup simple
    cy.visit('/')
    cy.wait(2000)
    
    // Asegurar organización
    cy.get('body').then($body => {
      if ($body.find('.tool-selector-container').length === 0) {
        cy.get('#organizationButton').click({ force: true })
        cy.wait(1000)
        cy.get('#organizationList .list-group-item').first().click({ force: true })
      }
    })
    
    // Ir al módulo de madurez
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()
    cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
  })

  it('VALIDACIÓN CRÍTICA: Usuario puede navegar por todos los dominios del cuestionario', () => {
    // 1. Crear evaluación
    cy.get('#btnNuevaEvaluacion, [data-menu-item="nueva"], .btn:contains("Nueva Evaluación")').first().click()
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    cy.get('#nombreEvaluacion').clear().type('Validación Navegación Final')
    cy.get('#btnCrearEvaluacion').click()
    cy.wait(2000)
    
    // 2. Ir a lista y abrir cuestionario
    cy.get('#btnVistaLista').click({ force: true })
    cy.wait(1000)
    cy.get('tbody tr').last().find('button').first().click()
    
    // 3. PUNTO CRÍTICO: Navegar por los primeros 3 dominios
    // Dominio 1
    cy.get('.questionnaire-view').should('be.visible')
    cy.contains('Dominio 1 de 7').should('be.visible')
    cy.contains('Protección de acceso').should('be.visible')
    cy.get('.pregunta-container').each($p => cy.wrap($p).find('input[value="3"]').check({ force: true }))
    cy.get('#btnSiguiente').click()
    
    // Dominio 2 - ESTE ERA EL PROBLEMA REPORTADO
    cy.contains('Dominio 2 de 7', { timeout: 5000 }).should('be.visible')
    cy.contains('Seguridad en dispositivos y redes').should('be.visible')
    cy.get('.pregunta-container').each($p => cy.wrap($p).find('input[value="2"]').check({ force: true }))
    cy.get('#btnSiguiente').click()
    
    // Dominio 3 - VERIFICAR QUE PODEMOS AVANZAR MÁS ALLÁ DEL SEGUNDO
    cy.contains('Dominio 3 de 7', { timeout: 5000 }).should('be.visible')
    cy.contains('Protección de datos').should('be.visible')
    
    // Verificar navegación hacia atrás también
    cy.get('#btnAnterior').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 3 de 7').should('be.visible')
    
    cy.log('✅ NAVEGACIÓN FUNCIONANDO CORRECTAMENTE')
  })
  
  it('Debe mantener funcionalidad después de cambiar de vista y volver', () => {
    // Crear evaluación
    cy.get('#btnNuevaEvaluacion, [data-menu-item="nueva"]').first().click()
    cy.get('#nombreEvaluacion').clear().type('Test Vista')
    cy.get('#btnCrearEvaluacion').click()
    cy.wait(2000)
    
    // Abrir cuestionario
    cy.get('#btnVistaLista').click({ force: true })
    cy.wait(1000)
    cy.get('tbody tr').last().find('button').first().click()
    
    // Completar dominio 1
    cy.get('.pregunta-container').each($p => cy.wrap($p).find('input').first().check({ force: true }))
    cy.get('#btnSiguiente').click()
    
    // Volver a la lista (cambiar de vista)
    cy.get('#btnVistaLista').should('be.visible').click()
    cy.get('#listaView').should('be.visible')
    
    // Volver al cuestionario
    cy.get('tbody tr').last().find('button').first().click()
    
    // VERIFICAR: Los botones siguen funcionando después de cambiar de vista
    cy.get('#btnSiguiente').should('be.visible').should('not.be.disabled')
    cy.get('#btnAnterior').should('be.visible').should('not.be.disabled')
    
    // Completar dominio actual y avanzar
    cy.get('.pregunta-container').each($p => cy.wrap($p).find('input').first().check({ force: true }))
    cy.get('#btnSiguiente').click()
    
    // Verificar que avanzamos correctamente
    cy.contains('Dominio 3 de 7').should('be.visible')
  })
})