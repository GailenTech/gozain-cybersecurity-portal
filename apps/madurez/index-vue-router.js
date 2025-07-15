/**
 * Módulo de Madurez con Vue Router
 */

export default class MadurezVueRouterApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
        this.router = null;
    }

    async mount() {
        console.log('MadurezVueRouterApp mount() called');
        
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Crear contenedor para Vue
        this.container.innerHTML = '<div id="madurez-vue-root"></div>';
        const vueContainer = this.container.querySelector('#madurez-vue-root');
        
        try {
            const { createApp, h } = window.Vue;
            const { createRouter, createWebHashHistory } = window.VueRouter;
            
            console.log('Creating Vue app for Madurez...');
            
            // Cargar componentes dinámicamente
            const { DashboardPage } = await import('./pages/DashboardPage.js');
            const { EvaluacionesPage } = await import('./pages/EvaluacionesPage.js');
            const { CuestionarioPage } = await import('./pages/CuestionarioPage.js');
            const { HistorialPage } = await import('./pages/HistorialPage.js');
            
            // Crear router
            const router = createRouter({
                history: createWebHashHistory(),
                routes: [
                    { path: '/', redirect: '/dashboard' },
                    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
                    { path: '/evaluaciones', name: 'evaluaciones', component: EvaluacionesPage },
                    { path: '/cuestionario/:id', name: 'cuestionario', component: CuestionarioPage },
                    { path: '/historial', name: 'historial', component: HistorialPage }
                ]
            });
            
            // Guardar rutas en localStorage para persistencia
            router.afterEach((to) => {
                const routeData = {
                    module: 'madurez',
                    path: to.fullPath,
                    organization: this.organization
                };
                localStorage.setItem('gozain_last_route', JSON.stringify(routeData));
            });
            
            // Componente raíz
            const RootComponent = {
                name: 'MadurezRoot',
                
                mounted() {
                    this.setupMenu();
                    
                    // Escuchar eventos del menú
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.on('madurez:menuAction', this.handleMenuAction);
                    }
                },
                
                beforeUnmount() {
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.off('madurez:menuAction', this.handleMenuAction);
                    }
                },
                
                methods: {
                    handleMenuAction(data) {
                        console.log('Menu action:', data);
                        
                        if (data.item === 'nueva') {
                            console.log('Crear nueva evaluación');
                            // TODO: Implementar modal de nueva evaluación
                        } else {
                            // Navegar usando el router
                            this.$router.push({ name: data.item });
                        }
                    },
                    
                    setupMenu() {
                        const eventBus = window.gozainApp?.eventBus;
                        if (!eventBus) return;
                        
                        // Actualizar menú basado en la ruta actual
                        const updateMenuState = () => {
                            const currentRoute = this.$route.name;
                            eventBus.emit('shell:setAppMenu', {
                                appId: 'madurez',
                                menu: [
                                    {
                                        id: 'dashboard',
                                        label: 'Dashboard',
                                        icon: 'bi-speedometer2',
                                        active: currentRoute === 'dashboard'
                                    },
                                    {
                                        id: 'evaluaciones',
                                        label: 'Evaluaciones',
                                        icon: 'bi-list-check',
                                        active: currentRoute === 'evaluaciones'
                                    },
                                    {
                                        id: 'historial',
                                        label: 'Historial',
                                        icon: 'bi-clock-history',
                                        active: currentRoute === 'historial'
                                    },
                                    { divider: true },
                                    {
                                        id: 'nueva',
                                        label: 'Nueva Evaluación',
                                        icon: 'bi-plus-circle'
                                    }
                                ]
                            });
                        };
                        
                        // Llamar al inicio
                        updateMenuState();
                        
                        // Actualizar en cada cambio de ruta
                        this.$router.afterEach(() => {
                            updateMenuState();
                        });
                    }
                },
                
                render() {
                    return h('div', { class: 'madurez-module' }, [
                        h(window.VueRouter.RouterView)
                    ]);
                }
            };
            
            // Crear la app
            const app = createApp(RootComponent);
            
            // Usar router
            app.use(router);
            
            // Hacer servicios disponibles globalmente para las páginas
            window.gozainApp = {
                services: this.services,
                eventBus: this.services.eventBus,
                organization: this.organization
            };
            
            // Montar
            app.mount(vueContainer);
            this.vueApp = app;
            
            console.log('Madurez Vue app mounted successfully');
            
            // Restaurar ruta si existe
            const savedRoute = localStorage.getItem('gozain_last_route');
            if (savedRoute) {
                try {
                    const routeData = JSON.parse(savedRoute);
                    if (routeData.module === 'madurez' && routeData.organization === this.organization) {
                        router.push(routeData.path);
                    }
                } catch (e) {
                    console.error('Error restaurando ruta:', e);
                }
            }
            
        } catch (error) {
            console.error('Error montando Madurez:', error);
            vueContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error al cargar Madurez</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    async unmount() {
        if (this.vueApp) {
            this.vueApp.unmount();
        }
        this.container.innerHTML = '';
    }
}