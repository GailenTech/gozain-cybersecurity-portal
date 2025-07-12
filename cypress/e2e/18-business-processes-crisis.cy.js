describe('Procesos de Negocio - Gestión de Crisis', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  it('Debe crear proceso de Activación Plan de Continuidad', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('activacion_bcp')
    
    cy.wait(500)
    
    // Llenar formulario de crisis
    cy.get('#tipo_evento').select('Ciberataque')
    cy.get('#sistemas_afectados').type('Sistema de producción principal\nBase de datos de clientes\nPortal web público')
    cy.get('#ubicaciones_afectadas').type('Datacenter principal Madrid\nOficina central')
    cy.get('#coordinador_crisis').type('Roberto Jiménez - CTO')
    cy.get('#fecha_activacion').type('2025-07-11T03:45')
    
    // Verificar vista previa
    cy.get('#vistaPrevia').should('be.visible')
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar activación inmediata
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Activar comité de crisis')
    cy.get('.tareas-lista').should('contain', 'sistemas críticos')
    cy.get('.tareas-lista').should('contain', 'sitio de recuperación')
    cy.get('.tareas-lista').should('contain', 'Comunicar a todos los empleados')
    cy.get('.tareas-lista').should('contain', 'clientes críticos')
    
    // Verificar que el coordinador aparece en las tareas
    cy.get('.tareas-lista').should('contain', 'Roberto Jiménez')
  })

  it('Debe crear proceso de Fusión/Adquisición', () => {
    cy.get('[data-menu-item="nuevo"]').click()
    cy.get('#tipoImpacto').select('fusion_empresa')
    
    cy.wait(500)
    
    // Llenar formulario complejo
    cy.get('#nombre_empresa').type('TechStartup Solutions')
    cy.get('#num_empleados').type('45')
    cy.get('#fecha_efectiva').type('2025-10-01')
    cy.get('#responsable_integracion').type('María del Carmen Ruiz')
    cy.get('#sistemas_integrar').type('CRM Salesforce\nSistema ERP propietario\nHerramientas de desarrollo\nRepositorios Git')
    cy.get('#mantener_marca').check()
    
    // Crear impacto
    cy.get('#btnCrearImpacto').click()
    cy.get('.toast-body').should('contain', 'creado correctamente')
    
    // Verificar proceso de integración
    cy.get('tbody tr').first().find('button').contains('Ver').click()
    cy.get('.tareas-lista').should('contain', 'Auditoría de seguridad de sistemas')
    cy.get('.tareas-lista').should('contain', 'Inventario completo de activos IT')
    cy.get('.tareas-lista').should('contain', 'Plan de migración de usuarios')
    cy.get('.tareas-lista').should('contain', 'Integración de directorio activo')
    cy.get('.tareas-lista').should('contain', 'Homologación de políticas')
    
    // Verificar que hay tareas programadas antes y después
    cy.get('.modal-body').should('contain', 'TechStartup Solutions')
  })
  
  it('Debe verificar la ejecutación de procesos de impacto', () => {
    // Verificar que hay impactos pendientes
    cy.get('#filtroEstado').select('pendiente')
    cy.get('#btnBuscar').click()
    
    // Tomar el primer impacto pendiente
    cy.get('tbody tr').first().within(() => {
      cy.get('td').eq(1).invoke('text').as('tipoImpacto')
      cy.get('button').contains('Ejecutar').click()
    })
    
    // Confirmar ejecución
    cy.on('window:confirm', () => true)
    
    // Verificar mensaje de éxito
    cy.get('.toast-body').should('contain', 'ejecutado correctamente')
    
    // Verificar que cambió a ejecutado
    cy.get('#filtroEstado').select('ejecutado')
    cy.get('#btnBuscar').click()
    cy.get('tbody').should('contain', 'ejecutado')
  })
})