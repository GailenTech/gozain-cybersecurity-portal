// Página de Tareas de Impactos
import { ref, inject, onMounted, computed, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const eventBus = inject('eventBus');
        const organization = inject('organization');
        
        // Estado de la página
        const loading = ref(false);
        const tareas = ref([]);
        const tareasSeleccionadas = ref(new Set());
        
        // Estado de filtros
        const filtros = reactive({
            prioridad: '',
            responsable: '',
            fechaLimite: ''
        });

        // Opciones
        const prioridades = ref([
            { value: 'alta', label: 'Alta', class: 'text-danger' },
            { value: 'media', label: 'Media', class: 'text-warning' },
            { value: 'baja', label: 'Baja', class: 'text-info' }
        ]);

        // Computadas
        const tareasFiltradas = computed(() => {
            if (!tareas.value) return [];
            return tareas.value.filter(tarea => {
                if (filtros.prioridad && tarea.prioridad !== filtros.prioridad) return false;
                if (filtros.responsable && !tarea.responsable?.toLowerCase().includes(filtros.responsable.toLowerCase())) return false;
                if (filtros.fechaLimite && tarea.fecha_limite !== filtros.fechaLimite) return false;
                return true;
            });
        });

        const tieneTareas = computed(() => {
            return tareasFiltradas.value && tareasFiltradas.value.length > 0;
        });

        const todasSeleccionadas = computed(() => {
            return tareasFiltradas.value.length > 0 && 
                   tareasFiltradas.value.every(tarea => tareasSeleccionadas.value.has(tarea.id));
        });

        const algunasSeleccionadas = computed(() => {
            return tareasSeleccionadas.value.size > 0;
        });

        const contadorSeleccionadas = computed(() => {
            return tareasSeleccionadas.value.size;
        });

        // Métodos
        const cargarTareas = async () => {
            loading.value = true;
            try {
                const response = await api.get('/impactos/tareas');
                tareas.value = response || [];
            } catch (error) {
                console.error('Error cargando tareas:', error);
                mostrarError('Error al cargar las tareas');
                tareas.value = [];
            } finally {
                loading.value = false;
            }
        };

        const aplicarFiltros = () => {
            // Los filtros se aplican automáticamente mediante computed
        };

        const limpiarFiltros = () => {
            Object.keys(filtros).forEach(key => {
                filtros[key] = '';
            });
        };

        const toggleSeleccionarTodas = () => {
            if (todasSeleccionadas.value) {
                tareasSeleccionadas.value.clear();
            } else {
                tareasFiltradas.value.forEach(tarea => {
                    tareasSeleccionadas.value.add(tarea.id);
                });
            }
        };

        const toggleSeleccionarTarea = (tareaId) => {
            if (tareasSeleccionadas.value.has(tareaId)) {
                tareasSeleccionadas.value.delete(tareaId);
            } else {
                tareasSeleccionadas.value.add(tareaId);
            }
        };

        const completarTarea = async (tarea) => {
            try {
                await api.post(`/impactos/tareas/${tarea.id}/completar`);
                mostrarExito('Tarea completada correctamente');
                await cargarTareas();
            } catch (error) {
                console.error('Error completando tarea:', error);
                mostrarError('Error al completar la tarea');
            }
        };

        const completarSeleccionadas = async () => {
            if (tareasSeleccionadas.value.size === 0) return;
            
            if (!confirm(`¿Está seguro de que desea completar ${tareasSeleccionadas.value.size} tarea(s)?`)) {
                return;
            }

            try {
                const tareaIds = Array.from(tareasSeleccionadas.value);
                await api.post('/impactos/tareas/completar-masivo', { tareas: tareaIds });
                mostrarExito(`${tareaIds.length} tarea(s) completada(s) correctamente`);
                tareasSeleccionadas.value.clear();
                await cargarTareas();
            } catch (error) {
                console.error('Error completando tareas:', error);
                mostrarError('Error al completar las tareas seleccionadas');
            }
        };

        const posponerSeleccionadas = async () => {
            if (tareasSeleccionadas.value.size === 0) return;

            const nuevaFecha = prompt('Ingrese la nueva fecha límite (YYYY-MM-DD):');
            if (!nuevaFecha) return;

            try {
                const tareaIds = Array.from(tareasSeleccionadas.value);
                await api.post('/impactos/tareas/posponer', { 
                    tareas: tareaIds, 
                    nueva_fecha: nuevaFecha 
                });
                mostrarExito(`${tareaIds.length} tarea(s) pospuesta(s) correctamente`);
                tareasSeleccionadas.value.clear();
                await cargarTareas();
            } catch (error) {
                console.error('Error posponiendo tareas:', error);
                mostrarError('Error al posponer las tareas seleccionadas');
            }
        };

        const verDetalleImpacto = (impactoId) => {
            eventBus.emit('impactos:showModal', { type: 'detalle', impactoId });
        };

        // Utilidades
        const getPrioridadClass = (prioridad) => {
            const clases = {
                'alta': 'text-danger',
                'media': 'text-warning', 
                'baja': 'text-info'
            };
            return clases[prioridad] || 'text-secondary';
        };

        const getPrioridadLabel = (prioridad) => {
            const prioridadObj = prioridades.value.find(p => p.value === prioridad);
            return prioridadObj ? prioridadObj.label : prioridad;
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const esFechaVencida = (fecha) => {
            return new Date(fecha) < new Date();
        };

        const esFechaProxima = (fecha) => {
            const fechaTarea = new Date(fecha);
            const hoy = new Date();
            const diferencia = fechaTarea.getTime() - hoy.getTime();
            const diasDiferencia = diferencia / (1000 * 3600 * 24);
            return diasDiferencia <= 3 && diasDiferencia >= 0;
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
            cargarTareas();
        });

        return {
            loading,
            tareas,
            filtros,
            prioridades,
            tareasSeleccionadas,
            tareasFiltradas,
            tieneTareas,
            todasSeleccionadas,
            algunasSeleccionadas,
            contadorSeleccionadas,
            cargarTareas,
            aplicarFiltros,
            limpiarFiltros,
            toggleSeleccionarTodas,
            toggleSeleccionarTarea,
            completarTarea,
            completarSeleccionadas,
            posponerSeleccionadas,
            verDetalleImpacto,
            getPrioridadClass,
            getPrioridadLabel,
            formatearFecha,
            esFechaVencida,
            esFechaProxima
        };
    },

    template: `
        <div class="tareas-impactos">
            <!-- Filtros y acciones -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Tareas Pendientes</h5>
                    <button class="btn btn-sm btn-outline-primary" @click="cargarTareas" :disabled="loading">
                        <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                        Actualizar
                    </button>
                </div>
                <div class="card-body">
                    <div class="row g-3 mb-3">
                        <div class="col-md-3">
                            <label class="form-label">Prioridad</label>
                            <select class="form-select" v-model="filtros.prioridad">
                                <option value="">Todas las prioridades</option>
                                <option v-for="prioridad in prioridades" :key="prioridad.value" :value="prioridad.value">
                                    {{ prioridad.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Responsable</label>
                            <input type="text" class="form-control" v-model="filtros.responsable" 
                                   placeholder="Filtrar por responsable">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Fecha Límite</label>
                            <input type="date" class="form-control" v-model="filtros.fechaLimite">
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button class="btn btn-outline-secondary w-100" @click="limpiarFiltros">
                                <i class="bi bi-x"></i> Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    <!-- Acciones masivas -->
                    <div v-if="algunasSeleccionadas" class="alert alert-info d-flex justify-content-between align-items-center" id="accionesMasivas">
                        <span>{{ contadorSeleccionadas }} tarea(s) seleccionada(s)</span>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-success" @click="completarSeleccionadas" id="btnCompletarSeleccionadas">
                                <i class="bi bi-check-all"></i> Completar
                            </button>
                            <button class="btn btn-warning" @click="posponerSeleccionadas" id="btnPosponer">
                                <i class="bi bi-calendar-plus"></i> Posponer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de tareas -->
            <div class="card">
                <div class="card-body">
                    <!-- Loading state -->
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary"></div>
                        <p class="mt-2 mb-0 text-muted">Cargando tareas...</p>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="!tieneTareas" class="text-center py-5">
                        <i class="bi bi-check-circle display-4 text-success"></i>
                        <h5 class="mt-3 text-muted">No hay tareas pendientes</h5>
                        <p class="text-muted">
                            Todas las tareas han sido completadas o no hay tareas que coincidan con los filtros.
                        </p>
                    </div>

                    <!-- Tabla -->
                    <div v-else class="table-responsive">
                        <table class="table table-hover" id="tablaTareas">
                            <thead>
                                <tr>
                                    <th>
                                        <input 
                                            type="checkbox" 
                                            class="form-check-input" 
                                            id="selectAllTareas"
                                            :checked="todasSeleccionadas"
                                            @change="toggleSeleccionarTodas"
                                        >
                                    </th>
                                    <th>Tarea</th>
                                    <th>Responsable</th>
                                    <th>Prioridad</th>
                                    <th>Fecha Límite</th>
                                    <th>Impacto</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="tarea in tareasFiltradas" :key="tarea.id"
                                    :class="{ 'table-danger': esFechaVencida(tarea.fecha_limite), 'table-warning': esFechaProxima(tarea.fecha_limite) }">
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            class="form-check-input tarea-checkbox"
                                            :checked="tareasSeleccionadas.has(tarea.id)"
                                            @change="toggleSeleccionarTarea(tarea.id)"
                                        >
                                    </td>
                                    <td>
                                        <div>
                                            <strong>{{ tarea.titulo }}</strong>
                                            <div v-if="tarea.descripcion" class="text-muted small">
                                                {{ tarea.descripcion }}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{{ tarea.responsable || 'Sin asignar' }}</td>
                                    <td>
                                        <span :class="getPrioridadClass(tarea.prioridad)">
                                            <i class="bi bi-circle-fill"></i>
                                            {{ getPrioridadLabel(tarea.prioridad) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span :class="{ 'text-danger': esFechaVencida(tarea.fecha_limite), 'text-warning': esFechaProxima(tarea.fecha_limite) }">
                                            {{ formatearFecha(tarea.fecha_limite) }}
                                            <i v-if="esFechaVencida(tarea.fecha_limite)" class="bi bi-exclamation-triangle ms-1"></i>
                                        </span>
                                    </td>
                                    <td>
                                        <a href="#" @click.prevent="verDetalleImpacto(tarea.impacto_id)"
                                           class="text-decoration-none">
                                            <code>{{ tarea.impacto_id?.substring(0, 8) }}</code>
                                        </a>
                                    </td>
                                    <td>
                                        <button 
                                            class="btn btn-sm btn-outline-success"
                                            @click="completarTarea(tarea)"
                                            title="Completar tarea"
                                        >
                                            <i class="bi bi-check"></i>
                                        </button>
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