/**
 * Página Dashboard - Métricas de Ciberseguridad
 */
export const DashboardPage = {
    name: 'DashboardPage',
    
    data() {
        return {
            loading: false
        };
    },
    
    computed: {
        ...window.Vuex.mapState({
            estadisticas: state => state.estadisticas,
            activos: state => state.activos,
            organizationId: state => state.organizationId
        }),
        
        // Métricas básicas
        activosActivos() {
            return this.estadisticas.por_estado?.['Activo'] || 0;
        },
        
        activosInactivos() {
            return this.estadisticas.por_estado?.['Inactivo'] || 0;
        },
        
        activosMantenimiento() {
            return this.estadisticas.por_estado?.['En mantenimiento'] || 0;
        },
        
        // Métricas de criticidad
        activosCriticos() {
            return this.estadisticas.por_criticidad?.['Crítica'] || 0;
        },
        
        activosImportantes() {
            return this.estadisticas.por_criticidad?.['Importante'] || 0;
        },
        
        // Métricas de clasificación
        activosSecretos() {
            return this.estadisticas.por_clasificacion?.['Secreto'] || 0;
        },
        
        activosConfidenciales() {
            return this.estadisticas.por_clasificacion?.['Confidencial'] || 0;
        },
        
        // Métricas de riesgo
        porcentajeCriticos() {
            const total = this.estadisticas.total || 1;
            return Math.round((this.activosCriticos / total) * 100);
        },
        
        porcentajeActivos() {
            const total = this.estadisticas.total || 1;
            return Math.round((this.activosActivos / total) * 100);
        },
        
        activosSinResponsable() {
            if (!this.activos) return 0;
            return this.activos.filter(a => !a.responsable || a.responsable.trim() === '').length;
        },
        
        // Activos por tipo
        activosPorTipo() {
            return this.estadisticas.por_tipo || {};
        }
    },
    
    mounted() {
        this.cargarDatos();
    },
    
    methods: {
        async cargarDatos() {
            this.loading = true;
            try {
                await Promise.all([
                    this.$store.dispatch('cargarEstadisticas'),
                    this.$store.dispatch('cargarActivos')
                ]);
            } finally {
                this.loading = false;
            }
        },
        
        getColorPorcentaje(porcentaje, inverso = false) {
            if (inverso) {
                if (porcentaje >= 80) return 'text-success';
                if (porcentaje >= 60) return 'text-warning';
                return 'text-danger';
            } else {
                if (porcentaje >= 80) return 'text-danger';
                if (porcentaje >= 60) return 'text-warning';
                return 'text-success';
            }
        },
        
        getIconoTipo(tipo) {
            const iconos = {
                'Hardware': 'bi bi-pc-display',
                'Software': 'bi bi-code-square',
                'Servicio': 'bi bi-cloud',
                'Información': 'bi bi-file-earmark-text',
                'Personal': 'bi bi-person'
            };
            return iconos[tipo] || 'bi bi-box';
        }
    },
    
    render() {
        const { h } = window.Vue;
        
        return h('div', { class: 'p-4' }, [
            // Loading
            this.loading && h('div', { class: 'text-center py-5' }, [
                h('div', { class: 'loader' }, [
                    h('div', { class: 'spinner-border text-primary' }),
                    h('p', { class: 'mt-3 text-muted' }, 'Cargando métricas de seguridad...')
                ])
            ]),
            
            // Métricas principales
            !this.loading && h('div', [
                // Row 1: Resumen de estado
                h('div', { class: 'row mb-4' }, [
                    // Total Activos
                    h('div', { class: 'col-md-3 mb-3' }, [
                        h('div', { class: 'card h-100' }, [
                            h('div', { class: 'card-body' }, [
                                h('div', { class: 'd-flex justify-content-between align-items-center' }, [
                                    h('div', [
                                        h('h6', { class: 'text-muted mb-1' }, 'Total Activos'),
                                        h('h2', { class: 'mb-0' }, this.estadisticas.total || 0)
                                    ]),
                                    h('div', { class: 'text-primary' }, [
                                        h('i', { class: 'bi bi-box-seam', style: 'font-size: 2rem;' })
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    
                    // Activos Operativos
                    h('div', { class: 'col-md-3 mb-3' }, [
                        h('div', { class: 'card h-100' }, [
                            h('div', { class: 'card-body' }, [
                                h('div', { class: 'd-flex justify-content-between align-items-center' }, [
                                    h('div', [
                                        h('h6', { class: 'text-muted mb-1' }, 'Operativos'),
                                        h('h2', { class: 'mb-0' }, this.activosActivos),
                                        h('small', { 
                                            class: this.getColorPorcentaje(this.porcentajeActivos, true) 
                                        }, `${this.porcentajeActivos}% del total`)
                                    ]),
                                    h('div', { class: 'text-success' }, [
                                        h('i', { class: 'bi bi-check-circle', style: 'font-size: 2rem;' })
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    
                    // Activos Críticos
                    h('div', { class: 'col-md-3 mb-3' }, [
                        h('div', { class: 'card h-100 border-danger' }, [
                            h('div', { class: 'card-body' }, [
                                h('div', { class: 'd-flex justify-content-between align-items-center' }, [
                                    h('div', [
                                        h('h6', { class: 'text-muted mb-1' }, 'Críticos'),
                                        h('h2', { class: 'mb-0 text-danger' }, this.activosCriticos),
                                        h('small', { class: 'text-muted' }, 
                                            `${this.porcentajeCriticos}% requieren atención`
                                        )
                                    ]),
                                    h('div', { class: 'text-danger' }, [
                                        h('i', { class: 'bi bi-exclamation-triangle', style: 'font-size: 2rem;' })
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    
                    // Sin Responsable
                    h('div', { class: 'col-md-3 mb-3' }, [
                        h('div', { class: 'card h-100' }, [
                            h('div', { class: 'card-body' }, [
                                h('div', { class: 'd-flex justify-content-between align-items-center' }, [
                                    h('div', [
                                        h('h6', { class: 'text-muted mb-1' }, 'Sin Responsable'),
                                        h('h2', { 
                                            class: this.activosSinResponsable > 0 ? 'mb-0 text-warning' : 'mb-0' 
                                        }, this.activosSinResponsable),
                                        h('small', { class: 'text-muted' }, 'Requieren asignación')
                                    ]),
                                    h('div', { class: 'text-warning' }, [
                                        h('i', { class: 'bi bi-person-x', style: 'font-size: 2rem;' })
                                    ])
                                ])
                            ])
                        ])
                    ])
                ]),
                
                // Row 2: Clasificación de Seguridad
                h('div', { class: 'row mb-4' }, [
                    h('div', { class: 'col-md-6 mb-3' }, [
                        h('div', { class: 'card h-100' }, [
                            h('div', { class: 'card-header' }, [
                                h('h6', { class: 'mb-0' }, [
                                    h('i', { class: 'bi bi-shield-lock me-2' }),
                                    'Clasificación de Seguridad'
                                ])
                            ]),
                            h('div', { class: 'card-body' }, [
                                // Secreto
                                h('div', { class: 'd-flex justify-content-between align-items-center mb-3' }, [
                                    h('div', { class: 'd-flex align-items-center' }, [
                                        h('span', { class: 'badge bg-dark me-2' }, 'Secreto'),
                                        h('span', { class: 'text-muted small' }, 'Máxima protección')
                                    ]),
                                    h('strong', this.activosSecretos)
                                ]),
                                // Confidencial
                                h('div', { class: 'd-flex justify-content-between align-items-center mb-3' }, [
                                    h('div', { class: 'd-flex align-items-center' }, [
                                        h('span', { class: 'badge bg-danger me-2' }, 'Confidencial'),
                                        h('span', { class: 'text-muted small' }, 'Acceso restringido')
                                    ]),
                                    h('strong', this.activosConfidenciales)
                                ]),
                                // Interno
                                h('div', { class: 'd-flex justify-content-between align-items-center mb-3' }, [
                                    h('div', { class: 'd-flex align-items-center' }, [
                                        h('span', { class: 'badge bg-warning text-dark me-2' }, 'Interno'),
                                        h('span', { class: 'text-muted small' }, 'Uso interno')
                                    ]),
                                    h('strong', this.estadisticas.por_clasificacion?.['Interno'] || 0)
                                ]),
                                // Público
                                h('div', { class: 'd-flex justify-content-between align-items-center' }, [
                                    h('div', { class: 'd-flex align-items-center' }, [
                                        h('span', { class: 'badge bg-success me-2' }, 'Público'),
                                        h('span', { class: 'text-muted small' }, 'Sin restricciones')
                                    ]),
                                    h('strong', this.estadisticas.por_clasificacion?.['Público'] || 0)
                                ])
                            ])
                        ])
                    ]),
                    
                    // Distribución por Tipo
                    h('div', { class: 'col-md-6 mb-3' }, [
                        h('div', { class: 'card h-100' }, [
                            h('div', { class: 'card-header' }, [
                                h('h6', { class: 'mb-0' }, [
                                    h('i', { class: 'bi bi-pie-chart me-2' }),
                                    'Distribución por Tipo'
                                ])
                            ]),
                            h('div', { class: 'card-body' }, [
                                Object.entries(this.activosPorTipo).map(([tipo, cantidad]) => 
                                    h('div', { 
                                        class: 'd-flex justify-content-between align-items-center mb-2',
                                        key: tipo 
                                    }, [
                                        h('div', { class: 'd-flex align-items-center' }, [
                                            h('i', { class: this.getIconoTipo(tipo) + ' me-2' }),
                                            h('span', tipo)
                                        ]),
                                        h('div', { class: 'd-flex align-items-center' }, [
                                            h('span', { class: 'badge bg-secondary me-2' }, cantidad),
                                            h('div', { 
                                                class: 'progress', 
                                                style: 'width: 100px; height: 8px;' 
                                            }, [
                                                h('div', {
                                                    class: 'progress-bar',
                                                    style: `width: ${(cantidad / this.estadisticas.total * 100)}%`
                                                })
                                            ])
                                        ])
                                    ])
                                )
                            ])
                        ])
                    ])
                ]),
                
                // Row 3: Indicadores de Riesgo
                h('div', { class: 'row mb-4' }, [
                    h('div', { class: 'col-12' }, [
                        h('div', { class: 'card' }, [
                            h('div', { class: 'card-header bg-light' }, [
                                h('h6', { class: 'mb-0' }, [
                                    h('i', { class: 'bi bi-activity me-2' }),
                                    'Indicadores de Riesgo'
                                ])
                            ]),
                            h('div', { class: 'card-body' }, [
                                h('div', { class: 'row' }, [
                                    // Activos en mantenimiento
                                    h('div', { class: 'col-md-4 mb-3' }, [
                                        h('div', { class: 'text-center' }, [
                                            h('h3', { class: 'text-warning mb-1' }, this.activosMantenimiento),
                                            h('p', { class: 'text-muted mb-0' }, 'En mantenimiento'),
                                            h('small', { class: 'text-muted' }, 
                                                'Temporalmente no disponibles'
                                            )
                                        ])
                                    ]),
                                    
                                    // Activos importantes
                                    h('div', { class: 'col-md-4 mb-3' }, [
                                        h('div', { class: 'text-center' }, [
                                            h('h3', { class: 'text-info mb-1' }, this.activosImportantes),
                                            h('p', { class: 'text-muted mb-0' }, 'Importantes'),
                                            h('small', { class: 'text-muted' }, 
                                                'Requieren monitoreo constante'
                                            )
                                        ])
                                    ]),
                                    
                                    // Activos inactivos
                                    h('div', { class: 'col-md-4 mb-3' }, [
                                        h('div', { class: 'text-center' }, [
                                            h('h3', { class: 'text-secondary mb-1' }, this.activosInactivos),
                                            h('p', { class: 'text-muted mb-0' }, 'Inactivos'),
                                            h('small', { class: 'text-muted' }, 
                                                'Evaluar necesidad o eliminar'
                                            )
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ])
        ]);
    }
};