// Lista de Impactos de Negocio
import { ref, inject, onMounted, computed, reactive, h } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const eventBus = inject('eventBus');
        const organization = inject('organization');
        
        // Estado de la página
        const loading = ref(false);
        const impactos = ref([]);
        
        // Filtros
        const filtros = reactive({
            tipo: '',
            estado: '',
            fechaDesde: '',
            fechaHasta: '',
            usuario: ''
        });

        // Opciones para filtros
        const tiposImpacto = ref([
            { value: 'alta_empleado', label: 'Alta de Empleado' },
            { value: 'baja_empleado', label: 'Baja de Empleado' },
            { value: 'nuevo_cliente', label: 'Nuevo Cliente' },
            { value: 'cambio_config', label: 'Cambio de Configuración' }
        ]);

        const estadosImpacto = ref([
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'procesado', label: 'Procesado' },
            { value: 'error', label: 'Error' },
            { value: 'cancelado', label: 'Cancelado' }
        ]);

        // Computadas
        const impactosFiltrados = computed(() => {
            if (!impactos.value) return [];
            return impactos.value;
        });

        const tieneImpactos = computed(() => {
            return impactosFiltrados.value && impactosFiltrados.value.length > 0;
        });

        // Métodos
        const cargarImpactos = async () => {
            loading.value = true;
            try {
                const params = new URLSearchParams();
                
                // Aplicar filtros
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        params.append(key, filtros[key]);
                    }
                });

                const response = await api.get(`/impactos?${params.toString()}`);
                impactos.value = response || [];
            } catch (error) {
                console.error('Error cargando impactos:', error);
                mostrarError('Error al cargar los impactos');
                impactos.value = [];
            } finally {
                loading.value = false;
            }
        };

        const aplicarFiltros = () => {
            cargarImpactos();
        };

        const limpiarFiltros = () => {
            Object.keys(filtros).forEach(key => {
                filtros[key] = '';
            });
            cargarImpactos();
        };

        const crearNuevoImpacto = () => {
            eventBus.emit('impactos:showModal', { type: 'nuevo' });
        };

        const verDetalleImpacto = (impacto) => {
            eventBus.emit('impactos:showModal', { type: 'detalle', impacto });
        };

        const procesarImpacto = async (impacto) => {
            if (!confirm(`¿Está seguro de que desea procesar el impacto ${impacto.id}?`)) {
                return;
            }

            try {
                await api.post(`/impactos/${impacto.id}/procesar`);
                mostrarExito('Impacto procesado correctamente');
                await cargarImpactos();
            } catch (error) {
                console.error('Error procesando impacto:', error);
                mostrarError('Error al procesar el impacto');
            }
        };

        const exportarImpactos = async () => {
            try {
                const params = new URLSearchParams();
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        params.append(key, filtros[key]);
                    }
                });

                const blob = await api.getBlob(`/impactos/export?${params.toString()}`);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `impactos_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Error exportando impactos:', error);
                mostrarError('Error al exportar los impactos');
            }
        };

        // Utilidades
        const getEstadoClass = (estado) => {
            const clases = {
                'pendiente': 'bg-warning',
                'procesado': 'bg-success', 
                'error': 'bg-danger',
                'cancelado': 'bg-secondary'
            };
            return clases[estado] || 'bg-secondary';
        };

        const getEstadoText = (estado) => {
            const textos = {
                'pendiente': 'Pendiente',
                'procesado': 'Procesado',
                'error': 'Error',
                'cancelado': 'Cancelado'
            };
            return textos[estado] || estado;
        };

        const getTipoLabel = (tipo) => {
            const tipoObj = tiposImpacto.value.find(t => t.value === tipo);
            return tipoObj ? tipoObj.label : tipo;
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearFechaHora = (fecha) => {
            return new Date(fecha).toLocaleString('es-ES');
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
            cargarImpactos();
        });

        return {
            loading,
            impactos,
            filtros,
            tiposImpacto,
            estadosImpacto,
            impactosFiltrados,
            tieneImpactos,
            cargarImpactos,
            aplicarFiltros,
            limpiarFiltros,
            crearNuevoImpacto,
            verDetalleImpacto,
            procesarImpacto,
            exportarImpactos,
            getEstadoClass,
            getEstadoText,
            getTipoLabel,
            formatearFecha,
            formatearFechaHora
        };
    },

    render() {
        return h('div', { class: 'impactos-lista' }, [
            // Filtros
            h('div', { class: 'card mb-4' }, [
                h('div', { class: 'card-header d-flex justify-content-between align-items-center' }, [
                    h('h5', { class: 'mb-0' }, 'Filtros'),
                    h('div', {}, [
                        h('button', {
                            class: 'btn btn-sm btn-outline-primary me-2',
                            onClick: this.exportarImpactos
                        }, [
                            h('i', { class: 'bi bi-download' }),
                            ' Exportar'
                        ]),
                        h('button', {
                            class: 'btn btn-sm btn-primary',
                            onClick: this.crearNuevoImpacto
                        }, [
                            h('i', { class: 'bi bi-plus' }),
                            ' Nuevo Impacto'
                        ])
                    ])
                ]),
                h('div', { class: 'card-body' }, [
                    h('div', { class: 'row g-3' }, [
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Tipo de Impacto'),
                            h('select', {
                                class: 'form-select',
                                'onUpdate:modelValue': (value) => this.filtros.tipo = value,
                                modelValue: this.filtros.tipo
                            }, [
                                h('option', { value: '' }, 'Todos los tipos'),
                                ...this.tiposImpacto.map(tipo => 
                                    h('option', { key: tipo.value, value: tipo.value }, tipo.label)
                                )
                            ])
                        ]),
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Estado'),
                            h('select', {
                                class: 'form-select',
                                'onUpdate:modelValue': (value) => this.filtros.estado = value,
                                modelValue: this.filtros.estado
                            }, [
                                h('option', { value: '' }, 'Todos los estados'),
                                ...this.estadosImpacto.map(estado => 
                                    h('option', { key: estado.value, value: estado.value }, estado.label)
                                )
                            ])
                        ]),
                        h('div', { class: 'col-md-2' }, [
                            h('label', { class: 'form-label' }, 'Fecha Desde'),
                            h('input', {
                                type: 'date',
                                class: 'form-control',
                                'onUpdate:modelValue': (value) => this.filtros.fechaDesde = value,
                                modelValue: this.filtros.fechaDesde
                            })
                        ]),
                        h('div', { class: 'col-md-2' }, [
                            h('label', { class: 'form-label' }, 'Fecha Hasta'),
                            h('input', {
                                type: 'date',
                                class: 'form-control',
                                'onUpdate:modelValue': (value) => this.filtros.fechaHasta = value,
                                modelValue: this.filtros.fechaHasta
                            })
                        ]),
                        h('div', { class: 'col-md-2 d-flex align-items-end' }, [
                            h('div', { class: 'btn-group w-100' }, [
                                h('button', {
                                    class: 'btn btn-primary',
                                    onClick: this.aplicarFiltros,
                                    disabled: this.loading
                                }, [
                                    h('i', { class: 'bi bi-funnel' }),
                                    ' Filtrar'
                                ]),
                                h('button', {
                                    class: 'btn btn-outline-secondary',
                                    onClick: this.limpiarFiltros
                                }, [
                                    h('i', { class: 'bi bi-x' })
                                ])
                            ])
                        ])
                    ])
                ])
            ]),
            
            // Tabla de impactos
            h('div', { class: 'card' }, [
                h('div', { class: 'card-header d-flex justify-content-between align-items-center' }, [
                    h('h5', { class: 'mb-0' }, 'Lista de Impactos'),
                    h('button', {
                        class: 'btn btn-sm btn-outline-primary',
                        onClick: this.cargarImpactos,
                        disabled: this.loading
                    }, [
                        h('i', { class: `bi bi-arrow-clockwise ${this.loading ? 'fa-spin' : ''}` }),
                        ' Actualizar'
                    ])
                ]),
                h('div', { class: 'card-body' }, [
                    // Loading state
                    this.loading ?
                        h('div', { class: 'text-center py-4' }, [
                            h('div', { class: 'spinner-border text-primary' }),
                            h('p', { class: 'mt-2 mb-0 text-muted' }, 'Cargando impactos...')
                        ]) :
                    // Empty state
                    !this.tieneImpactos ?
                        h('div', { class: 'text-center py-5' }, [
                            h('i', { class: 'bi bi-inbox display-4 text-muted' }),
                            h('h5', { class: 'mt-3 text-muted' }, 'No se encontraron impactos'),
                            h('p', { class: 'text-muted' }, 'No hay impactos que coincidan con los filtros seleccionados.'),
                            h('button', {
                                class: 'btn btn-primary',
                                onClick: this.crearNuevoImpacto
                            }, [
                                h('i', { class: 'bi bi-plus' }),
                                ' Crear primer impacto'
                            ])
                        ]) :
                    // Tabla
                    h('div', { class: 'table-responsive' }, [
                        h('table', { class: 'table table-hover', id: 'tablaImpactos' }, [
                            h('thead', {}, [
                                h('tr', {}, [
                                    h('th', {}, 'ID'),
                                    h('th', {}, 'Tipo'),
                                    h('th', {}, 'Descripción'),
                                    h('th', {}, 'Usuario'),
                                    h('th', {}, 'Fecha'),
                                    h('th', {}, 'Estado'),
                                    h('th', {}, 'Acciones')
                                ])
                            ]),
                            h('tbody', {},
                                this.impactosFiltrados.map(impacto => 
                                    h('tr', { key: impacto.id }, [
                                        h('td', {}, [
                                            h('code', {}, impacto.id.substring(0, 8))
                                        ]),
                                        h('td', {}, [
                                            h('span', { class: 'badge bg-secondary' }, this.getTipoLabel(impacto.tipo))
                                        ]),
                                        h('td', {}, [
                                            h('div', {
                                                class: 'text-truncate',
                                                style: 'max-width: 200px;',
                                                title: impacto.descripcion
                                            }, impacto.descripcion || 'Sin descripción')
                                        ]),
                                        h('td', {}, impacto.usuario || '-'),
                                        h('td', {}, this.formatearFecha(impacto.fecha_creacion)),
                                        h('td', {}, [
                                            h('span', {
                                                class: `badge ${this.getEstadoClass(impacto.estado)}`
                                            }, this.getEstadoText(impacto.estado))
                                        ]),
                                        h('td', {}, [
                                            h('div', { class: 'btn-group btn-group-sm' }, [
                                                h('button', {
                                                    class: 'btn btn-outline-primary',
                                                    onClick: () => this.verDetalleImpacto(impacto),
                                                    title: 'Ver detalles'
                                                }, [
                                                    h('i', { class: 'bi bi-eye' })
                                                ]),
                                                impacto.estado === 'pendiente' ?
                                                    h('button', {
                                                        class: 'btn btn-outline-success',
                                                        onClick: () => this.procesarImpacto(impacto),
                                                        title: 'Procesar'
                                                    }, [
                                                        h('i', { class: 'bi bi-play-fill' })
                                                    ]) : null
                                            ].filter(Boolean))
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