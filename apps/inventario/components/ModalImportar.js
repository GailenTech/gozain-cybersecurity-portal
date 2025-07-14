/**
 * Componente Modal para Importar
 */
export const ModalImportar = {
    name: 'ModalImportar',
    
    computed: {
        ...window.Vuex.mapState({
            show: state => state.modalImportar.show,
            loading: state => state.loading
        })
    },
    
    data() {
        return {
            archivo: null,
            preview: null
        };
    },
    
    watch: {
        show(newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    this.showModal();
                });
            } else {
                this.hideModal();
            }
        }
    },
    
    mounted() {
        // No necesitamos el event listener de Bootstrap ya que controlamos todo desde Vue
    },
    
    methods: {
        showModal() {
            const modalElement = document.getElementById('modalImportar');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.show();
            }
        },
        
        hideModal() {
            const modalElement = document.getElementById('modalImportar');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
                
                // Asegurar limpieza completa después de la animación
                setTimeout(() => {
                    // Eliminar TODOS los backdrops (por si hay múltiples)
                    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                        backdrop.remove();
                    });
                    // Limpiar clases del body
                    document.body.classList.remove('modal-open');
                    document.body.style.removeProperty('overflow');
                    document.body.style.removeProperty('padding-right');
                }, 300);
            }
        },
        
        cerrarModal() {
            // Primero ocultar el modal de Bootstrap
            this.hideModal();
            // Luego actualizar el estado en Vue
            this.$store.commit('HIDE_MODAL_IMPORTAR');
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
                
                const api = this.$store.state.services?.api || window.gozainApp?.services?.api;
                const response = await api.post('/inventario/preview-import', formData);
                
                this.preview = response;
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
                
                const api = this.$store.state.services?.api || window.gozainApp?.services?.api;
                const result = await api.post('/inventario/importar', formData);
                
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
                this.cerrarModal();
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
    },
    
    render() {
        const { h } = window.Vue;
        
        if (!this.show) {
            return null;
        }
        
        return h('div', {
            class: 'modal fade',
            id: 'modalImportar',
            tabindex: '-1',
            'aria-labelledby': 'modalImportarTitle',
            'aria-hidden': 'true'
        }, [
            h('div', { class: 'modal-dialog modal-lg' }, [
                h('div', { class: 'modal-content' }, [
                    // Header
                    h('div', { class: 'modal-header' }, [
                        h('h5', { 
                            class: 'modal-title',
                            id: 'modalImportarTitle'
                        }, 'Importar Activos'),
                        h('button', {
                            type: 'button',
                            class: 'btn-close',
                            'aria-label': 'Close',
                            onClick: this.cerrarModal
                        })
                    ]),
                    
                    // Body
                    h('div', { class: 'modal-body' }, [
                        // Selector de archivo
                        h('div', { class: 'mb-3' }, [
                            h('label', { class: 'form-label' }, 'Seleccionar archivo'),
                            h('input', {
                                type: 'file',
                                class: 'form-control',
                                id: 'archivoImportar',
                                accept: '.csv,.xlsx',
                                onChange: this.handleFileSelect
                            }),
                            h('div', { class: 'form-text' }, 'Formatos soportados: CSV, Excel')
                        ]),
                        
                        // Vista previa
                        this.preview && h('div', { class: 'mt-4', id: 'previewImportar' }, [
                            h('h6', {}, 'Vista previa'),
                            h('div', { class: 'table-responsive' }, [
                                h('table', { class: 'table table-sm', id: 'tablaPreview' }, [
                                    h('thead', {}, [
                                        h('tr', {}, 
                                            this.preview.headers.map(header => 
                                                h('th', {}, header)
                                            )
                                        )
                                    ]),
                                    h('tbody', {}, 
                                        this.preview.preview.map((row, index) => 
                                            h('tr', { key: index }, 
                                                row.map((cell, cellIndex) => 
                                                    h('td', { key: cellIndex }, cell || '-')
                                                )
                                            )
                                        )
                                    )
                                ])
                            ]),
                            h('p', { class: 'text-muted mt-2' }, 
                                `Mostrando ${this.preview.preview.length} de ${this.preview.total} filas`
                            )
                        ])
                    ]),
                    
                    // Footer
                    h('div', { class: 'modal-footer' }, [
                        h('button', {
                            type: 'button',
                            class: 'btn btn-secondary',
                            onClick: this.cerrarModal
                        }, 'Cancelar'),
                        h('button', {
                            type: 'button',
                            class: 'btn btn-primary',
                            id: 'btnConfirmarImportar',
                            onClick: this.confirmarImportacion,
                            disabled: !this.archivo || this.loading
                        }, [
                            this.loading ? 'Importando...' : 'Importar'
                        ])
                    ])
                ])
            ])
        ]);
    }
};