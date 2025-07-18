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
        
        // Verificar autenticación
        if (!window.authService || !window.authService.isAuthenticated()) {
            this.showUnauthenticatedView();
            return;
        }
        
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
            const DashboardPage = (await import('./pages/DashboardPage.js')).default;
            const AssessmentDashboardPage = (await import('./pages/AssessmentDashboardPage.js')).default;
            const EvaluacionesPage = (await import('./pages/EvaluacionesPage.js')).default;
            const CuestionarioPage = (await import('./pages/CuestionarioPage.js')).default;
            const HistorialPage = (await import('./pages/HistorialPage.js')).default;
            
            // Crear router
            const router = createRouter({
                history: createWebHashHistory(),
                routes: [
                    { path: '/', redirect: '/dashboard' },
                    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
                    { path: '/dashboard/:id', name: 'assessment-dashboard', component: AssessmentDashboardPage },
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
            
            // Cargar componente del modal
            const ModalNuevaEvaluacion = (await import('./components/ModalNuevaEvaluacion.js')).default;
            
            // Componente raíz
            const RootComponent = {
                name: 'MadurezRoot',
                
                components: {
                    ModalNuevaEvaluacion
                },
                
                data() {
                    return {
                        showModalNueva: false
                    };
                },
                
                mounted() {
                    this.setupMenu();
                    
                    // Escuchar eventos del menú
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.on('madurez:menuAction', this.handleMenuAction);
                        eventBus.on('madurez:showModal', this.handleShowModal);
                    }
                },
                
                beforeUnmount() {
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.off('madurez:menuAction', this.handleMenuAction);
                        eventBus.off('madurez:showModal', this.handleShowModal);
                    }
                },
                
                methods: {
                    handleMenuAction(data) {
                        console.log('Menu action:', data);
                        
                        if (data.item === 'nueva') {
                            this.showModalNueva = true;
                        } else {
                            // Navegar usando el router
                            this.$router.push({ name: data.item });
                        }
                    },
                    
                    handleShowModal(data) {
                        if (data.type === 'nueva') {
                            this.showModalNueva = true;
                        }
                        // Otros tipos de modales se pueden agregar aquí
                    },
                    
                    handleEvaluacionCreated(evaluacion) {
                        // Navegar al cuestionario de la nueva evaluación
                        this.$router.push(`/cuestionario/${evaluacion.id}`);
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
                        h(window.VueRouter.RouterView),
                        h(ModalNuevaEvaluacion, {
                            show: this.showModalNueva,
                            onClose: () => this.showModalNueva = false,
                            onCreated: this.handleEvaluacionCreated
                        })
                    ]);
                }
            };
            
            // Crear la app
            const app = createApp(RootComponent);
            
            // Usar router
            app.use(router);
            
            // Proveer servicios a todos los componentes hijos
            app.provide('api', this.services.api);
            app.provide('eventBus', this.services.eventBus);
            app.provide('organization', this.organization);
            
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
    
    showUnauthenticatedView() {
        this.container.innerHTML = `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-8 text-center">
                        <div class="mb-4">
                            <i class="bi bi-speedometer2" style="font-size: 4rem; color: var(--bs-success);"></i>
                        </div>
                        <h2 class="mb-4">Evaluación de Madurez en Ciberseguridad</h2>
                        <p class="lead mb-4">
                            Evalúa el nivel de madurez de tu organización en ciberseguridad 
                            basado en marcos reconocidos internacionalmente.
                        </p>
                        <div class="row mb-5">
                            <div class="col-md-4">
                                <div class="feature-box p-3">
                                    <i class="bi bi-clipboard-check fs-3 text-primary mb-3"></i>
                                    <h5>Evaluaciones Completas</h5>
                                    <p class="text-muted">Cuestionarios basados en NIST y CIS</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="feature-box p-3">
                                    <i class="bi bi-graph-up-arrow fs-3 text-warning mb-3"></i>
                                    <h5>Seguimiento de Progreso</h5>
                                    <p class="text-muted">Visualiza tu evolución en el tiempo</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="feature-box p-3">
                                    <i class="bi bi-file-earmark-text fs-3 text-info mb-3"></i>
                                    <h5>Planes de Mejora</h5>
                                    <p class="text-muted">Recomendaciones personalizadas</p>
                                </div>
                            </div>
                        </div>
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Autenticación requerida</strong><br>
                            Para acceder a las evaluaciones de madurez, debes iniciar sesión con tu cuenta organizacional.
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