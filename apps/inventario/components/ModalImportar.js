/**
 * Componente Modal para importar activos
 */
export const ModalImportar = {
    name: 'ModalImportar',
    
    template: `
        <div class="modal fade show d-block" id="modalImportar" tabindex="-1" @click.self="cerrar">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Importar Activos</h5>
                        <button type="button" class="btn-close" @click="cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Seleccionar archivo</label>
                            <input 
                                type="file" 
                                class="form-control" 
                                id="archivoImportar"
                                accept=".csv,.xlsx"
                                @change="handleFileSelect"
                            >
                            <div class="form-text">Formatos soportados: CSV, Excel</div>
                        </div>
                        
                        <div v-if="preview" class="mt-4" id="previewImportar">
                            <h6>Vista previa</h6>
                            <div class="table-responsive">
                                <table class="table table-sm" id="tablaPreview">
                                    <thead>
                                        <tr>
                                            <th v-for="header in preview.headers" :key="header">{{ header }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(row, index) in preview.preview" :key="index">
                                            <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                                                {{ cell || '-' }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p class="text-muted mt-2">
                                Mostrando {{ preview.preview.length }} de {{ preview.total }} filas
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cerrar">Cancelar</button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            id="btnConfirmarImportar"
                            :disabled="!archivo"
                            @click="confirmarImportacion"
                        >
                            Importar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `,
    
    data() {
        return {
            archivo: null,
            preview: null
        };
    },
    
    mounted() {
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
        
        async handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) {
                this.archivo = null;
                this.preview = null;
                return;
            }
            
            // Validar archivo
            const extension = file.name.split('.').pop().toLowerCase();
            if (!['csv', 'xlsx'].includes(extension)) {
                this.mostrarError('Formato de archivo no soportado');
                event.target.value = '';
                return;
            }
            
            this.archivo = file;
            await this.mostrarPreview(file);
        },
        
        async mostrarPreview(file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const organizationId = this.$store.state.organizationId;
                const response = await fetch(`${window.location.origin}/api/inventario/preview-import`, {
                    method: 'POST',
                    headers: {
                        'X-Organization-Id': organizationId
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Error al procesar archivo');
                }
                
                this.preview = await response.json();
            } catch (error) {
                console.error('Error preview:', error);
                this.mostrarError('Error al procesar el archivo');
                this.archivo = null;
                this.preview = null;
            }
        },
        
        async confirmarImportacion() {
            if (!this.archivo) return;
            
            try {
                const formData = new FormData();
                formData.append('file', this.archivo);
                formData.append('reemplazar', 'false');
                
                const organizationId = this.$store.state.organizationId;
                const response = await fetch(`${window.location.origin}/api/inventario/importar`, {
                    method: 'POST',
                    headers: {
                        'X-Organization-Id': organizationId
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Error al importar');
                }
                
                const result = await response.json();
                
                // Mostrar notificación
                const eventBus = window.gozainApp?.eventBus;
                if (eventBus) {
                    eventBus.emit('shell:showToast', {
                        message: `Se importaron ${result.imported} activos correctamente`,
                        type: 'success'
                    });
                }
                
                // Recargar datos
                await this.$store.dispatch('cargarActivos');
                
                // Cerrar modal
                this.cerrar();
            } catch (error) {
                console.error('Error importando:', error);
                this.mostrarError('Error al importar los activos');
            }
        },
        
        mostrarError(mensaje) {
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('shell:showToast', {
                    message: mensaje,
                    type: 'danger'
                });
            }
        }
    }
};