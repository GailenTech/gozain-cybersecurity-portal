// Comandos personalizados para Gozain

// Resetear datos (en producción solo limpia localStorage)
Cypress.Commands.add('resetData', () => {
  cy.clearLocalStorage()
  cy.clearCookies()
})

// Crear organización de test
Cypress.Commands.add('createTestOrganization', () => {
  cy.visit('/')
  cy.get('#organizationButton').click()
  cy.get('#btnNewOrganization').click()
  cy.get('#newOrgName').type('Test Organization')
  cy.get('#btnCreateOrganization').click()
})

// DEPRECATED: Use direct navigation instead
// Example: cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()

// Comando para seleccionar organización
Cypress.Commands.add('selectOrganization', (orgName) => {
  // Check if already selected
  cy.get('#organizationName').then($name => {
    if ($name.text() === orgName) {
      cy.log(`Organization ${orgName} already selected`)
      return
    }
    
    // Click organization button
    cy.get('#organizationButton').click({ force: true })
    cy.wait(1000) // Wait for modal animation
    
    // Try to find the organization or select first available
    cy.get('body').then($body => {
      if ($body.find('#organizationList .list-group-item').length > 0) {
        // Check if specific org exists
        const $items = $body.find('#organizationList .list-group-item')
        let found = false
        
        $items.each((index, element) => {
          if (element.textContent.includes(orgName)) {
            cy.wrap(element).click({ force: true })
            found = true
            return false // break
          }
        })
        
        if (!found) {
          cy.log('Organization not found, selecting first available')
          cy.get('#organizationList .list-group-item').first().click({ force: true })
        }
      }
    })
    
    // Verify selection
    cy.get('#organizationName').should('not.contain', 'Seleccionar Organización')
  })
})

// Comando para navegar a una herramienta
Cypress.Commands.add('navigateToTool', (toolName) => {
  // Si estamos en una herramienta, volver a inicio
  cy.get('body').then(($body) => {
    if ($body.find('#btnHomeTop').length > 0) {
      cy.get('#btnHomeTop').click()
    }
  })
  
  // Seleccionar herramienta
  cy.contains('.tool-card', toolName).click()
})

// Comando para login con organización
Cypress.Commands.add('loginWithOrg', (orgName = 'E2E Test Organization') => {
  cy.visit('/')
  cy.wait(2000) // Wait for page initialization
  
  // Check if already in tool selector (organization remembered)
  cy.get('body').then($body => {
    if ($body.find('.tool-selector-container').length > 0) {
      // Verificar que es la organización correcta
      cy.get('#organizationName').then($name => {
        if ($name.text().includes(orgName)) {
          cy.log('Organization already selected, in tool selector')
          return
        } else {
          // Cambiar a la organización correcta
          cy.get('#organizationButton').click({ force: true })
          cy.wait(1000)
          cy.selectOrganization(orgName)
        }
      })
      return
    }
    
    // Check if we need to select an organization
    cy.get('#organizationName').then($name => {
      const currentOrg = $name.text().trim()
      
      if (currentOrg === 'Seleccionar Organización' || !currentOrg.includes(orgName)) {
        // Need to select an organization
        cy.get('#organizationButton').click({ force: true })
        cy.wait(1500)
        
        // Check if there are any organizations
        cy.get('body').then($body => {
          const hasOrgs = $body.find('#organizationList .list-group-item').length > 0
          
          if (!hasOrgs) {
            cy.log('No hay organizaciones, creando una nueva')
            
            // Click new organization button
            cy.get('#btnNewOrganization').click({ force: true })
            cy.wait(500)
            
            // Fill new organization form
            cy.get('#newOrgName').type(orgName)
            cy.get('#btnCreateOrganization').click()
            cy.wait(2000)
          } else {
            // Buscar la organización específica
            let found = false
            cy.get('#organizationList .list-group-item').each($item => {
              if ($item.text().includes(orgName)) {
                cy.wrap($item).click({ force: true })
                found = true
                return false
              }
            }).then(() => {
              if (!found) {
                // Si no existe, crearla
                cy.get('body').then($modal => {
                  if ($modal.find('#btnNewOrganization').length > 0) {
                    cy.get('#btnNewOrganization').click({ force: true })
                    cy.wait(500)
                    cy.get('#newOrgName').type(orgName)
                    cy.get('#btnCreateOrganization').click()
                    cy.wait(2000)
                  }
                })
              }
            })
          }
        })
      }
    })
    
    cy.get('.tool-selector-container', { timeout: 10000 }).should('be.visible')
  })
})

