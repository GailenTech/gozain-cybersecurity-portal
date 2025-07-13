// Propuesta: Usar atributos data para estado visible

// En lugar de:
// element.style.display = 'none'

// Usar:
// element.setAttribute('data-view', 'hidden')
// element.setAttribute('data-view', 'visible')

// Modificar apps/inventario/index.js:
mostrarVistaLista() {
    const container = this.container;
    
    // Cambiar estado con atributos
    container.setAttribute('data-current-view', 'lista');
    
    // Cambiar clases en lugar de estilos inline
    container.querySelector('#dashboardView').classList.add('d-none');
    container.querySelector('#listaView').classList.remove('d-none');
    
    // Botones
    container.querySelector('#btnVistaLista').classList.add('active');
    container.querySelector('#btnVistaDashboard').classList.remove('active');
    
    // Filtros
    const filtrosSection = container.querySelector('#filtrosSection');
    if (filtrosSection) {
        filtrosSection.classList.remove('d-none');
    }
    
    // Actualizar menú lateral
    this.updateSideMenu('inventario');
}

// En CSS:
.d-none {
    display: none !important;
}

// En Cypress:
Cypress.Commands.add('switchView', (view) => {
    if (view === 'lista') {
        cy.get('#btnVistaLista').click();
        // Verificar por atributo en lugar de estilo
        cy.get('.inventario-app').should('have.attr', 'data-current-view', 'lista');
        cy.get('#listaView').should('not.have.class', 'd-none');
    }
});