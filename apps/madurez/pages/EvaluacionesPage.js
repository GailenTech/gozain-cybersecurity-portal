// Lista de Evaluaciones de Madurez
export default {
    name: 'EvaluacionesPage',
    
    setup() {
        const { ref, inject, onMounted, computed, reactive } = Vue;
        const { useRouter } = VueRouter;
        const api = inject('api');
        const eventBus = inject('eventBus');
        const organization = inject('organization');
        const router = useRouter();
        
        // Estado de la página
        const loading = ref(false);
        const assessments = ref([]);
        
        // Filtros
        const filtros = reactive({
            estado: '',
            fechaDesde: '',
            fechaHasta: ''
        });

        // Opciones para filtros
        const estadosEvaluacion = ref([
            { value: 'abierto', label: 'Abierto' },
            { value: 'completado', label: 'Completado' },
            { value: 'firmado', label: 'Firmado' }
        ]);

        // Computadas
        const evaluacionesFiltradas = computed(() => {
            if (!assessments.value) return [];
            return assessments.value.filter(assessment => {
                if (filtros.estado && assessment.estado !== filtros.estado) return false;
                if (filtros.fechaDesde && assessment.fecha_inicio < filtros.fechaDesde) return false;
                if (filtros.fechaHasta && assessment.fecha_inicio > filtros.fechaHasta) return false;
                return true;
            });
        });

        const tieneEvaluaciones = computed(() => {
            return evaluacionesFiltradas.value && evaluacionesFiltradas.value.length > 0;
        });

        // Métodos
        const cargarEvaluaciones = async () => {
            loading.value = true;
            try {
                const params = new URLSearchParams();
                
                // Aplicar filtros
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        params.append(key, filtros[key]);
                    }
                });

                const response = await api.get(`/madurez/assessments?${params.toString()}`);
                assessments.value = response || [];
            } catch (error) {
                console.error('Error cargando evaluaciones:', error);
                mostrarError('Error al cargar las evaluaciones');
                assessments.value = [];
            } finally {
                loading.value = false;
            }
        };

        const aplicarFiltros = () => {
            cargarEvaluaciones();
        };

        const limpiarFiltros = () => {
            Object.keys(filtros).forEach(key => {
                filtros[key] = '';
            });
            cargarEvaluaciones();
        };

        const crearNuevaEvaluacion = () => {
            eventBus.emit('madurez:showModal', { type: 'nueva' });
        };

        const continuarEvaluacion = (assessment) => {
            // Navegar al cuestionario
            router.push(`/cuestionario/${assessment.id}`);
        };

        const verResultados = (assessment) => {
            // Navegar al dashboard del assessment
            router.push(`/dashboard/${assessment.id}`);
        };

        const firmarEvaluacion = async (assessment) => {
            const firmante = prompt('Ingrese el nombre del firmante:');
            if (!firmante) return;

            try {
                await api.post(`/madurez/assessments/${assessment.id}/sign`, { firmante });
                mostrarExito('Evaluación firmada correctamente');
                await cargarEvaluaciones();
            } catch (error) {
                console.error('Error firmando evaluación:', error);
                mostrarError('Error al firmar la evaluación');
            }
        };

        const eliminarEvaluacion = async (assessment) => {
            if (!confirm(`¿Está seguro de que desea eliminar la evaluación "${assessment.nombre}"?`)) {
                return;
            }

            try {
                await api.delete(`/madurez/assessments/${assessment.id}`);
                mostrarExito('Evaluación eliminada correctamente');
                await cargarEvaluaciones();
            } catch (error) {
                console.error('Error eliminando evaluación:', error);
                mostrarError('Error al eliminar la evaluación');
            }
        };

        const exportarEvaluaciones = async () => {
            try {
                const params = new URLSearchParams();
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        params.append(key, filtros[key]);
                    }
                });

                const blob = await api.getBlob(`/madurez/assessments/export?${params.toString()}`);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `evaluaciones_madurez_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Error exportando evaluaciones:', error);
                mostrarError('Error al exportar las evaluaciones');
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
                'abierto': 'Abierto',
                'completado': 'Completado',
                'firmado': 'Firmado'
            };
            return textos[estado] || estado;
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearPuntuacion = (puntuacion) => {
            return puntuacion ? Number(puntuacion).toFixed(1) : '-';
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
            cargarEvaluaciones();
        });

        return {
            loading,
            assessments,
            filtros,
            estadosEvaluacion,
            evaluacionesFiltradas,
            tieneEvaluaciones,
            cargarEvaluaciones,
            aplicarFiltros,
            limpiarFiltros,
            crearNuevaEvaluacion,
            continuarEvaluacion,
            verResultados,
            firmarEvaluacion,
            eliminarEvaluacion,
            exportarEvaluaciones,
            getEstadoClass,
            getEstadoText,
            formatearFecha,
            formatearPuntuacion
        };
    },

    template: `
        <div class="evaluaciones-madurez">
            <!-- Filtros -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Filtros</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" @click="exportarEvaluaciones">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                        <button class="btn btn-sm btn-primary" @click="crearNuevaEvaluacion">
                            <i class="bi bi-plus"></i> Nueva Evaluación
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Estado</label>
                            <select class="form-select" v-model="filtros.estado">
                                <option value="">Todos los estados</option>
                                <option v-for="estado in estadosEvaluacion" :key="estado.value" :value="estado.value">
                                    {{ estado.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Fecha Desde</label>
                            <input type="date" class="form-control" v-model="filtros.fechaDesde">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Fecha Hasta</label>
                            <input type="date" class="form-control" v-model="filtros.fechaHasta">
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <div class="btn-group w-100">
                                <button class="btn btn-primary" @click="aplicarFiltros" :disabled="loading">
                                    <i class="bi bi-funnel"></i> Filtrar
                                </button>
                                <button class="btn btn-outline-secondary" @click="limpiarFiltros">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de evaluaciones -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Evaluaciones de Madurez</h5>
                    <button class="btn btn-sm btn-outline-primary" @click="cargarEvaluaciones" :disabled="loading">
                        <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                        Actualizar
                    </button>
                </div>
                <div class="card-body">
                    <!-- Loading state -->
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary"></div>
                        <p class="mt-2 mb-0 text-muted">Cargando evaluaciones...</p>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="!tieneEvaluaciones" class="text-center py-5">
                        <i class="bi bi-clipboard-x display-4 text-muted"></i>
                        <h5 class="mt-3 text-muted">No se encontraron evaluaciones</h5>
                        <p class="text-muted">
                            No hay evaluaciones que coincidan con los filtros seleccionados.
                        </p>
                        <button class="btn btn-primary" @click="crearNuevaEvaluacion">
                            <i class="bi bi-plus"></i> Crear primera evaluación
                        </button>
                    </div>

                    <!-- Tabla -->
                    <div v-else class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Fecha Inicio</th>
                                    <th>Estado</th>
                                    <th>Puntuación</th>
                                    <th>Fecha Completado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="assessment in evaluacionesFiltradas" :key="assessment.id">
                                    <td>
                                        <div>
                                            <strong>{{ assessment.nombre }}</strong>
                                            <div v-if="assessment.descripcion" class="text-muted small">
                                                {{ assessment.descripcion }}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{{ formatearFecha(assessment.fecha_inicio) }}</td>
                                    <td>
                                        <span class="badge" :class="getEstadoClass(assessment.estado)">
                                            {{ getEstadoText(assessment.estado) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span v-if="assessment.resultados">
                                            <strong>{{ formatearPuntuacion(assessment.resultados.puntuacion_total) }}</strong>/4.0
                                        </span>
                                        <span v-else class="text-muted">-</span>
                                    </td>
                                    <td>
                                        <span v-if="assessment.fecha_completado">
                                            {{ formatearFecha(assessment.fecha_completado) }}
                                        </span>
                                        <span v-else class="text-muted">-</span>
                                    </td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <!-- Continuar evaluación -->
                                            <button 
                                                v-if="assessment.estado === 'abierto'"
                                                class="btn btn-outline-primary" 
                                                @click="continuarEvaluacion(assessment)"
                                                title="Continuar evaluación"
                                            >
                                                <i class="bi bi-play-fill"></i>
                                            </button>
                                            
                                            <!-- Ver resultados -->
                                            <button 
                                                v-if="assessment.resultados"
                                                class="btn btn-outline-success" 
                                                @click="verResultados(assessment)"
                                                title="Ver resultados"
                                            >
                                                <i class="bi bi-bar-chart"></i>
                                            </button>
                                            
                                            <!-- Firmar evaluación -->
                                            <button 
                                                v-if="assessment.estado === 'completado'"
                                                class="btn btn-outline-warning" 
                                                @click="firmarEvaluacion(assessment)"
                                                title="Firmar evaluación"
                                            >
                                                <i class="bi bi-file-earmark-check"></i>
                                            </button>
                                            
                                            <!-- Eliminar -->
                                            <button 
                                                v-if="assessment.estado === 'abierto'"
                                                class="btn btn-outline-danger" 
                                                @click="eliminarEvaluacion(assessment)"
                                                title="Eliminar evaluación"
                                            >
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};