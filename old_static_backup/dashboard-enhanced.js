// Dashboard Enhanced Functions
let chartEvolucion = null;
let chartEstados = null;
let chartCriticidad = null;

// Actualizar dashboard completo
async function actualizarDashboard() {
    const periodo = document.getElementById('dashboardPeriodo').value;
    
    try {
        // Mostrar loading en los gráficos
        mostrarLoadingGraficos();
        
        const response = await fetch(`/api/estadisticas?periodo=${periodo}`, {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const stats = data.estadisticas;
            
            // Actualizar cards principales con porcentajes
            actualizarCardsConPorcentajes(stats);
            
            // Actualizar KPIs
            actualizarKPIs(stats);
            
            // Actualizar todos los gráficos
            actualizarGraficosEnhanced(stats);
            
            // Actualizar actividad reciente
            cargarActividadReciente();
        }
    } catch (error) {
        console.error('Error actualizando dashboard:', error);
    }
}

// Actualizar cards con porcentajes
function actualizarCardsConPorcentajes(stats) {
    const total = stats.total_activos || 0;
    
    // Total activos con tendencia
    document.getElementById('stat-total').textContent = total;
    const trend = stats.tendencia_total || '+5%';
    document.getElementById('stat-total-trend').innerHTML = 
        trend.startsWith('+') ? 
        `<i class="bi bi-arrow-up text-success"></i> ${trend}` : 
        `<i class="bi bi-arrow-down text-danger"></i> ${trend}`;
    
    // Hardware con porcentaje
    const hardware = stats.por_tipo['Hardware'] || 0;
    document.getElementById('stat-hardware').textContent = hardware;
    document.getElementById('stat-hardware-percent').textContent = 
        total > 0 ? Math.round((hardware / total) * 100) + '%' : '0%';
    
    // Software con porcentaje
    const software = stats.por_tipo['Software'] || stats.por_tipo['Software e Información'] || 0;
    document.getElementById('stat-software').textContent = software;
    document.getElementById('stat-software-percent').textContent = 
        total > 0 ? Math.round((software / total) * 100) + '%' : '0%';
    
    // Críticos
    document.getElementById('stat-criticos').textContent = stats.activos_criticos || 0;
}

// Actualizar KPIs
function actualizarKPIs(stats) {
    // Activos activos
    const activos = stats.por_estado?.['Activo'] || 0;
    document.getElementById('kpi-activos').textContent = activos;
    
    // En mantenimiento
    const mantenimiento = stats.por_estado?.['En mantenimiento'] || 0;
    document.getElementById('kpi-mantenimiento').textContent = mantenimiento;
    
    // Próximas revisiones
    const proxRevisiones = stats.proximas_revisiones || 0;
    document.getElementById('kpi-revision').textContent = proxRevisiones;
    
    // Valor total (simulado por ahora)
    const valorTotal = stats.valor_total || Math.round(stats.total_activos * 1500);
    document.getElementById('kpi-valor').textContent = '$' + valorTotal.toLocaleString();
}

// Actualizar todos los gráficos enhanced
function actualizarGraficosEnhanced(stats) {
    // Mantener los gráficos originales
    actualizarGraficos(stats);
    
    // Agregar nuevos gráficos
    crearGraficoEvolucion(stats);
    crearGraficoEstados(stats);
    crearGraficoCriticidad(stats);
}

// Gráfico de evolución temporal
function crearGraficoEvolucion(stats) {
    const ctx = document.getElementById('chartEvolucion');
    if (!ctx) return;
    
    if (chartEvolucion) chartEvolucion.destroy();
    
    // Datos simulados de evolución (en producción vendría del backend)
    const labels = generarLabelsEvolucion('mes');
    const datosEvolucion = generarDatosEvolucion(stats.total_activos, labels.length);
    
    chartEvolucion = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Activos',
                data: datosEvolucion.total,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4
            }, {
                label: 'Nuevos',
                data: datosEvolucion.nuevos,
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4
            }, {
                label: 'Bajas',
                data: datosEvolucion.bajas,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Gráfico de estados
function crearGraficoEstados(stats) {
    const ctx = document.getElementById('chartEstados');
    if (!ctx) return;
    
    if (chartEstados) chartEstados.destroy();
    
    const estados = stats.por_estado || {
        'Activo': stats.total_activos * 0.8,
        'En mantenimiento': stats.total_activos * 0.15,
        'Inactivo': stats.total_activos * 0.05
    };
    
    chartEstados = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(estados),
            datasets: [{
                data: Object.values(estados),
                backgroundColor: ['#198754', '#ffc107', '#6c757d']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Actualizar barras de progreso
    const total = Object.values(estados).reduce((a, b) => a + b, 0) || 1;
    
    const activosPercent = Math.round((estados['Activo'] || 0) / total * 100);
    document.getElementById('estado-activos-percent').textContent = activosPercent + '%';
    document.getElementById('estado-activos-bar').style.width = activosPercent + '%';
    
    const mantenimientoPercent = Math.round((estados['En mantenimiento'] || 0) / total * 100);
    document.getElementById('estado-mantenimiento-percent').textContent = mantenimientoPercent + '%';
    document.getElementById('estado-mantenimiento-bar').style.width = mantenimientoPercent + '%';
    
    const inactivosPercent = Math.round((estados['Inactivo'] || 0) / total * 100);
    document.getElementById('estado-inactivos-percent').textContent = inactivosPercent + '%';
    document.getElementById('estado-inactivos-bar').style.width = inactivosPercent + '%';
}

// Gráfico de criticidad
function crearGraficoCriticidad(stats) {
    const ctx = document.getElementById('chartCriticidad');
    if (!ctx) return;
    
    if (chartCriticidad) chartCriticidad.destroy();
    
    const criticidad = stats.por_criticidad || {
        'Crítico': stats.activos_criticos || 0,
        'Importante': Math.round(stats.total_activos * 0.2),
        'Normal': Math.round(stats.total_activos * 0.5),
        'Bajo': Math.round(stats.total_activos * 0.3) - (stats.activos_criticos || 0)
    };
    
    chartCriticidad = new Chart(ctx.getContext('2d'), {
        type: 'polarArea',
        data: {
            labels: Object.keys(criticidad),
            datasets: [{
                data: Object.values(criticidad),
                backgroundColor: [
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(13, 110, 253, 0.7)',
                    'rgba(108, 117, 125, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Cargar actividad reciente
async function cargarActividadReciente() {
    try {
        const response = await fetch('/api/auditoria?limite=5', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success && data.logs) {
            const container = document.getElementById('actividadReciente');
            container.innerHTML = '';
            
            data.logs.forEach(log => {
                const tipo = getActivityType(log.accion);
                const item = document.createElement('div');
                item.className = `activity-item ${tipo}`;
                item.innerHTML = `
                    <div class="activity-time">${formatearFechaRelativa(log.fecha)}</div>
                    <div class="activity-text">
                        <strong>${log.usuario}</strong> ${log.accion} 
                        <em>${log.activo_nombre || 'activo'}</em>
                    </div>
                `;
                container.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Error cargando actividad:', error);
    }
}

// Helpers
function mostrarLoadingGraficos() {
    const graficos = ['chartEvolucion', 'chartEstados', 'chartCriticidad'];
    graficos.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas && canvas.parentElement) {
            // Agregar indicador de carga si es necesario
        }
    });
}

function generarLabelsEvolucion(periodo) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const trimestres = ['Q1', 'Q2', 'Q3', 'Q4'];
    const años = ['2023', '2024'];
    
    switch(periodo) {
        case 'trimestre': return trimestres;
        case 'año': return años;
        default: return meses;
    }
}

function generarDatosEvolucion(totalActual, numPeriodos) {
    const total = [];
    const nuevos = [];
    const bajas = [];
    
    for (let i = 0; i < numPeriodos; i++) {
        const factor = 1 - (numPeriodos - i) * 0.05;
        total.push(Math.round(totalActual * factor));
        nuevos.push(Math.round(Math.random() * 10) + 5);
        bajas.push(Math.round(Math.random() * 5));
    }
    
    return { total, nuevos, bajas };
}

function getActivityType(accion) {
    if (accion.includes('creó') || accion.includes('agregó')) return 'success';
    if (accion.includes('actualizó') || accion.includes('modificó')) return 'warning';
    if (accion.includes('eliminó') || accion.includes('borró')) return 'danger';
    return '';
}

function formatearFechaRelativa(fecha) {
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diff = ahora - fechaObj;
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 60) return `Hace ${minutos} minutos`;
    if (horas < 24) return `Hace ${horas} horas`;
    if (dias < 7) return `Hace ${dias} días`;
    
    return fechaObj.toLocaleDateString();
}

// Funciones para cambiar vistas de gráficos
function cambiarVistaGrafico(chartId, tipo) {
    // Implementar cambio de tipo de gráfico
    if (chartId === 'chartTipos' && chartTipos) {
        const config = chartTipos.config;
        config.type = tipo === 'pie' ? 'pie' : 'bar';
        chartTipos.update();
    }
}

function ordenarGrafico(chartId) {
    if (chartId === 'chartDepartamentos' && chartDepartamentos) {
        const data = chartDepartamentos.data;
        const combined = data.labels.map((label, i) => ({
            label: label,
            value: data.datasets[0].data[i]
        }));
        
        combined.sort((a, b) => b.value - a.value);
        
        data.labels = combined.map(item => item.label);
        data.datasets[0].data = combined.map(item => item.value);
        
        chartDepartamentos.update();
    }
}

function cambiarPeriodoEvolucion(periodo) {
    // Actualizar botones activos
    const botones = document.querySelectorAll('.chart-actions button');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recrear gráfico con nuevo periodo
    const stats = { total_activos: parseInt(document.getElementById('stat-total').textContent) };
    crearGraficoEvolucion(stats);
}

// Exportar funciones al objeto window
window.actualizarDashboard = actualizarDashboard;
window.cambiarVistaGrafico = cambiarVistaGrafico;
window.ordenarGrafico = ordenarGrafico;
window.cambiarPeriodoEvolucion = cambiarPeriodoEvolucion;