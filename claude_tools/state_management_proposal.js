// Propuesta: Implementar un sistema de estado observable

// core/services/app-state.js
export class AppState {
    constructor() {
        this.state = {
            currentView: 'dashboard',
            filters: {},
            assets: []
        };
        this.listeners = [];
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }
    
    getState() {
        return this.state;
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// En apps/inventario/index.js:
export default class InventarioApp {
    constructor(options) {
        // ...
        this.state = new AppState();
        
        // Suscribirse a cambios de estado
        this.state.subscribe(state => {
            this.updateView(state);
        });
    }
    
    updateView(state) {
        // Actualizar DOM basado en estado
        if (state.currentView === 'lista') {
            this.container.querySelector('#dashboardView').classList.add('d-none');
            this.container.querySelector('#listaView').classList.remove('d-none');
        } else {
            this.container.querySelector('#dashboardView').classList.remove('d-none');
            this.container.querySelector('#listaView').classList.add('d-none');
        }
    }
    
    // Cambiar vista actualiza estado
    mostrarVistaLista() {
        this.state.setState({ currentView: 'lista' });
    }
    
    mostrarVistaDashboard() {
        this.state.setState({ currentView: 'dashboard' });
    }
}

// En Cypress:
Cypress.Commands.add('switchView', (view) => {
    cy.window().then(win => {
        // Acceder al estado directamente
        const app = win.__currentInventarioApp;
        if (app && app.state) {
            app.state.setState({ currentView: view });
            cy.wait(100); // Esperar actualización DOM
        }
    });
    
    // Verificar resultado
    if (view === 'lista') {
        cy.get('#listaView').should('be.visible');
    }
});