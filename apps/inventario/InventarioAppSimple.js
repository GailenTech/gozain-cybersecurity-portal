/**
 * Versión simplificada del componente principal para debug
 */
export const InventarioAppSimple = {
    name: 'InventarioAppSimple',
    
    template: `
        <div class="inventario-app p-4">
            <h2>Inventario Vue - Debug</h2>
            <p>Organización: {{ organizationId }}</p>
            <p>Vista actual: {{ currentView }}</p>
            <button @click="test" class="btn btn-primary">Test</button>
            
            <div v-if="currentView === 'dashboard'" class="inventario-dashboard-view mt-4">
                <h3>Dashboard</h3>
                <button @click="cambiarVista('inventario')" class="btn btn-secondary">Ver Lista</button>
            </div>
            
            <div v-else class="inventario-list-view mt-4">
                <h3>Lista de Inventario</h3>
                <button @click="cambiarVista('dashboard')" class="btn btn-secondary">Ver Dashboard</button>
            </div>
        </div>
    `,
    
    data() {
        return {
            organizationId: null,
            currentView: 'dashboard'
        };
    },
    
    mounted() {
        console.log('InventarioAppSimple mounted!');
        this.organizationId = this.$store?.state?.organizationId || 'No org';
    },
    
    methods: {
        test() {
            console.log('Test button clicked!');
            alert('Vue está funcionando!');
        },
        
        cambiarVista(vista) {
            this.currentView = vista;
        }
    }
};