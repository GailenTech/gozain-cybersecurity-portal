describe('Procesos de Negocio - Seguridad y Cumplimiento', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.navigateToTool('Impactos de Negocio')
  })

  it('Debe crear proceso de Incidente de Seguridad', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('incidente_seguridad')
    
    cy.wait(500)
    
    // Llenar formulario de incidente
    cy.get('#tipo_incidente').select('Phishing')
    cy.get('#sistemas_afectados').type('Servidor de correo Exchange\nCuentas de usuario del departamento financiero')
    cy.get('#usuarios_afectados').type('15 usuarios del departamento financiero')
    cy.get('#fecha_deteccion').type('2025-07-11T14:30')
    cy.get('#severidad').select('Alta')
    cy.get('#descripcion_incidente').type('Campaña de phishing suplantando al CEO solicitando transferencias urgentes')
    
    // Verificar vista previa
    cy.get('#vistaPrevia').should('be.visible')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar respuesta al incidente
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Aislar sistemas afectados')
    cy.get('.tareas-lista').should('contain', 'Recopilar evidencias')
    cy.get('.tareas-lista').should('contain', 'Notificar a usuarios afectados')
    cy.get('.tareas-lista').should('contain', 'informe post-incidente')
  })

  it('Debe crear proceso de Auditoría Externa', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('auditoria_externa')
    
    cy.wait(500)
    
    // Llenar formulario
    cy.get('#tipo_auditoria').select('ISO 27001')
    cy.get('#empresa_auditora').type('Bureau Veritas')
    cy.get('#alcance').type('Todos los procesos de gestión de seguridad de la información\nSistemas críticos de negocio\nGestión de accesos y contraseñas')
    cy.get('#fecha_inicio').type('2025-09-01')
    cy.get('#fecha_fin').type('2025-09-05')
    cy.get('#responsable_interno').type('Laura Sánchez - CISO')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar preparación para auditoría
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Recopilar documentación')
    cy.get('.tareas-lista').should('contain', 'políticas de seguridad')
    cy.get('.tareas-lista').should('contain', 'auditoría interna previa')
    cy.get('.tareas-lista').should('contain', 'Crear cuentas de acceso para auditores')
  })

  it('Debe crear proceso de Solicitud GDPR', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('solicitud_gdpr')
    
    cy.wait(500)
    
    // Llenar formulario con email
    cy.get('#tipo_solicitud').select('Supresión')
    cy.get('#solicitante').type('Antonio García López')
    cy.get('#email_solicitante').type('agarcia@example.com')
    cy.get('#fecha_solicitud').type('2025-07-10')
    cy.get('#sistemas_afectados').type('CRM principal\nSistema de facturación\nNewsletter\nBackups')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar proceso GDPR
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Verificar identidad')
    cy.get('.tareas-lista').should('contain', 'Localizar datos en sistemas')
    cy.get('.tareas-lista').should('contain', 'Ejecutar solicitud')
    cy.get('.tareas-lista').should('contain', 'Notificar resultado')
  })

  it('Debe crear proceso de Campaña de Concienciación', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('campana_seguridad')
    
    cy.wait(500)
    
    // Llenar formulario con número
    cy.get('#nombre_campana').type('Phishing Awareness Q3 2025')
    cy.get('#tipo_campana').select('Phishing simulado')
    cy.get('#audiencia').select('Todos los empleados')
    cy.get('#fecha_inicio').type('2025-08-01')
    cy.get('#duracion_dias').type('30')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar campaña
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Preparar contenido')
    cy.get('.tareas-lista').should('contain', 'plataforma de formación')
    cy.get('.tareas-lista').should('contain', 'comunicación inicial')
    cy.get('.tareas-lista').should('contain', 'Monitorear participación')
  })
})