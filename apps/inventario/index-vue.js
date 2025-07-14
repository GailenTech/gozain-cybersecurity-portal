/**
 * Módulo de Inventario integrado con Vue
 */
import { vueAdapter } from '../../core/vue/VueAdapter.js';
import { InventarioApp } from './InventarioApp.vue.js';
import { inventarioStore } from './store/index.js';

export default class InventarioVueApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
    }
    
    async mount() {
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Configurar el store con la organización
        inventarioStore.commit('SET_ORGANIZATION', this.organization);
        
        // Registrar la aplicación Vue
        vueAdapter.registerApp('inventario', InventarioApp, inventarioStore);
        
        // Crear contenedor para Vue
        this.container.innerHTML = '<div id="inventario-vue-root"></div>';
        const vueContainer = this.container.querySelector('#inventario-vue-root');
        
        // Montar la aplicación Vue
        const { app, instance, unmount } = vueAdapter.mountApp(
            'inventario',
            vueContainer,
            {}, // props
            this.services // servicios
        );
        
        this.vueApp = { app, instance, unmount };
        
        // Configurar event bus en la instancia Vue
        this.vueApp.app.config.globalProperties.eventBus = window.gozainApp?.eventBus;
        
        // Escuchar eventos del menú
        const eventBus = window.gozainApp?.eventBus;
        if (eventBus) {
            this.menuHandler = (data) => {
                if (data.item && this.vueApp.instance) {
                    this.vueApp.instance.handleMenuAction(data.item);
                }
            };
            eventBus.on('inventario:menuAction', this.menuHandler);
        }
    }
    
    async unmount() {
        // Desmontar Vue
        if (this.vueApp?.unmount) {
            this.vueApp.unmount();
        }
        
        // Limpiar event listeners
        const eventBus = window.gozainApp?.eventBus;
        if (eventBus && this.menuHandler) {
            eventBus.off('inventario:menuAction', this.menuHandler);
        }
        
        // Limpiar contenedor
        this.container.innerHTML = '';
    }
    
    // Métodos para compatibilidad con el sistema actual
    handleMenuAction(action) {
        if (this.vueApp?.instance) {
            this.vueApp.instance.handleMenuAction(action);
        }
    }
}