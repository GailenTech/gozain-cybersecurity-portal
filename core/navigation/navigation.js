// Sistema de navegación y gestión de aplicaciones
export class NavigationManager {
    constructor() {
        this.apps = new Map();
        this.currentApp = null;
        this.currentOrganization = null;
    }
    
    registerApp(appConfig) {
        this.apps.set(appConfig.id, appConfig);
    }
    
    getApps() {
        return Array.from(this.apps.values());
    }
    
    setOrganization(orgId) {
        this.currentOrganization = orgId;
    }
    
    async loadApp(appId, container) {
        // Si hay una app cargada, desmontarla
        if (this.currentApp) {
            if (this.currentApp.unmount) {
                await this.currentApp.unmount();
            }
        }
        
        const appConfig = this.apps.get(appId);
        if (!appConfig) {
            throw new Error(`Aplicación no encontrada: ${appId}`);
        }
        
        // Cargar el módulo de la aplicación
        try {
            const module = await import(`${appConfig.path}/index.js`);
            const AppClass = module.default;
            
            // Crear instancia de la aplicación
            this.currentApp = new AppClass({
                container,
                organization: this.currentOrganization,
                services: window.gozainCore.services,
                config: appConfig
            });
            
            // Montar la aplicación
            await this.currentApp.mount();
            
        } catch (error) {
            console.error(`Error cargando aplicación ${appId}:`, error);
            throw error;
        }
    }
    
    getCurrentApp() {
        return this.currentApp;
    }
    
    async unloadCurrentApp() {
        if (this.currentApp && this.currentApp.unmount) {
            await this.currentApp.unmount();
        }
        this.currentApp = null;
    }
}