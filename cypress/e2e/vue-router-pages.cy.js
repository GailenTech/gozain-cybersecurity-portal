describe('Vue Router - Páginas Separadas', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Inventario de Activos').click()
  })

  it('Debe mostrar Dashboard como página inicial', () => {
    // Dashboard debe ser la página por defecto
    cy.contains('Dashboard de Inventario', {timeout: 5000}).should('exist')
    cy.get('.card').contains('Total Activos').should('exist')
    cy.get('.card').contains('Acciones Rápidas').should('exist')
  })

  it('Debe navegar a Inventario desde el menú lateral', () => {
    // Verificar que el menú lateral existe
    cy.get('#appMenu').should('exist')
    
    // Click en Inventario de Activos en el menú
    cy.get('#appMenu').contains('Inventario de Activos').click()
    
    // Debe mostrar la página de inventario
    cy.contains('h2', 'Inventario de Activos').should('exist')
    cy.get('#tablaActivos').should('exist')
    cy.get('#btnNuevoActivo').should('exist')
  })

  it('Debe navegar entre Dashboard e Inventario', () => {
    // Empezar en Dashboard
    cy.contains('Dashboard de Inventario').should('exist')
    
    // Ir a Inventario desde el menú
    cy.get('#appMenu').contains('Inventario de Activos').click()
    cy.contains('h2', 'Inventario de Activos').should('exist')
    
    // Volver a Dashboard desde el menú
    cy.get('#appMenu').contains('Dashboard').click()
    cy.contains('Dashboard de Inventario').should('exist')
  })

  it('Debe mantener el estado activo del menú', () => {
    // Dashboard debe estar activo inicialmente
    cy.get('#appMenu').contains('Dashboard').parent().should('have.class', 'active')
    
    // Navegar a Inventario
    cy.get('#appMenu').contains('Inventario de Activos').click()
    
    // Inventario debe estar activo ahora
    cy.get('#appMenu').contains('Inventario de Activos').parent().should('have.class', 'active')
    cy.get('#appMenu').contains('Dashboard').parent().should('not.have.class', 'active')
  })

  it('Debe abrir modal de nuevo activo desde el menú', () => {
    // Click en Nuevo Activo del menú
    cy.get('#appMenu').contains('Nuevo Activo').click()
    
    // Debe abrir el modal
    cy.get('#modalActivo').should('be.visible')
    cy.get('#modalActivoTitle').should('contain', 'Nuevo Activo')
    
    // Cerrar modal
    cy.get('#modalActivo .btn-close').click()
    cy.get('#modalActivo').should('not.exist')
  })

  it('Debe navegar desde Dashboard a Inventario con botón Ver Inventario', () => {
    // Verificar que estamos en Dashboard
    cy.contains('Dashboard de Inventario').should('exist')
    
    // Click en Ver Inventario
    cy.get('#btnVerInventario').click()
    
    // Debe estar en la página de Inventario
    cy.contains('h2', 'Inventario de Activos').should('exist')
    cy.get('#tablaActivos').should('exist')
  })

  it('Debe navegar a páginas en desarrollo', () => {
    // Navegar a Reportes
    cy.get('#appMenu').contains('Reportes').click()
    cy.contains('h2', 'Reportes').should('exist')
    cy.contains('Módulo de reportes en desarrollo').should('exist')
    
    // Navegar a Auditoría
    cy.get('#appMenu').contains('Auditoría').click()
    cy.contains('h2', 'Auditoría').should('exist')
    cy.contains('Módulo de auditoría en desarrollo').should('exist')
  })
})