// Propuesta: Crear un contrato de testing explícito

// core/testing/testing-bridge.js
window.GozainTestingBridge = {
    apps: {},
    
    registerApp(name, instance) {
        this.apps[name] = instance;
    },
    
    getApp(name) {
        return this.apps[name];
    },
    
    // Métodos de alto nivel para testing
    inventario: {
        switchToListView() {
            const app = this.apps.inventario;
            if (app && app.mostrarVistaLista) {
                app.mostrarVistaLista();
                return true;
            }
            return false;
        },
        
        switchToDashboardView() {
            const app = this.apps.inventario;
            if (app && app.mostrarVistaDashboard) {
                app.mostrarVistaDashboard();
                return true;
            }
            return false;
        },
        
        getCurrentView() {
            const app = this.apps.inventario;
            if (!app) return null;
            
            const listaVisible = app.container.querySelector('#listaView').style.display !== 'none';
            return listaVisible ? 'lista' : 'dashboard';
        }
    }
};

// En apps/inventario/index.js:
async mount() {
    // ... código existente ...
    
    // Registrar para testing
    if (window.GozainTestingBridge) {
        window.GozainTestingBridge.registerApp('inventario', this);
    }
}

// En cypress/support/commands.js:
Cypress.Commands.add('switchView', (view) => {
    cy.window().then(win => {
        if (win.GozainTestingBridge) {
            if (view === 'lista') {
                win.GozainTestingBridge.inventario.switchToListView();
            } else if (view === 'dashboard') {
                win.GozainTestingBridge.inventario.switchToDashboardView();
            }
            cy.wait(100);
        } else {
            // Fallback al click normal
            cy.get(`#btnVista${view.charAt(0).toUpperCase() + view.slice(1)}`).click();
        }
    });
});