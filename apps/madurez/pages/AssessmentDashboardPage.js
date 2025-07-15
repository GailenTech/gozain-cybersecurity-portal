/**
 * Dashboard de Assessment Individual
 */
export default {
    name: 'AssessmentDashboardPage',
    
    setup() {
        const { ref, inject, onMounted, watch } = Vue;
        const { useRoute } = VueRouter;
        
        const api = inject('api');
        const route = useRoute();
        
        const loading = ref(true);
        const dashboardView = ref(null);
        const error = ref(null);
        
        // Contenedor para el dashboard view
        const dashboardContainer = ref(null);
        
        const loadDashboard = async () => {
            loading.value = true;
            error.value = null;
            
            try {
                // Importar la vista del dashboard
                const { default: AssessmentDashboard } = await import('../views/dashboard-view.js');
                
                // Crear instancia
                dashboardView.value = new AssessmentDashboard(
                    dashboardContainer.value,
                    api
                );
                
                // Renderizar con el ID del assessment
                await dashboardView.value.render(route.params.id);
                
            } catch (err) {
                console.error('Error cargando dashboard:', err);
                error.value = err.message || 'Error al cargar el dashboard';
            } finally {
                loading.value = false;
            }
        };
        
        // Cargar cuando cambie el ID
        watch(() => route.params.id, () => {
            if (route.params.id) {
                loadDashboard();
            }
        });
        
        onMounted(() => {
            if (route.params.id) {
                loadDashboard();
            }
        });
        
        return {
            loading,
            error,
            dashboardContainer
        };
    },
    
    template: `
        <div class="assessment-dashboard-page">
            <!-- Loading -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando dashboard...</p>
            </div>
            
            <!-- Error -->
            <div v-else-if="error" class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Error:</strong> {{ error }}
            </div>
            
            <!-- Dashboard Container -->
            <div v-else ref="dashboardContainer" class="dashboard-container"></div>
        </div>
    `
};