/**
 * Router simple para manejar las diferentes páginas del módulo
 */
export const InventarioRouter = {
    name: 'InventarioRouter',
    
    data() {
        return {
            currentPage: 'dashboard' // página inicial
        };
    },
    
    computed: {
        currentComponent() {
            const components = {
                'dashboard': 'DashboardPage',
                'inventario': 'InventarioPage',
                'nuevo': 'NuevoActivoPage',
                'importar': 'ImportarPage',
                'reportes': 'ReportesPage',
                'auditoria': 'AuditoriaPage'
            };
            return components[this.currentPage] || 'DashboardPage';
        }
    },
    
    mounted() {
        // Configurar el menú lateral
        this.setupMenu();
        
        // Escuchar eventos de navegación del menú
        const eventBus = this.$root.$eventBus || window.gozainApp?.eventBus;
        if (eventBus) {
            eventBus.on('inventario:menuAction', this.handleMenuAction);
        }
    },
    
    beforeUnmount() {
        const eventBus = this.$root.$eventBus || window.gozainApp?.eventBus;
        if (eventBus) {
            eventBus.off('inventario:menuAction', this.handleMenuAction);
        }
    },
    
    methods: {
        handleMenuAction(data) {
            console.log('Menu action received:', data);
            if (data.item) {
                this.navigateTo(data.item);
            }
        },
        
        navigateTo(page) {
            // Páginas que abren modales en lugar de navegar
            const modalPages = ['nuevo', 'importar'];
            
            if (modalPages.includes(page)) {
                // Emitir evento para abrir modal
                if (page === 'nuevo') {
                    this.$store.commit('SHOW_MODAL_ACTIVO', { modo: 'nuevo' });
                } else if (page === 'importar') {
                    this.$store.commit('SHOW_MODAL_IMPORTAR');
                }
            } else {
                // Navegar a la página
                this.currentPage = page;
                this.updateMenuActiveState();
            }
        },
        
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
                        active: this.currentPage === 'dashboard'
                    },
                    {
                        id: 'inventario',
                        label: 'Inventario de Activos',
                        icon: 'bi-server',
                        active: this.currentPage === 'inventario'
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
                        icon: 'bi-file-earmark-bar-graph'
                    },
                    {
                        id: 'auditoria',
                        label: 'Auditoría',
                        icon: 'bi-shield-check'
                    }
                ]
            });
        },
        
        updateMenuActiveState() {
            const eventBus = window.gozainApp?.eventBus;
            if (!eventBus) return;
            
            // Actualizar estado activo del menú
            eventBus.emit('shell:updateMenuActiveState', {
                appId: 'inventario',
                activeItem: this.currentPage
            });
        }
    },
    
    render() {
        const { h, resolveComponent } = window.Vue;
        
        console.log('InventarioRouter render:', {
            currentPage: this.currentPage,
            currentComponent: this.currentComponent,
            storeState: this.$store?.state
        });
        
        // En Vue 3, usar resolveComponent para componentes globales
        const componentName = this.currentComponent;
        const component = resolveComponent(componentName);
        
        if (!component || typeof component === 'string') {
            console.error(`Component ${componentName} not found!`);
            return h('div', { class: 'alert alert-danger m-4' }, 
                `Error: Component ${componentName} not found`
            );
        }
        
        return h('div', { class: 'inventario-module' }, [
            // Componente de la página actual
            h(component),
            
            // Modales globales
            this.$store.state.modalActivo.show && h(resolveComponent('ModalActivo')),
            this.$store.state.modalImportar.show && h(resolveComponent('ModalImportar'))
        ]);
    }
};