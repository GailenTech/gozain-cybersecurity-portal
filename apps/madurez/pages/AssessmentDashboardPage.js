/**
 * Dashboard de Assessment Individual con gráficos
 */
export default {
    name: 'AssessmentDashboardPage',
    
    inject: ['api'],
    
    data() {
        return {
            loading: true,
            error: null,
            dashboardView: null
        };
    },
    
    computed: {
        assessmentId() {
            return this.$route.params.id;
        }
    },
    
    mounted() {
        this.loadDashboard();
    },
    
    watch: {
        assessmentId(newId, oldId) {
            if (newId && newId !== oldId) {
                // Limpiar vista anterior
                this.cleanupDashboard();
                this.loadDashboard();
            }
        }
    },
    
    methods: {
        async loadDashboard() {
            this.loading = true;
            this.error = null;
            
            try {
                // Importar la vista del dashboard
                const { default: AssessmentDashboard } = await import('../views/dashboard-view.js');
                
                // Esperar a que el DOM esté listo
                await this.$nextTick();
                
                const container = this.$refs.dashboardContainer;
                if (!container) {
                    this.error = 'Error al inicializar el dashboard';
                    this.loading = false;
                    return;
                }
                
                // Crear nueva instancia del dashboard view
                this.dashboardView = new AssessmentDashboard(container, this.api);
                
                // Renderizar con el ID del assessment
                await this.dashboardView.render(this.assessmentId);
                
                this.loading = false;
                
            } catch (err) {
                console.error('Error cargando dashboard:', err);
                this.error = err.message || 'Error al cargar el dashboard';
                this.loading = false;
            }
        },
        
        cleanupDashboard() {
            // Limpiar gráficos de Chart.js si existen
            if (this.dashboardView && this.dashboardView.charts) {
                Object.values(this.dashboardView.charts).forEach(chart => {
                    if (chart && typeof chart.destroy === 'function') {
                        chart.destroy();
                    }
                });
            }
            
            // Limpiar contenedor
            if (this.$refs.dashboardContainer) {
                this.$refs.dashboardContainer.innerHTML = '';
            }
        }
    },
    
    beforeUnmount() {
        this.cleanupDashboard();
    },
    
    template: `
        <div class="assessment-dashboard-page">
            <!-- Loading -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando dashboard del assessment...</p>
            </div>
            
            <!-- Error -->
            <div v-else-if="error" class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> {{ error }}
                <div class="mt-3">
                    <button class="btn btn-primary" @click="loadDashboard">
                        <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                    </button>
                    <button class="btn btn-secondary ms-2" @click="$router.push('/evaluaciones')">
                        <i class="bi bi-arrow-left me-1"></i> Volver a evaluaciones
                    </button>
                </div>
            </div>
            
            <!-- Dashboard Container -->
            <div v-show="!loading && !error" ref="dashboardContainer" class="dashboard-container"></div>
        </div>
    `
};