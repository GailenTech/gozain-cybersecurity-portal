describe.skip('Procesos de Negocio - Gestión de Personal', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  it('Debe crear proceso de Cambio de Rol/Departamento', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('cambio_rol')
    
    // Esperar a que se carguen los campos dinámicos
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#empleado').type('Juan Pérez')
    cy.get('#rol_anterior').type('Analista Junior')
    cy.get('#rol_nuevo').type('Analista Senior')
    cy.get('#departamento_anterior').type('Soporte')
    cy.get('#departamento_nuevo').type('Desarrollo')
    cy.get('#fecha_cambio').type('2025-07-15')
    cy.get('#requiere_formacion').check()
    
    // Verificar vista previa
    cy.get('#vistaPrevia').should('be.visible')
    cy.get('#listaVistaPrevia').should('contain', 'tareas de seguimiento')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar en lista
    cy.get('#filtroTipo').select('cambio_rol')
    cy.get('#btnBuscar').click()
    cy.get('tbody').should('contain', 'Cambio de Rol/Departamento')
    cy.get('tbody').should('contain', 'Juan Pérez')
  })

  it('Debe crear proceso de Configuración Trabajo Remoto', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('configuracion_remoto')
    
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#empleado').type('María García')
    cy.get('#tipo_acceso').select('VPN completa')
    cy.get('#duracion').select('Permanente')
    cy.get('#equipo_personal').check()
    cy.get('#fecha_inicio').type('2025-07-20')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar que se creó
    cy.get('#filtroTipo').select('configuracion_remoto')
    cy.get('#btnBuscar').click()
    cy.get('tbody').should('contain', 'Configuración Trabajo Remoto')
    cy.get('tbody').should('contain', 'María García')
    
    // Verificar tareas generadas
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('#modalDetalleImpacto').should('be.visible')
    cy.get('.tareas-lista').should('contain', 'Configurar acceso VPN')
    cy.get('.tareas-lista').should('contain', 'Verificar configuración de seguridad en equipo personal')
  })
})