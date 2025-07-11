describe('Problemas de Tareas - Simplificado', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000)
    
    // Asegurar que tenemos una organización
    cy.get('#organizationButton').click()
    cy.wait(1000)
    
    // Seleccionar primera org o crear una nueva
    cy.get('body').then($body => {
      if ($body.find('#organizationList .list-group-item').length > 0) {
        cy.get('#organizationList .list-group-item').first().click()
      } else {
        cy.get('#btnNewOrganization').click()
        cy.get('#newOrgName').type('Test Org Tasks')
        cy.get('#btnCreateOrganization').click()
      }
    })
    cy.wait(2000)
    
    // Ir a impactos
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
  })

  it('Setup: Crear impacto para generar tareas', () => {
    // Crear un impacto para tener tareas
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#modalNuevoImpacto').should('be.visible')
    
    cy.get('#tipoImpacto').select('alta_empleado')
    cy.wait(1000)
    
    // Llenar campos requeridos
    cy.get('#nombre_completo').type('Test Employee')
    cy.get('#departamento').type('IT')
    cy.get('#cargo').type('Developer')
    cy.get('#necesita_equipo').check()
    cy.get('#necesita_acceso_sistemas').check()
    
    cy.get('#btnCrearImpacto').click()
    cy.wait(2000)
    
    // Procesar el impacto
    cy.get('#btnProcesarImpacto').should('be.visible').click()
    cy.wait(1000)
    
    // Verificar mensaje de éxito
    cy.get('.toast').should('be.visible')
    cy.get('.toast-body').should('contain', 'procesado correctamente')
  })

  it('Verificar que se generaron tareas', () => {
    // Ir directamente a tareas
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Verificar que hay tareas
    cy.get('#tablaTareas').should('be.visible')
    cy.get('#tablaTareas tbody tr').should('have.length.greaterThan', 0)
    
    // Verificar estructura de tareas
    cy.get('#tablaTareas tbody tr').first().within(() => {
      cy.get('td').should('have.length.greaterThan', 4)
      cy.get('.badge').should('contain', 'Pendiente')
      cy.get('.btn-success').should('be.visible') // Botón check
    })
  })

  it('PROBLEMA: Completar tarea no funciona correctamente', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Contar tareas iniciales
    cy.get('#tablaTareas tbody tr').then($rows => {
      const initialCount = $rows.length
      
      // Intentar completar primera tarea
      cy.get('#tablaTareas tbody tr').first().within(() => {
        cy.get('.btn-success').click()
      })
      
      cy.wait(1000)
      
      // Verificar toast
      cy.get('.toast').should('be.visible')
      cy.get('.toast-body').should('contain', 'Tarea marcada como completada')
      
      // PROBLEMA: La tarea sigue apareciendo igual
      cy.get('#tablaTareas tbody tr').should('have.length', initialCount)
      cy.get('#tablaTareas tbody tr').first().within(() => {
        // La tarea sigue pendiente
        cy.get('.badge').should('contain', 'Pendiente')
      })
    })
  })

  it('PROBLEMA: Completar múltiples tareas no persiste', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Seleccionar varias tareas
    cy.get('.tarea-checkbox').eq(0).check()
    cy.get('.tarea-checkbox').eq(1).check()
    
    // Debe aparecer sección de acciones masivas
    cy.get('#accionesMasivas').should('be.visible')
    cy.get('#btnCompletarSeleccionadas').should('be.visible')
    
    // Intentar completar
    cy.get('#btnCompletarSeleccionadas').click()
    
    // Manejar confirmación
    cy.on('window:confirm', () => true)
    cy.wait(1000)
    
    // Verificar mensaje
    cy.get('.toast-body').should('contain', 'tareas marcadas como completadas')
    
    // PROBLEMA: Las tareas siguen apareciendo
    cy.get('#tablaTareas tbody tr').should('have.length.greaterThan', 0)
    cy.get('.badge').contains('Pendiente').should('exist')
  })

  it('PROBLEMA: Botón posponer no tiene funcionalidad', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Seleccionar una tarea
    cy.get('.tarea-checkbox').first().check()
    
    // Verificar botón posponer
    cy.get('#btnPosponer').should('be.visible')
    cy.get('#btnPosponer').should('contain', 'Posponer')
    
    // Click en posponer
    cy.get('#btnPosponer').click()
    cy.wait(1000)
    
    // PROBLEMA: No pasa nada
    // No hay modal de fecha
    cy.get('.modal.show').should('not.exist')
    
    // No hay cambio en la interfaz
    cy.get('#tablaTareas tbody tr').first().within(() => {
      cy.get('.badge').should('contain', 'Pendiente')
    })
    
    // No hay mensaje de confirmación
    cy.get('.toast').should('not.exist')
  })

  it('Verificar contador de tareas en menú', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Verificar que el badge muestra número de tareas
    cy.get('[data-menu-item="tareas"] .badge').then($badge => {
      const count = parseInt($badge.text())
      expect(count).to.be.greaterThan(0)
      
      // Debe coincidir con las filas de la tabla
      cy.get('#tablaTareas tbody tr').should('have.length', count)
    })
  })

  it('Las tareas se regeneran en cada visita (no hay persistencia)', () => {
    // Primera visita
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    cy.get('#tablaTareas tbody tr').then($rows => {
      const count1 = $rows.length
      
      // Cambiar a otra vista
      cy.get('[data-menu-item="dashboard"]').click()
      cy.wait(1000)
      
      // Volver a tareas
      cy.get('[data-menu-item="tareas"]').click()
      cy.wait(2000)
      
      // El número debe ser el mismo (se regeneran)
      cy.get('#tablaTareas tbody tr').should('have.length', count1)
    })
  })

  it('No hay edición ni detalles avanzados de tareas', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    cy.get('#tablaTareas tbody tr').first().within(() => {
      // No hay botón de editar
      cy.get('.btn-warning').should('not.exist')
      cy.get('i.bi-pencil').should('not.exist')
      
      // Solo hay check y ver impacto
      cy.get('button').should('have.length', 2)
      cy.get('.btn-success').should('exist') // Check
      cy.get('.btn-info').should('exist') // Ver impacto
    })
  })
})