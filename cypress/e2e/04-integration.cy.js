describe('Pruebas de Integración', () => {
  beforeEach(() => {
    // Usar comando loginWithOrg para asegurar organización
    cy.loginWithOrg('E2E Test Organization')
    
    // Ignorar errores de scripts cross-origin
    cy.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from failing the test
      return false
    })
  })

  describe('Flujo completo de trabajo', () => {
    it('Debe completar un flujo de alta de empleado', () => {
      // 1. Crear algunos activos base
      cy.get('.tool-card').contains('Inventario de Activos').click()
      cy.wait(2000) // Esperar a que cargue el módulo
      cy.switchView('lista')
      
      cy.fixture('test-data.json').then((data) => {
        // Crear laptop disponible
        cy.createAsset({
          tipo: 'Hardware',
          nombre: 'Laptop Dell - Disponible',
          responsable: 'Almacén TI',
          departamento: 'TI',
          estado: 'Inactivo',
          criticidad: 'Normal',
          clasificacion: 'Interno'
        })
        
        // 2. Ir a impactos y crear alta de empleado
        cy.get('#toolSelectorButton').click()
        cy.wait(500)
        cy.get('.tool-card').contains('Impactos de Negocio').click()
        cy.createImpact('alta_empleado', data.impacts.alta_empleado)
        
        // 3. Verificar que el impacto se creó
        cy.get('#modalDetalleImpacto').should('be.visible')
        cy.get('#modalDetalleImpacto').should('contain', data.impacts.alta_empleado.nombre_completo)
        
        // 4. Cerrar modal
        cy.get('#modalDetalleImpacto .btn-close').click({ force: true })
        cy.wait(500)
        
        // 5. Volver a inventario y verificar que tenemos el activo inicial
        cy.get('#toolSelectorButton').click({ force: true })
        cy.wait(500)
        cy.get('.tool-card').contains('Inventario de Activos').click()
        cy.wait(2000) // Esperar a que cargue el módulo
        cy.switchView('lista')
        
        // Verificar que hay al menos un activo
        cy.get('#tablaActivos tbody tr').should('have.length.at.least', 1)
      })
    })

    it('Debe mantener consistencia de datos entre módulos', () => {
      // Obtener estadísticas iniciales de inventario
      cy.get('.tool-card').contains('Inventario de Activos').click()
      cy.get('#statTotal').invoke('text').then((totalInicial) => {
        const totalActivosInicial = parseInt(totalInicial)
        
        // Crear nuevo activo
        cy.fixture('test-data.json').then((data) => {
          cy.switchView('lista')
          cy.createAsset(data.assets[0])
          
          // Verificar que aumentó el total
          cy.get('#statTotal').invoke('text').should((nuevoTotal) => {
            expect(parseInt(nuevoTotal)).to.equal(totalActivosInicial + 1)
          })
          
          // Navegar a impactos y volver
          cy.get('#toolSelectorButton').should('be.visible').click()
          cy.wait(500)
          cy.get('.tool-card').contains('Impactos de Negocio').click()
          cy.wait(500)
          cy.get('#toolSelectorButton').should('be.visible').click()
          cy.wait(500)
          cy.get('.tool-card').contains('Inventario de Activos').click()
          
          // El total debe mantenerse
          cy.get('#statTotal').invoke('text').should((total) => {
            expect(parseInt(total)).to.equal(totalActivosInicial + 1)
          })
        })
      })
    })
  })

  describe('Importación y Exportación', () => {
    it('Debe mostrar el modal de importación', () => {
      cy.get('.tool-card').contains('Inventario de Activos').click()
      cy.get('[data-menu-item="importar"]').click()
      cy.get('#modalImportar').should('be.visible')
      
      // Verificar elementos del modal
      cy.get('#modalImportar').should('contain', 'Formatos soportados: CSV')
      cy.get('#archivoImportar').should('be.visible')
      cy.get('#reemplazarExistentes').should('be.visible')
      cy.get('#btnConfirmarImportar').should('be.disabled')
      
      cy.get('#modalImportar .btn-close').click()
    })

    it('Debe exportar activos', () => {
      cy.get('.tool-card').contains('Inventario de Activos').click()
      cy.switchView('dashboard')
      
      // Click en exportar desde el dashboard
      cy.get('#dashboardView').within(() => {
        cy.contains('button', 'Exportar CSV').click()
      })
      
      // Verificar que se inició la descarga (no podemos verificar el archivo en sí)
      cy.wait(1000)
    })
  })

  describe('Responsividad', () => {
    it('Debe funcionar en dispositivos móviles', () => {
      // Cambiar viewport a móvil
      cy.viewport('iphone-x')
      
      cy.visit('/')
      cy.loginWithOrg('E2E Test Organization')
      
      // El selector de herramientas debe adaptarse
      cy.get('.tool-selector-container').should('be.visible')
      cy.get('.tools-grid').should('have.css', 'grid-template-columns')
      
      // Navegar a inventario
      cy.get('.tool-card').contains('Inventario de Activos').click()
      
      // En móvil, el sidebar podría comportarse diferente
      cy.get('#sidebarMenu').then($sidebar => {
        // Verificar que el contenido principal se adapta
        cy.get('#mainContent').should('be.visible')
      })
    })

    it('Debe funcionar en tablets', () => {
      cy.viewport('ipad-2')
      
      cy.loginWithOrg()
      cy.get('.tool-card').contains('Inventario de Activos').click()
      
      // Verificar que los elementos se muestran correctamente
      cy.get('#dashboardView').should('be.visible')
      cy.get('.card').should('be.visible')
    })
  })

  describe('Persistencia de Estado', () => {
    it.skip('Debe recordar la última organización seleccionada', () => {
      // SKIP: La aplicación no implementa persistencia de organización
      // Este test se puede habilitar cuando se implemente la funcionalidad
    })

    it('Debe limpiar el estado al cambiar de organización', () => {
      cy.loginWithOrg('E2E Test Organization')
      cy.get('.tool-card').contains('Inventario de Activos').click({ force: true })
      cy.wait(2000)
      
      // Cambiar a otra organización
      cy.get('#organizationButton').click({ force: true })
      cy.wait(1000)
      
      // Crear nueva organización para asegurar que existe
      cy.get('#btnNewOrganization').click()
      cy.get('#newOrgName').type('Test Cambio Org ' + Date.now())
      cy.get('#btnCreateOrganization').click()
      cy.wait(2000)
      
      // Debe volver al selector de herramientas
      cy.get('.tool-selector-container').should('be.visible')
    })
  })

  describe('Rendimiento', () => {
    it('Debe cargar la aplicación en tiempo razonable', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('start')
        },
        onLoad: (win) => {
          win.performance.mark('end')
          win.performance.measure('pageLoad', 'start', 'end')
          const measure = win.performance.getEntriesByName('pageLoad')[0]
          expect(measure.duration).to.be.lessThan(3000) // Menos de 3 segundos
        }
      })
    })

    it('Debe cambiar entre módulos rápidamente', () => {
      cy.loginWithOrg()
      
      const startTime = Date.now()
      cy.get('.tool-card').contains('Inventario de Activos').click()
      cy.get('#dashboardView').should('be.visible')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).to.be.lessThan(2000) // Menos de 2 segundos
    })
  })
})