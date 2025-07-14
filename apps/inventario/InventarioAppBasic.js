/**
 * Versión básica del componente principal usando funciones de render
 */
export const InventarioAppBasic = {
    name: 'InventarioAppBasic',
    
    data() {
        return {
            loading: false,
            error: null
        };
    },
    
    computed: {
        ...window.Vuex.mapState({
            currentView: state => state.currentView,
            organizationId: state => state.organizationId
        })
    },
    
    mounted() {
        console.log('InventarioAppBasic mounted!');
        console.log('Store state:', this.$store.state);
        
        // Cargar datos iniciales
        if (this.currentView === 'dashboard') {
            this.$store.dispatch('cargarEstadisticas');
        } else {
            this.$store.dispatch('cargarActivos');
        }
    },
    
    methods: {
        handleClick() {
            console.log('Button clicked!');
            this.$store.commit('SET_CURRENT_VIEW', 
                this.currentView === 'dashboard' ? 'inventario' : 'dashboard'
            );
        }
    },
    
    render() {
        const { h } = window.Vue;
        
        return h('div', { class: 'inventario-app p-4' }, [
            h('h2', 'Inventario Vue - Basic'),
            h('p', `Organización: ${this.organizationId}`),
            h('p', `Vista: ${this.currentView}`),
            h('button', {
                class: 'btn btn-primary',
                onClick: this.handleClick
            }, 'Cambiar Vista'),
            
            this.loading && h('div', { class: 'mt-3' }, 'Cargando...'),
            this.error && h('div', { class: 'alert alert-danger mt-3' }, this.error),
            
            h('div', { class: 'mt-4' }, 
                this.currentView === 'dashboard' 
                    ? h('div', { class: 'inventario-dashboard-view' }, [
                        h('h3', 'Dashboard de Inventario'),
                        h('p', 'Aquí irán las estadísticas')
                      ])
                    : h('div', { class: 'inventario-list-view' }, [
                        h('h3', 'Lista de Inventario'),
                        h('p', 'Aquí irá la tabla de activos')
                      ])
            )
        ]);
    }
};