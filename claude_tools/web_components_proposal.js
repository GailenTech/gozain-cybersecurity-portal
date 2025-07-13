// Propuesta: Migrar a Web Components con estado interno

// components/inventario-view.js
class InventarioView extends HTMLElement {
    constructor() {
        super();
        this.currentView = 'dashboard';
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    // Propiedad observable
    set view(value) {
        if (this.currentView !== value) {
            this.currentView = value;
            this.updateView();
            // Disparar evento personalizado
            this.dispatchEvent(new CustomEvent('viewchange', { 
                detail: { view: value } 
            }));
        }
    }
    
    get view() {
        return this.currentView;
    }
    
    updateView() {
        const dashboardView = this.querySelector('#dashboardView');
        const listaView = this.querySelector('#listaView');
        
        if (this.currentView === 'lista') {
            dashboardView.hidden = true;
            listaView.hidden = false;
        } else {
            dashboardView.hidden = false;
            listaView.hidden = true;
        }
    }
    
    setupEventListeners() {
        this.querySelector('#btnVistaLista').addEventListener('click', () => {
            this.view = 'lista';
        });
        
        this.querySelector('#btnVistaDashboard').addEventListener('click', () => {
            this.view = 'dashboard';
        });
    }
}

customElements.define('inventario-view', InventarioView);

// En Cypress:
Cypress.Commands.add('switchView', (view) => {
    cy.get('inventario-view').then($element => {
        // Acceder directamente a la propiedad del componente
        $element[0].view = view;
    });
    
    // Verificar cambio
    cy.get('inventario-view').should('have.prop', 'view', view);
});