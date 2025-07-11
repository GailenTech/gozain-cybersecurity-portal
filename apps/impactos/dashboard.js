// Dashboard de Impactos
export default class ImpactosDashboard {
    constructor(container, api) {
        this.container = container;
        this.api = api;
    }
    
    async render() {
        // Cargar estadísticas
        const stats = await this.loadStatistics();
        
        this.container.innerHTML = `
            <div class="impactos-dashboard">
                <!-- Contadores principales -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-warning">
                            <div class="card-body text-center">
                                <h1 class="text-warning mb-0">${stats.pendientes}</h1>
                                <p class="mb-0">Impactos Pendientes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-success">
                            <div class="card-body text-center">
                                <h1 class="text-success mb-0">${stats.completados7dias}</h1>
                                <p class="mb-0">Completados (7 días)</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-info">
                            <div class="card-body text-center">
                                <h1 class="text-info mb-0">${stats.tareasPendientes}</h1>
                                <p class="mb-0">Tareas Pendientes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center cursor-pointer" id="btnNuevoImpacto">
                                <h1 class="mb-0"><i class="bi bi-plus-circle"></i></h1>
                                <p class="mb-0">Nuevo Impacto</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Tipos de Impacto -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Tipos de Impacto</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="chartTiposImpacto" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Impactos Recientes -->
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Impactos Recientes</h5>
                            </div>
                            <div class="card-body" style="max-height: 350px; overflow-y: auto;">
                                ${this.renderImpactosRecientes(stats.recientes)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Timeline de actividad -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Actividad Reciente</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderTimeline(stats.actividad)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Renderizar gráficos
        await this.renderCharts(stats);
        
        // Configurar event listeners
        this.setupEventListeners();
    }
    
    async loadStatistics() {
        try {
            // TODO: Implementar endpoint de estadísticas de impactos
            // Por ahora retornamos datos de ejemplo
            return {
                pendientes: 0,
                completados7dias: 0,
                tareasPendientes: 0,
                recientes: [],
                actividad: [],
                porTipo: {
                    'Cambio de configuración': 0,
                    'Actualización de sistema': 0,
                    'Incidente de seguridad': 0,
                    'Mantenimiento': 0
                }
            };
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            return {
                pendientes: 0,
                completados7dias: 0,
                tareasPendientes: 0,
                recientes: [],
                actividad: [],
                porTipo: {}
            };
        }
    }
    
    renderImpactosRecientes(impactos) {
        if (!impactos || impactos.length === 0) {
            return '<p class="text-muted text-center py-4">No hay impactos recientes</p>';
        }
        
        return impactos.map(impacto => `
            <div class="border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${impacto.titulo}</h6>
                        <small class="text-muted">${impacto.tipo} - ${impacto.fecha}</small>
                    </div>
                    <span class="badge bg-${this.getEstadoColor(impacto.estado)}">${impacto.estado}</span>
                </div>
            </div>
        `).join('');
    }
    
    renderTimeline(actividades) {
        if (!actividades || actividades.length === 0) {
            return '<p class="text-muted text-center py-4">No hay actividad reciente</p>';
        }
        
        return `
            <div class="timeline">
                ${actividades.map(act => `
                    <div class="timeline-item">
                        <div class="timeline-marker bg-${this.getActividadColor(act.tipo)}"></div>
                        <div class="timeline-content">
                            <h6 class="mb-1">${act.descripcion}</h6>
                            <small class="text-muted">${act.usuario} - ${act.fecha}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async renderCharts(stats) {
        // Cargar Chart.js si no está cargado
        if (!window.Chart) {
            await this.loadChartJS();
        }
        
        // Gráfico de tipos de impacto
        const ctx = document.getElementById('chartTiposImpacto')?.getContext('2d');
        if (!ctx) return;
        
        const data = {
            labels: Object.keys(stats.porTipo || {}),
            datasets: [{
                data: Object.values(stats.porTipo || {}),
                backgroundColor: [
                    '#ffc107', // amarillo
                    '#0d6efd', // azul
                    '#dc3545', // rojo
                    '#198754'  // verde
                ]
            }]
        };
        
        new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    async loadChartJS() {
        return new Promise((resolve) => {
            if (document.querySelector('script[src*="chart.js"]')) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    
    setupEventListeners() {
        // Nuevo impacto
        document.getElementById('btnNuevoImpacto')?.addEventListener('click', () => {
            window.gozainCore.services.eventBus.emit('impactos:new');
        });
    }
    
    getEstadoColor(estado) {
        const colores = {
            'Pendiente': 'warning',
            'En proceso': 'info',
            'Completado': 'success',
            'Cancelado': 'secondary'
        };
        return colores[estado] || 'secondary';
    }
    
    getActividadColor(tipo) {
        const colores = {
            'creacion': 'primary',
            'actualizacion': 'info',
            'completado': 'success',
            'cancelado': 'danger'
        };
        return colores[tipo] || 'secondary';
    }
}