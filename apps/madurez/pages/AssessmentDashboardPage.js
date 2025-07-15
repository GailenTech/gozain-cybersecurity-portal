/**
 * Dashboard de Assessment Individual - Versión corregida
 */
export default {
    name: 'AssessmentDashboardPage',
    
    inject: ['api'],
    
    data() {
        return {
            loading: true,
            error: null,
            dashboardData: null
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
                this.loadDashboard();
            }
        }
    },
    
    methods: {
        async loadDashboard() {
            this.loading = true;
            this.error = null;
            this.dashboardData = null;
            
            try {
                // Cargar datos del dashboard directamente
                const data = await this.api.get(`/madurez/dashboard/${this.assessmentId}`);
                
                if (!data) {
                    throw new Error('No se encontraron datos del assessment');
                }
                
                this.dashboardData = data;
                
            } catch (err) {
                console.error('Error cargando dashboard:', err);
                this.error = err.message || 'Error al cargar el dashboard';
            } finally {
                this.loading = false;
            }
        },
        
        formatearFecha(fecha) {
            if (!fecha) return 'Sin fecha';
            try {
                return new Date(fecha).toLocaleDateString('es-ES');
            } catch (e) {
                return 'Fecha inválida';
            }
        },
        
        getNivelClass(nivel) {
            if (nivel >= 3.5) return 'success';
            if (nivel >= 2.5) return 'info';
            if (nivel >= 1.5) return 'warning';
            return 'danger';
        },
        
        getNivelTexto(nivel) {
            if (nivel >= 3.5) return 'Optimizado';
            if (nivel >= 2.5) return 'Gestionado';
            if (nivel >= 1.5) return 'Definido';
            return 'Inicial';
        }
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
            
            <!-- Dashboard Content -->
            <div v-else-if="dashboardData" class="dashboard-content">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 class="mb-0">
                            <i class="bi bi-bar-chart text-primary"></i>
                            Dashboard - {{ dashboardData.assessment.nombre }}
                        </h4>
                        <p class="text-muted mb-0">
                            {{ dashboardData.assessment.descripcion || 'Sin descripción' }}
                        </p>
                    </div>
                    <div>
                        <button class="btn btn-outline-primary" @click="$router.push('/evaluaciones')">
                            <i class="bi bi-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
                
                <!-- Métricas Principales -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h2 :class="'text-' + getNivelClass(dashboardData.metricas.puntuacion_total)">
                                    {{ dashboardData.metricas.puntuacion_total.toFixed(2) }}
                                </h2>
                                <p class="mb-0">Puntuación Total</p>
                                <small :class="'text-' + getNivelClass(dashboardData.metricas.puntuacion_total)">
                                    {{ getNivelTexto(dashboardData.metricas.puntuacion_total) }}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h2 class="text-primary">{{ dashboardData.metricas.dominios_evaluados }}</h2>
                                <p class="mb-0">Dominios Evaluados</p>
                                <small class="text-muted">de 7 totales</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h2 class="text-info">{{ dashboardData.metricas.porcentaje_completado }}%</h2>
                                <p class="mb-0">Completado</p>
                                <small class="text-muted">{{ dashboardData.metricas.total_preguntas }} preguntas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h2 class="text-warning">{{ dashboardData.metricas.dominio_mas_debil }}</h2>
                                <p class="mb-0">Dominio Más Débil</p>
                                <small class="text-muted">{{ dashboardData.metricas.puntuacion_mas_baja.toFixed(2) }}/4.0</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Estado y Fechas -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="text-muted">Estado</label>
                                <p class="mb-0">
                                    <span :class="'badge bg-' + (dashboardData.assessment.estado === 'firmado' ? 'primary' : 'success')">
                                        {{ dashboardData.assessment.estado }}
                                    </span>
                                </p>
                            </div>
                            <div class="col-md-3">
                                <label class="text-muted">Fecha Inicio</label>
                                <p class="mb-0">{{ formatearFecha(dashboardData.assessment.fecha_inicio) }}</p>
                            </div>
                            <div class="col-md-3">
                                <label class="text-muted">Fecha Completado</label>
                                <p class="mb-0">{{ formatearFecha(dashboardData.assessment.fecha_completado) }}</p>
                            </div>
                            <div class="col-md-3" v-if="dashboardData.assessment.firmado_por">
                                <label class="text-muted">Firmado por</label>
                                <p class="mb-0">{{ dashboardData.assessment.firmado_por }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Resultados por Dominio -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Resultados por Dominio</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Dominio</th>
                                        <th>Puntuación</th>
                                        <th>Nivel</th>
                                        <th>Respuestas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="dominio in dashboardData.assessment.resultados.dominios" 
                                        :key="dominio.dominio_id">
                                        <td>{{ dominio.dominio_id }}</td>
                                        <td>
                                            <strong :class="'text-' + getNivelClass(dominio.nivel_actual)">
                                                {{ dominio.nivel_actual.toFixed(2) }}
                                            </strong>
                                            / 4.0
                                        </td>
                                        <td>
                                            <span :class="'badge bg-' + getNivelClass(dominio.nivel_actual)">
                                                {{ getNivelTexto(dominio.nivel_actual) }}
                                            </span>
                                        </td>
                                        <td>{{ dominio.respuestas.length }} respuestas</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-info mt-4">
                    <i class="bi bi-info-circle"></i>
                    <strong>Nota:</strong> Las visualizaciones con gráficos (radar, gaps, roadmap) 
                    se mostrarán cuando Chart.js esté completamente integrado.
                </div>
            </div>
        </div>
    `
};