describe('Módulo de Madurez en Ciberseguridad', () => {
  beforeEach(() => {
    cy.loginWithOrg()
    cy.selectTool('madurez')
    cy.wait(2000) // Esperar a que cargue el módulo
  })

  it('Debe mostrar el módulo de madurez en el selector', () => {
    // Volver al selector para verificar que está disponible
    cy.get('#toolSelectorButton').click()
    cy.contains('.tool-card', 'Madurez en Ciberseguridad').should('be.visible')
    
    // Verificar que tiene el icono correcto
    cy.contains('.tool-card', 'Madurez en Ciberseguridad')
      .find('i.bi-shield-check')
      .should('be.visible')
  })

  it('Debe cargar correctamente el dashboard principal', () => {
    // Verificar que se carga el módulo
    cy.get('.madurez-app').should('be.visible')
    
    // Verificar título
    cy.contains('Madurez en Ciberseguridad').should('be.visible')
    
    // Verificar estadísticas principales
    cy.get('#statTotal').should('be.visible')
    cy.get('#statCompletadas').should('be.visible')
    cy.get('#statProgreso').should('be.visible')
    cy.get('#statPuntuacion').should('be.visible')
    
    // Verificar botones de vista
    cy.get('#btnVistaLista').should('be.visible')
    cy.get('#btnVistaDashboard').should('be.visible')
    
    // Verificar que está en dashboard por defecto
    cy.get('#btnVistaDashboard').should('have.class', 'active')
  })

  it('Debe permitir crear una nueva evaluación', () => {
    cy.createMaturityAssessment({
      nombre: 'Evaluación E2E Test',
      descripcion: 'Test automatizado de evaluación'
    })
    
    // Verificar que aparece en la lista
    cy.switchMaturityView('lista')
    cy.contains('Evaluación E2E Test').should('be.visible')
    
    // Verificar estado
    cy.get('tbody tr').first().within(() => {
      cy.get('.badge').should('contain', 'Abierto')
    })
  })

  it('Debe navegar correctamente por el cuestionario', () => {
    // Crear evaluación
    cy.createMaturityAssessment({
      nombre: 'Test Navegación'
    })
    
    // Ir a lista y abrir el cuestionario
    cy.switchMaturityView('lista')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    
    // Verificar que se carga el cuestionario
    cy.get('.questionnaire-view').should('be.visible')
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // Verificar progreso inicial
    cy.get('.progress-bar').should('have.css', 'width').and('contain', '14.285') // 1/7 ≈ 14.3%
    
    // Responder primera pregunta del primer dominio
    cy.get('.pregunta-container').first().within(() => {
      cy.get('input[value="3"]').check({ force: true })
    })
    
    // Verificar que no se puede avanzar sin responder todas
    cy.get('#btnSiguiente').click()
    cy.get('.toast-body').should('contain', 'responde todas las preguntas')
    
    // Responder todas las preguntas del dominio 1
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="3"]').check({ force: true })
    })
    
    // Avanzar al dominio 2
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    // Verificar progreso actualizado
    cy.get('.progress-bar').should('have.css', 'width').and('contain', '28.571') // 2/7 ≈ 28.6%
    
    // Verificar botón anterior funciona
    cy.get('#btnAnterior').click()
    cy.contains('Dominio 1 de 7').should('be.visible')
    
    // Volver al dominio 2
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 2 de 7').should('be.visible')
    
    // Responder y avanzar al dominio 3 para verificar navegación continua
    cy.get('.pregunta-container').each(($pregunta) => {
      cy.wrap($pregunta).find('input[value="2"]').check({ force: true })
    })
    
    cy.get('#btnSiguiente').click()
    cy.contains('Dominio 3 de 7').should('be.visible')
  })

  it('Debe completar un cuestionario completo y mostrar resultados', () => {
    // Crear evaluación
    cy.createMaturityAssessment({
      nombre: 'Test Completo'
    })
    
    // Completar cuestionario completo
    cy.switchMaturityView('lista')
    cy.completeMaturityQuestionnaire()
    
    // Verificar que volvió a la lista
    cy.get('#listaView').should('be.visible')
    
    // Verificar que el estado cambió a completado
    cy.contains('Test Completo').parent().parent().within(() => {
      cy.get('.badge').should('contain', 'Completado')
      cy.get('strong').should('exist') // Puntuación visible
    })
    
    // Verificar estadísticas actualizadas
    cy.get('#statCompletadas').should('not.contain', '0')
  })

  it('Debe mostrar dashboard de resultados con visualizaciones', () => {
    // Primero necesitamos una evaluación completada
    cy.createMaturityAssessment({
      nombre: 'Test Dashboard'
    })
    
    cy.switchMaturityView('lista')
    cy.completeMaturityQuestionnaire()
    
    // Acceder al dashboard de resultados
    cy.verifyMaturityDashboard()
    
    // Verificar elementos específicos del dashboard
    cy.contains('Dashboard - Test Dashboard').should('be.visible')
    cy.contains('Completado el').should('be.visible')
    
    // Verificar métricas principales
    cy.contains('Puntuación Total').should('be.visible')
    cy.contains('Dominios Evaluados').should('be.visible')
    cy.contains('Área Más Débil').should('be.visible')
    
    // Verificar que los charts están presentes
    cy.get('#radarChart').should('be.visible')
    cy.get('#gapsChart').should('be.visible')
    cy.get('#roadmapChart').should('be.visible')
    
    // Verificar detalles por dominio
    cy.contains('Detalles por Dominio').should('be.visible')
    cy.get('.dominio-detalle').should('have.length', 7)
  })

  it('Debe permitir firmar una evaluación', () => {
    // Crear y completar evaluación
    cy.createMaturityAssessment({
      nombre: 'Test Firma'
    })
    
    cy.switchMaturityView('lista')
    cy.completeMaturityQuestionnaire()
    
    // Verificar botón de firma está disponible
    cy.get('button[onclick*="firmarEvaluacion"]').should('be.visible')
    
    // Firmar evaluación
    cy.signMaturityAssessment('Juan Pérez')
    
    // Verificar que el estado cambió
    cy.contains('Test Firma').parent().parent().within(() => {
      cy.get('.badge').should('contain', 'Firmado')
    })
  })

  it('Debe mostrar histórico de evaluaciones', () => {
    // Primero crear algunas evaluaciones
    cy.createMaturityAssessment({
      nombre: 'Histórico Test 1'
    })
    
    cy.switchMaturityView('lista')
    cy.completeMaturityQuestionnaire()
    
    // Ir a histórico
    cy.verifyMaturityHistory()
    
    // Verificar elementos del histórico
    cy.contains('Total Evaluaciones').should('be.visible')
    cy.contains('Puntuación Actual').should('be.visible')
    cy.contains('Evaluaciones Completadas').should('be.visible')
    
    // Verificar que aparece la evaluación
    cy.contains('Histórico Test 1').should('be.visible')
  })

  it('Debe mantener navegación coherente entre vistas', () => {
    // Probar navegación desde dashboard
    cy.switchMaturityView('dashboard')
    cy.get('#dashboardView').should('be.visible')
    
    // Cambiar a lista
    cy.switchMaturityView('lista')
    cy.get('#listaView').should('be.visible')
    
    // Usar menú lateral para navegación
    cy.get('[data-menu-item="dashboard"]').click()
    cy.get('#dashboardView').should('be.visible')
    
    cy.get('[data-menu-item="evaluaciones"]').click()
    cy.get('#listaView').should('be.visible')
    
    // Verificar que los botones de vista reflejan el estado actual
    cy.get('#btnVistaLista').should('have.class', 'active')
    cy.get('#btnVistaDashboard').should('not.have.class', 'active')
  })

  it('Debe filtrar evaluaciones correctamente', () => {
    // Crear evaluaciones con diferentes estados
    cy.createMaturityAssessment({
      nombre: 'Eval Filtro 1'
    })
    
    cy.createMaturityAssessment({
      nombre: 'Eval Filtro 2'
    })
    
    // Completar una
    cy.switchMaturityView('lista')
    cy.get('button[onclick*="completarEvaluacion"]').first().click()
    cy.completeMaturityQuestionnaire()
    
    // Probar filtros
    cy.get('#filtroEstado').select('completado')
    cy.get('#btnFiltrar').click()
    
    // Debe mostrar solo evaluaciones completadas
    cy.get('tbody tr .badge').each(($badge) => {
      cy.wrap($badge).should('contain', 'Completado')
    })
    
    // Resetear filtro
    cy.get('#filtroEstado').select('')
    cy.get('#btnFiltrar').click()
    
    // Debe mostrar todas las evaluaciones
    cy.get('tbody tr').should('have.length.at.least', 2)
  })

  it('No debe mostrar errores en consola durante la navegación', () => {
    cy.checkNoConsoleErrors()
    
    // Navegación básica
    cy.switchMaturityView('lista')
    cy.switchMaturityView('dashboard')
    
    // Crear evaluación
    cy.createMaturityAssessment()
    
    // Verificar sin errores
    cy.checkNoConsoleErrors()
  })
})