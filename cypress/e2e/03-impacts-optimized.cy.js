describe('Módulo de Impactos - Optimizado', () => {
  beforeEach(() => {
    // Interceptar llamadas API
    cy.intercept('GET', '/api/impactos/dashboard/stats').as('getStats')
    cy.intercept('GET', '/api/impactos/analisis*').as('getImpactos')
    cy.intercept('POST', '/api/impactos/analisis').as('createImpacto')
    cy.intercept('GET', '/api/tareas').as('getTareas')
    
    // Usar comando loginWithOrg para asegurar organización
    cy.loginWithOrg('E2E Test Organization')
    
    // Navegar a Impactos
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  describe('Vista Dashboard', () => {
    it('Debe mostrar el dashboard de impactos por defecto', () => {
      cy.get('#dashboardView').should('be.visible')
      cy.get('#btnVistaDashboard').should('have.class', 'active')
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
    })

    it('Debe mostrar las estadísticas de impactos', () => {
      cy.wait('@getStats')
      cy.get('#statHoy').should('exist')
      cy.get('#statPendientes').should('exist')
      cy.get('#statSemana').should('exist')
      cy.get('#statTotal').should('exist')
    })

    it('Debe mostrar el timeline y gráficos', () => {
      cy.get('#dashboardView').within(() => {
        // Verificar elementos del dashboard
        cy.get('.card').should('have.length.at.least', 2)
        cy.get('canvas').should('exist') // Gráficos
      })
    })
  })

  describe('Crear Impactos', () => {
    it('Debe crear un impacto de alta de empleado', () => {
      cy.fixture('test-data.json').then((data) => {
        const impactData = data.impacts.alta_empleado
        
        cy.get('[data-menu-item="nuevo"]').click()
        cy.get('#modalNuevoImpacto').should('be.visible')
        
        // Seleccionar tipo
        cy.get('#tipoImpacto').select('Alta de Empleado')
        
        // Verificar que se cargan los campos dinámicos - usar timeout en lugar de wait
        cy.get('#nombre_completo', {timeout: 2000}).should('be.visible')
        cy.get('#fecha_inicio').should('be.visible')
        cy.get('#departamento').should('be.visible')
        cy.get('#cargo').should('be.visible')
        
        // Completar campos básicos
        cy.get('#nombre_completo').type(impactData.nombre_completo)
        cy.get('#fecha_inicio').type(impactData.fecha_inicio)
        cy.get('#departamento').type(impactData.departamento)
        cy.get('#cargo').type(impactData.cargo)
        
        // Completar necesidades
        if (impactData.equipo_informatico) {
          cy.get('#necesita_equipo').check()
          cy.get('#tipo_equipo').type(impactData.tipo_equipo)
        }
        
        if (impactData.accesos_sistemas) {
          cy.get('#necesita_accesos').check()
          cy.get('#sistemas_requeridos').type(impactData.sistemas.join(', '))
        }
        
        // Guardar
        cy.get('#btnGuardarImpacto').click()
        cy.wait('@createImpacto')
        
        // Verificar que se cierra el modal
        cy.get('#modalNuevoImpacto').should('not.have.class', 'show')
        
        // Verificar en lista
        cy.get('#btnVistaLista').click()
        cy.get('#listaView', {timeout: 3000}).should('be.visible')
        cy.get('#tablaImpactos').should('contain', impactData.nombre_completo)
      })
    })

    it('Debe validar campos requeridos', () => {
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalNuevoImpacto').should('be.visible')
      
      // Intentar guardar sin seleccionar tipo
      cy.get('#btnGuardarImpacto').click()
      
      // Modal debe seguir abierto
      cy.get('#modalNuevoImpacto').should('be.visible')
      
      // Seleccionar tipo y intentar guardar sin campos
      cy.get('#tipoImpacto').select('Cambio de Servidor')
      cy.get('#btnGuardarImpacto').click()
      
      // Modal debe seguir abierto
      cy.get('#modalNuevoImpacto').should('be.visible')
      
      // Cerrar modal
      cy.get('#modalNuevoImpacto .btn-close').click()
      cy.get('#modalNuevoImpacto').should('not.have.class', 'show')
    })

    it('Debe crear múltiples tipos de impactos', () => {
      const impactos = [
        { tipo: 'Cambio de Servidor', campos: { servidor_actual: 'SRV001', nuevo_servidor: 'SRV002' } },
        { tipo: 'Actualización Software', campos: { software_nombre: 'CRM v1.0', nueva_version: 'CRM v2.0' } },
        { tipo: 'Baja de Empleado', campos: { empleado_nombre: 'Test User', fecha_baja: '2024-12-31' } }
      ]
      
      impactos.forEach((impacto, index) => {
        cy.get('[data-menu-item="nuevo"]').click()
        cy.get('#modalNuevoImpacto').should('be.visible')
        
        cy.get('#tipoImpacto').select(impacto.tipo)
        
        // Esperar campos dinámicos
        cy.get('.dynamic-fields input', {timeout: 2000}).first().should('be.visible')
        
        // Completar campos según el tipo
        Object.entries(impacto.campos).forEach(([campo, valor]) => {
          cy.get(`#${campo}`).type(valor)
        })
        
        cy.get('#btnGuardarImpacto').click()
        cy.wait('@createImpacto')
        
        cy.get('#modalNuevoImpacto').should('not.have.class', 'show')
      })
      
      // Verificar en lista
      cy.get('#btnVistaLista').click()
      cy.get('#listaView', {timeout: 3000}).should('be.visible')
      cy.get('#tablaImpactos tbody tr').should('have.length.at.least', 3)
    })
  })

  describe('Vista Lista y Filtros', () => {
    beforeEach(() => {
      cy.get('#btnVistaLista').click()
      cy.get('#listaView', {timeout: 3000}).should('be.visible')
    })

    it('Debe cambiar a vista de lista', () => {
      cy.get('#listaView').should('be.visible')
      cy.get('#dashboardView').should('have.class', 'd-none')
      cy.get('#tablaImpactos').should('be.visible')
    })

    it('Debe mostrar filtros en la vista de lista', () => {
      cy.get('#filtroTipoImpacto').should('be.visible')
      cy.get('#filtroEstadoImpacto').should('be.visible')
      cy.get('#filtroBusquedaImpacto').should('be.visible')
    })

    it('Debe filtrar por tipo de impacto', () => {
      cy.get('#filtroTipoImpacto').select('Alta de Empleado')
      cy.get('#btnBuscarImpactos').click()
      cy.wait('@getImpactos')
      
      // Verificar resultados
      cy.get('#tablaImpactos tbody tr').each($row => {
        cy.wrap($row).should('contain', 'Alta de Empleado')
      })
    })

    it('Debe filtrar por estado', () => {
      cy.get('#filtroEstadoImpacto').select('pendiente')
      cy.get('#btnBuscarImpactos').click()
      cy.wait('@getImpactos')
      
      // Verificar badges de estado
      cy.get('#tablaImpactos .badge-warning').should('exist')
    })
  })

  describe('Procesamiento de Impactos', () => {
    it('Debe procesar un impacto y generar tareas', () => {
      // Crear un impacto primero
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalNuevoImpacto').should('be.visible')
      
      cy.get('#tipoImpacto').select('Alta de Empleado')
      cy.get('#nombre_completo', {timeout: 2000}).type('Empleado Test E2E')
      cy.get('#fecha_inicio').type('2024-12-01')
      cy.get('#departamento').type('TI')
      cy.get('#cargo').type('Desarrollador')
      cy.get('#necesita_equipo').check()
      cy.get('#tipo_equipo').type('Laptop')
      
      cy.get('#btnGuardarImpacto').click()
      cy.wait('@createImpacto')
      cy.get('#modalNuevoImpacto').should('not.have.class', 'show')
      
      // Ir a lista y procesar
      cy.get('#btnVistaLista').click()
      cy.get('#listaView', {timeout: 3000}).should('be.visible')
      
      // Buscar el impacto creado y procesarlo
      cy.get('#tablaImpactos').contains('Empleado Test E2E')
        .parent('tr')
        .within(() => {
          cy.get('.btn-success').click()
        })
      
      // Verificar modal de procesamiento
      cy.get('#modalProcesarImpacto').should('be.visible')
      cy.get('#listaTareasPendientes li').should('have.length.at.least', 2)
      
      // Confirmar procesamiento
      cy.get('#btnConfirmarProcesamiento').click()
      
      // Verificar que se procesó
      cy.get('#modalProcesarImpacto').should('not.have.class', 'show')
      cy.get('.alert-success').should('contain', 'procesado correctamente')
    })
  })

  describe('Navegación del Menú', () => {
    it('Debe navegar por todas las opciones del menú', () => {
      // Dashboard (ya estamos ahí)
      cy.get('[data-menu-item="dashboard"]').should('have.class', 'active')
      
      // Lista
      cy.get('[data-menu-item="lista"]').click()
      cy.get('#listaView').should('be.visible')
      
      // Nuevo
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalNuevoImpacto').should('be.visible')
      cy.get('#modalNuevoImpacto .btn-close').click()
      
      // Tareas
      cy.get('[data-menu-item="tareas"]').click()
      cy.get('#tareasView').should('be.visible')
      
      // Reportes
      cy.get('[data-menu-item="reportes"]').click()
      cy.get('#reportesView').should('be.visible')
      
      // Volver a dashboard
      cy.get('[data-menu-item="dashboard"]').click()
      cy.get('#dashboardView').should('be.visible')
    })
  })
})