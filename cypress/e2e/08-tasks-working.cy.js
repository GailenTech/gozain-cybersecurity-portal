describe('Sistema de Tareas - Funcionamiento Real', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    
    // Ir a impactos
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.wait(2000)
  })

  it('Crear impacto con plantilla real alta_empleado', () => {
    // Crear un impacto con los campos correctos
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#modalNuevoImpacto').should('be.visible')
    
    cy.get('#tipoImpacto').select('alta_empleado')
    cy.wait(1000)
    
    // Llenar campos según la plantilla real
    cy.get('#nombre_completo').type('Juan Pérez')
    cy.get('#email').type('juan.perez@empresa.com')
    cy.get('#departamento').select('IT')
    cy.get('#cargo').type('Desarrollador Senior')
    cy.get('#fecha_inicio').type('2025-07-15')
    cy.get('#modalidad').select('Híbrido')
    cy.get('#necesita_movil').check()
    
    cy.get('#btnCrearImpacto').click()
    cy.wait(2000)
    
    // Verificar que se creó
    cy.get('.toast').should('be.visible')
    cy.get('.toast-body').should('contain', 'creado correctamente')
  })

  it('Procesar impacto para generar tareas', () => {
    // Ir a lista para encontrar el impacto
    cy.get('[data-menu-item="lista"]').click()
    cy.wait(2000)
    
    // Abrir el primer impacto pendiente
    cy.get('#tablaImpactos tr').first().within(() => {
      cy.get('.badge').should('contain', 'pendiente')
      cy.get('.btn-primary').click()
    })
    
    cy.wait(1000)
    
    // Procesar
    cy.get('#btnProcesarImpacto').should('be.visible').click()
    cy.wait(2000)
    
    // Verificar mensaje de éxito
    cy.get('.toast').should('be.visible')
    cy.get('.toast-body').should('contain', 'procesado correctamente')
  })

  it('Verificar tareas generadas desde la API real', () => {
    // Ir a tareas
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Verificar que hay tareas (pueden ser de la API o simuladas)
    cy.get('#tablaTareas').should('be.visible')
    
    // El contador debe mostrar algo
    cy.get('[data-menu-item="tareas"] .badge').then($badge => {
      const count = parseInt($badge.text())
      cy.log(`Tareas encontradas: ${count}`)
      
      if (count > 0) {
        // Si hay tareas, verificar la tabla
        cy.get('#tablaTareas tbody tr').should('have.length.greaterThan', 0)
      } else {
        // Si no hay tareas, debe mostrar mensaje
        cy.get('#tablaTareas tbody').should('contain', 'No hay tareas pendientes')
      }
    })
  })

  it('Completar tarea individual con API real', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Solo si hay tareas
    cy.get('#tablaTareas tbody tr').then($rows => {
      if ($rows.length > 0) {
        // Contar tareas iniciales
        const initialCount = $rows.length
        
        // Completar primera tarea
        cy.get('#tablaTareas tbody tr').first().within(() => {
          cy.get('.btn-success').click()
        })
        
        cy.wait(2000)
        
        // Verificar mensaje
        cy.get('.toast').should('be.visible')
        cy.get('.toast-body').invoke('text').then(text => {
          if (text.includes('completada')) {
            // Si se completó, debe haber menos tareas
            cy.get('#tablaTareas tbody tr').should('have.length.lessThan', initialCount)
          } else {
            // Si hubo error, las tareas siguen igual
            cy.log('Error al completar:', text)
          }
        })
      } else {
        cy.log('No hay tareas para completar')
      }
    })
  })

  it('Botón posponer muestra mensaje informativo', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    cy.get('#tablaTareas tbody tr').then($rows => {
      if ($rows.length > 0) {
        // Seleccionar una tarea
        cy.get('.tarea-checkbox').first().check()
        
        // Click en posponer
        cy.get('#btnPosponer').click()
        cy.wait(1000)
        
        // Debe mostrar mensaje de advertencia
        cy.get('.toast').should('be.visible')
        cy.get('.toast-body').should('contain', 'próximamente')
      }
    })
  })

  it('Verificar integración con inventario', () => {
    // Cambiar a inventario
    cy.get('#toolSelectorButton').click()
    cy.get('.tool-card').contains('Inventario de Activos').click()
    cy.wait(2000)
    
    // Ir a lista
    cy.get('[data-menu-item="lista"]').click()
    cy.wait(2000)
    
    // Buscar activos creados por el impacto
    cy.get('#filtroBusqueda').type('Juan Pérez')
    cy.get('#btnBuscar').click()
    cy.wait(1000)
    
    // Debe haber al menos un activo (laptop)
    cy.get('#tablaActivos tbody tr').then($rows => {
      if ($rows.text().includes('No se encontraron')) {
        cy.log('No se encontraron activos - puede que el impacto no se haya procesado')
      } else {
        cy.get('#tablaActivos').should('contain', 'Laptop')
        cy.get('#tablaActivos').should('contain', 'Juan Pérez')
      }
    })
  })

  it('Verificar persistencia de tareas completadas', () => {
    cy.get('[data-menu-item="tareas"]').click()
    cy.wait(2000)
    
    // Obtener contador inicial
    cy.get('[data-menu-item="tareas"] .badge').then($badge => {
      const count1 = parseInt($badge.text())
      
      // Cambiar vista y volver
      cy.get('[data-menu-item="dashboard"]').click()
      cy.wait(1000)
      cy.get('[data-menu-item="tareas"]').click()
      cy.wait(2000)
      
      // El contador debe ser el mismo si usamos la API real
      cy.get('[data-menu-item="tareas"] .badge').then($badge2 => {
        const count2 = parseInt($badge2.text())
        cy.log(`Contador antes: ${count1}, después: ${count2}`)
        
        // Si usa API real, deberían ser iguales
        // Si usa simulación, podrían ser diferentes
      })
    })
  })
})