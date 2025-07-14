// Módulo de Impactos de Negocio con Vue 3 + Router
import { createApp, ref, reactive, computed, onMounted, provide } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { createRouter, createWebHashHistory } from 'https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js';

// Importar páginas
import DashboardPage from './pages/DashboardPage.js';
import ImpactosPage from './pages/ImpactosPage.js';
import TareasPage from './pages/TareasPage.js';

export default class ImpactosApp {
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
            history: createWebHashHistory('/impactos'),
            routes: [
                { path: '/', redirect: '/dashboard' },
                { path: '/dashboard', component: DashboardPage, meta: { title: 'Dashboard' } },
                { path: '/lista', component: ImpactosPage, meta: { title: 'Lista de Impactos' } },
                { path: '/tareas', component: TareasPage, meta: { title: 'Tareas' } },
            ]
        });

        // Configurar persistencia de rutas
        this.router.afterEach((to) => {
            const routeData = {
                module: 'impactos',
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
                const impactos = ref([]);
                const estadisticas = ref({
                    hoy: 0,
                    pendientes: 0,
                    semana: 0,
                    total: 0
                });
                const loading = ref(false);

                provide('impactos', impactos);
                provide('estadisticas', estadisticas);
                provide('loading', loading);

                onMounted(() => {
                    this.setupMenu();
                    
                    // Escuchar eventos del menú
                    const eventBus = services.eventBus;
                    if (eventBus) {
                        eventBus.on('impactos:menuAction', this.handleMenuAction);
                    }
                });

                return {
                    organization,
                    impactos,
                    estadisticas,
                    loading
                };
            },

            methods: {
                handleMenuAction(data) {
                    console.log('Menu action:', data);
                    
                    if (data.item === 'nuevo') {
                        // Implementar modal de nuevo impacto
                        console.log('Crear nuevo impacto');
                    } else {
                        // Navegar usando el router
                        this.$router.push({ path: '/' + data.item });
                    }
                },
                
                setupMenu() {
                    const eventBus = window.gozainApp?.eventBus;
                    if (!eventBus) return;
                    
                    // Actualizar menú basado en la ruta actual
                    const updateMenuState = () => {
                        const currentPath = this.$route.path;
                        eventBus.emit('shell:setAppMenu', {
                            appId: 'impactos',
                            menu: [
                                {
                                    id: 'dashboard',
                                    label: 'Dashboard',
                                    icon: 'bi-speedometer2',
                                    active: currentPath === '/dashboard'
                                },
                                {
                                    id: 'lista',
                                    label: 'Lista de Impactos',
                                    icon: 'bi-list-ul',
                                    active: currentPath === '/lista'
                                },
                                {
                                    id: 'tareas',
                                    label: 'Tareas',
                                    icon: 'bi-check-square',
                                    active: currentPath === '/tareas'
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

            template: `<router-view></router-view>`
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
            { id: 'lista', icon: 'bi-list-ul', text: 'Lista de Impactos', route: '/lista' },
            { id: 'nuevo', icon: 'bi-plus-circle', text: 'Nuevo Impacto', action: 'new' },
            { id: 'tareas', icon: 'bi-check2-square', text: 'Tareas', route: '/tareas' },
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
                    this.services.eventBus.emit('impactos:showModal', { type: 'nuevo' });
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
            '/lista': 'lista',
            '/tareas': 'tareas'
        };

        const activeMenuId = routeToMenu[currentRoute] || 'dashboard';

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
            const estadisticas = await this.services.api.get('/impactos/estadisticas');
            this.vueApp._instance.setupState.estadisticas.value = estadisticas;
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }
}