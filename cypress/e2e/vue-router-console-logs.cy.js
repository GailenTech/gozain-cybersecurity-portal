describe('Vue Router Console Logs', () => {
  it('Captura todos los logs de consola', () => {
    let logs = [];
    let errors = [];
    
    cy.on('window:before:load', (win) => {
      // Guardar referencias originales
      const originalLog = win.console.log;
      const originalError = win.console.error;
      
      // Interceptar console.log
      win.console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(win.console, args);
      };
      
      // Interceptar console.error
      win.console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(win.console, args);
      };
    });
    
    // Login
    cy.loginWithOrg('E2E Test Organization');
    
    // Click en inventario
    cy.get('.tool-card').contains('Inventario de Activos').click();
    
    // Esperar un poco para que se cargue
    cy.wait(3000);
    
    // Imprimir todos los logs
    cy.then(() => {
      cy.log('=== CONSOLE LOGS ===');
      logs.forEach((log, i) => {
        cy.log(`LOG ${i}: ${log}`);
      });
      
      cy.log('=== CONSOLE ERRORS ===');
      errors.forEach((error, i) => {
        cy.log(`ERROR ${i}: ${error}`);
      });
    });
    
    // Verificar el DOM
    cy.get('#appContainer').then($el => {
      const html = $el.html();
      cy.log('Container HTML length:', html.length);
      cy.log('Container HTML preview:', html.substring(0, 200));
    });
    
    // Verificar si Vue está cargado
    cy.window().then(win => {
      cy.log('Vue disponible?', !!win.Vue);
      cy.log('Vuex disponible?', !!win.Vuex);
    });
  });
});