describe('Setup de Organización de Prueba', () => {
  const TEST_ORG_NAME = 'E2E Test Organization'
  const TEST_ORG_ID = 'e2e_test_org'
  
  it('Debe crear una organización limpia para pruebas', () => {
    cy.visit('/')
    
    // Simular autenticación
    cy.mockAuth({ organizacion_id: TEST_ORG_ID })
    cy.reload()
    cy.wait(1000)
    
    // Hacer clic en el botón de organización en la navbar
    cy.get('#organizationButton').click()
    // Ahora el modal debería estar visible
    cy.get('#organizationModal', { timeout: 5000 }).should('be.visible')
    
    // Buscar si ya existe nuestra organización de test
    cy.get('#organizationList .list-group-item').then($items => {
      const found = Array.from($items).some(item => 
        item.textContent.includes(TEST_ORG_NAME)
      )
      
      if (found) {
        // Si existe, seleccionarla - hacer click en el elemento que contiene el texto
        cy.get('#organizationList')
          .contains('.list-group-item', TEST_ORG_NAME)
          .click({ force: true })
      } else {
        // Si no existe, crearla
        cy.get('#btnNewOrganization').click()
        cy.get('#newOrgName').clear().type(TEST_ORG_NAME)
        cy.get('#btnCreateOrganization').click()
      }
    })
    
    // Esperar un momento para que se procese el click
    cy.wait(1000)
    
    // Verificar que el modal ya no tiene la clase 'show' (está oculto)
    cy.get('#organizationModal').should('not.have.class', 'show')
    
    // Verificar que se seleccionó correctamente
    cy.get('#organizationName', {timeout: 5000}).should('contain', TEST_ORG_NAME)
    
    // Verificar que se muestran las herramientas
    cy.contains('Portal de Ciberseguridad').should('be.visible')
  })
  
  it('Debe crear activos base en inventario', () => {
    // Volver a cargar la página con autenticación
    cy.loginWithOrg(TEST_ORG_NAME)
    
    // Intercept API calls
    cy.intercept('POST', '/api/inventario/activos').as('createActivo')
    
    // Hacer clic en la herramienta de inventario
    cy.contains('Inventario de Activos').parent().parent().click()
    cy.get('#appMenu', {timeout: 5000}).should('be.visible')
    
    // Ir a la lista
    cy.get('#btnVerInventario').click()
    cy.get('.inventario-list-view', {timeout: 3000}).should('be.visible')
    
    // Crear múltiples activos
    const activos = [
      { tipo: 'Hardware', nombre: 'Servidor Principal', responsable: 'Admin TI', departamento: 'TI', criticidad: 'Crítica' },
      { tipo: 'Software', nombre: 'Sistema CRM', responsable: 'Gerente Ventas', departamento: 'Ventas', criticidad: 'Importante' },
      { tipo: 'Información', nombre: 'Base de Datos Clientes', responsable: 'DPO', departamento: 'Legal', criticidad: 'Crítica' },
      { tipo: 'Servicio', nombre: 'Soporte Técnico', responsable: 'Jefe Soporte', departamento: 'TI', criticidad: 'Normal' },
      { tipo: 'Personal', nombre: 'Equipo Desarrollo', responsable: 'CTO', departamento: 'Desarrollo', criticidad: 'Importante' }
    ]
    
    activos.forEach(activo => {
      cy.get('#btnNuevoActivo').click()
      cy.get('#modalActivo').should('be.visible')
      
      cy.get('#tipoActivo').select(activo.tipo)
      cy.get('#nombreActivo').clear().type(activo.nombre)
      cy.get('#responsableActivo').clear().type(activo.responsable)
      cy.get('#departamentoActivo').clear().type(activo.departamento)
      cy.get('#criticidadActivo').select(activo.criticidad)
      cy.get('#estadoActivo').select('Activo')
      
      cy.get('#btnGuardarActivo').click()
      cy.wait('@createActivo')
      cy.get('#modalActivo').should('not.have.class', 'show')
    })
    
    // Verificar que se crearon
    cy.get('#tablaActivos tbody tr').should('have.length.at.least', 5)
  })
  
  it('Debe configurar datos iniciales para módulo de impactos', () => {
    // Volver a cargar con la organización
    cy.loginWithOrg(TEST_ORG_NAME)
    
    // Intercept API calls
    cy.intercept('POST', '/api/impactos/analisis').as('createAnalisis')
    
    // Ir a impactos directamente
    cy.contains('Impactos de Negocio').parent().parent().click()
    cy.get('#currentToolName', {timeout: 5000}).should('contain', 'Impactos de Negocio')
    
    // Crear un análisis
    cy.get('#btnNuevoAnalisis').click()
    cy.get('#modalAnalisis').should('be.visible')
    
    cy.get('#nombreAnalisis').type('Análisis E2E Test')
    cy.get('#descripcionAnalisis').type('Análisis creado para pruebas E2E')
    cy.get('#btnGuardarAnalisis').click()
    
    cy.wait('@createAnalisis')
    cy.get('#modalAnalisis').should('not.have.class', 'show')
    
    // Verificar
    cy.get('#listaAnalisis').should('contain', 'Análisis E2E Test')
  })
  
  it('Debe crear una evaluación inicial en madurez', () => {
    // Volver a cargar con la organización
    cy.loginWithOrg(TEST_ORG_NAME)
    
    // Intercept API calls
    cy.intercept('POST', '/api/madurez/evaluaciones').as('createEvaluacion')
    
    // Ir a madurez directamente
    cy.contains('Madurez en Ciberseguridad').parent().parent().click()
    cy.get('#currentToolName', {timeout: 5000}).should('contain', 'Madurez en Ciberseguridad')
    
    // Crear evaluación
    cy.get('#btnNuevaEvaluacion').click()
    cy.get('#modalEvaluacion').should('be.visible')
    
    cy.get('#nombreEvaluacion').type('Evaluación E2E Test')
    cy.get('#descripcionEvaluacion').type('Evaluación inicial para pruebas')
    cy.get('#btnGuardarEvaluacion').click()
    
    cy.wait('@createEvaluacion')
    cy.get('#modalEvaluacion').should('not.have.class', 'show')
    
    // Verificar
    cy.get('#listaEvaluaciones').should('contain', 'Evaluación E2E Test')
  })
  
  it('Debe guardar el ID de la organización para otros tests', () => {
    // Guardar información para otros tests
    cy.window().then(win => {
      const orgId = win.localStorage.getItem('selectedOrganization')
      if (orgId) {
        cy.writeFile('cypress/fixtures/test-org.json', {
          id: orgId,
          name: TEST_ORG_NAME
        })
      }
    })
  })
})