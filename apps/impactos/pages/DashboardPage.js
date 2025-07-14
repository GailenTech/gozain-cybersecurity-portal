// Dashboard de Impactos de Negocio
import { ref, inject, onMounted, computed, h } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const organization = inject('organization');
        const loading = ref(false);
        
        // Estado del dashboard
        const estadisticas = ref({
            pendientes: 0,
            completados7dias: 0,
            tareasPendientes: 0,
            recientes: [],
            actividad: [],
            porTipo: {}
        });

        const impactosRecientes = ref([]);
        const actividadReciente = ref([]);

        // Computadas
        const tieneImpactosRecientes = computed(() => {
            return impactosRecientes.value && impactosRecientes.value.length > 0;
        });

        const tieneActividad = computed(() => {
            return actividadReciente.value && actividadReciente.value.length > 0;
        });

        // Métodos
        const cargarDashboard = async () => {
            loading.value = true;
            try {
                const [stats, recientes, actividad] = await Promise.all([
                    api.get('/impactos/estadisticas'),
                    api.get('/impactos/recientes?limit=10'),
                    api.get('/impactos/actividad?limit=15')
                ]);

                estadisticas.value = stats;
                impactosRecientes.value = recientes;
                actividadReciente.value = actividad;
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                mostrarError('Error al cargar el dashboard');
            } finally {
                loading.value = false;
            }
        };

        const crearNuevoImpacto = () => {
            const eventBus = inject('eventBus');
            eventBus.emit('impactos:showModal', { type: 'nuevo' });
        };

        const verDetalleImpacto = (impacto) => {
            const eventBus = inject('eventBus');
            eventBus.emit('impactos:showModal', { type: 'detalle', impacto });
        };

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

        const getTipoIcon = (tipo) => {
            const iconos = {
                'alta_empleado': 'bi-person-plus',
                'baja_empleado': 'bi-person-dash',
                'nuevo_cliente': 'bi-building',
                'cambio_config': 'bi-gear'
            };
            return iconos[tipo] || 'bi-circle';
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearFechaHora = (fecha) => {
            return new Date(fecha).toLocaleString('es-ES');
        };

        const mostrarError = (mensaje) => {
            console.error(mensaje);
        };

        // Lifecycle
        onMounted(() => {
            cargarDashboard();
        });

        return {
            loading,
            estadisticas,
            impactosRecientes,
            actividadReciente,
            tieneImpactosRecientes,
            tieneActividad,
            cargarDashboard,
            crearNuevoImpacto,
            verDetalleImpacto,
            getEstadoClass,
            getEstadoText,
            getTipoIcon,
            formatearFecha,
            formatearFechaHora
        };
    },

    render() {
        return h('div', { class: 'dashboard-impactos' }, [
            // Acciones rápidas  
            h('div', { class: 'row mb-4' }, [
                h('div', { class: 'col-md-3' }, [
                    h('div', { 
                        class: 'card border-warning cursor-pointer',
                        onClick: this.crearNuevoImpacto
                    }, [
                        h('div', { class: 'card-body text-center' }, [
                            h('h1', { class: 'text-warning mb-0' }, [
                                h('i', { class: 'bi bi-plus-circle' })
                            ]),
                            h('p', { class: 'mb-0' }, 'Nuevo Impacto')
                        ])
                    ])
                ]),
                h('div', { class: 'col-md-3' }, [
                    h('div', { class: 'card border-warning' }, [
                        h('div', { class: 'card-body text-center' }, [
                            h('h1', { class: 'text-warning mb-0' }, this.estadisticas.pendientes),
                            h('p', { class: 'mb-0' }, 'Pendientes')
                        ])
                    ])
                ]),
                h('div', { class: 'col-md-3' }, [
                    h('div', { class: 'card border-success' }, [
                        h('div', { class: 'card-body text-center' }, [
                            h('h1', { class: 'text-success mb-0' }, this.estadisticas.completados7dias),
                            h('p', { class: 'mb-0' }, 'Completados (7 días)')
                        ])
                    ])
                ]),
                h('div', { class: 'col-md-3' }, [
                    h('div', { class: 'card border-info' }, [
                        h('div', { class: 'card-body text-center' }, [
                            h('h1', { class: 'text-info mb-0' }, this.estadisticas.tareasPendientes),
                            h('p', { class: 'mb-0' }, 'Tareas Pendientes')
                        ])
                    ])
                ])
            ]),

            h('div', { class: 'row' }, [
                // Impactos Recientes
                h('div', { class: 'col-md-6' }, [
                    h('div', { class: 'card' }, [
                        h('div', { class: 'card-header d-flex justify-content-between align-items-center' }, [
                            h('h5', { class: 'mb-0' }, 'Impactos Recientes'),
                            h('button', {
                                class: 'btn btn-sm btn-outline-primary',
                                onClick: this.cargarDashboard,
                                disabled: this.loading
                            }, [
                                h('i', { class: `bi bi-arrow-clockwise ${this.loading ? 'fa-spin' : ''}` })
                            ])
                        ]),
                        h('div', { class: 'card-body', style: 'max-height: 400px; overflow-y: auto;' }, [
                            this.loading ? 
                                h('div', { class: 'text-center py-4' }, [
                                    h('div', { class: 'spinner-border spinner-border-sm text-primary' }),
                                    h('p', { class: 'mt-2 mb-0 text-muted' }, 'Cargando...')
                                ]) :
                            !this.tieneImpactosRecientes ?
                                h('div', { class: 'text-center py-4 text-muted' }, [
                                    h('i', { class: 'bi bi-inbox display-4' }),
                                    h('p', { class: 'mt-2 mb-0' }, 'No hay impactos recientes')
                                ]) :
                                h('div', {},
                                    this.impactosRecientes.map(impacto => 
                                        h('div', {
                                            key: impacto.id,
                                            class: 'border-bottom pb-2 mb-2 cursor-pointer hover-bg-light',
                                            onClick: () => this.verDetalleImpacto(impacto)
                                        }, [
                                            h('div', { class: 'd-flex justify-content-between align-items-start' }, [
                                                h('div', { class: 'flex-grow-1' }, [
                                                    h('div', { class: 'd-flex align-items-center mb-1' }, [
                                                        h('i', { class: `${this.getTipoIcon(impacto.tipo)} me-2 text-primary` }),
                                                        h('h6', { class: 'mb-0' }, impacto.descripcion || 'Sin descripción')
                                                    ]),
                                                    h('small', { class: 'text-muted' }, `${impacto.tipo_nombre} - ${this.formatearFecha(impacto.fecha_creacion)}`)
                                                ]),
                                                h('span', { class: `badge ${this.getEstadoClass(impacto.estado)}` }, this.getEstadoText(impacto.estado))
                                            ])
                                        ])
                                    )
                                )
                        ])
                    ])
                ]),

                // Actividad Reciente
                h('div', { class: 'col-md-6' }, [
                    h('div', { class: 'card' }, [
                        h('div', { class: 'card-header' }, [
                            h('h5', { class: 'mb-0' }, 'Actividad Reciente')
                        ]),
                        h('div', { class: 'card-body', style: 'max-height: 400px; overflow-y: auto;' }, [
                            this.loading ? 
                                h('div', { class: 'text-center py-4' }, [
                                    h('div', { class: 'spinner-border spinner-border-sm text-primary' }),
                                    h('p', { class: 'mt-2 mb-0 text-muted' }, 'Cargando...')
                                ]) :
                            !this.tieneActividad ?
                                h('div', { class: 'text-center py-4 text-muted' }, [
                                    h('i', { class: 'bi bi-clock-history display-4' }),
                                    h('p', { class: 'mt-2 mb-0' }, 'No hay actividad reciente')
                                ]) :
                                h('div', { class: 'timeline' },
                                    this.actividadReciente.map((actividad, index) => 
                                        h('div', {
                                            key: actividad.id || index,
                                            class: 'timeline-item d-flex mb-3'
                                        }, [
                                            h('div', { class: 'timeline-marker me-3' }, [
                                                h('div', { class: 'rounded-circle bg-primary', style: 'width: 10px; height: 10px;' })
                                            ]),
                                            h('div', { class: 'timeline-content flex-grow-1' }, [
                                                h('h6', { class: 'mb-1' }, actividad.descripcion),
                                                h('small', { class: 'text-muted' }, `${actividad.usuario || 'Sistema'} - ${this.formatearFechaHora(actividad.fecha)}`)
                                            ])
                                        ])
                                    )
                                )
                        ])
                    ])
                ])
            ]),

            // Resumen por tipos
            Object.keys(this.estadisticas.porTipo || {}).length > 0 ?
                h('div', { class: 'row mt-4' }, [
                    h('div', { class: 'col-12' }, [
                        h('div', { class: 'card' }, [
                            h('div', { class: 'card-header' }, [
                                h('h5', { class: 'mb-0' }, 'Tipos de Impacto')
                            ]),
                            h('div', { class: 'card-body' }, [
                                h('div', { class: 'row' },
                                    Object.entries(this.estadisticas.porTipo).map(([tipo, cantidad]) => 
                                        h('div', {
                                            key: tipo,
                                            class: 'col-md-3 mb-3'
                                        }, [
                                            h('div', { class: 'text-center' }, [
                                                h('h3', { class: 'text-primary' }, cantidad),
                                                h('p', { class: 'mb-0 text-muted' }, tipo)
                                            ])
                                        ])
                                    )
                                )
                            ])
                        ])
                    ])
                ]) : null
        ]);
    }
};