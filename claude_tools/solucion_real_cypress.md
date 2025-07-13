# Solución Real para el Problema de Cypress

## El Problema Concreto

El código actual manipula `style.display` directamente:
```javascript
this.container.querySelector('#listaView').style.display = 'block';
this.container.querySelector('#dashboardView').style.display = 'none';
```

Esto es problemático porque:
1. No hay eventos que Cypress pueda esperar
2. No hay clases CSS que verificar
3. Los estilos inline son difíciles de testear

## Solución Inmediata: Usar Clases CSS

### Paso 1: Cambiar el código a clases

```javascript
// En lugar de:
element.style.display = 'none';

// Usar:
element.classList.add('d-none');
element.classList.remove('d-none');
```

### Paso 2: Implementar el cambio

```javascript
// apps/inventario/index.js
mostrarVistaLista() {
    // Usar clases en lugar de estilos inline
    this.container.querySelector('#dashboardView').classList.add('d-none');
    this.container.querySelector('#listaView').classList.remove('d-none');
    
    // Agregar atributo para testing
    this.container.setAttribute('data-current-view', 'lista');
    
    // Resto del código...
}

mostrarVistaDashboard() {
    // Usar clases en lugar de estilos inline
    this.container.querySelector('#listaView').classList.add('d-none');
    this.container.querySelector('#dashboardView').classList.remove('d-none');
    
    // Agregar atributo para testing
    this.container.setAttribute('data-current-view', 'dashboard');
    
    // Resto del código...
}
```

### Paso 3: Actualizar el HTML inicial

```html
<!-- En lugar de style="display: none;" -->
<div id="listaView" class="card d-none">
    <!-- contenido -->
</div>
```

### Paso 4: Tests más robustos

```javascript
// cypress/support/commands.js
Cypress.Commands.add('switchView', (view) => {
    if (view === 'lista') {
        cy.get('#btnVistaLista').click();
        // Verificar por clase, no por estilo
        cy.get('#listaView').should('not.have.class', 'd-none');
        cy.get('#dashboardView').should('have.class', 'd-none');
        // Verificar atributo
        cy.get('.inventario-app').should('have.attr', 'data-current-view', 'lista');
    }
});
```

## Por qué esto SÍ funciona

1. **Las clases son predecibles**: Bootstrap ya las tiene definidas
2. **Son más fáciles de verificar**: `have.class` es más confiable que verificar estilos
3. **No hay conflictos**: Los estilos inline siempre ganan, las clases cooperan
4. **Debugging más fácil**: Puedes ver las clases en el inspector

## Beneficios adicionales

- ✅ No necesitas refactorizar toda la arquitectura
- ✅ Es un cambio mínimo (30 minutos)
- ✅ Los tests serán más estables
- ✅ Funciona con el código actual
- ✅ No necesitas Testing Contract ni State Management (aún)

## Implementación paso a paso

1. Buscar todos los `.style.display =`
2. Reemplazar por `.classList.add/remove('d-none')`
3. Agregar `data-current-view` para testing
4. Actualizar los tests para verificar clases
5. Profit! 🎉