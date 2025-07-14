/**
 * Componente Modal para Activos
 */
export const ModalActivo = {
    name: 'ModalActivo',
    
    computed: {
        ...window.Vuex.mapState({
            modalData: state => state.modalActivo,
            loading: state => state.loading
        }),
        
        titulo() {
            return this.modalData.modo === 'editar' ? 'Editar Activo' : 'Nuevo Activo';
        },
        
        esEdicion() {
            return this.modalData.modo === 'editar';
        }
    },
    
    data() {
        return {
            form: {
                nombre: '',
                tipo: 'Hardware',
                estado: 'Activo',
                departamento: '',
                responsable: '',
                clasificacion: 'Interno',
                criticidad: 'Normal',
                descripcion: ''
            }
        };
    },
    
    watch: {
        'modalData.show': {
            handler(show) {
                if (show) {
                    this.initForm();
                    // Esperar más tiempo para que el DOM se actualice
                    setTimeout(() => {
                        this.showModal();
                    }, 100);
                } else {
                    // Ocultar modal cuando show es false
                    this.hideModal();
                }
            },
            immediate: true
        }
    },
    
    methods: {
        initForm() {
            if (this.esEdicion && this.modalData.activo) {
                this.form = { ...this.modalData.activo };
            } else {
                this.form = {
                    nombre: '',
                    tipo: 'Hardware',
                    estado: 'Activo',
                    departamento: '',
                    responsable: '',
                    clasificacion: 'Interno',
                    criticidad: 'Normal',
                    descripcion: ''
                };
            }
        },
        
        showModal() {
            const modalElement = document.getElementById('modalActivo');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.show();
            }
        },
        
        hideModal() {
            const modalElement = document.getElementById('modalActivo');
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
            this.$store.commit('HIDE_MODAL_ACTIVO');
        },
        
        async guardarActivo() {
            try {
                if (this.esEdicion) {
                    await this.$store.dispatch('actualizarActivo', {
                        id: this.modalData.activo.id,
                        activo: this.form
                    });
                } else {
                    await this.$store.dispatch('crearActivo', this.form);
                }
                
                // Recargar activos
                await this.$store.dispatch('cargarActivos');
                
                // Cerrar modal
                this.cerrarModal();
            } catch (error) {
                console.error('Error guardando activo:', error);
                alert('Error al guardar el activo');
            }
        }
    },
    
    mounted() {
        // No necesitamos el event listener de Bootstrap ya que controlamos todo desde Vue
    },
    
    render() {
        const { h } = window.Vue;
        
        if (!this.modalData.show) {
            return null;
        }
        
        return h('div', {
            class: 'modal fade',
            id: 'modalActivo',
            tabindex: '-1',
            'aria-labelledby': 'modalActivoTitle',
            'aria-hidden': 'true'
        }, [
            h('div', { class: 'modal-dialog modal-lg' }, [
                h('div', { class: 'modal-content' }, [
                    // Header
                    h('div', { class: 'modal-header' }, [
                        h('h5', { 
                            class: 'modal-title',
                            id: 'modalActivoTitle'
                        }, this.titulo),
                        h('button', {
                            type: 'button',
                            class: 'btn-close',
                            'aria-label': 'Close',
                            onClick: this.cerrarModal
                        })
                    ]),
                    
                    // Body
                    h('div', { class: 'modal-body' }, [
                        h('form', { id: 'formActivo' }, [
                            // Nombre
                            h('div', { class: 'mb-3' }, [
                                h('label', { for: 'nombre', class: 'form-label' }, 'Nombre'),
                                h('input', {
                                    type: 'text',
                                    class: 'form-control',
                                    id: 'nombre',
                                    value: this.form.nombre,
                                    onInput: (e) => this.form.nombre = e.target.value,
                                    required: true
                                })
                            ]),
                            
                            // Fila: Tipo y Estado
                            h('div', { class: 'row mb-3' }, [
                                h('div', { class: 'col-md-6' }, [
                                    h('label', { for: 'tipo', class: 'form-label' }, 'Tipo'),
                                    h('select', {
                                        class: 'form-select',
                                        id: 'tipo',
                                        value: this.form.tipo,
                                        onChange: (e) => this.form.tipo = e.target.value
                                    }, [
                                        h('option', { value: 'Hardware' }, 'Hardware'),
                                        h('option', { value: 'Software' }, 'Software'),
                                        h('option', { value: 'Servicio' }, 'Servicio'),
                                        h('option', { value: 'Información' }, 'Información'),
                                        h('option', { value: 'Personal' }, 'Personal')
                                    ])
                                ]),
                                h('div', { class: 'col-md-6' }, [
                                    h('label', { for: 'estado', class: 'form-label' }, 'Estado'),
                                    h('select', {
                                        class: 'form-select',
                                        id: 'estado',
                                        value: this.form.estado,
                                        onChange: (e) => this.form.estado = e.target.value
                                    }, [
                                        h('option', { value: 'Activo' }, 'Activo'),
                                        h('option', { value: 'Inactivo' }, 'Inactivo'),
                                        h('option', { value: 'En mantenimiento' }, 'En mantenimiento')
                                    ])
                                ])
                            ]),
                            
                            // Fila: Departamento y Responsable
                            h('div', { class: 'row mb-3' }, [
                                h('div', { class: 'col-md-6' }, [
                                    h('label', { for: 'departamento', class: 'form-label' }, 'Departamento'),
                                    h('input', {
                                        type: 'text',
                                        class: 'form-control',
                                        id: 'departamento',
                                        value: this.form.departamento,
                                        onInput: (e) => this.form.departamento = e.target.value
                                    })
                                ]),
                                h('div', { class: 'col-md-6' }, [
                                    h('label', { for: 'responsable', class: 'form-label' }, 'Responsable'),
                                    h('input', {
                                        type: 'text',
                                        class: 'form-control',
                                        id: 'responsable',
                                        value: this.form.responsable,
                                        onInput: (e) => this.form.responsable = e.target.value
                                    })
                                ])
                            ]),
                            
                            // Fila: Clasificación y Criticidad
                            h('div', { class: 'row mb-3' }, [
                                h('div', { class: 'col-md-6' }, [
                                    h('label', { for: 'clasificacion', class: 'form-label' }, 'Clasificación'),
                                    h('select', {
                                        class: 'form-select',
                                        id: 'clasificacion',
                                        value: this.form.clasificacion,
                                        onChange: (e) => this.form.clasificacion = e.target.value
                                    }, [
                                        h('option', { value: 'Público' }, 'Público'),
                                        h('option', { value: 'Interno' }, 'Interno'),
                                        h('option', { value: 'Confidencial' }, 'Confidencial'),
                                        h('option', { value: 'Secreto' }, 'Secreto')
                                    ])
                                ]),
                                h('div', { class: 'col-md-6' }, [
                                    h('label', { for: 'criticidad', class: 'form-label' }, 'Criticidad'),
                                    h('select', {
                                        class: 'form-select',
                                        id: 'criticidad',
                                        value: this.form.criticidad,
                                        onChange: (e) => this.form.criticidad = e.target.value
                                    }, [
                                        h('option', { value: 'Baja' }, 'Baja'),
                                        h('option', { value: 'Normal' }, 'Normal'),
                                        h('option', { value: 'Importante' }, 'Importante'),
                                        h('option', { value: 'Crítica' }, 'Crítica')
                                    ])
                                ])
                            ]),
                            
                            // Descripción
                            h('div', { class: 'mb-3' }, [
                                h('label', { for: 'descripcion', class: 'form-label' }, 'Descripción'),
                                h('textarea', {
                                    class: 'form-control',
                                    id: 'descripcion',
                                    rows: 3,
                                    value: this.form.descripcion,
                                    onInput: (e) => this.form.descripcion = e.target.value
                                })
                            ])
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
                            onClick: this.guardarActivo,
                            disabled: this.loading
                        }, [
                            this.loading ? 'Guardando...' : 'Guardar'
                        ])
                    ])
                ])
            ])
        ]);
    }
};