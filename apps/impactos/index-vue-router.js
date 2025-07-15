/**
 * Módulo de Impactos con Vue Router
 */

export default class ImpactosVueRouterApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
    }
    
    async mount() {
        console.log('ImpactosVueRouterApp mount() called');
        
        // Verificar autenticación
        if (!window.authService || !window.authService.isAuthenticated()) {
            this.showUnauthenticatedView();
            return;
        }
        
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Crear contenedor para Vue
        this.container.innerHTML = '<div id="impactos-vue-root"></div>';
        const vueContainer = this.container.querySelector('#impactos-vue-root');
        
        try {
            const { createApp, h } = window.Vue;
            const { createRouter, createWebHashHistory } = window.VueRouter;
            
            console.log('Creating Vue app for Impactos...');
            
            // Cargar componentes dinámicamente
            const { DashboardPage } = await import('./pages/DashboardPage.js');
            const { ImpactosPage } = await import('./pages/ImpactosPage.js');
            const { TareasPage } = await import('./pages/TareasPage.js');
            const { ModalImpacto } = await import('./components/ModalImpacto.js');
            
            // Crear router
            const router = createRouter({
                history: createWebHashHistory(),
                routes: [
                    { path: '/', redirect: '/dashboard' },
                    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
                    { path: '/lista', name: 'lista', component: ImpactosPage },
                    { path: '/tareas', name: 'tareas', component: TareasPage }
                ]
            });
            
            // Guardar rutas en localStorage para persistencia
            router.afterEach((to) => {
                const routeData = {
                    module: 'impactos',
                    path: to.fullPath,
                    organization: this.organization
                };
                localStorage.setItem('gozain_last_route', JSON.stringify(routeData));
            });
            
            // Componente raíz
            const RootComponent = {
                name: 'ImpactosRoot',
                
                mounted() {
                    this.setupMenu();
                    
                    // Escuchar eventos del menú
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.on('impactos:menuAction', this.handleMenuAction);
                    }
                },
                
                beforeUnmount() {
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.off('impactos:menuAction', this.handleMenuAction);
                    }
                },
                
                methods: {
                    handleMenuAction(data) {
                        console.log('Menu action:', data);
                        
                        if (data.item === 'nuevo') {
                            console.log('Crear nuevo impacto');
                            // TODO: Implementar modal de nuevo impacto
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
                                appId: 'impactos',
                                menu: [
                                    {
                                        id: 'dashboard',
                                        label: 'Dashboard',
                                        icon: 'bi-speedometer2',
                                        active: currentRoute === 'dashboard'
                                    },
                                    {
                                        id: 'lista',
                                        label: 'Lista de Impactos',
                                        icon: 'bi-list-ul',
                                        active: currentRoute === 'lista'
                                    },
                                    {
                                        id: 'tareas',
                                        label: 'Tareas',
                                        icon: 'bi-check-square',
                                        active: currentRoute === 'tareas'
                                    },
                                    { divider: true },
                                    {
                                        id: 'nuevo',
                                        label: 'Nuevo Impacto',
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
                    return h('div', { class: 'impactos-module' }, [
                        h(window.VueRouter.RouterView),
                        h(ModalImpacto)
                    ]);
                }
            };
            
            // Crear la app
            const app = createApp(RootComponent);
            
            // Usar router
            app.use(router);
            
            // Registrar componente modal
            app.component('ModalImpacto', ModalImpacto);
            
            // Hacer servicios disponibles globalmente para las páginas
            window.gozainApp = {
                services: this.services,
                eventBus: this.services.eventBus,
                organization: this.organization
            };
            
            // Montar
            app.mount(vueContainer);
            this.vueApp = app;
            
            console.log('Impactos Vue app mounted successfully');
            
            // Restaurar ruta si existe
            const savedRoute = localStorage.getItem('gozain_last_route');
            if (savedRoute) {
                try {
                    const routeData = JSON.parse(savedRoute);
                    if (routeData.module === 'impactos' && routeData.organization === this.organization) {
                        router.push(routeData.path);
                    }
                } catch (e) {
                    console.error('Error restaurando ruta:', e);
                }
            }
            
        } catch (error) {
            console.error('Error montando Impactos:', error);
            vueContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error al cargar Impactos</h4>
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
    
    showUnauthenticatedView() {
        this.container.innerHTML = `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-8 text-center">
                        <div class="mb-4">
                            <i class="bi bi-diagram-3" style="font-size: 4rem; color: var(--bs-warning);"></i>
                        </div>
                        <h2 class="mb-4">Gestión de Impactos de Negocio</h2>
                        <p class="lead mb-4">
                            Registra y gestiona los impactos de negocio, cambios organizacionales 
                            y tareas asociadas de manera eficiente.
                        </p>
                        <div class="row mb-5">
                            <div class="col-md-4">
                                <div class="feature-box p-3">
                                    <i class="bi bi-people fs-3 text-primary mb-3"></i>
                                    <h5>Gestión de Personal</h5>
                                    <p class="text-muted">Altas, bajas y cambios de personal</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="feature-box p-3">
                                    <i class="bi bi-list-task fs-3 text-success mb-3"></i>
                                    <h5>Tareas Asociadas</h5>
                                    <p class="text-muted">Control de tareas derivadas de impactos</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="feature-box p-3">
                                    <i class="bi bi-graph-up fs-3 text-info mb-3"></i>
                                    <h5>Análisis y Reportes</h5>
                                    <p class="text-muted">Métricas y tendencias de impactos</p>
                                </div>
                            </div>
                        </div>
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Autenticación requerida</strong><br>
                            Para acceder al módulo de impactos, debes iniciar sesión con tu cuenta organizacional.
                        </div>
                        <button class="btn btn-primary btn-lg" onclick="document.querySelector('#login-btn').click()">
                            <i class="bi bi-box-arrow-in-right me-2"></i>
                            Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}