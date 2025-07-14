// Dashboard de Madurez en Ciberseguridad
import { ref, inject, onMounted, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const organization = inject('organization');
        const loading = ref(false);
        
        // Estado del dashboard
        const estadisticas = ref({
            total: 0,
            completadas: 0,
            progreso: 0,
            puntuacion: null,
            ultimaEvaluacion: null,
            tendencia: []
        });

        const evaluacionesRecientes = ref([]);
        const metricas = ref({
            dominios: [],
            progresoAnual: [],
            comparativas: []
        });

        // Computadas
        const tieneEvaluaciones = computed(() => {
            return evaluacionesRecientes.value && evaluacionesRecientes.value.length > 0;
        });

        const puntuacionPromedio = computed(() => {
            if (!estadisticas.value.puntuacion) return null;
            return Number(estadisticas.value.puntuacion).toFixed(1);
        });

        const nivelMadurez = computed(() => {
            const puntuacion = estadisticas.value.puntuacion;
            if (!puntuacion) return { nivel: 'Sin evaluar', color: 'secondary' };
            
            if (puntuacion >= 3.5) return { nivel: 'Optimizado', color: 'success' };
            if (puntuacion >= 2.5) return { nivel: 'Gestionado', color: 'info' };
            if (puntuacion >= 1.5) return { nivel: 'Definido', color: 'warning' };
            return { nivel: 'Inicial', color: 'danger' };
        });

        // Métodos
        const cargarDashboard = async () => {
            loading.value = true;
            try {
                const [stats, recientes, metricas_data] = await Promise.all([
                    api.get('/madurez/estadisticas'),
                    api.get('/madurez/assessments/recientes?limit=5'),
                    api.get('/madurez/metricas')
                ]);

                estadisticas.value = stats;
                evaluacionesRecientes.value = recientes;
                metricas.value = metricas_data;
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                mostrarError('Error al cargar el dashboard');
            } finally {
                loading.value = false;
            }
        };

        const crearNuevaEvaluacion = () => {
            const eventBus = inject('eventBus');
            eventBus.emit('madurez:showModal', { type: 'nueva' });
        };

        const continuarEvaluacion = (assessment) => {
            const router = inject('$router');
            if (router) {
                router.push(`/cuestionario/${assessment.id}`);
            }
        };

        const verResultados = (assessment) => {
            const eventBus = inject('eventBus');
            eventBus.emit('madurez:showModal', { type: 'resultados', assessment });
        };

        const verHistorial = () => {
            const router = inject('$router');
            if (router) {
                router.push('/historial');
            }
        };

        // Utilidades
        const getEstadoClass = (estado) => {
            const clases = {
                'abierto': 'bg-warning',
                'completado': 'bg-success',
                'firmado': 'bg-primary'
            };
            return clases[estado] || 'bg-secondary';
        };

        const getEstadoText = (estado) => {
            const textos = {
                'abierto': 'En Progreso',
                'completado': 'Completado',
                'firmado': 'Firmado'
            };
            return textos[estado] || estado;
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearFechaHora = (fecha) => {
            return new Date(fecha).toLocaleString('es-ES');
        };

        const mostrarError = (mensaje) => {
            console.error(mensaje);
            // TODO: Implementar toast de error
        };

        // Lifecycle
        onMounted(() => {
            cargarDashboard();
        });

        return {
            loading,
            estadisticas,
            evaluacionesRecientes,
            metricas,
            tieneEvaluaciones,
            puntuacionPromedio,
            nivelMadurez,
            cargarDashboard,
            crearNuevaEvaluacion,
            continuarEvaluacion,
            verResultados,
            verHistorial,
            getEstadoClass,
            getEstadoText,
            formatearFecha,
            formatearFechaHora
        };
    },

    template: `
        <div class="dashboard-madurez">
            <!-- Indicadores principales -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card border-primary cursor-pointer" @click="crearNuevaEvaluacion">
                        <div class="card-body text-center">
                            <h1 class="text-primary mb-0">
                                <i class="bi bi-plus-circle"></i>
                            </h1>
                            <p class="mb-0">Nueva Evaluación</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-info">
                        <div class="card-body text-center">
                            <h1 class="text-info mb-0">{{ puntuacionPromedio || '-' }}</h1>
                            <p class="mb-0">Puntuación Actual</p>
                            <small class="text-muted">(sobre 4.0)</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card" :class="'border-' + nivelMadurez.color">
                        <div class="card-body text-center">
                            <h4 :class="'text-' + nivelMadurez.color + ' mb-0'">{{ nivelMadurez.nivel }}</h4>
                            <p class="mb-0">Nivel de Madurez</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-success cursor-pointer" @click="verHistorial">
                        <div class="card-body text-center">
                            <h1 class="text-success mb-0">{{ estadisticas.completadas }}</h1>
                            <p class="mb-0">Evaluaciones Completadas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Evaluaciones Recientes -->
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Evaluaciones Recientes</h5>
                            <button class="btn btn-sm btn-outline-primary" @click="cargarDashboard" :disabled="loading">
                                <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                            </button>
                        </div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            <div v-if="loading" class="text-center py-4">
                                <div class="spinner-border spinner-border-sm text-primary"></div>
                                <p class="mt-2 mb-0 text-muted">Cargando...</p>
                            </div>
                            
                            <div v-else-if="!tieneEvaluaciones" class="text-center py-4 text-muted">
                                <i class="bi bi-clipboard-x display-4"></i>
                                <p class="mt-2 mb-0">No hay evaluaciones recientes</p>
                                <button class="btn btn-primary mt-2" @click="crearNuevaEvaluacion">
                                    Crear primera evaluación
                                </button>
                            </div>
                            
                            <div v-else>
                                <div 
                                    v-for="evaluacion in evaluacionesRecientes" 
                                    :key="evaluacion.id" 
                                    class="border-bottom pb-2 mb-2"
                                >
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="flex-grow-1">
                                            <h6 class="mb-1">{{ evaluacion.nombre }}</h6>
                                            <small class="text-muted">
                                                Creado: {{ formatearFecha(evaluacion.fecha_inicio) }}
                                            </small>
                                            <div v-if="evaluacion.descripcion" class="small text-muted mt-1">
                                                {{ evaluacion.descripcion }}
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <span class="badge" :class="getEstadoClass(evaluacion.estado)">
                                                {{ getEstadoText(evaluacion.estado) }}
                                            </span>
                                            <div class="mt-1">
                                                <button 
                                                    v-if="evaluacion.estado === 'abierto'"
                                                    class="btn btn-sm btn-outline-primary"
                                                    @click="continuarEvaluacion(evaluacion)"
                                                    title="Continuar evaluación"
                                                >
                                                    <i class="bi bi-play-fill"></i>
                                                </button>
                                                <button 
                                                    v-if="evaluacion.estado === 'completado' || evaluacion.estado === 'firmado'"
                                                    class="btn btn-sm btn-outline-success"
                                                    @click="verResultados(evaluacion)"
                                                    title="Ver resultados"
                                                >
                                                    <i class="bi bi-bar-chart"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Métricas y Progreso -->
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Evolución de Madurez</h5>
                        </div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            <div v-if="loading" class="text-center py-4">
                                <div class="spinner-border spinner-border-sm text-primary"></div>
                                <p class="mt-2 mb-0 text-muted">Cargando métricas...</p>
                            </div>
                            
                            <div v-else-if="!estadisticas.ultimaEvaluacion" class="text-center py-4 text-muted">
                                <i class="bi bi-graph-up display-4"></i>
                                <p class="mt-2 mb-0">No hay datos de evolución</p>
                                <small>Complete al menos una evaluación para ver métricas</small>
                            </div>
                            
                            <div v-else>
                                <!-- Última evaluación -->
                                <div class="mb-4">
                                    <h6>Última Evaluación</h6>
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-6">
                                                    <strong>{{ estadisticas.ultimaEvaluacion.nombre }}</strong>
                                                    <br>
                                                    <small class="text-muted">
                                                        {{ formatearFecha(estadisticas.ultimaEvaluacion.fecha_completado) }}
                                                    </small>
                                                </div>
                                                <div class="col-6 text-end">
                                                    <h4 class="text-primary mb-0">
                                                        {{ Number(estadisticas.ultimaEvaluacion.puntuacion_total).toFixed(1) }}
                                                    </h4>
                                                    <small class="text-muted">/ 4.0</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Dominios de la última evaluación -->
                                <div v-if="metricas.dominios && metricas.dominios.length > 0">
                                    <h6>Puntuación por Dominio</h6>
                                    <div v-for="dominio in metricas.dominios" :key="dominio.nombre" class="mb-2">
                                        <div class="d-flex justify-content-between">
                                            <small>{{ dominio.nombre }}</small>
                                            <small><strong>{{ Number(dominio.puntuacion).toFixed(1) }}</strong></small>
                                        </div>
                                        <div class="progress" style="height: 8px;">
                                            <div 
                                                class="progress-bar"
                                                :style="{ width: (dominio.puntuacion / 4) * 100 + '%' }"
                                                :class="{
                                                    'bg-danger': dominio.puntuacion < 1.5,
                                                    'bg-warning': dominio.puntuacion >= 1.5 && dominio.puntuacion < 2.5,
                                                    'bg-info': dominio.puntuacion >= 2.5 && dominio.puntuacion < 3.5,
                                                    'bg-success': dominio.puntuacion >= 3.5
                                                }"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Objetivos y Recomendaciones -->
            <div class="row mt-4" v-if="estadisticas.ultimaEvaluacion">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Objetivos de Mejora</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <h6 class="text-info">Objetivo 6 meses</h6>
                                        <h3 class="text-info">{{ estadisticas.ultimaEvaluacion.objetivo_6meses || 'N/A' }}</h3>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <h6 class="text-warning">Objetivo 1 año</h6>
                                        <h3 class="text-warning">{{ estadisticas.ultimaEvaluacion.objetivo_1año || 'N/A' }}</h3>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <h6 class="text-success">Objetivo 2 años</h6>
                                        <h3 class="text-success">{{ estadisticas.ultimaEvaluacion.objetivo_2años || 'N/A' }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};