/**
 * Componente principal del módulo Inventario en Vue
 */
import { inventarioStore } from './store/index.js';
import { DashboardView } from './components/DashboardView.js';
import { InventarioListView } from './components/InventarioListView.js';
import { ModalActivo } from './components/ModalActivo.js';
import { ModalImportar } from './components/ModalImportar.js';

export const InventarioApp = {
    name: 'InventarioApp',
    
    components: {
        DashboardView,
        InventarioListView,
        ModalActivo,
        ModalImportar
    },
    
    template: `
        <div class="inventario-app">
            <!-- Vista actual -->
            <component 
                :is="currentViewComponent" 
                v-bind="viewProps"
            />
            
            <!-- Modales -->
            <modal-activo 
                v-if="modalActivo.show"
                :modo="modalActivo.modo"
                :activo="modalActivo.activo"
                @close="hideModalActivo"
                @save="guardarActivo"
            />
            
            <modal-importar
                v-if="modalImportar.show"
                @close="hideModalImportar"
                @import="procesarImportacion"
            />
            
            <!-- Loading overlay -->
            <div v-if="loading" class="loading-overlay">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        </div>
    `,
    
    computed: {
        ...Vuex.mapState({
            currentView: state => state.currentView,
            loading: state => state.loading,
            error: state => state.error,
            modalActivo: state => state.modalActivo,
            modalImportar: state => state.modalImportar
        }),
        
        currentViewComponent() {
            return this.currentView === 'dashboard' ? 'DashboardView' : 'InventarioListView';
        },
        
        viewProps() {
            // Props específicas para cada vista si necesario
            return {};
        }
    },
    
    methods: {
        ...Vuex.mapActions([
            'cargarActivos',
            'cargarEstadisticas',
            'crearActivo',
            'actualizarActivo',
            'cambiarVista'
        ]),
        
        ...Vuex.mapMutations([
            'HIDE_MODAL_ACTIVO',
            'HIDE_MODAL_IMPORTAR'
        ]),
        
        hideModalActivo() {
            this.HIDE_MODAL_ACTIVO();
        },
        
        hideModalImportar() {
            this.HIDE_MODAL_IMPORTAR();
        },
        
        async guardarActivo(activo) {
            try {
                if (this.modalActivo.modo === 'editar' && this.modalActivo.activo) {
                    await this.actualizarActivo({
                        id: this.modalActivo.activo.id,
                        activo
                    });
                } else {
                    await this.crearActivo(activo);
                }
                this.HIDE_MODAL_ACTIVO();
            } catch (error) {
                console.error('Error guardando activo:', error);
            }
        },
        
        async procesarImportacion(archivo) {
            // TODO: Implementar importación
            console.log('Procesando importación:', archivo);
            this.HIDE_MODAL_IMPORTAR();
        },
        
        // Métodos del menú
        handleMenuAction(action) {
            const eventBus = this.$root.eventBus;
            
            switch(action) {
                case 'dashboard':
                    this.cambiarVista('dashboard');
                    break;
                case 'inventario':
                    this.cambiarVista('inventario');
                    break;
                case 'nuevo':
                    this.$store.commit('SHOW_MODAL_ACTIVO', { modo: 'nuevo' });
                    break;
                case 'importar':
                    this.$store.commit('SHOW_MODAL_IMPORTAR');
                    break;
                case 'exportar':
                    // TODO: Implementar exportación
                    eventBus.emit('shell:showToast', { 
                        message: 'Exportación en desarrollo', 
                        type: 'info' 
                    });
                    break;
                case 'reportes':
                    eventBus.emit('shell:showToast', { 
                        message: 'Reportes en desarrollo', 
                        type: 'info' 
                    });
                    break;
                case 'auditoria':
                    eventBus.emit('shell:showToast', { 
                        message: 'Auditoría en desarrollo', 
                        type: 'info' 
                    });
                    break;
            }
        }
    },
    
    mounted() {
        // Configurar menú lateral
        this.setupMenu();
        
        // Cargar datos iniciales según la vista
        if (this.currentView === 'dashboard') {
            this.cargarEstadisticas();
        } else {
            this.cargarActivos();
        }
        
        // Escuchar eventos del menú
        const eventBus = this.$root.eventBus;
        eventBus.on('inventario:menuAction', this.handleMenuAction);
    },
    
    beforeUnmount() {
        // Limpiar event listeners
        const eventBus = this.$root.eventBus;
        eventBus.off('inventario:menuAction', this.handleMenuAction);
    },
    
    methods: {
        setupMenu() {
            const eventBus = this.$root.eventBus;
            
            // Emitir estructura del menú
            eventBus.emit('shell:setAppMenu', {
                appId: 'inventario',
                menu: [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'bi-speedometer2',
                        active: this.currentView === 'dashboard'
                    },
                    {
                        id: 'inventario',
                        label: 'Inventario de Activos',
                        icon: 'bi-server',
                        active: this.currentView === 'inventario'
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
        }
    }
};

// CSS para el loading overlay
const style = document.createElement('style');
style.textContent = `
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}
`;
document.head.appendChild(style);