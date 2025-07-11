// Vista del Dashboard de Resultados de Madurez
export default class AssessmentDashboard {
    constructor(container, apiService) {
        this.container = container;
        this.api = apiService;
        this.dashboardData = null;
        this.charts = {};
    }
    
    async render(assessmentId) {
        try {
            // Cargar datos del dashboard
            this.dashboardData = await this.api.get(`/madurez/dashboard/${assessmentId}`);
            
            if (!this.dashboardData) {
                throw new Error('No se encontraron datos del assessment');
            }
            
            // Renderizar la interfaz
            this.renderDashboard();
            
            // Cargar Chart.js si no está disponible
            await this.loadChartJS();
            
            // Crear visualizaciones
            this.createCharts();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle"></i> 
                    Error: ${error.message}
                </div>
            `;
        }
    }
    
    renderDashboard() {
        const assessment = this.dashboardData.assessment;
        const metricas = this.dashboardData.metricas;
        
        this.container.innerHTML = `
            <div class="assessment-dashboard fade-in">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 class="mb-0">
                            <i class="bi bi-bar-chart text-primary"></i>
                            Dashboard - ${assessment.nombre}
                        </h4>
                        <small class="text-muted">
                            Completado el ${new Date(assessment.fecha_completado).toLocaleDateString()} 
                            ${assessment.estado === 'firmado' ? '- Firmado por ' + assessment.firmado_por : ''}
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-secondary" id="btnVolver">
                            <i class="bi bi-arrow-left"></i> Volver
                        </button>
                        <button class="btn btn-outline-primary" id="btnExportar">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                        ${assessment.estado === 'completado' ? 
                            `<button class="btn btn-outline-warning" id="btnFirmar">
                                <i class="bi bi-file-earmark-check"></i> Firmar
                            </button>` : ''
                        }
                    </div>
                </div>
                
                <!-- Métricas principales -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-bg-primary">
                            <div class="card-body">
                                <h6 class="card-title">Puntuación Total</h6>
                                <h2 class="mb-0">${metricas.puntuacion_total.toFixed(1)}/4.0</h2>
                                <small>${metricas.porcentaje_completado}% de madurez</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-info">
                            <div class="card-body">
                                <h6 class="card-title">Dominios Evaluados</h6>
                                <h2 class="mb-0">${metricas.dominios_evaluados}</h2>
                                <small>de ${metricas.total_preguntas} preguntas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-warning">
                            <div class="card-body">
                                <h6 class="card-title">Área Más Débil</h6>
                                <h2 class="mb-0">${metricas.puntuacion_mas_baja.toFixed(1)}</h2>
                                <small>${this.getDominioNombre(metricas.dominio_mas_debil)}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-success">
                            <div class="card-body">
                                <h6 class="card-title">Estado</h6>
                                <h3 class="mb-0">
                                    <span class="badge bg-white text-success">
                                        ${this.getEstadoText(assessment.estado)}
                                    </span>
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gráficos principales -->
                <div class="row mb-4">
                    <!-- Radar Chart -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-radar"></i>
                                    Estado Actual vs Objetivos
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="radarChart" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Gaps Analysis -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-gap"></i>
                                    Análisis de Gaps
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="gapsChart" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Roadmap -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-map"></i>
                                    Roadmap de Mejora
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="roadmapChart" width="800" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Detalles por dominio -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-list-check"></i>
                                    Detalles por Dominio
                                </h5>
                            </div>
                            <div class="card-body">
                                ${this.renderDominiosDetalle()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar event listeners
        this.setupEventListeners();
    }
    
    renderDominiosDetalle() {
        const template = this.dashboardData.template;
        const resultados = this.dashboardData.assessment.resultados;
        
        return template.dominios.map(dominio => {
            const resultado = resultados.dominios.find(r => r.dominio_id === dominio.id);
            const nivel = resultado ? resultado.nivel_actual : 0;
            const porcentaje = Math.round((nivel / 4) * 100);
            
            return `
                <div class="dominio-detalle mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">${dominio.nombre}</h6>
                        <span class="badge bg-${this.getNivelClass(nivel)} fs-6">${nivel.toFixed(1)}/4.0</span>
                    </div>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-${this.getNivelClass(nivel)}" 
                             style="width: ${porcentaje}%"></div>
                    </div>
                    <p class="text-muted small">${dominio.descripcion}</p>
                    
                    <!-- Respuestas del dominio -->
                    <div class="respuestas-dominio">
                        ${resultado ? this.renderRespuestasDominio(dominio, resultado) : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderRespuestasDominio(dominio, resultado) {
        return `
            <div class="accordion accordion-flush" id="accordion_${dominio.id}">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" 
                                data-bs-toggle="collapse" data-bs-target="#collapse_${dominio.id}">
                            <small>Ver ${resultado.respuestas.length} respuestas</small>
                        </button>
                    </h2>
                    <div id="collapse_${dominio.id}" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            ${resultado.respuestas.map(respuesta => {
                                const pregunta = dominio.preguntas.find(p => p.id === respuesta.pregunta_id);
                                return `
                                    <div class="respuesta-item mb-3">
                                        <div class="d-flex justify-content-between">
                                            <small class="text-muted">${pregunta?.texto || 'Pregunta no encontrada'}</small>
                                            <span class="badge bg-${this.getScoreBadgeClass(respuesta.valor)}">${respuesta.valor}/4</span>
                                        </div>
                                        <div class="mt-1">
                                            <strong>${respuesta.respuesta}</strong>
                                            ${respuesta.comentario ? `<br><em class="text-muted">"${respuesta.comentario}"</em>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getNivelClass(nivel) {
        if (nivel >= 3.5) return 'success';
        if (nivel >= 2.5) return 'warning';
        if (nivel >= 1.5) return 'danger';
        return 'secondary';
    }
    
    getScoreBadgeClass(valor) {
        switch(valor) {
            case 1: return 'danger';
            case 2: return 'warning';
            case 3: return 'success';
            case 4: return 'primary';
            default: return 'secondary';
        }
    }
    
    getDominioNombre(dominioId) {
        const dominio = this.dashboardData.template.dominios.find(d => d.id === dominioId);
        return dominio ? dominio.nombre : 'Desconocido';
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
            // Cargar Chart.js desde CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            document.head.appendChild(script);
            
            return new Promise((resolve) => {
                script.onload = resolve;
            });
        }
    }
    
    createCharts() {
        this.createRadarChart();
        this.createGapsChart();
        this.createRoadmapChart();
    }
    
    createRadarChart() {
        const ctx = document.getElementById('radarChart');
        const radarData = this.dashboardData.radar_data;
        
        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: radarData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 4,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    createGapsChart() {
        const ctx = document.getElementById('gapsChart');
        const gapsData = this.dashboardData.gaps_data;
        
        this.charts.gaps = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: gapsData.map(g => g.dominio),
                datasets: [
                    {
                        label: 'Actual',
                        data: gapsData.map(g => g.actual),
                        backgroundColor: 'rgba(255, 107, 107, 0.8)'
                    },
                    {
                        label: 'Objetivo',
                        data: gapsData.map(g => g.objetivo),
                        backgroundColor: 'rgba(76, 172, 254, 0.8)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    createRoadmapChart() {
        const ctx = document.getElementById('roadmapChart');
        const timelineData = this.dashboardData.timeline_data;
        
        this.charts.roadmap = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Actual', '6 meses', '1 año', '2 años'],
                datasets: [{
                    label: 'Puntuación de Madurez',
                    data: [
                        timelineData.actual.puntuacion,
                        ...timelineData.objetivos.map(o => o.puntuacion)
                    ],
                    borderColor: 'rgba(76, 172, 254, 1)',
                    backgroundColor: 'rgba(76, 172, 254, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    setupEventListeners() {
        // Volver
        this.container.querySelector('#btnVolver').addEventListener('click', () => {
            this.volverALista();
        });
        
        // Exportar
        this.container.querySelector('#btnExportar').addEventListener('click', () => {
            this.exportarResultados();
        });
        
        // Firmar
        const btnFirmar = this.container.querySelector('#btnFirmar');
        if (btnFirmar) {
            btnFirmar.addEventListener('click', () => {
                this.firmarEvaluacion();
            });
        }
    }
    
    volverALista() {
        if (window.gozainApp && window.gozainApp.navigation) {
            const app = window.gozainApp.navigation.getCurrentApp();
            if (app && typeof app.mostrarVistaLista === 'function') {
                app.mostrarVistaLista();
            }
        }
    }
    
    async firmarEvaluacion() {
        const firmante = prompt('Ingrese el nombre del firmante:');
        if (!firmante) return;
        
        try {
            await this.api.post(`/madurez/assessments/${this.dashboardData.assessment.id}/sign`, { firmante });
            this.mostrarExito('Evaluación firmada correctamente');
            
            // Recargar datos
            setTimeout(() => {
                this.render(this.dashboardData.assessment.id);
            }, 1000);
            
        } catch (error) {
            console.error('Error firmando evaluación:', error);
            this.mostrarError('Error al firmar la evaluación');
        }
    }
    
    exportarResultados() {
        // TODO: Implementar exportación a PDF
        this.mostrarToast('Exportación en desarrollo', 'info');
    }
    
    mostrarExito(mensaje) {
        this.mostrarToast(mensaje, 'success');
    }
    
    mostrarError(mensaje) {
        this.mostrarToast(mensaje, 'error');
    }
    
    mostrarToast(mensaje, tipo = 'success') {
        const iconos = {
            success: 'bi-check-circle',
            error: 'bi-exclamation-circle',
            info: 'bi-info-circle'
        };
        const clases = {
            success: 'text-bg-success',
            error: 'text-bg-danger',
            info: 'text-bg-info'
        };
        
        const html = `
            <div class="toast align-items-center ${clases[tipo]} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="${iconos[tipo]} me-2"></i>${mensaje}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
        
        container.insertAdjacentHTML('beforeend', html);
        const toast = container.lastElementChild;
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}