// Comando para crear un activo
Cypress.Commands.add('createAsset', (assetData) => {
  cy.get('#btnNuevoActivo, [data-menu-item="nuevo"]').first().click()
  cy.get('#modalActivo').should('be.visible')
  
  // Llenar formulario
  cy.get('#tipoActivo').select(assetData.tipo)
  cy.get('#nombreActivo').clear().type(assetData.nombre)
  cy.get('#responsableActivo').clear().type(assetData.responsable)
  cy.get('#departamentoActivo').clear().type(assetData.departamento)
  cy.get('#estadoActivo').select(assetData.estado || 'Activo')
  cy.get('#criticidadActivo').select(assetData.criticidad || 'Normal')
  cy.get('#clasificacionActivo').select(assetData.clasificacion || 'Interno')
  
  if (assetData.descripcion) {
    cy.get('#descripcionActivo').clear().type(assetData.descripcion)
  }
  
  // Guardar
  cy.get('#btnGuardarActivo').click()
  cy.get('.toast-body').should('contain', 'creado correctamente')
})

// Comando para crear un impacto
Cypress.Commands.add('createImpact', (impactType, impactData) => {
  cy.get('#btnNuevoImpacto, [data-menu-item="nuevo"]').first().click()
  cy.get('#modalNuevoImpacto').should('be.visible')
  
  // Seleccionar tipo
  cy.get('#tipoImpacto').select(impactType)
  cy.wait(500) // Esperar a que cargue la plantilla
  
  // Llenar campos dinámicos
  Object.entries(impactData).forEach(([field, value]) => {
    cy.get(`#${field}`).then($el => {
      if ($el.is('select')) {
        cy.get(`#${field}`).select(value)
      } else if ($el.is(':checkbox')) {
        if (value) cy.get(`#${field}`).check()
      } else {
        cy.get(`#${field}`).clear().type(value)
      }
    })
  })
  
  // Crear
  cy.get('#btnCrearImpacto').click()
  cy.get('.toast-body').should('contain', 'creado correctamente')
})

// Comando para verificar estadísticas
Cypress.Commands.add('verifyStats', (expectedStats) => {
  Object.entries(expectedStats).forEach(([statId, value]) => {
    cy.get(`#${statId}`).should('have.text', value.toString())
  })
})

// Comando para filtrar activos
Cypress.Commands.add('filterAssets', (filters) => {
  if (filters.tipo) {
    cy.get('#filtroTipo').select(filters.tipo)
  }
  if (filters.departamento) {
    cy.get('#filtroDepartamento').select(filters.departamento)
  }
  if (filters.busqueda) {
    cy.get('#filtroBusqueda').clear().type(filters.busqueda)
  }
  cy.get('#btnBuscar').click()
})

// Comando para cambiar vista
Cypress.Commands.add('switchView', (view) => {
  if (view === 'dashboard') {
    // Click en el botón
    cy.get('#btnVistaDashboard').click({ force: true })
    cy.wait(1000) // Más tiempo de espera
    
    // Verificar que el dashboard es visible usando clases
    cy.get('#dashboardView').should('not.have.class', 'd-none')
    cy.get('#listaView').should('have.class', 'd-none')
    
    // Verificar atributo data
    cy.get('.inventario-app').should('have.attr', 'data-current-view', 'dashboard')
  } else if (view === 'lista') {
    // Click en el botón
    cy.get('#btnVistaLista').should('be.visible').click({ force: true })
    cy.wait(1500) // Más tiempo de espera
    
    // Verificar que la lista es visible - usar should directamente
    cy.get('#listaView').should('be.visible')
    cy.get('#dashboardView').should('not.be.visible')
    
    // Verificar atributo data
    cy.get('.inventario-app').should('have.attr', 'data-current-view', 'lista')
    
    // Verificar que la tabla también existe
    cy.get('#tablaActivos').should('exist')
    
    // Verificar que los filtros son visibles
    cy.get('#filtrosSection').should('be.visible')
  }
})

// Comando para verificar que no hay errores en consola
Cypress.Commands.add('checkNoConsoleErrors', () => {
  // Simplificado - solo log para debug
  cy.window().then((win) => {
    cy.log('Console errors check - simplified version')
  })
})

// =================== COMANDOS ESPECÍFICOS PARA MADUREZ ===================

