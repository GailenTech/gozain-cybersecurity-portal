/**
 * Modal para crear/ver impactos
 */
export const ModalImpacto = {
    name: 'ModalImpacto',
    
    data() {
        return {
            show: false,
            mode: 'nuevo', // 'nuevo' o 'detalle'
            loading: false,
            saving: false,
            impacto: {
                tipo: '',
                descripcion: '',
                datos: {}
            },
            plantilla: null,
            errors: {},
            tiposPlantillas: []
        };
    },
    
    computed: {
        modalTitle() {
            return this.mode === 'nuevo' ? 'Nuevo Impacto' : 'Detalle del Impacto';
        },
        
        isReadOnly() {
            return this.mode === 'detalle';
        },
        
        canProcess() {
            return this.mode === 'detalle' && this.impacto.estado === 'pendiente';
        }
    },
    
    methods: {
        async open(data = {}) {
            this.mode = data.type || 'nuevo';
            this.errors = {};
            
            if (this.mode === 'detalle') {
                // Si tenemos impactoId directamente
                if (data.impactoId) {
                    await this.cargarDetalleImpacto(data.impactoId);
                } 
                // Si tenemos el objeto impacto completo
                else if (data.impacto) {
                    // Si solo tenemos el ID, cargar los detalles completos
                    if (data.impacto.id && !data.impacto.vista_previa) {
                        await this.cargarDetalleImpacto(data.impacto.id);
                    } else {
                        this.impacto = { ...data.impacto };
                    }
                }
            } else {
                this.impacto = {
                    tipo: '',
                    descripcion: '',
                    datos: {}
                };
            }
            
            this.show = true;
            
            // Cargar tipos de plantillas disponibles siempre
            await this.cargarTiposPlantillas();
        },
        
        close() {
            this.show = false;
            this.impacto = {
                tipo: '',
                descripcion: '',
                datos: {}
            };
            this.plantilla = null;
            this.errors = {};
        },
        
        async cargarDetalleImpacto(impactoId) {
            try {
                this.loading = true;
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const impacto = await api.get(`/impactos/${impactoId}`);
                this.impacto = impacto;
            } catch (error) {
                console.error('Error cargando detalle del impacto:', error);
                this.mostrarError('Error al cargar el impacto');
            } finally {
                this.loading = false;
            }
        },
        
        async cargarTiposPlantillas() {
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                // Por ahora, definir tipos estáticos
                this.tiposPlantillas = [
                    { id: 'alta_empleado', nombre: 'Alta de Empleado' },
                    { id: 'baja_empleado', nombre: 'Baja de Empleado' },
                    { id: 'cambio_rol', nombre: 'Cambio de Rol' },
                    { id: 'nuevo_proyecto', nombre: 'Nuevo Proyecto' },
                    { id: 'acceso_sistema', nombre: 'Acceso a Sistema' }
                ];
            } catch (error) {
                console.error('Error cargando tipos:', error);
            }
        },
        
        async cargarPlantilla() {
            if (!this.impacto.tipo) return;
            
            try {
                this.loading = true;
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const plantilla = await api.get(`/impactos/plantillas/${this.impacto.tipo}`);
                this.plantilla = plantilla;
                
                // Inicializar datos con campos vacíos
                this.impacto.datos = {};
                if (plantilla && plantilla.campos) {
                    plantilla.campos.forEach(campo => {
                        this.impacto.datos[campo.id] = campo.tipo === 'checkbox' ? false : '';
                    });
                }
            } catch (error) {
                console.error('Error cargando plantilla:', error);
                this.mostrarError('Error al cargar la plantilla');
            } finally {
                this.loading = false;
            }
        },
        
        async guardar() {
            if (!this.validar()) return;
            
            try {
                this.saving = true;
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const nuevoImpacto = await api.post('/impactos', this.impacto);
                
                // Emitir evento de éxito
                const eventBus = window.gozainApp?.eventBus;
                if (eventBus) {
                    eventBus.emit('impactos:created', nuevoImpacto);
                }
                
                this.mostrarExito('Impacto creado exitosamente');
                this.close();
            } catch (error) {
                console.error('Error guardando impacto:', error);
                this.mostrarError('Error al guardar el impacto');
            } finally {
                this.saving = false;
            }
        },
        
        async procesarImpacto() {
            if (!confirm('¿Está seguro de procesar este impacto? Se crearán los activos asociados.')) {
                return;
            }
            
            try {
                this.saving = true;
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const resultado = await api.post(`/impactos/${this.impacto.id}/procesar`);
                
                // Emitir evento de procesado
                const eventBus = window.gozainApp?.eventBus;
                if (eventBus) {
                    eventBus.emit('impactos:processed', resultado);
                }
                
                this.mostrarExito('Impacto procesado exitosamente');
                this.close();
            } catch (error) {
                console.error('Error procesando impacto:', error);
                this.mostrarError('Error al procesar el impacto');
            } finally {
                this.saving = false;
            }
        },
        
        validar() {
            this.errors = {};
            
            if (!this.impacto.tipo) {
                this.errors.tipo = 'Seleccione un tipo de impacto';
            }
            
            if (!this.impacto.descripcion) {
                this.errors.descripcion = 'Ingrese una descripción';
            }
            
            // Validar campos requeridos de la plantilla
            if (this.plantilla && this.plantilla.campos) {
                this.plantilla.campos.forEach(campo => {
                    if (campo.requerido && !this.impacto.datos[campo.id]) {
                        this.errors[campo.id] = `${campo.label} es requerido`;
                    }
                });
            }
            
            return Object.keys(this.errors).length === 0;
        },
        
        mostrarError(mensaje) {
            console.error(mensaje);
            // TODO: Implementar notificaciones
        },
        
        mostrarExito(mensaje) {
            console.log(mensaje);
            // TODO: Implementar notificaciones
        },
        
        getTareas() {
            // Buscar tareas en diferentes formatos
            if (this.impacto.acciones_ejecutadas && typeof this.impacto.acciones_ejecutadas === 'object') {
                return this.impacto.acciones_ejecutadas.tareas_creadas || [];
            }
            return this.impacto.tareas_generadas || [];
        },
        
        formatearFecha(fecha) {
            if (!fecha) return 'Sin fecha';
            return new Date(fecha).toLocaleDateString('es-ES');
        },
        
        getEstadoClass(estado) {
            const clases = {
                'pendiente': 'badge bg-warning text-dark',
                'completada': 'badge bg-success',
                'cancelada': 'badge bg-danger'
            };
            return clases[estado] || 'badge bg-secondary';
        }
    },
    
    mounted() {
        // Escuchar eventos para abrir el modal
        const eventBus = window.gozainApp?.eventBus;
        if (eventBus) {
            eventBus.on('impactos:showModal', this.open);
        }
    },
    
    beforeUnmount() {
        const eventBus = window.gozainApp?.eventBus;
        if (eventBus) {
            eventBus.off('impactos:showModal', this.open);
        }
    },
    
    template: `
        <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ modalTitle }}</h5>
                        <button type="button" class="btn-close" @click="close"></button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Loading state -->
                        <div v-if="loading" class="text-center py-4">
                            <div class="spinner-border text-primary"></div>
                        </div>
                        
                        <!-- Formulario -->
                        <form v-else @submit.prevent="guardar">
                            <!-- Tipo de Impacto -->
                            <div class="mb-3">
                                <label class="form-label">Tipo de Impacto</label>
                                <select class="form-select" 
                                        v-model="impacto.tipo" 
                                        @change="cargarPlantilla"
                                        :disabled="isReadOnly"
                                        :class="{ 'is-invalid': errors.tipo }">
                                    <option value="">Seleccione un tipo...</option>
                                    <option v-for="tipo in tiposPlantillas" 
                                            :key="tipo.id" 
                                            :value="tipo.id">
                                        {{ tipo.nombre }}
                                    </option>
                                    <!-- Opción adicional para tipos no listados -->
                                    <option v-if="mode === 'detalle' && impacto.tipo && !tiposPlantillas.find(t => t.id === impacto.tipo)" 
                                            :value="impacto.tipo">
                                        {{ impacto.tipo }}
                                    </option>
                                </select>
                                <div v-if="errors.tipo" class="invalid-feedback">{{ errors.tipo }}</div>
                            </div>
                            
                            <!-- Descripción -->
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" 
                                          v-model="impacto.descripcion" 
                                          rows="3"
                                          :readonly="isReadOnly"
                                          :class="{ 'is-invalid': errors.descripcion }">
                                </textarea>
                                <div v-if="errors.descripcion" class="invalid-feedback">{{ errors.descripcion }}</div>
                            </div>
                            
                            <!-- Campos dinámicos de la plantilla -->
                            <div v-if="plantilla && plantilla.campos" class="border rounded p-3 mb-3">
                                <h6 class="mb-3">Datos específicos</h6>
                                <div v-for="campo in plantilla.campos" :key="campo.id" class="mb-3">
                                    <!-- Campo de texto -->
                                    <div v-if="campo.tipo === 'text'">
                                        <label class="form-label">
                                            {{ campo.label }}
                                            <span v-if="campo.requerido" class="text-danger">*</span>
                                        </label>
                                        <input type="text" 
                                               class="form-control"
                                               v-model="impacto.datos[campo.id]"
                                               :readonly="isReadOnly"
                                               :class="{ 'is-invalid': errors[campo.id] }">
                                        <div v-if="errors[campo.id]" class="invalid-feedback">{{ errors[campo.id] }}</div>
                                    </div>
                                    
                                    <!-- Campo de fecha -->
                                    <div v-else-if="campo.tipo === 'date'">
                                        <label class="form-label">
                                            {{ campo.label }}
                                            <span v-if="campo.requerido" class="text-danger">*</span>
                                        </label>
                                        <input type="date" 
                                               class="form-control"
                                               v-model="impacto.datos[campo.id]"
                                               :readonly="isReadOnly"
                                               :class="{ 'is-invalid': errors[campo.id] }">
                                        <div v-if="errors[campo.id]" class="invalid-feedback">{{ errors[campo.id] }}</div>
                                    </div>
                                    
                                    <!-- Campo select -->
                                    <div v-else-if="campo.tipo === 'select'">
                                        <label class="form-label">
                                            {{ campo.label }}
                                            <span v-if="campo.requerido" class="text-danger">*</span>
                                        </label>
                                        <select class="form-select"
                                                v-model="impacto.datos[campo.id]"
                                                :disabled="isReadOnly"
                                                :class="{ 'is-invalid': errors[campo.id] }">
                                            <option value="">Seleccione...</option>
                                            <option v-for="opcion in campo.opciones" 
                                                    :key="opcion" 
                                                    :value="opcion">
                                                {{ opcion }}
                                            </option>
                                        </select>
                                        <div v-if="errors[campo.id]" class="invalid-feedback">{{ errors[campo.id] }}</div>
                                    </div>
                                    
                                    <!-- Checkbox -->
                                    <div v-else-if="campo.tipo === 'checkbox'" class="form-check">
                                        <input type="checkbox" 
                                               class="form-check-input"
                                               :id="'campo_' + campo.id"
                                               v-model="impacto.datos[campo.id]"
                                               :disabled="isReadOnly">
                                        <label class="form-check-label" :for="'campo_' + campo.id">
                                            {{ campo.label }}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Vista previa de tareas (solo para impactos pendientes) -->
                            <div v-if="mode === 'detalle' && impacto.estado === 'pendiente' && impacto.vista_previa" 
                                 class="alert alert-warning">
                                <h6 class="alert-heading">Vista previa de cambios</h6>
                                <div class="row">
                                    <div class="col-md-4 text-center">
                                        <h5 class="text-primary">{{ impacto.vista_previa.activos_crear || 0 }}</h5>
                                        <small>Activos a crear</small>
                                    </div>
                                    <div class="col-md-4 text-center">
                                        <h5 class="text-warning">{{ impacto.vista_previa.activos_modificar || 0 }}</h5>
                                        <small>Activos a modificar</small>
                                    </div>
                                    <div class="col-md-4 text-center">
                                        <h5 class="text-info">{{ impacto.vista_previa.tareas_generar || 0 }}</h5>
                                        <small>Tareas a generar</small>
                                    </div>
                                </div>
                                <div v-if="impacto.vista_previa.acciones_detalle && impacto.vista_previa.acciones_detalle.length > 0" 
                                     class="mt-3">
                                    <h6>Detalle de acciones:</h6>
                                    <ul class="mb-0">
                                        <li v-for="accion in impacto.vista_previa.acciones_detalle" 
                                            :key="accion.tipo + accion.descripcion">
                                            <strong>{{ accion.tipo }}:</strong> {{ accion.descripcion }}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Información de estado (solo en modo detalle) -->
                            <div v-if="mode === 'detalle' && impacto.estado" class="alert alert-info">
                                <strong>Estado:</strong> {{ impacto.estado }}
                                <br v-if="impacto.fecha_procesamiento">
                                <strong>Procesado:</strong> {{ new Date(impacto.fecha_procesamiento).toLocaleString() }}
                            </div>
                            
                            <!-- Activos creados (solo si está procesado) -->
                            <div v-if="mode === 'detalle' && impacto.activos_creados && impacto.activos_creados.length > 0" 
                                 class="border rounded p-3 mb-3">
                                <h6 class="mb-3">Activos creados</h6>
                                <ul class="list-unstyled mb-0">
                                    <li v-for="activo in impacto.activos_creados" :key="activo.id">
                                        <i class="bi bi-check-circle text-success"></i>
                                        {{ activo.nombre }} ({{ activo.tipo }})
                                    </li>
                                </ul>
                            </div>
                            
                            <!-- Tareas generadas (solo si está procesado) -->
                            <div v-if="mode === 'detalle' && getTareas().length > 0" 
                                 class="border rounded p-3">
                                <h6 class="mb-3">Tareas generadas</h6>
                                <div class="list-group list-group-flush">
                                    <div v-for="tarea in getTareas()" :key="tarea.id" 
                                         class="list-group-item px-0">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <h6 class="mb-1">{{ tarea.descripcion }}</h6>
                                                <div class="text-muted small">
                                                    <i class="bi bi-person"></i> {{ tarea.responsable }}
                                                    <span class="mx-2">•</span>
                                                    <i class="bi bi-calendar"></i> Vence: {{ formatearFecha(tarea.fecha_limite) }}
                                                </div>
                                            </div>
                                            <span :class="getEstadoClass(tarea.estado)">
                                                {{ tarea.estado }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="close">
                            Cerrar
                        </button>
                        <button v-if="mode === 'nuevo'" 
                                type="button" 
                                class="btn btn-primary"
                                @click="guardar"
                                :disabled="saving">
                            <span v-if="saving">
                                <span class="spinner-border spinner-border-sm"></span>
                                Guardando...
                            </span>
                            <span v-else>
                                <i class="bi bi-save"></i> Guardar
                            </span>
                        </button>
                        <button v-if="canProcess" 
                                type="button" 
                                class="btn btn-success"
                                @click="procesarImpacto"
                                :disabled="saving">
                            <span v-if="saving">
                                <span class="spinner-border spinner-border-sm"></span>
                                Procesando...
                            </span>
                            <span v-else>
                                <i class="bi bi-play-circle"></i> Procesar
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};