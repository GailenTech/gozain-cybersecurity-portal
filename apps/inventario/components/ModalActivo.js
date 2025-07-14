/**
 * Componente Modal para crear/editar activos
 */
export const ModalActivo = {
    name: 'ModalActivo',
    
    props: {
        modo: {
            type: String,
            default: 'nuevo'
        },
        activo: {
            type: Object,
            default: null
        }
    },
    
    template: `
        <div class="modal fade show d-block" id="modalActivo" tabindex="-1" @click.self="cerrar">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalActivoTitle">
                            {{ modo === 'editar' ? 'Editar Activo' : 'Nuevo Activo' }}
                        </h5>
                        <button type="button" class="btn-close" @click="cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form ref="formActivo" id="formActivo" @submit.prevent="guardar">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Tipo de Activo</label>
                                    <select v-model="form.tipo" class="form-select" id="tipoActivo" required>
                                        <option value="">Seleccionar...</option>
                                        <option v-for="tipo in tiposActivo" :key="tipo" :value="tipo">
                                            {{ tipo }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Estado</label>
                                    <select v-model="form.estado" class="form-select" id="estadoActivo" required>
                                        <option v-for="estado in estadosActivo" :key="estado" :value="estado">
                                            {{ estado }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Nombre del Activo</label>
                                    <input 
                                        v-model="form.nombre" 
                                        type="text" 
                                        class="form-control" 
                                        id="nombreActivo" 
                                        required
                                        placeholder="Ej: Servidor Principal"
                                    >
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Responsable</label>
                                    <input 
                                        v-model="form.responsable" 
                                        type="text" 
                                        class="form-control" 
                                        id="responsableActivo"
                                        placeholder="Ej: Juan Pérez"
                                    >
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Departamento</label>
                                    <input 
                                        v-model="form.departamento" 
                                        type="text" 
                                        class="form-control" 
                                        id="departamentoActivo"
                                        placeholder="Ej: TI"
                                    >
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Clasificación</label>
                                    <select v-model="form.clasificacion" class="form-select" id="clasificacionActivo">
                                        <option v-for="clasificacion in clasificaciones" :key="clasificacion" :value="clasificacion">
                                            {{ clasificacion }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Criticidad</label>
                                    <select v-model="form.criticidad" class="form-select" id="criticidadActivo">
                                        <option v-for="criticidad in criticidades" :key="criticidad" :value="criticidad">
                                            {{ criticidad }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Descripción</label>
                                    <textarea 
                                        v-model="form.descripcion" 
                                        class="form-control" 
                                        id="descripcionActivo"
                                        rows="3"
                                        placeholder="Descripción detallada del activo..."
                                    ></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cerrar">Cancelar</button>
                        <button type="button" class="btn btn-primary" @click="guardar" id="btnGuardarActivo">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `,
    
    data() {
        return {
            form: {
                tipo: '',
                estado: 'Activo',
                nombre: '',
                responsable: '',
                departamento: '',
                clasificacion: 'Interno',
                criticidad: 'Normal',
                descripcion: ''
            }
        };
    },
    
    computed: {
        ...Vuex.mapGetters(['tiposActivo', 'estadosActivo', 'criticidades', 'clasificaciones'])
    },
    
    mounted() {
        // Si es modo edición, cargar los datos
        if (this.modo === 'editar' && this.activo) {
            this.form = {
                tipo: this.activo.tipo || this.activo.tipo_activo || '',
                estado: this.activo.estado || 'Activo',
                nombre: this.activo.nombre || '',
                responsable: this.activo.responsable || '',
                departamento: this.activo.departamento || '',
                clasificacion: this.activo.clasificacion || 'Interno',
                criticidad: this.activo.criticidad || 'Normal',
                descripcion: this.activo.descripcion || ''
            };
        }
        
        // Prevenir scroll del body
        document.body.classList.add('modal-open');
    },
    
    beforeUnmount() {
        // Restaurar scroll del body
        document.body.classList.remove('modal-open');
    },
    
    methods: {
        cerrar() {
            this.$emit('close');
        },
        
        guardar() {
            // Validar formulario
            const form = this.$refs.formActivo;
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Preparar datos
            const datosActivo = {
                tipo: this.form.tipo,
                tipo_activo: this.form.tipo, // Por compatibilidad
                estado: this.form.estado,
                nombre: this.form.nombre,
                responsable: this.form.responsable,
                departamento: this.form.departamento,
                clasificacion: this.form.clasificacion,
                criticidad: this.form.criticidad,
                descripcion: this.form.descripcion
            };
            
            // Emitir evento con los datos
            this.$emit('save', datosActivo);
        }
    }
};