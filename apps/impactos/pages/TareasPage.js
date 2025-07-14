// Página de Tareas de Impactos
import { ref, inject, onMounted, computed, reactive, h } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const eventBus = inject('eventBus');
        const organization = inject('organization');
        
        // Estado de la página
        const loading = ref(false);
        const tareas = ref([]);
        const tareasSeleccionadas = ref(new Set());
        
        // Estado de filtros
        const filtros = reactive({
            prioridad: '',
            responsable: '',
            fechaLimite: ''
        });

        // Opciones
        const prioridades = ref([
            { value: 'alta', label: 'Alta', class: 'text-danger' },
            { value: 'media', label: 'Media', class: 'text-warning' },
            { value: 'baja', label: 'Baja', class: 'text-info' }
        ]);

        // Computadas
        const tareasFiltradas = computed(() => {
            if (!tareas.value) return [];
            return tareas.value.filter(tarea => {
                if (filtros.prioridad && tarea.prioridad !== filtros.prioridad) return false;
                if (filtros.responsable && !tarea.responsable?.toLowerCase().includes(filtros.responsable.toLowerCase())) return false;
                if (filtros.fechaLimite && tarea.fecha_limite !== filtros.fechaLimite) return false;
                return true;
            });
        });

        const tieneTareas = computed(() => {
            return tareasFiltradas.value && tareasFiltradas.value.length > 0;
        });

        const todasSeleccionadas = computed(() => {
            return tareasFiltradas.value.length > 0 && 
                   tareasFiltradas.value.every(tarea => tareasSeleccionadas.value.has(tarea.id));
        });

        const algunasSeleccionadas = computed(() => {
            return tareasSeleccionadas.value.size > 0;
        });

        const contadorSeleccionadas = computed(() => {
            return tareasSeleccionadas.value.size;
        });

        // Métodos
        const cargarTareas = async () => {
            loading.value = true;
            try {
                const response = await api.get('/impactos/tareas');
                tareas.value = response || [];
            } catch (error) {
                console.error('Error cargando tareas:', error);
                mostrarError('Error al cargar las tareas');
                tareas.value = [];
            } finally {
                loading.value = false;
            }
        };

        const aplicarFiltros = () => {
            // Los filtros se aplican automáticamente mediante computed
        };

        const limpiarFiltros = () => {
            Object.keys(filtros).forEach(key => {
                filtros[key] = '';
            });
        };

        const toggleSeleccionarTodas = () => {
            if (todasSeleccionadas.value) {
                tareasSeleccionadas.value.clear();
            } else {
                tareasFiltradas.value.forEach(tarea => {
                    tareasSeleccionadas.value.add(tarea.id);
                });
            }
        };

        const toggleSeleccionarTarea = (tareaId) => {
            if (tareasSeleccionadas.value.has(tareaId)) {
                tareasSeleccionadas.value.delete(tareaId);
            } else {
                tareasSeleccionadas.value.add(tareaId);
            }
        };

        const completarTarea = async (tarea) => {
            try {
                await api.post(`/impactos/tareas/${tarea.id}/completar`);
                mostrarExito('Tarea completada correctamente');
                await cargarTareas();
            } catch (error) {
                console.error('Error completando tarea:', error);
                mostrarError('Error al completar la tarea');
            }
        };

        const completarSeleccionadas = async () => {
            if (tareasSeleccionadas.value.size === 0) return;
            
            if (!confirm(`¿Está seguro de que desea completar ${tareasSeleccionadas.value.size} tarea(s)?`)) {
                return;
            }

            try {
                const tareaIds = Array.from(tareasSeleccionadas.value);
                await api.post('/impactos/tareas/completar-masivo', { tareas: tareaIds });
                mostrarExito(`${tareaIds.length} tarea(s) completada(s) correctamente`);
                tareasSeleccionadas.value.clear();
                await cargarTareas();
            } catch (error) {
                console.error('Error completando tareas:', error);
                mostrarError('Error al completar las tareas seleccionadas');
            }
        };

        const posponerSeleccionadas = async () => {
            if (tareasSeleccionadas.value.size === 0) return;

            const nuevaFecha = prompt('Ingrese la nueva fecha límite (YYYY-MM-DD):');
            if (!nuevaFecha) return;

            try {
                const tareaIds = Array.from(tareasSeleccionadas.value);
                await api.post('/impactos/tareas/posponer', { 
                    tareas: tareaIds, 
                    nueva_fecha: nuevaFecha 
                });
                mostrarExito(`${tareaIds.length} tarea(s) pospuesta(s) correctamente`);
                tareasSeleccionadas.value.clear();
                await cargarTareas();
            } catch (error) {
                console.error('Error posponiendo tareas:', error);
                mostrarError('Error al posponer las tareas seleccionadas');
            }
        };

        const verDetalleImpacto = (impactoId) => {
            eventBus.emit('impactos:showModal', { type: 'detalle', impactoId });
        };

        // Utilidades
        const getPrioridadClass = (prioridad) => {
            const clases = {
                'alta': 'text-danger',
                'media': 'text-warning', 
                'baja': 'text-info'
            };
            return clases[prioridad] || 'text-secondary';
        };

        const getPrioridadLabel = (prioridad) => {
            const prioridadObj = prioridades.value.find(p => p.value === prioridad);
            return prioridadObj ? prioridadObj.label : prioridad;
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const esFechaVencida = (fecha) => {
            return new Date(fecha) < new Date();
        };

        const esFechaProxima = (fecha) => {
            const fechaTarea = new Date(fecha);
            const hoy = new Date();
            const diferencia = fechaTarea.getTime() - hoy.getTime();
            const diasDiferencia = diferencia / (1000 * 3600 * 24);
            return diasDiferencia <= 3 && diasDiferencia >= 0;
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
            cargarTareas();
        });

        return {
            loading,
            tareas,
            filtros,
            prioridades,
            tareasSeleccionadas,
            tareasFiltradas,
            tieneTareas,
            todasSeleccionadas,
            algunasSeleccionadas,
            contadorSeleccionadas,
            cargarTareas,
            aplicarFiltros,
            limpiarFiltros,
            toggleSeleccionarTodas,
            toggleSeleccionarTarea,
            completarTarea,
            completarSeleccionadas,
            posponerSeleccionadas,
            verDetalleImpacto,
            getPrioridadClass,
            getPrioridadLabel,
            formatearFecha,
            esFechaVencida,
            esFechaProxima
        };
    },

    render() {
        return h('div', { class: 'tareas-impactos' }, [
            // Filtros y acciones
            h('div', { class: 'card mb-4' }, [
                h('div', { class: 'card-header d-flex justify-content-between align-items-center' }, [
                    h('h5', { class: 'mb-0' }, 'Tareas Pendientes'),
                    h('button', {
                        class: 'btn btn-sm btn-outline-primary',
                        onClick: this.cargarTareas,
                        disabled: this.loading
                    }, [
                        h('i', { class: `bi bi-arrow-clockwise ${this.loading ? 'fa-spin' : ''}` }),
                        ' Actualizar'
                    ])
                ]),
                h('div', { class: 'card-body' }, [
                    h('div', { class: 'row g-3 mb-3' }, [
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Prioridad'),
                            h('select', {
                                class: 'form-select',
                                'onUpdate:modelValue': (value) => this.filtros.prioridad = value,
                                modelValue: this.filtros.prioridad
                            }, [
                                h('option', { value: '' }, 'Todas las prioridades'),
                                ...this.prioridades.map(prioridad => 
                                    h('option', { key: prioridad.value, value: prioridad.value }, prioridad.label)
                                )
                            ])
                        ]),
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Responsable'),
                            h('input', {
                                type: 'text',
                                class: 'form-control',
                                'onUpdate:modelValue': (value) => this.filtros.responsable = value,
                                modelValue: this.filtros.responsable,
                                placeholder: 'Filtrar por responsable'
                            })
                        ]),
                        h('div', { class: 'col-md-3' }, [
                            h('label', { class: 'form-label' }, 'Fecha Límite'),
                            h('input', {
                                type: 'date',
                                class: 'form-control',
                                'onUpdate:modelValue': (value) => this.filtros.fechaLimite = value,
                                modelValue: this.filtros.fechaLimite
                            })
                        ]),
                        h('div', { class: 'col-md-3 d-flex align-items-end' }, [
                            h('button', {
                                class: 'btn btn-outline-secondary w-100',
                                onClick: this.limpiarFiltros
                            }, [
                                h('i', { class: 'bi bi-x' }),
                                ' Limpiar Filtros'
                            ])
                        ])
                    ]),
                    
                    // Acciones masivas
                    this.algunasSeleccionadas ?
                        h('div', {
                            class: 'alert alert-info d-flex justify-content-between align-items-center',
                            id: 'accionesMasivas'
                        }, [
                            h('span', {}, `${this.contadorSeleccionadas} tarea(s) seleccionada(s)`),
                            h('div', { class: 'btn-group btn-group-sm' }, [
                                h('button', {
                                    class: 'btn btn-success',
                                    onClick: this.completarSeleccionadas,
                                    id: 'btnCompletarSeleccionadas'
                                }, [
                                    h('i', { class: 'bi bi-check-all' }),
                                    ' Completar'
                                ]),
                                h('button', {
                                    class: 'btn btn-warning',
                                    onClick: this.posponerSeleccionadas,
                                    id: 'btnPosponer'
                                }, [
                                    h('i', { class: 'bi bi-calendar-plus' }),
                                    ' Posponer'
                                ])
                            ])
                        ]) : null
                ])
            ]),
            
            // Tabla de tareas
            h('div', { class: 'card' }, [
                h('div', { class: 'card-body' }, [
                    // Loading state
                    this.loading ?
                        h('div', { class: 'text-center py-4' }, [
                            h('div', { class: 'spinner-border text-primary' }),
                            h('p', { class: 'mt-2 mb-0 text-muted' }, 'Cargando tareas...')
                        ]) :
                    // Empty state
                    !this.tieneTareas ?
                        h('div', { class: 'text-center py-5' }, [
                            h('i', { class: 'bi bi-check-circle display-4 text-success' }),
                            h('h5', { class: 'mt-3 text-muted' }, 'No hay tareas pendientes'),
                            h('p', { class: 'text-muted' }, 'Todas las tareas han sido completadas o no hay tareas que coincidan con los filtros.')
                        ]) :
                    // Tabla
                    h('div', { class: 'table-responsive' }, [
                        h('table', { class: 'table table-hover', id: 'tablaTareas' }, [
                            h('thead', {}, [
                                h('tr', {}, [
                                    h('th', {}, [
                                        h('input', {
                                            type: 'checkbox',
                                            class: 'form-check-input',
                                            id: 'selectAllTareas',
                                            checked: this.todasSeleccionadas,
                                            onChange: this.toggleSeleccionarTodas
                                        })
                                    ]),
                                    h('th', {}, 'Tarea'),
                                    h('th', {}, 'Responsable'),
                                    h('th', {}, 'Prioridad'),
                                    h('th', {}, 'Fecha Límite'),
                                    h('th', {}, 'Impacto'),
                                    h('th', {}, 'Acciones')
                                ])
                            ]),
                            h('tbody', {},
                                this.tareasFiltradas.map(tarea => 
                                    h('tr', {
                                        key: tarea.id,
                                        class: {
                                            'table-danger': this.esFechaVencida(tarea.fecha_limite),
                                            'table-warning': this.esFechaProxima(tarea.fecha_limite)
                                        }
                                    }, [
                                        h('td', {}, [
                                            h('input', {
                                                type: 'checkbox',
                                                class: 'form-check-input tarea-checkbox',
                                                checked: this.tareasSeleccionadas.has(tarea.id),
                                                onChange: () => this.toggleSeleccionarTarea(tarea.id)
                                            })
                                        ]),
                                        h('td', {}, [
                                            h('div', {}, [
                                                h('strong', {}, tarea.titulo),
                                                tarea.descripcion ?
                                                    h('div', { class: 'text-muted small' }, tarea.descripcion) : null
                                            ])
                                        ]),
                                        h('td', {}, tarea.responsable || 'Sin asignar'),
                                        h('td', {}, [
                                            h('span', { class: this.getPrioridadClass(tarea.prioridad) }, [
                                                h('i', { class: 'bi bi-circle-fill' }),
                                                ' ' + this.getPrioridadLabel(tarea.prioridad)
                                            ])
                                        ]),
                                        h('td', {}, [
                                            h('span', {
                                                class: {
                                                    'text-danger': this.esFechaVencida(tarea.fecha_limite),
                                                    'text-warning': this.esFechaProxima(tarea.fecha_limite)
                                                }
                                            }, [
                                                this.formatearFecha(tarea.fecha_limite),
                                                this.esFechaVencida(tarea.fecha_limite) ?
                                                    h('i', { class: 'bi bi-exclamation-triangle ms-1' }) : null
                                            ])
                                        ]),
                                        h('td', {}, [
                                            h('a', {
                                                href: '#',
                                                onClick: (e) => {
                                                    e.preventDefault();
                                                    this.verDetalleImpacto(tarea.impacto_id);
                                                },
                                                class: 'text-decoration-none'
                                            }, [
                                                h('code', {}, tarea.impacto_id?.substring(0, 8))
                                            ])
                                        ]),
                                        h('td', {}, [
                                            h('button', {
                                                class: 'btn btn-sm btn-outline-success',
                                                onClick: () => this.completarTarea(tarea),
                                                title: 'Completar tarea'
                                            }, [
                                                h('i', { class: 'bi bi-check' })
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