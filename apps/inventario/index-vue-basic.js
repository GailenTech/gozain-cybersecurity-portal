/**
 * Módulo de Inventario con Vue - Versión Básica
 */
import { inventarioStore } from './store/index.js';
import { InventarioAppBasic } from './InventarioAppBasic.js';

export default class InventarioVueBasicApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
    }
    
    async mount() {
        console.log('InventarioVueBasicApp mount() called');
        
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Configurar el store con la organización
        inventarioStore.commit('SET_ORGANIZATION', this.organization);
        
        // Crear contenedor para Vue
        this.container.innerHTML = '<div id="inventario-vue-root"></div>';
        const vueContainer = this.container.querySelector('#inventario-vue-root');
        
        try {
            const { createApp } = window.Vue;
            const app = createApp(InventarioAppBasic);
            
            // Usar el store
            app.use(inventarioStore);
            
            // Inyectar servicios
            app.provide('services', this.services);
            app.provide('eventBus', window.gozainApp?.eventBus);
            
            // Montar
            const instance = app.mount(vueContainer);
            
            this.vueApp = {
                app,
                instance,
                unmount: () => app.unmount()
            };
            
            console.log('Vue app mounted successfully');
            
        } catch (error) {
            console.error('Error montando Vue app:', error);
            this.container.innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`;
        }
    }
    
    async unmount() {
        if (this.vueApp?.unmount) {
            this.vueApp.unmount();
        }
        this.container.innerHTML = '';
    }
}