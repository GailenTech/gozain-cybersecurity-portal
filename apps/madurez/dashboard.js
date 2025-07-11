// Dashboard principal del módulo de Madurez
export default class MadurezDashboard {
    constructor(container, apiService) {
        this.container = container;
        this.api = apiService;
    }
    
    async render() {
        try {
            // Cargar datos de resumen
            const assessments = await this.api.get('/madurez/assessments');
            const history = await this.api.get('/madurez/history');
            
            this.container.innerHTML = `
                <div class="madurez-dashboard">
                    <!-- Resumen de evaluaciones -->
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="bi bi-clipboard-check"></i>
                                        Evaluaciones Recientes
                                    </h5>
                                </div>
                                <div class="card-body">
                                    ${this.renderRecentAssessments(assessments)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="bi bi-graph-up"></i>
                                        Progreso de Madurez
                                    </h5>
                                </div>
                                <div class="card-body">
                                    ${this.renderProgressChart(history)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Acciones rápidas -->
                    <div class="row">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="bi bi-lightning"></i>
                                        Acciones Rápidas
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-3">
                                            <button class="btn btn-primary w-100 h-100" id="btnNuevaEvaluacion">
                                                <i class="bi bi-plus-circle d-block mb-2" style="font-size: 2rem;"></i>
                                                Nueva Evaluación
                                            </button>
                                        </div>
                                        <div class="col-md-3">
                                            <button class="btn btn-outline-success w-100 h-100" id="btnVerEvaluaciones">
                                                <i class="bi bi-list-check d-block mb-2" style="font-size: 2rem;"></i>
                                                Ver Evaluaciones
                                            </button>
                                        </div>
                                        <div class="col-md-3">
                                            <button class="btn btn-outline-info w-100 h-100" id="btnHistorico">
                                                <i class="bi bi-clock-history d-block mb-2" style="font-size: 2rem;"></i>
                                                Histórico
                                            </button>
                                        </div>
                                        <div class="col-md-3">
                                            <button class="btn btn-outline-secondary w-100 h-100" id="btnPlantillas">
                                                <i class="bi bi-file-earmark-text d-block mb-2" style="font-size: 2rem;"></i>
                                                Plantillas
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error al cargar el dashboard. Inténtalo de nuevo.
                </div>
            `;
        }
    }
    
    renderRecentAssessments(assessments) {
        if (assessments.length === 0) {
            return `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-clipboard-x d-block mb-2" style="font-size: 3rem;"></i>
                    <p>No hay evaluaciones aún</p>
                    <button class="btn btn-primary btn-sm" id="btnCrearPrimera">
                        Crear primera evaluación
                    </button>
                </div>
            `;
        }
        
        const recientes = assessments.slice(0, 3);
        return `
            <div class="list-group list-group-flush">
                ${recientes.map(assessment => `
                    <div class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">${assessment.nombre}</div>
                            <small class="text-muted">
                                ${new Date(assessment.fecha_inicio).toLocaleDateString()}
                            </small>
                        </div>
                        <span class="badge ${this.getEstadoBadgeClass(assessment.estado)} rounded-pill">
                            ${this.getEstadoText(assessment.estado)}
                        </span>
                    </div>
                `).join('')}
            </div>
            ${assessments.length > 3 ? 
                `<div class="card-footer text-center">
                    <button class="btn btn-outline-primary btn-sm" id="btnVerTodas">
                        Ver todas las evaluaciones
                    </button>
                </div>` : ''
            }
        `;
    }
    
