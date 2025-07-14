/**
 * Página de Tareas de Impactos
 */
export const TareasPage = {
    name: 'ImpactosTareasPage',
    
    data() {
        return {
            loading: false,
            tareas: [],
            tareasSeleccionadas: new Set(),
            filtros: {
                prioridad: '',
                responsable: '',
                fechaLimite: ''
            },
            prioridades: [
                { value: 'alta', label: 'Alta', class: 'text-danger' },
                { value: 'media', label: 'Media', class: 'text-warning' },
                { value: 'baja', label: 'Baja', class: 'text-info' }
            ]
        };
    },
    
    computed: {
        tareasFiltradas() {
            if (!this.tareas) return [];
            return this.tareas.filter(tarea => {
                if (this.filtros.prioridad && tarea.prioridad !== this.filtros.prioridad) return false;
                if (this.filtros.responsable && !tarea.responsable?.toLowerCase().includes(this.filtros.responsable.toLowerCase())) return false;
                if (this.filtros.fechaLimite && tarea.fecha_limite !== this.filtros.fechaLimite) return false;
                return true;
            });
        },
        
        tieneTareas() {
            return this.tareasFiltradas && this.tareasFiltradas.length > 0;
        },
        
        todasSeleccionadas() {
            return this.tareasFiltradas.length > 0 && 
                   this.tareasFiltradas.every(tarea => this.tareasSeleccionadas.has(tarea.id));
        },
        
        algunasSeleccionadas() {
            return this.tareasSeleccionadas.size > 0;
        },
        
        contadorSeleccionadas() {
            return this.tareasSeleccionadas.size;
        }
    },
    
    methods: {
        async cargarTareas() {
            this.loading = true;
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const response = await api.get('/impactos/tareas');
                this.tareas = response || [];
            } catch (error) {
                console.error('Error cargando tareas:', error);
                this.mostrarError('Error al cargar las tareas');
                this.tareas = [];
            } finally {
                this.loading = false;
            }
        },
        
        aplicarFiltros() {
            // Los filtros se aplican automáticamente mediante computed
        },
        
        limpiarFiltros() {
            Object.keys(this.filtros).forEach(key => {
                this.filtros[key] = '';
            });
        },
        
        toggleSeleccionarTodas() {
            if (this.todasSeleccionadas) {
                this.tareasSeleccionadas.clear();
            } else {
                this.tareasFiltradas.forEach(tarea => {
                    this.tareasSeleccionadas.add(tarea.id);
                });
            }
            // Forzar re-render
            this.tareasSeleccionadas = new Set(this.tareasSeleccionadas);
        },
        
        toggleSeleccionarTarea(tareaId) {
            if (this.tareasSeleccionadas.has(tareaId)) {
                this.tareasSeleccionadas.delete(tareaId);
            } else {
                this.tareasSeleccionadas.add(tareaId);
            }
            // Forzar re-render
            this.tareasSeleccionadas = new Set(this.tareasSeleccionadas);
        },
        
        async completarTarea(tarea) {
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                await api.post(`/impactos/tareas/${tarea.id}/completar`);
                this.mostrarExito('Tarea completada correctamente');
                await this.cargarTareas();
            } catch (error) {
                console.error('Error completando tarea:', error);
                this.mostrarError('Error al completar la tarea');
            }
        },
        
        async completarSeleccionadas() {
            if (this.tareasSeleccionadas.size === 0) return;
            
            if (!confirm(`¿Está seguro de que desea completar ${this.tareasSeleccionadas.size} tarea(s)?`)) {
                return;
            }

            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const tareaIds = Array.from(this.tareasSeleccionadas);
                await api.post('/impactos/tareas/completar-masivo', { tareas: tareaIds });
                this.mostrarExito(`${tareaIds.length} tarea(s) completada(s) correctamente`);
                this.tareasSeleccionadas.clear();
                await this.cargarTareas();
            } catch (error) {
                console.error('Error completando tareas:', error);
                this.mostrarError('Error al completar las tareas seleccionadas');
            }
        },
        
        async posponerSeleccionadas() {
            if (this.tareasSeleccionadas.size === 0) return;

            const nuevaFecha = prompt('Ingrese la nueva fecha límite (YYYY-MM-DD):');
            if (!nuevaFecha) return;

            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const tareaIds = Array.from(this.tareasSeleccionadas);
                await api.post('/impactos/tareas/posponer', { 
                    tareas: tareaIds, 
                    nueva_fecha: nuevaFecha 
                });
                this.mostrarExito(`${tareaIds.length} tarea(s) pospuesta(s) correctamente`);
                this.tareasSeleccionadas.clear();
                await this.cargarTareas();
            } catch (error) {
                console.error('Error posponiendo tareas:', error);
                this.mostrarError('Error al posponer las tareas seleccionadas');
            }
        },
        
        verDetalleImpacto(impactoId) {
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('impactos:showModal', { type: 'detalle', impactoId });
            }
        },
        
        getPrioridadClass(prioridad) {
            const clases = {
                'alta': 'text-danger',
                'media': 'text-warning', 
                'baja': 'text-info'
            };
            return clases[prioridad] || 'text-secondary';
        },
        
        getPrioridadLabel(prioridad) {
            const prioridadObj = this.prioridades.find(p => p.value === prioridad);
            return prioridadObj ? prioridadObj.label : prioridad;
        },
        
        formatearFecha(fecha) {
            return new Date(fecha).toLocaleDateString('es-ES');
        },
        
        esFechaVencida(fecha) {
            return new Date(fecha) < new Date();
        },
        
        esFechaProxima(fecha) {
            const fechaTarea = new Date(fecha);
            const hoy = new Date();
            const diferencia = fechaTarea.getTime() - hoy.getTime();
            const diasDiferencia = diferencia / (1000 * 3600 * 24);
            return diasDiferencia <= 3 && diasDiferencia >= 0;
        },
        
        mostrarError(mensaje) {
            console.error(mensaje);
        },
        
        mostrarExito(mensaje) {
            console.log(mensaje);
        }
    },
    
    mounted() {
        this.cargarTareas();
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