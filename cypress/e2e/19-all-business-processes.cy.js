describe('Validación Completa de Procesos de Negocio', () => {
  beforeEach(() => {
    cy.loginWithOrg('E2E Test Organization')
    cy.get('.tool-card').contains('Impactos de Negocio').click()
    cy.get('#appMenu', { timeout: 10000 }).should('be.visible')
  })

  const procesosDeNegocio = {
    // Gestión de Personal
    'alta_empleado': {
      nombre: 'Alta de Empleado',
      datos: {
        nombre_completo: 'Juan Pérez Test',
        departamento: 'Desarrollo',
        cargo: 'Desarrollador Senior',
        fecha_inicio: '2025-02-01',
        modalidad: 'Híbrido',
        equipo_asignado: true,
        equipo_movil: true,
        vpn_requerida: true
      }
    },
    'baja_empleado': {
      nombre: 'Baja de Empleado',
      datos: {
        nombre_completo: 'María García Test',
        fecha_baja: '2025-01-31',
        motivo: 'Voluntaria',
        devolucion_equipo: true,
        backup_realizado: true,
        accesos_revocados: true
      }
    },
    'cambio_rol': {
      nombre: 'Cambio de Rol/Departamento',
      datos: {
        nombre_empleado: 'Carlos López Test',
        departamento_anterior: 'Ventas',
        departamento_nuevo: 'Marketing',
        rol_anterior: 'Ejecutivo',
        rol_nuevo: 'Coordinador',
        fecha_cambio: '2025-02-15',
        nuevos_permisos: true
      }
    },
    
    // Gestión de Proyectos
    'inicio_proyecto': {
      nombre: 'Inicio de Proyecto',
      datos: {
        nombre_proyecto: 'Proyecto Alpha Test',
        tipo_proyecto: 'Desarrollo de Software',
        fecha_inicio: '2025-02-01',
        duracion_estimada: '6',
        equipo_necesario: true,
        vpn_requerida: true,
        cloud_storage: true
      }
    },
    'cierre_proyecto': {
      nombre: 'Cierre de Proyecto',
      datos: {
        nombre_proyecto: 'Proyecto Beta Test',
        fecha_cierre: '2025-01-31',
        documentacion_archivada: true,
        recursos_liberados: true,
        accesos_revocados: true,
        backup_realizado: true
      }
    },
    
    // Gestión de Infraestructura
    'mantenimiento_servidor': {
      nombre: 'Mantenimiento de Servidor',
      datos: {
        servidor: 'PROD-WEB-01',
        tipo_mantenimiento: 'Actualización de seguridad',
        fecha_programada: '2025-02-10',
        duracion_horas: '4',
        requiere_downtime: true,
        backup_previo: true,
        notificacion_usuarios: true
      }
    },
    'nueva_aplicacion': {
      nombre: 'Despliegue Nueva Aplicación',
      datos: {
        nombre_aplicacion: 'CRM Test v2.0',
        tipo_aplicacion: 'Web',
        ambiente: 'Producción',
        fecha_despliegue: '2025-02-05',
        requiere_ssl: true,
        backup_configurado: true,
        monitoreo_activo: true
      }
    },
    
    // Gestión de Seguridad
    'incidente_seguridad': {
      nombre: 'Incidente de Seguridad',
      datos: {
        tipo_incidente: 'Intento de acceso no autorizado',
        severidad: 'Alta',
        fecha_deteccion: '2025-01-15T14:30',
        sistemas_afectados: 'Servidor de aplicaciones',
        contenido_exitoso: false,
        medidas_tomadas: 'Bloqueo de IP, revisión de logs',
        notificacion_enviada: true
      }
    },
    'auditoria_seguridad': {
      nombre: 'Auditoría de Seguridad',
      datos: {
        tipo_auditoria: 'Anual',
        alcance: 'Sistemas críticos',
        fecha_inicio: '2025-03-01',
        auditor: 'Empresa Externa XYZ',
        incluye_pentest: true,
        incluye_revision_codigo: true,
        incluye_revision_politicas: true
      }
    },
    
    // Gestión de Crisis
    'activacion_bcp': {
      nombre: 'Activación Plan Continuidad',
      datos: {
        tipo_evento: 'Fallo del centro de datos principal',
        fecha_activacion: '2025-01-20T08:00',
        sistemas_criticos_afectados: 'ERP, CRM, Email',
        tiempo_recuperacion_objetivo: '4',
        sitio_alternativo_activo: true,
        comunicacion_enviada: true
      }
    },
    'simulacro_emergencia': {
      nombre: 'Simulacro de Emergencia',
      datos: {
        tipo_simulacro: 'Evacuación',
        fecha_programada: '2025-04-15',
        hora_inicio: '10:00',
        participantes_estimados: '150',
        incluye_sistemas_it: true,
        coordinador: 'Equipo de Seguridad'
      }
    }
  }

  it('Debe poder crear y verificar todos los tipos de procesos de negocio', () => {
    let procesosCreados = 0
    
    Object.entries(procesosDeNegocio).forEach(([tipoProceso, info]) => {
      cy.log(`Creando proceso: ${info.nombre}`)
      
      // Crear nuevo impacto
      cy.get('[data-menu-item="nuevo"]').click()
      cy.get('#modalNuevoImpacto').should('be.visible')
      
      // Seleccionar tipo
      cy.get('#tipoImpacto').select(tipoProceso)
      cy.wait(500) // Esperar carga de plantilla
      
      // Verificar que se cargó la plantilla correcta
      cy.get('.modal-title').should('contain', info.nombre)
      
      // Llenar campos
      Object.entries(info.datos).forEach(([campo, valor]) => {
        cy.get(`#${campo}`).then($el => {
          if ($el.length > 0) {
            if ($el.is('select')) {
              cy.get(`#${campo}`).select(valor.toString())
            } else if ($el.is(':checkbox')) {
              if (valor) cy.get(`#${campo}`).check()
            } else {
              cy.get(`#${campo}`).clear().type(valor.toString())
            }
          }
        })
      })
      
      // Crear
      cy.get('#btnCrearImpacto').click()
      cy.get('.toast-body').should('contain', 'creado correctamente')
      cy.wait(1000)
      
      procesosCreados++
      
      // Verificar en la lista
      cy.get('tbody').should('contain', info.nombre)
    })
    
    // Verificar contador
    cy.get('#statTotal').should('contain', procesosCreados.toString())
    
    // Verificar filtros por categoría
    cy.log('Verificando filtros por categoría')
    
    // Filtrar por Personal
    cy.get('#filtroCategoria').select('personal')
    cy.get('tbody tr').should('have.length.at.least', 3)
    
    // Filtrar por Proyectos
    cy.get('#filtroCategoria').select('proyectos')
    cy.get('tbody tr').should('have.length.at.least', 2)
    
    // Filtrar por Infraestructura
    cy.get('#filtroCategoria').select('infraestructura')
    cy.get('tbody tr').should('have.length.at.least', 2)
    
    // Filtrar por Seguridad
    cy.get('#filtroCategoria').select('seguridad')
    cy.get('tbody tr').should('have.length.at.least', 2)
    
    // Filtrar por Crisis
    cy.get('#filtroCategoria').select('crisis')
    cy.get('tbody tr').should('have.length.at.least', 2)
    
    // Quitar filtro
    cy.get('#filtroCategoria').select('')
    cy.get('tbody tr').should('have.length.at.least', procesosCreados)
  })

  it('Debe poder exportar los procesos de negocio', () => {
    // Exportar a JSON
    cy.get('[data-menu-item="exportar"]').click()
    cy.get('button').contains('JSON').click()
    
    // Verificar descarga (Cypress no puede verificar descargas fácilmente,
    // pero podemos verificar que el botón funciona)
    cy.get('.toast-body').should('contain', 'Datos exportados')
  })

  it('Debe poder ver detalles de cada tipo de proceso', () => {
    // Verificar algunos procesos clave
    const procesosAVerificar = ['alta_empleado', 'incidente_seguridad', 'activacion_bcp']
    
    procesosAVerificar.forEach(tipoProceso => {
      const info = procesosDeNegocio[tipoProceso]
      
      // Buscar el proceso en la tabla
      cy.contains('tr', info.nombre).within(() => {
        cy.get('button').contains('Ver').click()
      })
      
      // Verificar modal de detalles
      cy.get('#modalDetalleImpacto').should('be.visible')
      cy.get('.modal-title').should('contain', 'Detalles del Impacto')
      
      // Verificar algunos campos
      cy.get('.modal-body').should('contain', info.nombre)
      
      // Cerrar modal
      cy.get('#modalDetalleImpacto .btn-close').click()
      cy.wait(500)
    })
  })

  it('Debe mantener la integridad de datos entre sesiones', () => {
    // Contar impactos actuales
    cy.get('#statTotal').invoke('text').then(totalInicial => {
      // Recargar página
      cy.reload()
      cy.wait(2000)
      
      // Verificar que el total se mantiene
      cy.get('#statTotal').should('have.text', totalInicial)
      
      // Verificar que los procesos siguen en la lista
      Object.values(procesosDeNegocio).forEach(info => {
        cy.get('tbody').should('contain', info.nombre)
      })
    })
  })
})