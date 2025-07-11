describe('Setup de Organización de Prueba', () => {
  const TEST_ORG_NAME = 'E2E Test Organization'
  const TEST_ORG_ID = 'e2e_test_org'
  
  it('Debe crear una organización limpia para pruebas', () => {
    cy.visit('/')
    cy.wait(2000)
    
    // Manejar caso donde ya existe una organización
    cy.get('body').then($body => {
      // Si estamos en el selector de herramientas, volver a organizaciones
      if ($body.find('.tool-selector-container').length > 0) {
        cy.get('#organizationButton').click()
        cy.wait(1000)
      }
      
      // Verificar si ya existe la organización de prueba
      cy.get('body').then($modal => {
        if ($modal.find('#organizationList').length > 0) {
          // Buscar si ya existe nuestra organización de test
          cy.get('#organizationList .list-group-item').then($items => {
            let found = false
            $items.each((index, item) => {
              if (item.textContent.includes(TEST_ORG_NAME)) {
                found = true
                // Si existe, seleccionarla
                cy.wrap(item).click()
                return false
              }
            })
            
            if (!found) {
              // Si no existe, crearla
              cy.get('#btnNewOrganization').click()
              cy.get('#newOrgName').clear().type(TEST_ORG_NAME)
              cy.get('#btnCreateOrganization').click()
              cy.wait(2000)
            }
          })
        } else {
          // Primera vez, crear organización
          cy.get('#btnNewOrganization').click()
          cy.get('#newOrgName').clear().type(TEST_ORG_NAME)
          cy.get('#btnCreateOrganization').click()
          cy.wait(2000)
        }
      })
    })
    
    // Verificar que llegamos al selector de herramientas
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
    cy.get('#organizationName').should('contain', TEST_ORG_NAME)
  })
  
  it('Debe crear activos base en inventario', () => {
    // Ir a Inventario
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
    
    // Crear activos de prueba
    const activos = [
      {
        tipo: 'Hardware',
        nombre: 'Servidor Principal TEST',
        responsable: 'Admin Test',
        departamento: 'IT',
        estado: 'Activo',
        criticidad: 'Crítica',
        clasificacion: 'Confidencial'
      },
      {
        tipo: 'Software',
        nombre: 'Sistema ERP TEST',
        responsable: 'Admin Test',
        departamento: 'Finanzas',
        estado: 'Activo',
        criticidad: 'Importante',
        clasificacion: 'Interno'
      },
      {
        tipo: 'Personal',
        nombre: 'Usuario Test E2E',
        responsable: 'RRHH Test',
        departamento: 'Desarrollo',
        estado: 'Activo',
        criticidad: 'Normal',
        clasificacion: 'Interno'
      }
    ]
    
    activos.forEach(activo => {
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalActivo').should('be.visible')
      
      cy.get('#tipoActivo').select(activo.tipo)
      cy.get('#nombreActivo').clear().type(activo.nombre)
      cy.get('#responsableActivo').clear().type(activo.responsable)
      cy.get('#departamentoActivo').clear().type(activo.departamento)
      cy.get('#estadoActivo').select(activo.estado)
      cy.get('#criticidadActivo').select(activo.criticidad)
      cy.get('#clasificacionActivo').select(activo.clasificacion)
      
      cy.get('#btnGuardarActivo').click()
      cy.get('.toast-body').should('contain', 'creado correctamente')
      cy.wait(1000)
    })
    
    // Verificar que se crearon
    cy.get('tbody tr').should('have.length.at.least', 3)
  })
  
  it('Debe configurar datos iniciales para módulo de impactos', () => {
    // Navegar a Impactos
    cy.get('#toolSelectorButton').click()
    cy.contains('.tool-card', 'Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
    
    // Crear un impacto de ejemplo
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('alta_empleado')
    cy.wait(500)
    
    cy.get('#nombre_completo').type('Empleado Test E2E')
    cy.get('#departamento').type('IT')
    cy.get('#cargo').type('Desarrollador')
    cy.get('#fecha_inicio').type('2025-08-01')
    cy.get('#modalidad').select('Híbrido')
    cy.get('#equipo_movil').check()
    
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar
    cy.get('tbody').should('contain', 'Alta de Empleado')
  })
  
  it('Debe crear una evaluación inicial en madurez', () => {
    // Navegar a Madurez
    cy.get('#toolSelectorButton').click()
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()
    cy.get('.madurez-app', { timeout: 10000 }).should('be.visible')
    
    // Crear evaluación
    cy.get('#btnNuevaEvaluacion, [data-menu-item="nueva"]').first().click()
    cy.get('#modalNuevaEvaluacion').should('be.visible')
    
    cy.get('#nombreEvaluacion').clear().type('Evaluación Test E2E')
    cy.get('#descripcionEvaluacion').clear().type('Evaluación inicial para pruebas automatizadas')
    cy.get('#objetivo6m').clear().type('2.5')
    cy.get('#objetivo1a').clear().type('3.0')
    cy.get('#objetivo2a').clear().type('4.0')
    
    cy.get('#btnCrearEvaluacion').click()
    
    // Esperar cierre del modal
    cy.wait(2000)
    cy.get('.modal-backdrop', { timeout: 10000 }).should('not.exist')
    
    // Verificar
    cy.get('#statTotal').should('not.have.text', '0')
  })
  
  it('Debe guardar el ID de la organización para otros tests', () => {
    // Este test guarda información que otros tests pueden usar
    cy.window().then(win => {
      win.localStorage.setItem('e2e_test_org_name', TEST_ORG_NAME)
      win.localStorage.setItem('e2e_test_org_id', TEST_ORG_ID)
      win.localStorage.setItem('e2e_test_setup_complete', 'true')
      win.localStorage.setItem('e2e_test_setup_date', new Date().toISOString())
    })
    
    cy.log(`✅ Setup completo para organización: ${TEST_ORG_NAME}`)
  })
})