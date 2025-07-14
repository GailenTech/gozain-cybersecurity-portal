/**
 * Página de Lista de Inventario - Completamente independiente
 */
export const InventarioPage = {
    name: 'InventarioPage',
    
    data() {
        return {
            loading: false,
            filtroLocal: {
                tipo: '',
                departamento: '',
                busqueda: ''
            }
        };
    },
    
    computed: {
        ...window.Vuex.mapState({
            activos: state => state.activos,
            departamentos: state => state.departamentos,
            filtros: state => state.filtros
        }),
        
        ...window.Vuex.mapGetters(['tiposActivo'])
    },
    
    mounted() {
        console.log('InventarioPage mounted');
        this.cargarDatos();
        
        // Sincronizar filtros
        this.filtroLocal = { ...this.filtros };
    },
    
    methods: {
        async cargarDatos() {
            this.loading = true;
            try {
                await this.$store.dispatch('cargarActivos');
            } finally {
                this.loading = false;
            }
        },
        
        nuevoActivo() {
            this.$store.commit('SHOW_MODAL_ACTIVO', { modo: 'nuevo' });
        },
        
        editarActivo(activo) {
            this.$store.commit('SHOW_MODAL_ACTIVO', { modo: 'editar', activo });
        },
        
        async eliminarActivo(id) {
            await this.$store.dispatch('eliminarActivo', id);
        },
        
        aplicarFiltros() {
            this.$store.commit('SET_FILTROS', this.filtroLocal);
            this.cargarDatos();
        },
        
        limpiarFiltros() {
            this.filtroLocal = {
                tipo: '',
                departamento: '',
                busqueda: ''
            };
            this.$store.commit('RESET_FILTROS');
            this.cargarDatos();
        },
        
        getEstadoClass(estado) {
            const clases = {
                'Activo': 'badge bg-success',
                'Inactivo': 'badge bg-secondary',
                'En mantenimiento': 'badge bg-warning text-dark'
            };
            return clases[estado] || 'badge bg-secondary';
        },
        
        getCriticidadClass(criticidad) {
            const clases = {
                'Baja': 'badge bg-info text-dark',
                'Normal': 'badge bg-primary',
                'Importante': 'badge bg-warning text-dark',
                'Crítica': 'badge bg-danger'
            };
            return clases[criticidad] || 'badge bg-secondary';
        }
    },
    
    render() {
        const { h } = window.Vue;
        
        return h('div', { class: 'p-4' }, [
            // Botón de nuevo activo alineado a la derecha
            h('div', { class: 'd-flex justify-content-end mb-3' }, [
                h('button', {
                    class: 'btn btn-primary',
                    id: 'btnNuevoActivo',
                    onClick: this.nuevoActivo
                }, [
                    h('i', { class: 'bi bi-plus-circle me-2' }),
                    'Nuevo Activo'
                ])
            ]),
            
            // Filtros
            h('div', { class: 'card mb-3' }, [
                h('div', { class: 'card-body' }, [
                    h('div', { class: 'row g-3' }, [
                        // Tipo
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Tipo de Activo'),
                            h('select', {
                                class: 'form-select',
                                id: 'filtroTipo',
                                value: this.filtroLocal.tipo,
                                onChange: (e) => {
                                    this.filtroLocal.tipo = e.target.value;
                                    this.aplicarFiltros();
                                }
                            }, [
                                h('option', { value: '' }, 'Todos'),
                                ...this.tiposActivo.map(tipo => 
                                    h('option', { value: tipo }, tipo)
                                )
                            ])
                        ]),
                        
                        // Departamento
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Departamento'),
                            h('select', {
                                class: 'form-select',
                                id: 'filtroDepartamento',
                                value: this.filtroLocal.departamento,
                                onChange: (e) => {
                                    this.filtroLocal.departamento = e.target.value;
                                    this.aplicarFiltros();
                                }
                            }, [
                                h('option', { value: '' }, 'Todos'),
                                ...this.departamentos.map(depto => 
                                    h('option', { value: depto }, depto)
                                )
                            ])
                        ]),
                        
                        // Búsqueda
                        h('div', { class: 'col-md-4' }, [
                            h('label', { class: 'form-label' }, 'Buscar'),
                            h('div', { class: 'input-group' }, [
                                h('input', {
                                    type: 'text',
                                    class: 'form-control',
                                    id: 'filtroBusqueda',
                                    placeholder: 'Buscar por nombre, responsable...',
                                    value: this.filtroLocal.busqueda,
                                    onInput: (e) => {
                                        this.filtroLocal.busqueda = e.target.value;
                                    },
                                    onKeyup: (e) => {
                                        if (e.key === 'Enter') {
                                            this.aplicarFiltros();
                                        }
                                    }
                                }),
                                h('button', {
                                    class: 'btn btn-outline-secondary',
                                    id: 'btnBuscar',
                                    onClick: this.aplicarFiltros
                                }, [
                                    h('i', { class: 'bi bi-search' })
                                ])
                            ])
                        ]),
                        
                        // Limpiar
                        h('div', { class: 'col-md-2 d-flex align-items-end' }, [
                            h('button', {
                                class: 'btn btn-outline-secondary w-100',
                                onClick: this.limpiarFiltros
                            }, [
                                h('i', { class: 'bi bi-x-circle me-2' }),
                                'Limpiar'
                            ])
                        ])
                    ])
                ])
            ]),
            
            // Tabla
            h('div', { class: 'card' }, [
                h('div', { class: 'card-body' }, [
                    this.loading 
                        ? h('div', { class: 'text-center' }, [
                            h('div', { class: 'spinner-border' })
                          ])
                        : h('div', { class: 'table-responsive' }, [
                            h('table', { class: 'table table-hover' }, [
                                h('thead', [
                                    h('tr', [
                                        h('th', 'Tipo'),
                                        h('th', 'Nombre'),
                                        h('th', 'Responsable'),
                                        h('th', 'Departamento'),
                                        h('th', 'Estado'),
                                        h('th', 'Criticidad'),
                                        h('th', 'Acciones')
                                    ])
                                ]),
                                h('tbody', { id: 'tablaActivos' }, 
                                    this.activos.length === 0
                                        ? [h('tr', [
                                            h('td', { 
                                                colspan: 7, 
                                                class: 'text-center text-muted py-4' 
                                            }, 'No se encontraron activos')
                                          ])]
                                        : this.activos.map(activo => 
                                            h('tr', { key: activo.id }, [
                                                h('td', [
                                                    h('span', { class: 'badge bg-secondary' }, 
                                                        activo.tipo || activo.tipo_activo
                                                    )
                                                ]),
                                                h('td', activo.nombre),
                                                h('td', activo.responsable || '-'),
                                                h('td', activo.departamento || '-'),
                                                h('td', [
                                                    h('span', { class: this.getEstadoClass(activo.estado) }, 
                                                        activo.estado
                                                    )
                                                ]),
                                                h('td', [
                                                    h('span', { class: this.getCriticidadClass(activo.criticidad) }, 
                                                        activo.criticidad
                                                    )
                                                ]),
                                                h('td', [
                                                    h('button', {
                                                        class: 'btn btn-sm btn-outline-primary me-1',
                                                        onClick: () => this.editarActivo(activo)
                                                    }, [
                                                        h('i', { class: 'bi bi-pencil' })
                                                    ]),
                                                    h('button', {
                                                        class: 'btn btn-sm btn-outline-danger',
                                                        onClick: () => this.eliminarActivo(activo.id)
                                                    }, [
                                                        h('i', { class: 'bi bi-trash' })
                                                    ])
                                                ])
                                            ])
                                        )
                                )
                            ])
                          ])
                ])
            ])
        ]);
    }
};