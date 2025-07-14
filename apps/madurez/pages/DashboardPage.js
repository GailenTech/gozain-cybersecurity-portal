/**
 * Dashboard de Madurez en Ciberseguridad
 */
export const DashboardPage = {
    name: 'MadurezDashboardPage',
    
    data() {
        return {
            loading: false,
            estadisticas: {
                total: 0,
                completadas: 0,
                progreso: 0,
                puntuacion: null,
                ultimaEvaluacion: null,
                tendencia: []
            },
            evaluacionesRecientes: [],
            metricas: {
                dominios: [],
                progresoAnual: [],
                comparativas: []
            }
        };
    },
    
    computed: {
        tieneEvaluaciones() {
            return this.evaluacionesRecientes && this.evaluacionesRecientes.length > 0;
        },
        
        puntuacionPromedio() {
            if (!this.estadisticas.puntuacion) return null;
            return Number(this.estadisticas.puntuacion).toFixed(1);
        },
        
        nivelMadurez() {
            const puntuacion = this.estadisticas.puntuacion;
            if (!puntuacion) return { nivel: 'Sin evaluar', color: 'secondary' };
            
            if (puntuacion >= 3.5) return { nivel: 'Optimizado', color: 'success' };
            if (puntuacion >= 2.5) return { nivel: 'Gestionado', color: 'info' };
            if (puntuacion >= 1.5) return { nivel: 'Definido', color: 'warning' };
            return { nivel: 'Inicial', color: 'danger' };
        }
    },
    
    methods: {
        async cargarDashboard() {
            this.loading = true;
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const [stats, evaluaciones] = await Promise.all([
                    api.get('/madurez/estadisticas'),
                    api.get('/madurez/evaluaciones?limit=5')
                ]);
                
                this.estadisticas = stats || this.estadisticas;
                this.evaluacionesRecientes = evaluaciones || [];
                
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                this.mostrarError('Error al cargar el dashboard');
            } finally {
                this.loading = false;
            }
        },
        
        nuevaEvaluacion() {
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('madurez:showModal', { type: 'nueva' });
            }
        },
        
        verEvaluacion(evaluacion) {
            this.$router.push(`/cuestionario/${evaluacion.id}`);
        },
        
        getEstadoClass(estado) {
            const clases = {
                'completada': 'success',
                'en_progreso': 'warning',
                'pendiente': 'secondary'
            };
            return clases[estado] || 'secondary';
        },
        
        getEstadoLabel(estado) {
            const labels = {
                'completada': 'Completada',
                'en_progreso': 'En Progreso',
                'pendiente': 'Pendiente'
            };
            return labels[estado] || estado;
        },
        
        formatearFecha(fecha) {
            return new Date(fecha).toLocaleDateString('es-ES');
        },
        
        mostrarError(mensaje) {
            console.error(mensaje);
        }
    },
    
    mounted() {
        this.cargarDashboard();
    },
    
    template: `
        <div class="madurez-dashboard">
            <!-- Resumen de Estado -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card border-primary">
                        <div class="card-body text-center">
                            <h1 class="text-primary mb-0">{{ estadisticas.total }}</h1>
                            <p class="mb-0">Total Evaluaciones</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-success">
                        <div class="card-body text-center">
                            <h1 class="text-success mb-0">{{ estadisticas.completadas }}</h1>
                            <p class="mb-0">Completadas</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-warning">
                        <div class="card-body text-center">
                            <h1 class="text-warning mb-0">{{ estadisticas.progreso }}</h1>
                            <p class="mb-0">En Progreso</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div :class="'card border-' + nivelMadurez.color">
                        <div class="card-body text-center">
                            <h1 :class="'text-' + nivelMadurez.color + ' mb-0'">
                                {{ puntuacionPromedio || '-' }}
                            </h1>
                            <p class="mb-0">{{ nivelMadurez.nivel }}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Evaluaciones Recientes -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Evaluaciones Recientes</h5>
                    <button class="btn btn-sm btn-primary" @click="nuevaEvaluacion">
                        <i class="bi bi-plus-circle"></i> Nueva Evaluación
                    </button>
                </div>
                <div class="card-body">
                    <!-- Loading state -->
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary"></div>
                        <p class="mt-2 mb-0 text-muted">Cargando dashboard...</p>
                    </div>
                    
                    <!-- Empty state -->
                    <div v-else-if="!tieneEvaluaciones" class="text-center py-5">
                        <i class="bi bi-clipboard-check display-4 text-muted"></i>
                        <h5 class="mt-3 text-muted">No hay evaluaciones aún</h5>
                        <p class="text-muted">
                            Comienza con tu primera evaluación de madurez en ciberseguridad.
                        </p>
                        <button class="btn btn-primary" @click="nuevaEvaluacion">
                            <i class="bi bi-plus-circle"></i> Crear Primera Evaluación
                        </button>
                    </div>
                    
                    <!-- Lista de evaluaciones -->
                    <div v-else class="list-group">
                        <div v-for="evaluacion in evaluacionesRecientes" :key="evaluacion.id"
                             class="list-group-item list-group-item-action"
                             @click="verEvaluacion(evaluacion)"
                             style="cursor: pointer;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">{{ evaluacion.template_name }}</h6>
                                    <small class="text-muted">
                                        <i class="bi bi-calendar"></i>
                                        {{ formatearFecha(evaluacion.fecha_creacion) }}
                                    </small>
                                </div>
                                <div class="text-end">
                                    <span :class="'badge bg-' + getEstadoClass(evaluacion.estado)">
                                        {{ getEstadoLabel(evaluacion.estado) }}
                                    </span>
                                    <div v-if="evaluacion.puntuacion_total" class="mt-1">
                                        <strong>{{ evaluacion.puntuacion_total.toFixed(1) }}</strong>
                                        <small class="text-muted">/ 4.0</small>
                                    </div>
                                </div>
                            </div>
                            <div v-if="evaluacion.progreso" class="progress mt-2" style="height: 5px;">
                                <div class="progress-bar" role="progressbar"
                                     :style="{ width: evaluacion.progreso + '%' }">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};