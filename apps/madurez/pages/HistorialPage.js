// Página de Historial de Evaluaciones de Madurez
export default {
    name: 'HistorialPage',
    
    setup() {
        const { ref, inject, onMounted, computed } = Vue;
        const api = inject('api');
        const eventBus = inject('eventBus');
        const organization = inject('organization');
        
        // Estado de la página
        const loading = ref(false);
        const historial = ref([]);
        const comparativa = ref(null);
        
        // Computadas
        const tieneHistorial = computed(() => {
            return historial.value && historial.value.length > 0;
        });

        const evaluacionesPorAño = computed(() => {
            if (!historial.value) return {};
            
            return historial.value.reduce((acc, evaluacion) => {
                const año = new Date(evaluacion.fecha_completado).getFullYear();
                if (!acc[año]) acc[año] = [];
                acc[año].push(evaluacion);
                return acc;
            }, {});
        });

        const añosDisponibles = computed(() => {
            return Object.keys(evaluacionesPorAño.value).sort((a, b) => b - a);
        });

        const tendenciaGeneral = computed(() => {
            if (!historial.value || historial.value.length < 2) return null;
            
            const evaluaciones = [...historial.value].sort((a, b) => 
                new Date(a.fecha_completado) - new Date(b.fecha_completado)
            );
            
            const primera = evaluaciones[0];
            const ultima = evaluaciones[evaluaciones.length - 1];
            
            return {
                mejora: ultima.resultados.puntuacion_total - primera.resultados.puntuacion_total,
                porcentaje: ((ultima.resultados.puntuacion_total - primera.resultados.puntuacion_total) / primera.resultados.puntuacion_total) * 100
            };
        });

        // Métodos
        const cargarHistorial = async () => {
            loading.value = true;
            try {
                // Usar el endpoint de history que existe
                const historialData = await api.get('/madurez/history');
                
                if (historialData && historialData.assessments) {
                    historial.value = historialData.assessments || [];
                } else {
                    // Si no viene en el formato esperado, cargar assessments completados
                    const allAssessments = await api.get('/madurez/assessments');
                    historial.value = allAssessments.filter(a => 
                        a.estado === 'completado' || a.estado === 'firmado'
                    );
                }
                
                comparativa.value = null; // Por ahora no tenemos endpoint de comparativa
            } catch (error) {
                console.error('Error cargando historial:', error);
                mostrarError('Error al cargar el historial');
                historial.value = [];
            } finally {
                loading.value = false;
            }
        };

        const verDetalleEvaluacion = (evaluacion) => {
            const { useRouter } = VueRouter;
            const router = useRouter();
            router.push(`/dashboard/${evaluacion.id}`);
        };

        const compararEvaluaciones = (evaluacion1, evaluacion2) => {
            eventBus.emit('madurez:showModal', { 
                type: 'comparativa', 
                evaluaciones: [evaluacion1, evaluacion2] 
            });
        };

        const exportarHistorial = async () => {
            try {
                // Por ahora usar el export general de assessments con filtro
                const params = new URLSearchParams({
                    estado: 'completado,firmado'
                });
                
                const blob = await api.getBlob(`/madurez/assessments/export?${params.toString()}`);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `historial_madurez_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                mostrarExito('Historial exportado correctamente');
            } catch (error) {
                console.error('Error exportando historial:', error);
                mostrarError('Error al exportar el historial');
            }
        };

        // Utilidades
        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearPuntuacion = (puntuacion) => {
            return Number(puntuacion).toFixed(1);
        };

        const getNivelMadurez = (puntuacion) => {
            if (puntuacion >= 3.5) return { nivel: 'Optimizado', color: 'success' };
            if (puntuacion >= 2.5) return { nivel: 'Gestionado', color: 'info' };
            if (puntuacion >= 1.5) return { nivel: 'Definido', color: 'warning' };
            return { nivel: 'Inicial', color: 'danger' };
        };

        const getTendenciaIcon = (mejora) => {
            if (mejora > 0.2) return { icon: 'bi-trending-up', color: 'success' };
            if (mejora < -0.2) return { icon: 'bi-trending-down', color: 'danger' };
            return { icon: 'bi-arrow-right', color: 'secondary' };
        };

        const mostrarError = (mensaje) => {
            console.error(mensaje);
            // TODO: Implementar toast de error
        };

        const mostrarExito = (mensaje) => {
            console.log(mensaje);
            // TODO: Implementar toast de éxito
        };

        // Lifecycle
        onMounted(() => {
            cargarHistorial();
        });

        return {
            loading,
            historial,
            comparativa,
            tieneHistorial,
            evaluacionesPorAño,
            añosDisponibles,
            tendenciaGeneral,
            cargarHistorial,
            verDetalleEvaluacion,
            compararEvaluaciones,
            exportarHistorial,
            formatearFecha,
            formatearPuntuacion,
            getNivelMadurez,
            getTendenciaIcon
        };
    },

    template: `
        <div class="historial-madurez">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">Historial de Evaluaciones</h5>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2" @click="exportarHistorial">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="cargarHistorial" :disabled="loading">
                        <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                        Actualizar
                    </button>
                </div>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2 mb-0 text-muted">Cargando historial...</p>
            </div>

            <!-- Empty state -->
            <div v-else-if="!tieneHistorial" class="text-center py-5">
                <i class="bi bi-clock-history display-4 text-muted"></i>
                <h5 class="mt-3 text-muted">No hay historial disponible</h5>
                <p class="text-muted">
                    Complete al menos una evaluación para ver el historial de madurez.
                </p>
            </div>

            <!-- Historial -->
            <div v-else>
                <!-- Resumen general -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-primary">{{ historial.length }}</h3>
                                <p class="mb-0">Evaluaciones Completadas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 :class="'text-' + getNivelMadurez(historial[0].resultados.puntuacion_total).color">
                                    {{ formatearPuntuacion(historial[0].resultados.puntuacion_total) }}
                                </h3>
                                <p class="mb-0">Puntuación Actual</p>
                                <small class="text-muted">{{ getNivelMadurez(historial[0].resultados.puntuacion_total).nivel }}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4" v-if="tendenciaGeneral">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 :class="'text-' + getTendenciaIcon(tendenciaGeneral.mejora).color">
                                    <i :class="getTendenciaIcon(tendenciaGeneral.mejora).icon"></i>
                                    {{ formatearPuntuacion(Math.abs(tendenciaGeneral.mejora)) }}
                                </h3>
                                <p class="mb-0">Tendencia General</p>
                                <small class="text-muted">
                                    {{ tendenciaGeneral.mejora > 0 ? 'Mejora' : 'Descenso' }} 
                                    ({{ Math.abs(tendenciaGeneral.porcentaje).toFixed(1) }}%)
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Historial por años -->
                <div v-for="año in añosDisponibles" :key="año" class="mb-4">
                    <h6 class="text-muted mb-3">
                        <i class="bi bi-calendar3"></i> Año {{ año }}
                        <span class="badge bg-secondary ms-2">{{ evaluacionesPorAño[año].length }} evaluaciones</span>
                    </h6>
                    
                    <div class="row">
                        <div 
                            v-for="evaluacion in evaluacionesPorAño[año]" 
                            :key="evaluacion.id"
                            class="col-md-6 col-lg-4 mb-3"
                        >
                            <div class="card h-100 hover-shadow cursor-pointer" @click="verDetalleEvaluacion(evaluacion)">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="card-title mb-0">{{ evaluacion.nombre }}</h6>
                                        <span class="badge bg-success">Completado</span>
                                    </div>
                                    
                                    <div class="text-center my-3">
                                        <h2 :class="'text-' + getNivelMadurez(evaluacion.resultados.puntuacion_total).color">
                                            {{ formatearPuntuacion(evaluacion.resultados.puntuacion_total) }}
                                        </h2>
                                        <span :class="'badge bg-' + getNivelMadurez(evaluacion.resultados.puntuacion_total).color">
                                            {{ getNivelMadurez(evaluacion.resultados.puntuacion_total).nivel }}
                                        </span>
                                    </div>
                                    
                                    <div class="text-muted small">
                                        <div><i class="bi bi-calendar"></i> {{ formatearFecha(evaluacion.fecha_completado) }}</div>
                                        <div v-if="evaluacion.firmante">
                                            <i class="bi bi-person-check"></i> Firmado por {{ evaluacion.firmante }}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card-footer bg-transparent">
                                    <div class="btn-group btn-group-sm w-100">
                                        <button class="btn btn-outline-primary" @click.stop="verDetalleEvaluacion(evaluacion)">
                                            <i class="bi bi-eye"></i> Ver Detalles
                                        </button>
                                        <button 
                                            v-if="historial.length > 1"
                                            class="btn btn-outline-secondary"
                                            @click.stop="compararEvaluaciones(evaluacion, historial[0])"
                                            title="Comparar con actual"
                                        >
                                            <i class="bi bi-bar-chart"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Análisis comparativo (si hay datos) -->
                <div v-if="comparativa && comparativa.dominios" class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">Evolución por Dominios</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div v-for="dominio in comparativa.dominios" :key="dominio.nombre" class="col-md-6 mb-3">
                                <h6>{{ dominio.nombre }}</h6>
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Puntuación actual</small>
                                    <small><strong>{{ formatearPuntuacion(dominio.puntuacion_actual) }}</strong></small>
                                </div>
                                <div class="progress mb-2" style="height: 8px;">
                                    <div 
                                        class="progress-bar"
                                        :style="{ width: (dominio.puntuacion_actual / 4) * 100 + '%' }"
                                        :class="{
                                            'bg-danger': dominio.puntuacion_actual < 1.5,
                                            'bg-warning': dominio.puntuacion_actual >= 1.5 && dominio.puntuacion_actual < 2.5,
                                            'bg-info': dominio.puntuacion_actual >= 2.5 && dominio.puntuacion_actual < 3.5,
                                            'bg-success': dominio.puntuacion_actual >= 3.5
                                        }"
                                    ></div>
                                </div>
                                <div v-if="dominio.mejora !== 0" class="small">
                                    <span :class="dominio.mejora > 0 ? 'text-success' : 'text-danger'">
                                        <i :class="dominio.mejora > 0 ? 'bi-arrow-up' : 'bi-arrow-down'"></i>
                                        {{ Math.abs(dominio.mejora).toFixed(1) }} puntos
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};