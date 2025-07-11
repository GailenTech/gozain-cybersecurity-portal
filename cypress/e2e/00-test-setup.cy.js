describe('Setup de Organización de Prueba', () => {
  const TEST_ORG_NAME = 'E2E Test Organization'
  const TEST_ORG_ID = 'e2e_test_org'
  
  it('Debe crear una organización limpia para pruebas', () => {
    cy.visit('/')
    cy.wait(2000)
    
    cy.get('body').then($body => {
      // Si ya estamos en el selector de herramientas (organización ya seleccionada)
      if ($body.find('.tool-selector-container').length > 0) {
        cy.get('#organizationButton').click()
        cy.wait(1000)
      } else if ($body.find('#organizationButton').length > 0) {
        // Si estamos en la página de bienvenida, hacer clic en el botón de organización
        cy.get('#organizationButton').click()
        cy.wait(1000)
      }
      
      // Ahora deberíamos ver el modal de organizaciones
      cy.get('#organizationModal', { timeout: 5000 }).should('be.visible')
      
      // Verificar si hay organizaciones existentes
      cy.get('body').then($modal => {
        const hasOrgs = $modal.find('#organizationList .list-group-item').length > 0
        
        if (hasOrgs) {
          // Buscar si ya existe nuestra organización de test
          let found = false
          cy.get('#organizationList .list-group-item').each($item => {
            if ($item.text().includes(TEST_ORG_NAME)) {
              cy.wrap($item).click()
              found = true
              return false
            }
          }).then(() => {
            if (!found) {
              // Si no existe, crearla
              cy.get('#btnNewOrganization').click()
              cy.wait(500)
              cy.get('#newOrgName').clear().type(TEST_ORG_NAME)
              cy.get('#btnCreateOrganization').click()
              cy.wait(2000)
            }
          })
        } else {
          // No hay organizaciones, crear la primera
          cy.get('#btnNewOrganization').click()
          cy.wait(500)
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
    // Usar comando loginWithOrg para asegurar que estamos en la organización correcta
    cy.loginWithOrg(TEST_ORG_NAME)
    
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
    // Usar comando loginWithOrg
    cy.loginWithOrg(TEST_ORG_NAME)
    
    // Navegar a Impactos
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
    // Usar comando loginWithOrg
    cy.loginWithOrg(TEST_ORG_NAME)
    
    // Navegar a Madurez
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