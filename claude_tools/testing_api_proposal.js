// Propuesta: Exponer API de Testing en la aplicación

// En apps/inventario/index.js, agregar después de mount():
export default class InventarioApp {
    async mount() {
        // ... código existente ...
        
        // Exponer instancia para testing (solo en desarrollo/testing)
        if (window.Cypress || process.env.NODE_ENV === 'test') {
            this.container.__inventarioApp = this;
            window.__currentInventarioApp = this;
        }
    }
    
    // Agregar métodos públicos para testing
    async changeView(viewName) {
        if (viewName === 'lista') {
            this.mostrarVistaLista();
        } else if (viewName === 'dashboard') {
            this.mostrarVistaDashboard();
        }
        // Esperar a que el cambio se complete
        return new Promise(resolve => setTimeout(resolve, 100));
    }
    
    getViewState() {
        return {
            isDashboardVisible: this.container.querySelector('#dashboardView').style.display !== 'none',
            isListaVisible: this.container.querySelector('#listaView').style.display !== 'none'
        };
    }
}

// En Cypress:
Cypress.Commands.add('switchView', (view) => {
    cy.window().then(win => {
        if (win.__currentInventarioApp) {
            return win.__currentInventarioApp.changeView(view);
        } else {
            // Fallback al método actual
            // ...
        }
    });
});