/**
 * Versión simplificada del módulo para debug
 */
export default class InventarioVueSimpleApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
    }
    
    async mount() {
        console.log('InventarioVueSimpleApp mount() called');
        
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Crear HTML básico
        this.container.innerHTML = `
            <div id="inventario-vue-root">
                <div class="text-center p-5">
                    <h2>Cargando Vue...</h2>
                </div>
            </div>
        `;
        
        // Verificar que Vue esté disponible
        if (!window.Vue) {
            console.error('Vue no está disponible');
            this.container.innerHTML = '<div class="alert alert-danger">Error: Vue no está cargado</div>';
            return;
        }
        
        if (!window.Vuex) {
            console.error('Vuex no está disponible');
            this.container.innerHTML = '<div class="alert alert-danger">Error: Vuex no está cargado</div>';
            return;
        }
        
        console.log('Vue version:', window.Vue.version);
        
        // Importar el componente simple
        const { InventarioAppSimple } = await import('./InventarioAppSimple.js');
        
        // Crear store simple
        const store = window.Vuex.createStore({
            state() {
                return {
                    organizationId: null,
                    currentView: 'dashboard'
                };
            },
            mutations: {
                SET_ORGANIZATION(state, orgId) {
                    state.organizationId = orgId;
                }
            }
        });
        
        // Configurar la organización en el store
        store.commit('SET_ORGANIZATION', this.organization);
        
        // Crear y montar la aplicación Vue
        try {
            const { createApp } = window.Vue;
            const app = createApp(InventarioAppSimple);
            app.use(store);
            
            const vueContainer = this.container.querySelector('#inventario-vue-root');
            app.mount(vueContainer);
            
            console.log('Vue app mounted successfully');
            
            // Configurar menú
            this.setupMenu();
            
        } catch (error) {
            console.error('Error montando Vue app:', error);
            this.container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }
    
    async unmount() {
        console.log('InventarioVueSimpleApp unmount() called');
        this.container.innerHTML = '';
    }
    
    setupMenu() {
        const eventBus = window.gozainApp?.eventBus;
        if (!eventBus) return;
        
        eventBus.emit('shell:setAppMenu', {
            appId: 'inventario',
            menu: [
                {
                    id: 'dashboard',
                    label: 'Dashboard',
                    icon: 'bi-speedometer2',
                    active: true
                },
                {
                    id: 'inventario',
                    label: 'Inventario de Activos',
                    icon: 'bi-server',
                    active: false
                }
            ]
        });
    }
}