/**
 * Modal para crear nueva evaluación de madurez
 */
export default {
    name: 'ModalNuevaEvaluacion',
    
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    
    emits: ['close', 'created'],
    
    setup(props, { emit }) {
        const { ref, inject, watch } = Vue;
        const api = inject('api');
        
        // Estado del formulario
        const formData = ref({
            nombre: '',
            descripcion: '',
            objetivo_6meses: 2.5,
            objetivo_1año: 3.0,
            objetivo_2años: 4.0
        });
        
        const loading = ref(false);
        const error = ref('');
        
        // Reset form when modal opens
        watch(() => props.show, (newVal) => {
            if (newVal) {
                formData.value = {
                    nombre: `Evaluación ${new Date().toLocaleDateString('es-ES')}`,
                    descripcion: '',
                    objetivo_6meses: 2.5,
                    objetivo_1año: 3.0,
                    objetivo_2años: 4.0
                };
                error.value = '';
            }
        });
        
        const handleSubmit = async () => {
            error.value = '';
            
            if (!formData.value.nombre.trim()) {
                error.value = 'El nombre es requerido';
                return;
            }
            
            loading.value = true;
            
            try {
                const response = await api.post('/madurez/assessments', formData.value);
                emit('created', response);
                emit('close');
            } catch (err) {
                console.error('Error creando evaluación:', err);
                error.value = err.message || 'Error al crear la evaluación';
            } finally {
                loading.value = false;
            }
        };
        
        const handleClose = () => {
            if (!loading.value) {
                emit('close');
            }
        };
        
        return {
            formData,
            loading,
            error,
            handleSubmit,
            handleClose
        };
    },
    
    template: `
        <div v-if="show" class="modal fade show d-block" tabindex="-1" @click.self="handleClose">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-plus-circle text-primary"></i>
                            Nueva Evaluación de Madurez
                        </h5>
                        <button type="button" class="btn-close" @click="handleClose" :disabled="loading"></button>
                    </div>
                    
                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <!-- Error Alert -->
                            <div v-if="error" class="alert alert-danger alert-dismissible">
                                <i class="bi bi-exclamation-triangle"></i>
                                {{ error }}
                                <button type="button" class="btn-close" @click="error = ''"></button>
                            </div>
                            
                            <!-- Nombre -->
                            <div class="mb-3">
                                <label class="form-label">Nombre de la Evaluación *</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="formData.nombre"
                                    :disabled="loading"
                                    required
                                    placeholder="Ej: Evaluación Q1 2024"
                                >
                            </div>
                            
                            <!-- Descripción -->
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea 
                                    class="form-control" 
                                    v-model="formData.descripcion"
                                    :disabled="loading"
                                    rows="3"
                                    placeholder="Descripción opcional de la evaluación"
                                ></textarea>
                            </div>
                            
                            <!-- Objetivos -->
                            <div class="mb-3">
                                <label class="form-label">Objetivos de Madurez</label>
                                <div class="row g-2">
                                    <div class="col-md-4">
                                        <label class="form-label small text-muted">6 meses</label>
                                        <input 
                                            type="number" 
                                            class="form-control" 
                                            v-model.number="formData.objetivo_6meses"
                                            :disabled="loading"
                                            min="1" 
                                            max="4" 
                                            step="0.1"
                                        >
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small text-muted">1 año</label>
                                        <input 
                                            type="number" 
                                            class="form-control" 
                                            v-model.number="formData.objetivo_1año"
                                            :disabled="loading"
                                            min="1" 
                                            max="4" 
                                            step="0.1"
                                        >
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small text-muted">2 años</label>
                                        <input 
                                            type="number" 
                                            class="form-control" 
                                            v-model.number="formData.objetivo_2años"
                                            :disabled="loading"
                                            min="1" 
                                            max="4" 
                                            step="0.1"
                                        >
                                    </div>
                                </div>
                                <small class="text-muted">Escala de 1 a 4 (1: Inicial, 4: Optimizado)</small>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="handleClose" :disabled="loading">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading">
                                    <span class="spinner-border spinner-border-sm me-2"></span>
                                    Creando...
                                </span>
                                <span v-else>
                                    <i class="bi bi-check-circle me-1"></i>
                                    Crear Evaluación
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Modal backdrop -->
        <div v-if="show" class="modal-backdrop fade show"></div>
    `
};