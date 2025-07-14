/**
 * Componente Dashboard del módulo Inventario
 */
export const DashboardView = {
    name: 'DashboardView',
    
    template: `
        <div class="inventario-dashboard-view p-4">
            <h2 class="mb-4">Dashboard de Inventario</h2>
            
            <!-- Tarjetas de Estadísticas -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">Total Activos</h5>
                            <p class="card-text display-6">{{ estadisticas.total }}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Activos Activos</h5>
                            <p class="card-text display-6">{{ activosActivos }}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h5 class="card-title">En Mantenimiento</h5>
                            <p class="card-text display-6">{{ activosMantenimiento }}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h5 class="card-title">Críticos</h5>
                            <p class="card-text display-6">{{ activosCriticos }}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Gráficos -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Distribución por Tipo</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="chartTipo" height="300"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Activos por Departamento</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="chartDepartamento" height="300"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Acciones Rápidas -->
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Acciones Rápidas</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3 mb-3">
                                    <button @click="nuevoActivo" class="btn btn-primary w-100" id="btnNuevoActivoDashboard">
                                        <i class="bi bi-plus-circle me-2"></i>
                                        Nuevo Activo
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button @click="verInventario" class="btn btn-outline-primary w-100" id="btnVerInventario">
                                        <i class="bi bi-list-ul me-2"></i>
                                        Ver Inventario
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button @click="importar" class="btn btn-outline-primary w-100" id="btnImportarDashboard">
                                        <i class="bi bi-upload me-2"></i>
                                        Importar
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button @click="reportes" class="btn btn-outline-primary w-100" id="btnReportesDashboard">
                                        <i class="bi bi-file-earmark-bar-graph me-2"></i>
                                        Reportes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            charts: {
                tipo: null,
                departamento: null
            }
        };
    },
    
    computed: {
        ...Vuex.mapState({
            estadisticas: state => state.estadisticas
        }),
        
        activosActivos() {
            return this.estadisticas.por_estado?.['Activo'] || 0;
        },
        
        activosMantenimiento() {
            return this.estadisticas.por_estado?.['En mantenimiento'] || 0;
        },
        
        activosCriticos() {
            return this.estadisticas.por_criticidad?.['Crítica'] || 0;
        }
    },
    
    methods: {
        ...Vuex.mapActions(['cambiarVista']),
        ...Vuex.mapMutations(['SHOW_MODAL_ACTIVO', 'SHOW_MODAL_IMPORTAR']),
        
        nuevoActivo() {
            this.SHOW_MODAL_ACTIVO({ modo: 'nuevo' });
        },
        
        verInventario() {
            this.cambiarVista('inventario');
        },
        
        importar() {
            this.SHOW_MODAL_IMPORTAR();
        },
        
        reportes() {
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('shell:showToast', {
                    message: 'Reportes en desarrollo',
                    type: 'info'
                });
            }
        },
        
        async loadChartJS() {
            if (window.Chart) return;
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },
        
        async renderCharts() {
            await this.loadChartJS();
            
            this.renderChartTipo();
            this.renderChartDepartamento();
        },
        
        renderChartTipo() {
            const ctx = this.$refs.chartTipo?.getContext('2d');
            if (!ctx) return;
            
            // Destruir chart anterior si existe
            if (this.charts.tipo) {
                this.charts.tipo.destroy();
            }
            
            const data = this.estadisticas.por_tipo || {};
            
            this.charts.tipo = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        data: Object.values(data),
                        backgroundColor: [
                            '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
        renderChartDepartamento() {
            const ctx = this.$refs.chartDepartamento?.getContext('2d');
            if (!ctx) return;
            
            // Destruir chart anterior si existe
            if (this.charts.departamento) {
                this.charts.departamento.destroy();
            }
            
            const data = this.estadisticas.por_departamento || {};
            
            this.charts.departamento = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        label: 'Activos por Departamento',
                        data: Object.values(data),
                        backgroundColor: '#0d6efd'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    },
    
    watch: {
        estadisticas: {
            deep: true,
            handler() {
                this.$nextTick(() => {
                    this.renderCharts();
                });
            }
        }
    },
    
    mounted() {
        this.renderCharts();
    },
    
    beforeUnmount() {
        // Limpiar charts
        if (this.charts.tipo) this.charts.tipo.destroy();
        if (this.charts.departamento) this.charts.departamento.destroy();
    }
};