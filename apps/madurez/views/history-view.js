// Vista del Histórico de Evaluaciones de Madurez
export default class HistoryView {
    constructor(container, apiService) {
        this.container = container;
        this.api = apiService;
    }
    
    async render() {
        try {
            // Cargar datos históricos
            const history = await this.api.get('/madurez/history');
            
            this.container.innerHTML = `
                <div class="history-view fade-in">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 class="mb-0">
                                <i class="bi bi-clock-history text-primary"></i>
                                Histórico de Evaluaciones
                            </h4>
                            <small class="text-muted">Evolución de la madurez en ciberseguridad</small>
                        </div>
                        <button class="btn btn-outline-secondary" id="btnVolver">
                            <i class="bi bi-arrow-left"></i> Volver
                        </button>
                    </div>
                    
                    ${history.evolution && history.evolution.length > 0 ? 
                        this.renderHistoryContent(history) : 
                        this.renderEmptyHistory()
                    }
                </div>
            `;
            
            this.setupEventListeners();
            
            // Cargar gráfico si hay datos
            if (history.evolution && history.evolution.length > 1) {
                await this.loadChartJS();
                this.createEvolutionChart(history.evolution);
            }
            
        } catch (error) {
            console.error('Error cargando histórico:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle"></i> 
                    Error al cargar el histórico: ${error.message}
                </div>
            `;
        }
    }
    
    renderHistoryContent(history) {
        return `
            <!-- Resumen -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-bg-primary">
                        <div class="card-body">
                            <h6 class="card-title">Total Evaluaciones</h6>
                            <h3 class="mb-0">${history.assessments.length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-bg-success">
                        <div class="card-body">
                            <h6 class="card-title">Puntuación Actual</h6>
                            <h3 class="mb-0">${this.getLatestScore(history.evolution)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-bg-info">
                        <div class="card-body">
                            <h6 class="card-title">Mejora Total</h6>
                            <h3 class="mb-0">${this.getTotalImprovement(history.evolution)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-bg-warning">
                        <div class="card-body">
                            <h6 class="card-title">Última Evaluación</h6>
                            <h3 class="mb-0">${this.getLastEvaluationDate(history.evolution)}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Gráfico de evolución -->
            ${history.evolution.length > 1 ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-graph-up"></i>
                            Evolución de la Puntuación
                        </h5>
                    </div>
                    <div class="card-body">
                        <canvas id="evolutionChart" width="800" height="300"></canvas>
                    </div>
                </div>
            ` : ''}
            
            <!-- Lista de evaluaciones -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-list"></i>
                        Evaluaciones Completadas
                    </h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Evaluación</th>
                                    <th>Fecha Completado</th>
                                    <th>Puntuación</th>
                                    <th>Estado</th>
                                    <th>Firmado Por</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderAssessmentsTable(history.assessments)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderEmptyHistory() {
        return `
            <div class="text-center py-5">
                <i class="bi bi-clock-history display-1 text-muted mb-4"></i>
                <h3 class="text-muted mb-3">No hay evaluaciones completadas</h3>
                <p class="text-muted mb-4">
                    Completa tu primera evaluación de madurez para comenzar a ver el histórico de progreso.
                </p>
                <button class="btn btn-primary" id="btnNuevaEvaluacion">
                    <i class="bi bi-plus-circle"></i> Nueva Evaluación
                </button>
            </div>
        `;
    }
    
    renderAssessmentsTable(assessments) {
        return assessments.map(assessment => `
            <tr>
                <td>
                    <strong>${assessment.nombre}</strong>
                    <br>
                    <small class="text-muted">${assessment.descripcion || ''}</small>
                </td>
                <td>${new Date(assessment.fecha_completado).toLocaleDateString()}</td>
                <td>
                    <span class="badge bg-${this.getScoreBadgeClass(assessment.resultados.puntuacion_total)} fs-6">
                        ${assessment.resultados.puntuacion_total.toFixed(1)}/4.0
                    </span>
                </td>
                <td>
                    <span class="badge ${this.getEstadoBadgeClass(assessment.estado)}">
                        ${this.getEstadoText(assessment.estado)}
                    </span>
                </td>
                <td>${assessment.firmado_por || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="window.gozainApp.navigation.getCurrentApp().verDashboard('${assessment.id}')">
                        <i class="bi bi-bar-chart"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    getLatestScore(evolution) {
        if (!evolution || evolution.length === 0) return '-';
        return evolution[evolution.length - 1].puntuacion_total.toFixed(1);
    }
    
    getTotalImprovement(evolution) {
        if (!evolution || evolution.length < 2) return '-';
        const first = evolution[0].puntuacion_total;
        const latest = evolution[evolution.length - 1].puntuacion_total;
        const improvement = latest - first;
        return improvement >= 0 ? `+${improvement.toFixed(1)}` : improvement.toFixed(1);
    }
    
    getLastEvaluationDate(evolution) {
        if (!evolution || evolution.length === 0) return '-';
        return new Date(evolution[evolution.length - 1].fecha).toLocaleDateString();
    }
    
    getScoreBadgeClass(score) {
        if (score >= 3.5) return 'success';
        if (score >= 2.5) return 'warning';
        if (score >= 1.5) return 'danger';
        return 'secondary';
    }
    
    getEstadoBadgeClass(estado) {
        const clases = {
            'completado': 'bg-success',
            'firmado': 'bg-primary'
        };
        return clases[estado] || 'bg-secondary';
    }
    
    getEstadoText(estado) {
        const textos = {
            'completado': 'Completado',
            'firmado': 'Firmado'
        };
        return textos[estado] || estado;
    }
    
    async loadChartJS() {
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            document.head.appendChild(script);
            
            return new Promise((resolve) => {
                script.onload = resolve;
            });
        }
    }
    
    createEvolutionChart(evolution) {
        const ctx = document.getElementById('evolutionChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: evolution.map(e => new Date(e.fecha).toLocaleDateString()),
                datasets: [{
                    label: 'Puntuación de Madurez',
                    data: evolution.map(e => e.puntuacion_total),
                    borderColor: 'rgba(76, 172, 254, 1)',
                    backgroundColor: 'rgba(76, 172, 254, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(76, 172, 254, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4,
                        ticks: {
                            stepSize: 0.5
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const assessment = evolution[context.dataIndex];
                                return `Evaluación: ${assessment.nombre}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    setupEventListeners() {
        // Volver
        const btnVolver = this.container.querySelector('#btnVolver');
        if (btnVolver) {
            btnVolver.addEventListener('click', () => {
                this.volverADashboard();
            });
        }
        
        // Nueva evaluación (desde vista vacía)
        const btnNuevaEvaluacion = this.container.querySelector('#btnNuevaEvaluacion');
        if (btnNuevaEvaluacion) {
            btnNuevaEvaluacion.addEventListener('click', () => {
                this.nuevaEvaluacion();
            });
        }
    }
    
    volverADashboard() {
        if (window.gozainApp && window.gozainApp.navigation) {
            const app = window.gozainApp.navigation.getCurrentApp();
            if (app && typeof app.mostrarVistaDashboard === 'function') {
                app.mostrarVistaDashboard();
            }
        }
    }
    
    nuevaEvaluacion() {
        if (window.gozainApp && window.gozainApp.navigation) {
            const app = window.gozainApp.navigation.getCurrentApp();
            if (app && typeof app.mostrarModalNuevaEvaluacion === 'function') {
                app.mostrarModalNuevaEvaluacion();
            }
        }
    }
}