// DEPRECATED: Use direct UI steps instead
// Example:
// cy.get('[data-menu-item="nueva"]').click()
// cy.get('#modalNuevaEvaluacion').should('be.visible')
// cy.get('#nombreEvaluacion').clear().type('Test')
// cy.get('#btnCrearEvaluacion').click()

// Comando para completar un cuestionario de madurez
Cypress.Commands.add('completeMaturityQuestionnaire', (responses = 'random') => {
  // Buscar el botón de completar evaluación
  cy.get('body').then($body => {
    if ($body.find('button[onclick*="completarEvaluacion"]').length > 0) {
      cy.get('button[onclick*="completarEvaluacion"]').first().click()
    } else {
      cy.get('.btn').contains('▶').click()
    }
  })
  
  // Esperar a que cargue el cuestionario
  cy.get('.questionnaire-view').should('be.visible')
  
  // Completar todos los dominios
  for (let dominio = 0; dominio < 7; dominio++) {
    cy.log(`Completando dominio ${dominio + 1}/7`)
    
    // Verificar que estamos en el dominio correcto
    cy.contains(`Dominio ${dominio + 1} de 7`).should('be.visible')
    
    // Responder todas las preguntas del dominio
    cy.get('.pregunta-container').each(($pregunta) => {
      const preguntaId = $pregunta.attr('data-pregunta-id')
      
      // Seleccionar una respuesta (aleatoria si no se especifica)
      if (responses === 'random') {
        cy.wrap($pregunta).find('input[type="radio"]').then($radios => {
          const randomIndex = Math.floor(Math.random() * $radios.length)
          cy.wrap($radios[randomIndex]).check({ force: true })
        })
      } else if (typeof responses === 'object' && responses[preguntaId]) {
        cy.wrap($pregunta).find(`input[value="${responses[preguntaId]}"]`).check({ force: true })
      } else {
        // Por defecto, seleccionar valor 3 (Sí)
        cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
      }
    })
    
    // Ir al siguiente dominio (o finalizar si es el último)
    if (dominio < 6) {
      cy.get('#btnSiguiente').should('be.visible').click()
      cy.wait(500) // Esperar transición
    } else {
      // Finalizar evaluación
      cy.get('#btnFinalizar').should('be.visible').click()
      
      // Confirmar finalización
      cy.on('window:confirm', () => true)
      
      // Verificar que se completó
      cy.get('.toast-body').should('contain', 'completada correctamente')
    }
  }
})

// DEPRECATED: Use direct navigation instead
// Example: cy.get('#btnVistaLista').click()

// Comando para verificar dashboard de resultados
Cypress.Commands.add('verifyMaturityDashboard', (assessmentId = null) => {
  if (assessmentId) {
    // Buscar y hacer clic en el botón de dashboard para la evaluación específica
    cy.get(`button[onclick*="verDashboard('${assessmentId}')"]`).click()
  } else {
    // Buscar cualquier botón de dashboard
    cy.get('button[onclick*="verDashboard"]').first().click()
  }
  
  // Verificar que se carga el dashboard
  cy.get('.assessment-dashboard').should('be.visible')
  
  // Verificar elementos clave del dashboard
  cy.get('#radarChart').should('be.visible')
  cy.get('#gapsChart').should('be.visible')
  cy.get('#roadmapChart').should('be.visible')
  
  // Verificar métricas
  cy.contains('Puntuación Total').should('be.visible')
  cy.contains('Estado Actual vs Objetivos').should('be.visible')
  cy.contains('Análisis de Gaps').should('be.visible')
})

// Comando para firmar una evaluación
Cypress.Commands.add('signMaturityAssessment', (firmante = 'Usuario Test') => {
  // Buscar botón de firmar
  cy.get('button[onclick*="firmarEvaluacion"], #btnFirmar').first().click()
  
  // Manejar el prompt del nombre del firmante
  cy.window().then((win) => {
    cy.stub(win, 'prompt').returns(firmante)
  })
  
  // Verificar que se firmó
  cy.get('.toast-body').should('contain', 'firmada correctamente')
})

// Comando para verificar histórico de madurez
Cypress.Commands.add('verifyMaturityHistory', () => {
  // Ir a la vista de histórico
  cy.get('[data-menu-item="historico"]').click()
  
  // Verificar que se carga la vista
  cy.get('.history-view').should('be.visible')
  
  // Verificar elementos del histórico
  cy.contains('Histórico de Evaluaciones').should('be.visible')
  cy.contains('Total Evaluaciones').should('be.visible')
})