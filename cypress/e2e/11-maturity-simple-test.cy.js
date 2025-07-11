describe('Test Simple del Módulo de Madurez', () => {
  it('Debe mostrar el módulo de Madurez en el selector de herramientas', () => {
    // Visitar la página
    cy.visit('/')
    cy.wait(2000)
    
    // Asegurar que tenemos una organización
    cy.get('#organizationName').then($name => {
      const currentOrg = $name.text().trim()
      
      if (currentOrg === 'Seleccionar Organización') {
        // Crear o seleccionar organización
        cy.get('#organizationButton').click({ force: true })
        cy.wait(1500)
        
        cy.get('body').then($body => {
          if ($body.find('#organizationList .list-group-item').length > 0) {
            // Seleccionar primera organización
            cy.get('#organizationList .list-group-item').first().click({ force: true })
          } else {
            // Crear nueva organización
            cy.get('#btnNewOrganization').click({ force: true })
            cy.get('#newOrgName').type('Organización Test Simple')
            cy.get('#btnCreateOrganization').click()
          }
        })
      }
    })
    
    // Verificar que llegamos al selector de herramientas
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    
    // Verificar que está el módulo de madurez
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').should('be.visible')
    
    // Verificar que tiene el icono correcto
    cy.contains('.tool-card', 'Madurez en Ciberseguridad')
      .find('i.bi-shield-check')
      .should('be.visible')
    
    // Hacer clic en el módulo
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()
    
    // Verificar que se carga el módulo
    cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
    cy.contains('Madurez en Ciberseguridad').should('be.visible')
    
    // Verificar elementos básicos del dashboard
    cy.get('#statTotal').should('be.visible')
    cy.get('#statCompletadas').should('be.visible')
    cy.get('#statProgreso').should('be.visible')
    cy.get('#statPuntuacion').should('be.visible')
  })
  
  it('Debe permitir crear una evaluación básica', () => {
    // Partir desde el módulo ya cargado
    cy.visit('/')
    cy.wait(2000)
    
    // Seleccionar organización si es necesario
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
    
    // Buscar botón de nueva evaluación (puede estar en varios lugares)
    cy.get('body').then($body => {
      if ($body.find('#btnNuevaEvaluacion').length > 0) {
        cy.get('#btnNuevaEvaluacion').click()
      } else if ($body.find('[data-menu-item="nueva"]').length > 0) {
        cy.get('[data-menu-item="nueva"]').click()
      } else {
        cy.get('.btn').contains('Nueva Evaluación').click()
      }
    })
    
    // Verificar que se abre el modal
    cy.get('#modalNuevaEvaluacion', { timeout: 5000 }).should('be.visible')
    
    // Llenar formulario básico
    cy.get('#nombreEvaluacion').clear().type('Test E2E Simple')
    cy.get('#descripcionEvaluacion').clear().type('Prueba automatizada básica')
    
    // Crear evaluación
    cy.get('#btnCrearEvaluacion').click()
    
    // Esperar a que se cierre el modal
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    cy.get('#modalNuevaEvaluacion', { timeout: 10000 }).should('not.be.visible')
    
    // Ir a la lista para verificar que se creó
    cy.get('#btnVistaLista').click()
    cy.get('#listaView').should('be.visible')
    
    // Verificar que la evaluación aparece en la lista
    cy.contains('Test E2E Simple').should('be.visible')
    
    // Verificar estado inicial
    cy.contains('Test E2E Simple').parent().parent().within(() => {
      cy.get('.badge').should('contain', 'Abierto')
    })
  })
})