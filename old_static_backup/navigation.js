// Sistema de navegación con History API
class NavigationManager {
    constructor() {
        this.currentView = null;
        this.initializeRoutes();
        this.setupEventListeners();
    }

    initializeRoutes() {
        this.routes = {
            '/': { view: 'dashboard', handler: () => mostrarVista('dashboard') },
            '/inventario': { view: 'activos', handler: () => mostrarVista('activos') },
            '/inventario/nuevo': { view: 'nuevo', handler: () => mostrarVista('nuevo') },
            '/inventario/importar': { view: 'importar', handler: () => mostrarVista('importar') },
            '/reportes': { view: 'reportes', handler: () => mostrarVista('reportes') },
            '/auditoria': { view: 'auditoria', handler: () => mostrarVista('auditoria') },
            '/impactos': { view: 'impactos', handler: () => window.location.href = '/static/impactos.html' }
        };
    }

    setupEventListeners() {
        // Interceptar clicks en enlaces
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href.startsWith(window.location.origin) && !link.target) {
                e.preventDefault();
                const path = new URL(link.href).pathname;
                this.navigate(path);
            }
        });

        // Manejar botones de navegación del browser
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname, false);
        });

        // Cargar ruta inicial
        this.handleRoute(window.location.pathname, false);
    }

    navigate(path, pushState = true) {
        if (pushState) {
            history.pushState({}, '', path);
        }
        this.handleRoute(path, false);
    }

    handleRoute(path, pushState = true) {
        // Buscar ruta exacta
        let route = this.routes[path];
        let params = {};

        // Si no existe, buscar rutas con parámetros
        if (!route) {
            for (const [pattern, routeConfig] of Object.entries(this.routes)) {
                const regex = this.pathToRegex(pattern);
                const match = path.match(regex);
                if (match) {
                    route = routeConfig;
                    params = this.extractParams(pattern, path);
                    break;
                }
            }
        }

        if (route) {
            // Si no es una ruta de impactos, ocultar el contenedor de impactos y mostrar el contenido principal
            if (!path.startsWith('/impactos')) {
                const contenedorImpactos = document.getElementById('contenedor-impactos');
                if (contenedorImpactos) {
                    contenedorImpactos.style.display = 'none';
                }
                
                // Mostrar de nuevo el contenido principal
                const mainElement = document.querySelector('main');
                if (mainElement) {
                    Array.from(mainElement.children).forEach(child => {
                        if (child.id !== 'contenedor-impactos') {
                            child.style.display = '';
                        }
                    });
                }
            }
            
            // Actualizar navegación activa
            this.updateActiveNavigation(route.view);
            
            // Ejecutar handler
            if (route.handler) {
                route.handler(params);
            }

            // Actualizar título
            this.updatePageTitle(route.view);
        } else {
            // Ruta no encontrada, ir al dashboard
            this.navigate('/', pushState);
        }
    }

    pathToRegex(path) {
        return new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$');
    }

    extractParams(pattern, path) {
        const params = {};
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        patternParts.forEach((part, i) => {
            if (part.startsWith(':')) {
                params[part.slice(1)] = pathParts[i];
            }
        });

        return params;
    }

    updateActiveNavigation(view) {
        // Remover clase active de todos los enlaces
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Agregar clase active al enlace correspondiente
        const activeLink = document.querySelector(`[data-route="${view}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updatePageTitle(view) {
        const titles = {
            'dashboard': 'Dashboard - Gestión de Activos ISO 27001',
            'activos': 'Inventario - Gestión de Activos ISO 27001',
            'nuevo': 'Nuevo Activo - Gestión de Activos ISO 27001',
            'importar': 'Importar - Gestión de Activos ISO 27001',
            'reportes': 'Reportes - Gestión de Activos ISO 27001',
            'auditoria': 'Auditoría - Gestión de Activos ISO 27001',
            'impactos-dashboard': 'Dashboard de Impactos - ISO 27001',
            'impactos-nuevo': 'Nuevo Impacto - ISO 27001',
            'impactos-lista': 'Lista de Impactos - ISO 27001',
            'impactos-tareas': 'Tareas de Impactos - ISO 27001',
            'impactos-detalle': 'Detalle de Impacto - ISO 27001'
        };

        document.title = titles[view] || 'Gestión de Activos ISO 27001';
    }
    
    async loadImpactosPage() {
        console.log('Cargando página de impactos...');
        
        // Ocultar el contenedor principal del inventario
        const vistasDashboard = document.getElementById('vista-dashboard');
        const vistasInventario = document.getElementById('vista-activos');
        const vistasNuevo = document.getElementById('vista-nuevo');
        const vistasImportar = document.getElementById('vista-importar');
        const vistasReportes = document.getElementById('vista-reportes');
        const vistasAuditoria = document.getElementById('vista-auditoria');
        
        [vistasDashboard, vistasInventario, vistasNuevo, vistasImportar, vistasReportes, vistasAuditoria].forEach(v => {
            if (v) v.style.display = 'none';
        });
        
        // Obtener o crear el contenedor de impactos
        let contenedor = document.getElementById('contenedor-impactos');
        
        // Cargar módulo de impactos si no está cargado o si está vacío
        if (!window.impactosManager || !contenedor || !contenedor.innerHTML.trim()) {
            console.log('Cargando módulo de impactos...');
            await this.loadImpactosModule();
            contenedor = document.getElementById('contenedor-impactos');
        }
        
        // Mostrar contenedor de impactos
        if (contenedor) {
            console.log('Mostrando contenedor de impactos');
            contenedor.style.display = 'block';
            
            // Inicializar si es necesario
            if (typeof initializeImpactos === 'function' && !window.impactosInicializado) {
                console.log('Inicializando impactos...');
                initializeImpactos();
            }
            
            // La vista se mostrará cuando el script se cargue completamente
        } else {
            console.error('No se pudo cargar el contenedor de impactos');
        }
    }
    
    async loadImpactosModule() {
        try {
            console.log('Iniciando carga del módulo de impactos...');
            
            // Cargar el contenido HTML de impactos
            const response = await fetch('/static/impactos.html');
            if (!response.ok) {
                throw new Error(`Error cargando impactos.html: ${response.status}`);
            }
            const html = await response.text();
            console.log('HTML de impactos cargado, longitud:', html.length);
            
            // Crear parser temporal
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extraer el contenido principal (sin navbar duplicado)
            const container = doc.querySelector('.container-fluid');
            console.log('Container encontrado:', !!container);
            
            if (container) {
                // Remover navbar del contenido de impactos
                const navbar = container.querySelector('.navbar');
                if (navbar) navbar.remove();
                
                // Crear o actualizar contenedor
                let contenedor = document.getElementById('contenedor-impactos');
                if (!contenedor) {
                    contenedor = document.createElement('div');
                    contenedor.id = 'contenedor-impactos';
                    contenedor.style.display = 'none';
                    document.querySelector('main').appendChild(contenedor);
                }
                
                // Insertar contenido ajustado
                contenedor.innerHTML = container.innerHTML;
                
                // Hacer visible el contenedor inmediatamente después de insertar el contenido
                contenedor.style.display = 'block';
                console.log('Contenido insertado en contenedor-impactos');
                
                // Actualizar referencias a mostrarVista en onclick handlers
                contenedor.querySelectorAll('[onclick*="mostrarVista"]').forEach(element => {
                    const onclick = element.getAttribute('onclick');
                    element.setAttribute('onclick', onclick.replace('mostrarVista', 'mostrarVistaImpactos'));
                });
                console.log('Referencias onclick actualizadas');
                
                // Ajustar layout: remover sidebar duplicado y expandir contenido
                const sidebarCol = contenedor.querySelector('.col-md-2');
                const mainCol = contenedor.querySelector('.col-md-10');
                if (sidebarCol) sidebarCol.remove();
                if (mainCol) {
                    mainCol.classList.remove('col-md-10');
                    mainCol.classList.add('col-md-12');
                }
                
                // Importante: Las vistas de impactos tienen los mismos IDs que las del inventario
                // Necesitamos diferenciarlas agregando un prefijo o moviendo el contenido correctamente
                const vistasImpactos = contenedor.querySelectorAll('.vista-contenido');
                vistasImpactos.forEach(vista => {
                    // Agregar clase específica para identificar vistas de impactos
                    vista.classList.add('vista-impactos');
                });
                
                // Cargar script de impactos si no está cargado
                if (!window.impactosScriptLoaded) {
                    // Verificar si ya existe el script en el DOM
                    let existingScript = document.querySelector('script[src="/static/impactos.js"]');
                    
                    // Si existe, eliminarlo para evitar conflictos
                    if (existingScript) {
                        console.log('Eliminando script de impactos existente');
                        existingScript.remove();
                        // Resetear estado
                        window.impactosScriptLoaded = false;
                        window.impactosManager = false;
                        window.impactosInicializado = false;
                        window.impactosModuloCargado = false;
                        // Limpiar funciones globales
                        if (window.initializeImpactos) delete window.initializeImpactos;
                        if (window.mostrarVistaImpactos) delete window.mostrarVistaImpactos;
                    }
                    
                    if (!existingScript || true) {  // Siempre crear uno nuevo después de limpiar
                        const script = document.createElement('script');
                        script.src = '/static/impactos.js';
                        script.onload = () => {
                            console.log('Script de impactos cargado exitosamente');
                            // Marcar como cargado
                            window.impactosScriptLoaded = true;
                            window.impactosManager = true;
                            
                            // Inicializar sistema de impactos
                            if (typeof initializeImpactos === 'function') {
                                console.log('Llamando a initializeImpactos desde onload');
                                initializeImpactos();
                                
                                // Ahora sí mostrar la vista
                                if (window.mostrarVistaImpactos) {
                                    console.log('Mostrando vista dashboard desde onload');
                                    window.mostrarVistaImpactos('dashboard');
                                }
                            } else {
                                console.error('initializeImpactos no está definida');
                            }
                        };
                        script.onerror = () => {
                            console.error('Error cargando script de impactos');
                            window.impactosScriptLoaded = false;
                        };
                        document.body.appendChild(script);
                    } else {
                        // El script ya existe, solo marcar como cargado e inicializar
                        window.impactosScriptLoaded = true;
                        window.impactosManager = true;
                        if (typeof initializeImpactos === 'function') {
                            initializeImpactos();
                        }
                    }
                } else {
                    // Ya está cargado, solo re-inicializar si es necesario
                    window.impactosManager = true;
                    if (typeof initializeImpactos === 'function' && !window.impactosGlobals.initialized) {
                        initializeImpactos();
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando módulo de impactos:', error);
        }
    }
}

// Inicializar navegación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navigationManager = new NavigationManager();
    });
} else {
    window.navigationManager = new NavigationManager();
}