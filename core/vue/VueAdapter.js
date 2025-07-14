/**
 * Adaptador para integrar componentes Vue en el sistema modular existente
 */
export class VueAdapter {
    constructor() {
        this.apps = new Map();
    }

    /**
     * Registra un componente Vue como aplicación
     */
    registerApp(name, component, store = null) {
        this.apps.set(name, { component, store });
    }

    /**
     * Monta una aplicación Vue en un contenedor
     */
    mountApp(name, container, props = {}, services = {}) {
        const appConfig = this.apps.get(name);
        if (!appConfig) {
            throw new Error(`Aplicación Vue '${name}' no registrada`);
        }

        // Crear la aplicación Vue
        const { createApp } = window.Vue || Vue;
        const app = createApp(appConfig.component, props);
        
        // Si hay un store Vuex, usarlo
        if (appConfig.store) {
            app.use(appConfig.store);
        }

        // Inyectar servicios globales
        app.provide('services', services);
        app.provide('eventBus', window.gozainApp?.eventBus);
        
        // Montar la aplicación
        const instance = app.mount(container);
        
        return {
            app,
            instance,
            unmount: () => app.unmount()
        };
    }

    /**
     * Crea un componente Vue simple sin template compilado
     */
    createComponent(options) {
        return {
            ...options,
            // Asegurar que el template se renderiza correctamente
            render() {
                if (options.template) {
                    // Para templates simples, usar innerHTML temporal
                    const temp = document.createElement('div');
                    temp.innerHTML = options.template;
                    const { h } = window.Vue || Vue;
                    return h('div', { innerHTML: temp.innerHTML });
                }
                const { h } = window.Vue || Vue;
                return options.render?.call(this) || h('div');
            }
        };
    }
}

// Instancia global del adaptador
export const vueAdapter = new VueAdapter();