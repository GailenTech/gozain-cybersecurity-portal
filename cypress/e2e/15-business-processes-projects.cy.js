describe('Procesos de Negocio - Clientes, Proyectos y Proveedores', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.navigateToTool('Impactos de Negocio')
  })

  it('Debe crear proceso de Inicio de Proyecto', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('nuevo_proyecto')
    
    cy.wait(500)
    
    // Llenar formulario complejo
    cy.get('#nombre_proyecto').type('Portal Cliente XYZ')
    cy.get('#cliente').type('Empresa XYZ S.A.')
    cy.get('#project_manager').type('Carlos Rodríguez')
    cy.get('#equipo_proyecto').type('Ana López - Desarrollo\nPedro Martín - QA\nLuisa Fernández - UX')
    cy.get('#fecha_inicio').type('2025-08-01')
    cy.get('#fecha_fin').type('2025-12-15')
    cy.get('#nivel_confidencialidad').select('Confidencial')
    
    // Verificar vista previa
    cy.get('#vistaPrevia').should('be.visible')
    cy.get('#listaVistaPrevia').should('contain', 'Repositorio del proyecto')
    cy.get('#listaVistaPrevia').should('contain', 'Espacio colaborativo')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar en lista
    cy.contains('Portal Cliente XYZ').should('be.visible')
    
    // Verificar detalles
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('#modalDetalleImpacto').should('be.visible')
    cy.get('.modal-body').should('contain', 'Confidencial')
    cy.get('.tareas-lista').should('contain', 'Crear estructura de carpetas')
    cy.get('.tareas-lista').should('contain', 'Configurar permisos de acceso')
  })

  it('Debe crear proceso de Alta de Proveedor', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('alta_proveedor')
    
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#nombre_proveedor').type('Security Consultants Inc')
    cy.get('#tipo_servicio').type('Auditoría de Seguridad')
    cy.get('#personas_autorizadas').type('John Smith - Auditor Principal\nJane Doe - Analista')
    cy.get('#sistemas_acceso').type('Portal de documentación\nSistema de tickets')
    cy.get('#fecha_inicio').type('2025-07-01')
    cy.get('#fecha_fin_contrato').type('2026-06-30')
    cy.get('#nda_firmado').check()
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar tareas específicas
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Verificar documentación legal')
    cy.get('.tareas-lista').should('contain', 'Crear cuentas de acceso limitado')
    cy.get('.tareas-lista').should('contain', 'Programar revisión de accesos')
  })

  it('Debe crear proceso de Renovación de Contrato', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('renovacion_contrato')
    
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#tipo_contrato').select('Software')
    cy.get('#proveedor').type('Microsoft')
    cy.get('#descripcion').type('Licencias Office 365 Enterprise')
    cy.get('#fecha_vencimiento').type('2025-08-31')
    cy.get('#costo_anual').type('25000')
    cy.get('#renovar').check()
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar que las tareas tienen fechas correctas (45 días antes, etc)
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Evaluar uso y necesidad')
    cy.get('.tareas-lista').should('contain', 'Negociar términos')
    cy.get('.tareas-lista').should('contain', 'Aprobar presupuesto')
  })
})