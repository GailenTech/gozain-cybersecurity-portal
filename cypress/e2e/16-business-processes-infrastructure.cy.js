describe('Procesos de Negocio - Infraestructura y Sistemas', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.navigateToTool('Impactos de Negocio')
  })

  it('Debe crear proceso de Cambio de Sistema/Infraestructura', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('cambio_sistema')
    
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#sistema_afectado').type('ERP Principal')
    cy.get('#tipo_cambio').select('Migración')
    cy.get('#fecha_cambio').type('2025-09-15')
    cy.get('#responsable_cambio').type('Miguel Ángel Torres')
    cy.get('#usuarios_afectados').type('Todos los usuarios del departamento financiero\nEquipo de ventas\nAdministración')
    cy.get('#plan_rollback').check()
    
    // Verificar vista previa
    cy.get('#vistaPrevia').should('be.visible')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar tareas críticas
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Realizar backup completo')
    cy.get('.tareas-lista').should('contain', 'Notificar a usuarios')
    cy.get('.tareas-lista').should('contain', 'Realizar pruebas de seguridad post-cambio')
  })

  it('Debe crear proceso de Apertura de Nueva Sede', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('nueva_sede')
    
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#nombre_sede').type('Oficina Barcelona')
    cy.get('#direccion').type('Av. Diagonal 123, 08028 Barcelona, España')
    cy.get('#responsable_sede').type('Isabel Martínez')
    cy.get('#num_empleados').type('25')
    cy.get('#fecha_apertura').type('2025-10-01')
    cy.get('#sistemas_locales').check()
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar activos generados
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.modal-body').should('contain', 'Infraestructura de red')
    cy.get('.modal-body').should('contain', 'Conectividad VPN')
    cy.get('.tareas-lista').should('contain', 'Configurar infraestructura de red')
    cy.get('.tareas-lista').should('contain', 'sistemas de seguridad física')
  })

  it('Debe crear proceso de Despliegue a Producción', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('despliegue_produccion')
    
    cy.wait(500)
    
    // Llenar formulario con datetime
    cy.get('#nombre_aplicacion').type('Portal de Clientes')
    cy.get('#version').type('2.5.0')
    cy.get('#tipo_despliegue').select('Nueva funcionalidad')
    cy.get('#fecha_despliegue').type('2025-07-25T22:00') // Datetime local
    cy.get('#responsable_tecnico').type('David Silva')
    cy.get('#requiere_downtime').check()
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar proceso de despliegue
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'pruebas en entorno staging')
    cy.get('.tareas-lista').should('contain', 'escaneo de seguridad')
    cy.get('.tareas-lista').should('contain', 'Backup completo')
    cy.get('.tareas-lista').should('contain', 'Monitoreo post-despliegue')
  })
})