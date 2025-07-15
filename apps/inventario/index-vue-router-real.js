/**
 * Módulo de Inventario con Vue Router Real (con rutas en URL)
 */
import { inventarioStore } from './store/index.js';
import { createInventarioRouter } from './router/index.js';
import { ModalActivo } from './components/ModalActivo.js';
import { ModalImportar } from './components/ModalImportar.js';

export default class InventarioVueRouterRealApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
    }
    
    async mount() {
        console.log('InventarioVueRouterRealApp mount() called');
        
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Configurar el store con la organización y servicios
        inventarioStore.commit('SET_ORGANIZATION', this.organization);
        inventarioStore.commit('SET_SERVICES', this.services);
        
        // Crear contenedor para Vue
        this.container.innerHTML = '<div id="inventario-vue-root"></div>';
        const vueContainer = this.container.querySelector('#inventario-vue-root');
        
        try {
            const { createApp, h } = window.Vue;
            
            console.log('Creating Vue app with real router...');
            
            // Componente raíz que maneja el menú y el router-view
            const RootComponent = {
                name: 'InventarioRoot',
                
                mounted() {
                    this.setupMenu();
                    
                    // Escuchar eventos del menú
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.on('inventario:menuAction', this.handleMenuAction);
                    }
                },
                
                beforeUnmount() {
                    const eventBus = window.gozainApp?.eventBus;
                    if (eventBus) {
                        eventBus.off('inventario:menuAction', this.handleMenuAction);
                    }
                },
                
                methods: {
                    handleMenuAction(data) {
                        console.log('Menu action:', data);
                        
                        if (data.item === 'nuevo') {
                            this.$store.commit('SHOW_MODAL_ACTIVO', { modo: 'nuevo' });
                        } else if (data.item === 'importar') {
                            this.$store.commit('SHOW_MODAL_IMPORTAR');
                        } else if (data.item === 'exportar') {
                            this.exportarActivos();
                        } else {
                            // Navegar usando el router
                            this.$router.push({ name: data.item });
                        }
                    },
                    
                    async exportarActivos() {
                        try {
                            const api = this.$store.state.services?.api || window.gozainApp?.services?.api;
                            const blob = await api.getBlob('/inventario/activos/export');
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                        } catch (error) {
                            console.error('Error exportando:', error);
                        }
                    },
                    
                    setupMenu() {
                        const eventBus = window.gozainApp?.eventBus;
                        if (!eventBus) return;
                        
                        // Actualizar menú basado en la ruta actual
                        const updateMenuState = () => {
                            const currentRoute = this.$route.name;
                            eventBus.emit('shell:setAppMenu', {
                                appId: 'inventario',
                                menu: [
                                    {
                                        id: 'dashboard',
                                        label: 'Dashboard',
                                        icon: 'bi-speedometer2',
                                        active: currentRoute === 'dashboard'
                                    },
                                    {
                                        id: 'inventario',
                                        label: 'Inventario de Activos',
                                        icon: 'bi-server',
                                        active: currentRoute === 'inventario'
                                    },
                                    { divider: true },
                                    {
                                        id: 'nuevo',
                                        label: 'Nuevo Activo',
                                        icon: 'bi-plus-circle'
                                    },
                                    {
                                        id: 'importar',
                                        label: 'Importar',
                                        icon: 'bi-upload'
                                    },
                                    {
                                        id: 'exportar',
                                        label: 'Exportar',
                                        icon: 'bi-download'
                                    },
                                    { divider: true },
                                    {
                                        id: 'reportes',
                                        label: 'Reportes',
                                        icon: 'bi-file-earmark-bar-graph',
                                        active: currentRoute === 'reportes'
                                    },
                                    {
                                        id: 'auditoria',
                                        label: 'Auditoría',
                                        icon: 'bi-shield-check',
                                        active: currentRoute === 'auditoria'
                                    }
                                ]
                            });
                        };
                        
                        // Actualizar al cambiar de ruta
                        this.$router.afterEach(updateMenuState);
                        updateMenuState();
                    }
                },
                
                render() {
                    return h('div', { class: 'inventario-module' }, [
                        // Router view para las páginas
                        h(window.VueRouter.RouterView),
                        
                        // Modales globales
                        this.$store.state.modalActivo.show && h(ModalActivo),
                        this.$store.state.modalImportar.show && h(ModalImportar)
                    ]);
                }
            };
            
            // Crear la app
            const app = createApp(RootComponent);
            
            // Crear y configurar el router
            const router = createInventarioRouter();
            
            // Guardar rutas en localStorage para persistencia
            router.afterEach((to) => {
                const routeData = {
                    module: 'inventario',
                    path: to.fullPath,
                    organization: this.organization
                };
                localStorage.setItem('gozain_last_route', JSON.stringify(routeData));
            });
            
            // Usar plugins
            app.use(inventarioStore);
            app.use(router);
            
            // Registrar componentes globales
            app.component('ModalActivo', ModalActivo);
            app.component('ModalImportar', ModalImportar);
            
            // Hacer servicios disponibles globalmente
            window.gozainApp = {
                services: this.services,
                eventBus: this.services.eventBus,
                organization: this.organization
            };
            
            // Inyectar servicios globales
            app.provide('services', this.services);
            app.config.globalProperties.$eventBus = window.gozainApp?.eventBus;
            
            // Handler de errores global
            app.config.errorHandler = (err, instance, info) => {
                console.error('Vue Error:', err, info);
            };
            
            // Montar
            console.log('Mounting app with router...');
            const instance = app.mount(vueContainer);
            
            this.vueApp = {
                app,
                instance,
                router,
                unmount: () => app.unmount()
            };
            
            console.log('Vue router app mounted successfully with real routing');
            
        } catch (error) {
            console.error('Error montando Vue app:', error, error.stack);
            this.container.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}<br><pre>${error.stack}</pre></div>`;
        }
    }
    
    async unmount() {
        if (this.vueApp?.unmount) {
            this.vueApp.unmount();
        }
        this.container.innerHTML = '';
    }
}