// Página del Cuestionario de Madurez
import { ref, inject, onMounted, computed, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const route = inject('$route');
        const router = inject('$router');
        
        // Estado del cuestionario
        const loading = ref(false);
        const assessment = ref(null);
        const template = ref(null);
        const dominioActual = ref(0);
        const respuestas = reactive({});
        
        // Computadas
        const progreso = computed(() => {
            if (!template.value) return 0;
            return Math.round(((dominioActual.value + 1) / template.value.dominios.length) * 100);
        });

        const dominioActualData = computed(() => {
            if (!template.value || !template.value.dominios) return null;
            return template.value.dominios[dominioActual.value];
        });

        const esUltimoDominio = computed(() => {
            if (!template.value) return false;
            return dominioActual.value >= template.value.dominios.length - 1;
        });

        const esPrimerDominio = computed(() => {
            return dominioActual.value === 0;
        });

        const dominioCompleto = computed(() => {
            if (!dominioActualData.value) return false;
            return dominioActualData.value.preguntas.every(pregunta => 
                respuestas[pregunta.id] !== undefined
            );
        });

        // Métodos
        const cargarCuestionario = async () => {
            loading.value = true;
            try {
                const assessmentId = route.params.id;
                
                // Cargar assessment y template
                const [assessmentData, templateData] = await Promise.all([
                    api.get(`/madurez/assessments/${assessmentId}`),
                    api.get(`/madurez/templates/default`) // Asumimos template por defecto
                ]);

                assessment.value = assessmentData;
                template.value = templateData;

                // Verificar que esté abierto
                if (assessment.value.estado !== 'abierto') {
                    throw new Error('Esta evaluación ya fue completada');
                }

                // Cargar respuestas existentes si las hay
                if (assessment.value.respuestas) {
                    Object.assign(respuestas, assessment.value.respuestas);
                }

            } catch (error) {
                console.error('Error cargando cuestionario:', error);
                mostrarError(`Error: ${error.message}`);
                // Volver a la lista de evaluaciones
                router.push('/evaluaciones');
            } finally {
                loading.value = false;
            }
        };

        const volverAEvaluaciones = () => {
            router.push('/evaluaciones');
        };

        const siguienteDominio = async () => {
            if (!dominioCompleto.value) {
                mostrarError('Complete todas las preguntas del dominio actual');
                return;
            }

            // Guardar progreso
            await guardarProgreso();

            if (esUltimoDominio.value) {
                // Completar evaluación
                await completarEvaluacion();
            } else {
                dominioActual.value++;
            }
        };

        const dominioAnterior = () => {
            if (!esPrimerDominio.value) {
                dominioActual.value--;
            }
        };

        const irADominio = (indice) => {
            dominioActual.value = indice;
        };

        const guardarProgreso = async () => {
            try {
                await api.put(`/madurez/assessments/${assessment.value.id}/progreso`, {
                    respuestas: respuestas,
                    dominio_actual: dominioActual.value
                });
            } catch (error) {
                console.error('Error guardando progreso:', error);
                mostrarError('Error al guardar el progreso');
            }
        };

        const completarEvaluacion = async () => {
            try {
                loading.value = true;
                
                const resultado = await api.post(`/madurez/assessments/${assessment.value.id}/completar`, {
                    respuestas: respuestas
                });

                mostrarExito('Evaluación completada correctamente');
                
                // Navegar a resultados o lista
                router.push('/evaluaciones');
                
            } catch (error) {
                console.error('Error completando evaluación:', error);
                mostrarError('Error al completar la evaluación');
            } finally {
                loading.value = false;
            }
        };

        const actualizarRespuesta = (preguntaId, valor) => {
            respuestas[preguntaId] = valor;
        };

        // Utilidades
        const getNivelTexto = (nivel) => {
            const niveles = {
                1: 'Inicial',
                2: 'Básico', 
                3: 'Intermedio',
                4: 'Avanzado'
            };
            return niveles[nivel] || nivel;
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
            cargarCuestionario();
        });

        return {
            loading,
            assessment,
            template,
            dominioActual,
            respuestas,
            progreso,
            dominioActualData,
            esUltimoDominio,
            esPrimerDominio,
            dominioCompleto,
            volverAEvaluaciones,
            siguienteDominio,
            dominioAnterior,
            irADominio,
            actualizarRespuesta,
            getNivelTexto
        };
    },

    template: `
        <div class="cuestionario-madurez">
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2 mb-0 text-muted">Cargando cuestionario...</p>
            </div>

            <!-- Cuestionario -->
            <div v-else-if="assessment && template">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 class="mb-0">
                            <i class="bi bi-clipboard-check text-primary"></i>
                            {{ assessment.nombre }}
                        </h4>
                        <small class="text-muted">Evaluación de Madurez en Ciberseguridad</small>
                    </div>
                    <button class="btn btn-outline-secondary" @click="volverAEvaluaciones">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>

                <!-- Progreso -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Dominio {{ dominioActual + 1 }} de {{ template.dominios.length }}</h6>
                            <span class="badge bg-primary">{{ progreso }}%</span>
                        </div>
                        <div class="progress mb-3">
                            <div class="progress-bar" :style="{ width: progreso + '%' }"></div>
                        </div>
                        <div class="row">
                            <div v-for="(dominio, index) in template.dominios" :key="index" class="col-auto">
                                <button
                                    class="btn btn-sm"
                                    :class="{
                                        'btn-primary': index === dominioActual,
                                        'btn-success': index < dominioActual,
                                        'btn-outline-secondary': index > dominioActual
                                    }"
                                    @click="irADominio(index)"
                                    :title="dominio.nombre"
                                >
                                    {{ index + 1 }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dominio actual -->
                <div v-if="dominioActualData" class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-1">
                            <i class="bi bi-shield-check"></i>
                            {{ dominioActualData.nombre }}
                        </h5>
                        <p class="text-muted mb-0">{{ dominioActualData.descripcion }}</p>
                    </div>
                    <div class="card-body">
                        <!-- Preguntas -->
                        <div v-for="(pregunta, index) in dominioActualData.preguntas" :key="pregunta.id" class="mb-4">
                            <div class="card border-start border-primary border-3">
                                <div class="card-body">
                                    <h6 class="card-title">
                                        Pregunta {{ index + 1 }}
                                        <span v-if="respuestas[pregunta.id]" class="badge bg-success ms-2">
                                            <i class="bi bi-check"></i> Respondida
                                        </span>
                                    </h6>
                                    <p class="card-text">{{ pregunta.texto }}</p>
                                    
                                    <!-- Descripción adicional -->
                                    <div v-if="pregunta.descripcion" class="text-muted small mb-3">
                                        {{ pregunta.descripcion }}
                                    </div>

                                    <!-- Opciones de respuesta -->
                                    <div class="row">
                                        <div v-for="(opcion, valor) in pregunta.opciones" :key="valor" class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input 
                                                    class="form-check-input" 
                                                    type="radio" 
                                                    :name="'pregunta_' + pregunta.id"
                                                    :id="'pregunta_' + pregunta.id + '_' + valor"
                                                    :value="valor"
                                                    :checked="respuestas[pregunta.id] == valor"
                                                    @change="actualizarRespuesta(pregunta.id, parseInt(valor))"
                                                >
                                                <label 
                                                    class="form-check-label" 
                                                    :for="'pregunta_' + pregunta.id + '_' + valor"
                                                >
                                                    <strong>{{ getNivelTexto(valor) }}</strong> - {{ opcion }}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navegación -->
                <div class="d-flex justify-content-between mb-4">
                    <button 
                        class="btn btn-outline-secondary" 
                        @click="dominioAnterior"
                        :disabled="esPrimerDominio"
                    >
                        <i class="bi bi-chevron-left"></i> Anterior
                    </button>
                    
                    <div class="text-center">
                        <div v-if="!dominioCompleto" class="text-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            Complete todas las preguntas para continuar
                        </div>
                        <div v-else class="text-success">
                            <i class="bi bi-check-circle"></i>
                            Dominio completo
                        </div>
                    </div>
                    
                    <button 
                        class="btn"
                        :class="esUltimoDominio ? 'btn-success' : 'btn-primary'"
                        @click="siguienteDominio"
                        :disabled="!dominioCompleto || loading"
                    >
                        <span v-if="loading">
                            <div class="spinner-border spinner-border-sm me-2"></div>
                            Procesando...
                        </span>
                        <span v-else-if="esUltimoDominio">
                            <i class="bi bi-check-circle"></i> Completar Evaluación
                        </span>
                        <span v-else>
                            Siguiente <i class="bi bi-chevron-right"></i>
                        </span>
                    </button>
                </div>

                <!-- Información adicional -->
                <div class="card bg-light">
                    <div class="card-body">
                        <h6><i class="bi bi-info-circle"></i> Instrucciones</h6>
                        <ul class="mb-0">
                            <li>Responda todas las preguntas del dominio actual para poder continuar</li>
                            <li>Puede navegar entre dominios ya visitados usando los botones numerados</li>
                            <li>Su progreso se guarda automáticamente al cambiar de dominio</li>
                            <li>Una vez completada, la evaluación se procesará y mostrará los resultados</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Error state -->
            <div v-else class="text-center py-5">
                <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
                <h5 class="mt-3">Error al cargar el cuestionario</h5>
                <p class="text-muted">No se pudo cargar la evaluación solicitada.</p>
                <button class="btn btn-primary" @click="volverAEvaluaciones">
                    <i class="bi bi-arrow-left"></i> Volver a Evaluaciones
                </button>
            </div>
        </div>
    `
};