/**
 * Módulo de Inventario con Vue - Con Router y páginas separadas
 */
import { inventarioStore } from './store/index.js';
import { InventarioRouter } from './InventarioRouter.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { InventarioPage } from './pages/InventarioPage.js';
import { ReportesPage } from './pages/ReportesPage.js';
import { AuditoriaPage } from './pages/AuditoriaPage.js';
import { ModalActivo } from './components/ModalActivo.js';
import { ModalImportar } from './components/ModalImportar.js';

export default class InventarioVueRouterApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        this.vueApp = null;
    }
    
    async mount() {
        console.log('InventarioVueRouterApp mount() called');
        
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Configurar el store con la organización y servicios
        inventarioStore.commit('SET_ORGANIZATION', this.organization);
        inventarioStore.commit('SET_SERVICES', this.services);
        
        // Crear contenedor para Vue
        this.container.innerHTML = '<div id="inventario-vue-root"></div>';
        const vueContainer = this.container.querySelector('#inventario-vue-root');
        
        try {
            const { createApp } = window.Vue;
            
            console.log('Creating Vue app...');
            
            // Crear la app con el router como componente principal
            const app = createApp(InventarioRouter);
            
            // Registrar componentes globales ANTES de usar el store
            console.log('Registering components...');
            app.component('DashboardPage', DashboardPage);
            app.component('InventarioPage', InventarioPage);
            app.component('ReportesPage', ReportesPage);
            app.component('AuditoriaPage', AuditoriaPage);
            app.component('ModalActivo', ModalActivo);
            app.component('ModalImportar', ModalImportar);
            
            // Páginas placeholder
            app.component('NuevoActivoPage', {
                render() {
                    // Redirige a inventario y abre modal
                    this.$parent.navigateTo('inventario');
                    this.$store.commit('SHOW_MODAL_ACTIVO', { modo: 'nuevo' });
                    return null;
                }
            });
            
            app.component('ImportarPage', {
                render() {
                    // Redirige a inventario y abre modal
                    this.$parent.navigateTo('inventario');
                    this.$store.commit('SHOW_MODAL_IMPORTAR');
                    return null;
                }
            });
            
            // Usar el store
            console.log('Configuring store...');
            app.use(inventarioStore);
            
            // Inyectar servicios globales
            app.provide('services', this.services);
            app.config.globalProperties.$eventBus = window.gozainApp?.eventBus;
            
            // Handler de errores global
            app.config.errorHandler = (err, instance, info) => {
                console.error('Vue Error:', err, info);
            };
            
            // Montar
            console.log('Mounting app...');
            const instance = app.mount(vueContainer);
            
            this.vueApp = {
                app,
                instance,
                unmount: () => app.unmount()
            };
            
            console.log('Vue router app mounted successfully', {
                instance,
                components: Object.keys(app._context.components)
            });
            
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