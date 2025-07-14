// Módulo de Madurez en Ciberseguridad con Vue 3 + Router
import { createApp, ref, reactive, computed, onMounted, provide } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { createRouter, createWebHashHistory } from 'https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js';

// Importar páginas
import DashboardPage from './pages/DashboardPage.js';
import EvaluacionesPage from './pages/EvaluacionesPage.js';
import CuestionarioPage from './pages/CuestionarioPage.js';
import HistorialPage from './pages/HistorialPage.js';

export default class MadurezApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
        this.router = null;
    }

    async mount() {
        this.services.api.setOrganization(this.organization);
        
        // Configurar router
        this.router = createRouter({
            history: createWebHashHistory('/madurez'),
            routes: [
                { path: '/', redirect: '/dashboard' },
                { path: '/dashboard', component: DashboardPage, meta: { title: 'Dashboard' } },
                { path: '/evaluaciones', component: EvaluacionesPage, meta: { title: 'Evaluaciones' } },
                { path: '/cuestionario/:id', component: CuestionarioPage, meta: { title: 'Cuestionario' } },
                { path: '/historial', component: HistorialPage, meta: { title: 'Historial' } },
            ]
        });

        // Configurar persistencia de rutas
        this.router.afterEach((to) => {
            const routeData = {
                module: 'madurez',
                path: to.fullPath,
                organization: this.organization
            };
            localStorage.setItem('gozain_last_route', JSON.stringify(routeData));
        });

        // Crear aplicación Vue
        this.vueApp = createApp({
            setup() {
                const organization = ref(this.organization);
                const services = reactive(this.services);
                
                // Proporcionar servicios a componentes hijos
                provide('api', services.api);
                provide('eventBus', services.eventBus);
                provide('organization', organization);

                // Estado global de la aplicación
                const assessments = ref([]);
                const estadisticas = ref({
                    total: 0,
                    completadas: 0,
                    progreso: 0,
                    puntuacion: null
                });
                const loading = ref(false);

                provide('assessments', assessments);
                provide('estadisticas', estadisticas);
                provide('loading', loading);

                return {
                    organization,
                    assessments,
                    estadisticas,
                    loading
                };
            },

            template: `
                <div class="madurez-app fade-in">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="mb-0">
                            <i class="bi bi-shield-check text-primary"></i>
                            Madurez en Ciberseguridad
                        </h4>
                        <div class="btn-group" role="group">
                            <router-link to="/evaluaciones" class="btn btn-outline-secondary" title="Evaluaciones">
                                <i class="bi bi-list-ul"></i>
                            </router-link>
                            <router-link to="/dashboard" class="btn btn-outline-secondary" title="Dashboard">
                                <i class="bi bi-grid-3x3-gap"></i>
                            </router-link>
                        </div>
                    </div>
                    
                    <!-- Estadísticas principales -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card text-bg-primary">
                                <div class="card-body">
                                    <h6 class="card-title">Total Evaluaciones</h6>
                                    <h3 class="mb-0">{{ estadisticas.total }}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-bg-success">
                                <div class="card-body">
                                    <h6 class="card-title">Completadas</h6>
                                    <h3 class="mb-0">{{ estadisticas.completadas }}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-bg-warning">
                                <div class="card-body">
                                    <h6 class="card-title">En Progreso</h6>
                                    <h3 class="mb-0">{{ estadisticas.progreso }}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-bg-info">
                                <div class="card-body">
                                    <h6 class="card-title">Puntuación Actual</h6>
                                    <h3 class="mb-0">{{ estadisticas.puntuacion || '-' }}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Router View -->
                    <router-view></router-view>
                </div>
            `
        }.bind(this));

        this.vueApp.use(this.router);
        this.vueApp.mount(this.container);

        // Configurar menú lateral
        this.setupModuleMenu();

        // Cargar datos iniciales
        await this.loadInitialData();
    }

    async unmount() {
        if (this.vueApp) {
            this.vueApp.unmount();
        }
        this.container.innerHTML = '';
    }

    setupModuleMenu() {
        const appMenu = document.getElementById('appMenu');
        if (!appMenu) return;

        appMenu.innerHTML = '';

        const menuItems = [
            { id: 'dashboard', icon: 'bi-speedometer2', text: 'Dashboard', route: '/dashboard' },
            { id: 'evaluaciones', icon: 'bi-clipboard-check', text: 'Evaluaciones', route: '/evaluaciones' },
            { id: 'nueva', icon: 'bi-plus-circle', text: 'Nueva Evaluación', action: 'new' },
            { id: 'historico', icon: 'bi-clock-history', text: 'Histórico', route: '/historial' },
        ];

        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            
            const a = document.createElement('a');
            a.className = 'nav-link';
            a.href = '#';
            a.setAttribute('data-menu-item', item.id);
            a.innerHTML = `
                <i class="${item.icon} me-2"></i>
                ${item.text}
            `;

            a.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar estado activo
                appMenu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                a.classList.add('active');

                if (item.route) {
                    this.router.push(item.route);
                } else if (item.action === 'new') {
                    this.services.eventBus.emit('madurez:showModal', { type: 'nueva' });
                }
            });

            li.appendChild(a);
            appMenu.appendChild(li);
        });

        // Activar elemento según ruta actual
        this.updateMenuActiveState();
        this.router.afterEach(() => {
            this.updateMenuActiveState();
        });
    }

    updateMenuActiveState() {
        const currentRoute = this.router.currentRoute.value.path;
        const appMenu = document.getElementById('appMenu');
        if (!appMenu) return;

        // Mapear rutas a elementos del menú
        const routeToMenu = {
            '/dashboard': 'dashboard',
            '/evaluaciones': 'evaluaciones',
            '/historial': 'historico'
        };

        // Para rutas de cuestionario, activar evaluaciones
        let activeMenuId = routeToMenu[currentRoute];
        if (!activeMenuId && currentRoute.includes('/cuestionario/')) {
            activeMenuId = 'evaluaciones';
        }
        activeMenuId = activeMenuId || 'dashboard';

        appMenu.querySelectorAll('.nav-link').forEach(link => {
            const menuItem = link.getAttribute('data-menu-item');
            if (menuItem === activeMenuId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async loadInitialData() {
        try {
            // Cargar estadísticas básicas
            const estadisticas = await this.services.api.get('/madurez/estadisticas');
            this.vueApp._instance.setupState.estadisticas.value = estadisticas;
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }
}