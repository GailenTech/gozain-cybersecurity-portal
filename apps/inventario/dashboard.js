// Dashboard de Inventario
export default class InventarioDashboard {
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this.charts = {};
    }
    
    async render() {
        // Cargar estadísticas
        const stats = await this.loadStatistics();
        
        this.container.innerHTML = `
            <div class="inventario-dashboard">
                <div class="d-flex justify-content-end mb-4">
                    <button class="btn btn-outline-secondary me-2" id="btnExportCSV">
                        <i class="bi bi-file-earmark-spreadsheet"></i> Exportar CSV
                    </button>
                    <button class="btn btn-outline-primary" id="btnExportExcel">
                        <i class="bi bi-file-earmark-excel"></i> Exportar Excel
                    </button>
                </div>
                
                <!-- Tarjetas de resumen -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-primary">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Activos</h5>
                                <h2 class="text-primary mb-0">${stats.total}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-info">
                            <div class="card-body text-center">
                                <h5 class="card-title">Hardware</h5>
                                <h2 class="text-info mb-0">${stats.porTipo.Hardware || 0}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-success">
                            <div class="card-body text-center">
                                <h5 class="card-title">Software</h5>
                                <h2 class="text-success mb-0">${stats.porTipo.Software || 0}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-danger">
                            <div class="card-body text-center">
                                <h5 class="card-title">Críticos</h5>
                                <h2 class="text-danger mb-0">${stats.criticos || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gráficos -->
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Activos por Tipo <small class="text-muted">(Click para filtrar)</small></h5>
                            </div>
                            <div class="card-body">
                                <canvas id="chartTipos" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Activos por Departamento <small class="text-muted">(Click para filtrar)</small></h5>
                            </div>
                            <div class="card-body">
                                <canvas id="chartDepartamentos" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Acciones rápidas -->
                <div class="row mt-4">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Acciones Rápidas</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex gap-3">
                                    <button class="btn btn-success" id="btnNuevoActivo">
                                        <i class="bi bi-plus-circle"></i> Nuevo Activo
                                    </button>
                                    <button class="btn btn-primary" id="btnVerInventario">
                                        <i class="bi bi-list-ul"></i> Ver Inventario Completo
                                    </button>
                                    <button class="btn btn-warning" id="btnImportar">
                                        <i class="bi bi-upload"></i> Importar Activos
                                    </button>
                                </div>
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
            const stats = await this.api.get('/inventario/estadisticas');
            
            // Calcular críticos
            stats.criticos = stats.por_criticidad?.['Crítica'] || stats.por_criticidad?.['Crítico'] || 0;
            
            // Mapear por_tipo a porTipo para compatibilidad
            stats.porTipo = {};
            if (stats.por_tipo) {
                Object.keys(stats.por_tipo).forEach(key => {
                    stats.porTipo[key] = stats.por_tipo[key];
                });
            }
            
            return stats;
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            return {
                total: 0,
                porTipo: {},
                por_departamento: {},
                criticos: 0
            };
        }
    }
    
    async renderCharts(stats) {
        // Cargar Chart.js si no está cargado
        if (!window.Chart) {
            await this.loadChartJS();
        }
        
        // Gráfico de tipos
        const tiposCtx = document.getElementById('chartTipos').getContext('2d');
        const tiposData = {
            labels: Object.keys(stats.por_tipo || {}),
            datasets: [{
                data: Object.values(stats.por_tipo || {}),
                backgroundColor: [
                    '#0d6efd', // azul - Hardware
                    '#6f42c1', // púrpura - Material de Oficina
                    '#d63384', // rosa - Servicios  
                    '#dc3545', // rojo - Software
                    '#fd7e14'  // naranja - otros
                ]
            }]
        };
        
        this.charts.tipos = new Chart(tiposCtx, {
            type: 'doughnut',
            data: tiposData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const tipo = tiposData.labels[index];
                        this.filterByType(tipo);
                    }
                }
            }
        });
        
        // Gráfico de departamentos
        const deptosCtx = document.getElementById('chartDepartamentos').getContext('2d');
        const deptosData = {
            labels: Object.keys(stats.por_departamento || {}),
            datasets: [{
                label: 'Activos',
                data: Object.values(stats.por_departamento || {}),
                backgroundColor: '#0d6efd'
            }]
        };
        
        this.charts.departamentos = new Chart(deptosCtx, {
            type: 'bar',
            data: deptosData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const depto = deptosData.labels[index];
                        this.filterByDepartment(depto);
                    }
                }
            }
        });
    }
    
    async loadChartJS() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    
    setupEventListeners() {
        // Exportar CSV
        document.getElementById('btnExportCSV')?.addEventListener('click', () => {
            window.gozainCore.services.eventBus.emit('inventario:export', { format: 'csv' });
        });
        
        // Exportar Excel
        document.getElementById('btnExportExcel')?.addEventListener('click', () => {
            window.gozainCore.services.eventBus.emit('inventario:export', { format: 'excel' });
        });
        
        // Nuevo activo
        document.getElementById('btnNuevoActivo')?.addEventListener('click', () => {
            window.gozainCore.services.eventBus.emit('inventario:new');
        });
        
        // Ver inventario
        document.getElementById('btnVerInventario')?.addEventListener('click', () => {
            window.gozainCore.services.eventBus.emit('inventario:viewList');
        });
        
        // Importar
        document.getElementById('btnImportar')?.addEventListener('click', () => {
            window.gozainCore.services.eventBus.emit('inventario:import');
        });
    }
    
    filterByType(tipo) {
        window.gozainCore.services.eventBus.emit('inventario:filter', { tipo });
    }
    
    filterByDepartment(departamento) {
        window.gozainCore.services.eventBus.emit('inventario:filter', { departamento });
    }
    
    destroy() {
        // Limpiar gráficos
        if (this.charts.tipos) {
            this.charts.tipos.destroy();
        }
        if (this.charts.departamentos) {
            this.charts.departamentos.destroy();
        }
    }
}