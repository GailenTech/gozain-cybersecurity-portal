// Loader para cargar dinámicamente el contenido de impactos
class ImpactosLoader {
    constructor() {
        this.loaded = false;
        this.container = null;
    }

    async loadImpactosContent() {
        if (this.loaded) return;

        try {
            // Cargar el HTML de impactos
            const response = await fetch('/static/impactos.html');
            const html = await response.text();
            
            // Crear un elemento temporal para parsear el HTML
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Extraer solo el contenido del body (sin head, scripts, etc)
            const mainContent = temp.querySelector('.container-fluid');
            if (mainContent) {
                // Crear contenedor para impactos si no existe
                this.container = document.getElementById('contenedor-impactos');
                if (!this.container) {
                    this.container = document.createElement('div');
                    this.container.id = 'contenedor-impactos';
                    this.container.style.display = 'none';
                    document.querySelector('main').appendChild(this.container);
                }
                
                // Insertar el contenido
                this.container.innerHTML = mainContent.innerHTML;
                
                // Ajustar clases para que funcione con el layout existente
                this.container.querySelector('.col-md-2')?.classList.add('d-none'); // Ocultar sidebar duplicado
                this.container.querySelector('.col-md-10')?.classList.replace('col-md-10', 'col-md-12');
                
                this.loaded = true;
                
                // Inicializar funciones de impactos si están disponibles
                if (typeof cargarTiposImpacto === 'function') {
                    cargarTiposImpacto();
                    cargarEstadisticas();
                }
            }
        } catch (error) {
            console.error('Error cargando contenido de impactos:', error);
        }
    }

    showImpactosView(view) {
        // Ocultar todas las vistas de inventario
        document.querySelectorAll('.vista-contenido').forEach(v => {
            v.style.display = 'none';
        });
        
        // Mostrar contenedor de impactos
        if (this.container) {
            this.container.style.display = 'block';
            
            // Mostrar vista específica de impactos
            if (typeof mostrarVista === 'function' && window.mostrarVistaImpactos) {
                window.mostrarVistaImpactos(view);
            }
        }
    }

    hideImpactos() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}

// Instancia global
window.impactosLoader = new ImpactosLoader();

// Modificar el navigation manager para cargar impactos cuando sea necesario
if (window.navigationManager) {
    const originalHandleRoute = window.navigationManager.handleRoute.bind(window.navigationManager);
    
    window.navigationManager.handleRoute = async function(path, pushState) {
        // Si es una ruta de impactos, cargar el contenido primero
        if (path.startsWith('/impactos')) {
            await window.impactosLoader.loadImpactosContent();
        }
        
        // Llamar al método original
        return originalHandleRoute(path, pushState);
    };
}