    renderProgressChart(history) {
        if (!history.evolution || history.evolution.length === 0) {
            return `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-graph-up-arrow d-block mb-2" style="font-size: 3rem;"></i>
                    <p>No hay datos de progreso aún</p>
                </div>
            `;
        }
        
        // Mostrar evolución simple
        const latest = history.evolution[history.evolution.length - 1];
        const previous = history.evolution.length > 1 ? history.evolution[history.evolution.length - 2] : null;
        
        let trend = '';
        if (previous) {
            const change = latest.puntuacion_total - previous.puntuacion_total;
            if (change > 0) {
                trend = `
                    <div class="text-success">
                        <i class="bi bi-arrow-up"></i> +${change.toFixed(1)} desde la evaluación anterior
                    </div>
                `;
            } else if (change < 0) {
                trend = `
                    <div class="text-danger">
                        <i class="bi bi-arrow-down"></i> ${change.toFixed(1)} desde la evaluación anterior
                    </div>
                `;
            } else {
                trend = `
                    <div class="text-muted">
                        <i class="bi bi-dash"></i> Sin cambios desde la evaluación anterior
                    </div>
                `;
            }
        }
        
        return `
            <div class="text-center">
                <div class="display-4 text-primary mb-2">${latest.puntuacion_total.toFixed(1)}</div>
                <div class="text-muted mb-2">Puntuación actual</div>
                ${trend}
                <div class="mt-3">
                    <small class="text-muted">
                        Última evaluación: ${new Date(latest.fecha).toLocaleDateString()}
                    </small>
                </div>
            </div>
        `;
    }
    
    getEstadoBadgeClass(estado) {
        const clases = {
            'abierto': 'bg-warning',
            'completado': 'bg-success',
            'firmado': 'bg-primary'
        };
        return clases[estado] || 'bg-secondary';
    }
    
    getEstadoText(estado) {
        const textos = {
            'abierto': 'Abierto',
            'completado': 'Completado',
            'firmado': 'Firmado'
        };
        return textos[estado] || estado;
    }
    
    setupEventListeners() {
        // Nueva evaluación
        const btnNuevaEvaluacion = this.container.querySelector('#btnNuevaEvaluacion');
        if (btnNuevaEvaluacion) {
            btnNuevaEvaluacion.addEventListener('click', () => {
                this.triggerEvent('madurez:nueva');
            });
        }
        
        // Ver evaluaciones
        const btnVerEvaluaciones = this.container.querySelector('#btnVerEvaluaciones');
        if (btnVerEvaluaciones) {
            btnVerEvaluaciones.addEventListener('click', () => {
                this.triggerEvent('madurez:lista');
            });
        }
        
        // Histórico
        const btnHistorico = this.container.querySelector('#btnHistorico');
        if (btnHistorico) {
            btnHistorico.addEventListener('click', () => {
                this.triggerEvent('madurez:historico');
            });
        }
        
        // Crear primera evaluación
        const btnCrearPrimera = this.container.querySelector('#btnCrearPrimera');
        if (btnCrearPrimera) {
            btnCrearPrimera.addEventListener('click', () => {
                this.triggerEvent('madurez:nueva');
            });
        }
        
        // Ver todas
        const btnVerTodas = this.container.querySelector('#btnVerTodas');
        if (btnVerTodas) {
            btnVerTodas.addEventListener('click', () => {
                this.triggerEvent('madurez:lista');
            });
        }
        
        // Plantillas
        const btnPlantillas = this.container.querySelector('#btnPlantillas');
        if (btnPlantillas) {
            btnPlantillas.addEventListener('click', () => {
                this.triggerEvent('madurez:plantillas');
            });
        }
    }
    
    triggerEvent(eventName) {
        // Triggear eventos en la aplicación principal
        if (window.gozainApp && window.gozainApp.navigation) {
            const app = window.gozainApp.navigation.getCurrentApp();
            if (app) {
                switch(eventName) {
                    case 'madurez:nueva':
                        app.mostrarModalNuevaEvaluacion();
                        break;
                    case 'madurez:lista':
                        app.mostrarVistaLista();
                        break;
                    case 'madurez:historico':
                        app.mostrarHistorico();
                        break;
                    case 'madurez:plantillas':
                        app.mostrarToast('Gestión de plantillas en desarrollo', 'info');
                        break;
                }
            }
        }
    }
}