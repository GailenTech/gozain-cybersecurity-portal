// Módulo de Madurez en Ciberseguridad
export default class MadurezApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        
        // Estado local
        this.assessments = [];
        this.currentAssessment = null;
        this.filtros = {
            estado: '',
            fecha_desde: '',
            fecha_hasta: ''
        };
        
        // Vistas disponibles
        this.currentView = 'dashboard';
    }
    
    async mount() {
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Renderizar UI inicial
        this.render();
        
        // Configurar menú lateral del módulo
        this.setupModuleMenu();
        
        // Cargar datos
        await this.loadData();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Mostrar dashboard por defecto
        this.container.querySelector('#btnVistaDashboard').classList.add('active');
        await this.mostrarVistaDashboard();
    }
    
    async unmount() {
        // Limpiar event listeners si es necesario
        this.container.innerHTML = '';
    }
    
    render() {
        this.container.innerHTML = `
            <div class="madurez-app fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="mb-0">
                        <i class="bi bi-shield-check text-primary"></i>
                        Madurez en Ciberseguridad
                    </h4>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-secondary" id="btnVistaLista" title="Lista de Evaluaciones">
                            <i class="bi bi-list-ul"></i>
                        </button>
                        <button class="btn btn-outline-secondary" id="btnVistaDashboard" title="Dashboard">
                            <i class="bi bi-grid-3x3-gap"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Estadísticas principales -->
                <div class="row mb-4" id="estadisticas">
                    <div class="col-md-3">
                        <div class="card text-bg-primary">
                            <div class="card-body">
                                <h6 class="card-title">Total Evaluaciones</h6>
                                <h3 class="mb-0" id="statTotal">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-success">
                            <div class="card-body">
                                <h6 class="card-title">Completadas</h6>
                                <h3 class="mb-0" id="statCompletadas">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-warning">
                            <div class="card-body">
                                <h6 class="card-title">En Progreso</h6>
                                <h3 class="mb-0" id="statProgreso">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-info">
                            <div class="card-body">
                                <h6 class="card-title">Puntuación Actual</h6>
                                <h3 class="mb-0" id="statPuntuacion">-</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Dashboard (visible por defecto) -->
                <div id="dashboardView">
                    <!-- El contenido del dashboard se cargará dinámicamente -->
                </div>
                
                <!-- Vista de lista (oculta por defecto) -->
                <div id="listaView" style="display: none;">
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" id="filtroEstado">
                                        <option value="">Todos</option>
                                        <option value="abierto">Abierto</option>
                                        <option value="completado">Completado</option>
                                        <option value="firmado">Firmado</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Desde</label>
                                    <input type="date" class="form-control" id="filtroDesde">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Hasta</label>
                                    <input type="date" class="form-control" id="filtroHasta">
                                </div>
                                <div class="col-md-3 d-flex align-items-end">
                                    <button class="btn btn-primary w-100" id="btnFiltrar">
                                        <i class="bi bi-funnel"></i> Filtrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Fecha Inicio</th>
                                            <th>Estado</th>
                                            <th>Puntuación</th>
                                            <th>Fecha Completado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tablaAssessments">
                                        <tr>
                                            <td colspan="6" class="text-center">
                                                <div class="loader"></div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal para nueva evaluación -->
            <div class="modal fade" id="modalNuevaEvaluacion" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nueva Evaluación de Madurez</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formNuevaEvaluacion">
                                <div class="mb-3">
                                    <label class="form-label">Nombre de la Evaluación</label>
                                    <input type="text" class="form-control" id="nombreEvaluacion" 
                                           placeholder="Evaluación Q1 2024" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcionEvaluacion" rows="3"
                                              placeholder="Descripción opcional de la evaluación"></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-4">
                                        <label class="form-label">Objetivo 6 meses</label>
                                        <input type="number" class="form-control" id="objetivo6m" 
                                               min="1" max="4" step="0.1" value="2.5">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Objetivo 1 año</label>
                                        <input type="number" class="form-control" id="objetivo1a" 
                                               min="1" max="4" step="0.1" value="3.0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Objetivo 2 años</label>
                                        <input type="number" class="form-control" id="objetivo2a" 
                                               min="1" max="4" step="0.1" value="4.0">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnCrearEvaluacion">Crear Evaluación</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Botones de vista
        this.container.querySelector('#btnVistaLista').addEventListener('click', () => {
            this.mostrarVistaLista();
        });
        
        this.container.querySelector('#btnVistaDashboard').addEventListener('click', () => {
            this.mostrarVistaDashboard();
        });
        
        // Filtros
        this.container.querySelector('#btnFiltrar').addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        // Nueva evaluación
        this.container.querySelector('#btnCrearEvaluacion').addEventListener('click', () => {
            this.crearEvaluacion();
        });
        
        // Escuchar cambios de organización
        this.services.eventBus.on('organization:changed', () => {
            this.loadData();
        });
    }
    
    async loadData() {
        try {
            // Cargar evaluaciones
            await this.cargarAssessments();
            
            // Actualizar estadísticas
            await this.actualizarEstadisticas();
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.mostrarError('Error al cargar los datos');
        }
    }
    
    async cargarAssessments() {
        try {
            const params = new URLSearchParams(this.filtros);
            this.assessments = await this.services.api.get(`/madurez/assessments?${params}`);
            this.renderTablaAssessments();
        } catch (error) {
            console.error('Error cargando assessments:', error);
            this.mostrarError('Error al cargar las evaluaciones');
        }
    }
    
    actualizarEstadisticas() {
        const total = this.assessments.length;
        const completadas = this.assessments.filter(a => a.estado === 'completado' || a.estado === 'firmado').length;
        const progreso = this.assessments.filter(a => a.estado === 'abierto').length;
        
        // Encontrar la evaluación más reciente completada
        const ultimaCompletada = this.assessments
            .filter(a => a.estado === 'completado' || a.estado === 'firmado')
            .sort((a, b) => new Date(b.fecha_completado) - new Date(a.fecha_completado))[0];
        
        const puntuacion = ultimaCompletada?.resultados?.puntuacion_total || '-';
        
        // Actualizar elementos
        this.container.querySelector('#statTotal').textContent = total;
        this.container.querySelector('#statCompletadas').textContent = completadas;
        this.container.querySelector('#statProgreso').textContent = progreso;
        this.container.querySelector('#statPuntuacion').textContent = 
            puntuacion !== '-' ? puntuacion.toFixed(1) : '-';
    }
    
    renderTablaAssessments() {
        const tbody = this.container.querySelector('#tablaAssessments');
        
        if (!tbody) return;
        
        if (this.assessments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        No se encontraron evaluaciones
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.assessments.map(assessment => `
            <tr>
                <td>${assessment.nombre}</td>
                <td>${new Date(assessment.fecha_inicio).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${this.getEstadoClass(assessment.estado)}">
                        ${this.getEstadoText(assessment.estado)}
                    </span>
                </td>
                <td>
                    ${assessment.resultados ? 
                        `<strong>${assessment.resultados.puntuacion_total.toFixed(1)}</strong>/4.0` : 
                        '-'
                    }
                </td>
                <td>
                    ${assessment.fecha_completado ? 
                        new Date(assessment.fecha_completado).toLocaleDateString() : 
                        '-'
                    }
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        ${assessment.estado === 'abierto' ? 
                            `<button class="btn btn-outline-primary" onclick="window.gozainApp.navigation.getCurrentApp().completarEvaluacion('${assessment.id}')">
                                <i class="bi bi-play-fill"></i>
                            </button>` : ''
                        }
                        ${assessment.resultados ? 
                            `<button class="btn btn-outline-success" onclick="window.gozainApp.navigation.getCurrentApp().verDashboard('${assessment.id}')">
                                <i class="bi bi-bar-chart"></i>
                            </button>` : ''
                        }
                        ${assessment.estado === 'completado' ? 
                            `<button class="btn btn-outline-warning" onclick="window.gozainApp.navigation.getCurrentApp().firmarEvaluacion('${assessment.id}')">
                                <i class="bi bi-file-earmark-check"></i>
                            </button>` : ''
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    getEstadoClass(estado) {
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
    
    aplicarFiltros() {
        this.filtros = {
            estado: this.container.querySelector('#filtroEstado').value,
            fecha_desde: this.container.querySelector('#filtroDesde').value,
            fecha_hasta: this.container.querySelector('#filtroHasta').value
        };
        this.cargarAssessments();
    }
    
    mostrarVistaLista() {
        // Si no estamos en la vista principal, renderizar primero
        if (!this.container.querySelector('#btnVistaLista')) {
            this.render();
            this.setupEventListeners();
            this.loadData();
        }
        
        // Cambiar estado de botones
        const btnLista = this.container.querySelector('#btnVistaLista');
        const btnDashboard = this.container.querySelector('#btnVistaDashboard');
        
        if (btnLista) btnLista.classList.add('active');
        if (btnDashboard) btnDashboard.classList.remove('active');
        
        // Mostrar/ocultar vistas
        const listaView = this.container.querySelector('#listaView');
        const dashboardView = this.container.querySelector('#dashboardView');
        
        if (listaView) listaView.classList.remove('d-none');
        if (dashboardView) dashboardView.classList.add('d-none');
        
        this.currentView = 'lista';
    }
    
    async mostrarVistaDashboard() {
        // Si no estamos en la vista principal, renderizar primero
        if (!this.container.querySelector('#btnVistaDashboard')) {
            this.render();
            this.setupEventListeners();
            await this.loadData();
        }
        
        // Cambiar estado de botones
        const btnLista = this.container.querySelector('#btnVistaLista');
        const btnDashboard = this.container.querySelector('#btnVistaDashboard');
        
        if (btnLista) btnLista.classList.remove('active');
        if (btnDashboard) btnDashboard.classList.add('active');
        
        // Mostrar/ocultar vistas
        const listaView = this.container.querySelector('#listaView');
        const dashboardView = this.container.querySelector('#dashboardView');
        
        if (listaView) listaView.classList.add('d-none');
        if (dashboardView) dashboardView.classList.remove('d-none');
        
        this.currentView = 'dashboard';
        
        // Cargar dashboard
        try {
            const dashboardContainer = this.container.querySelector('#dashboardView');
            if (dashboardContainer) {
                const { default: Dashboard } = await import('./dashboard.js');
                const dashboard = new Dashboard(dashboardContainer, this.services.api);
                await dashboard.render();
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            const dashboardContainer = this.container.querySelector('#dashboardView');
            if (dashboardContainer) {
                dashboardContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i> Dashboard en desarrollo
                    </div>
                `;
            }
        }
    }
    
    setupModuleMenu() {
        // Obtener el menú lateral
        const appMenu = document.getElementById('appMenu');
        if (!appMenu) return;
        
        // Limpiar el menú actual
        appMenu.innerHTML = '';
        
        // Agregar opciones del módulo
        const menuItems = [
            { id: 'dashboard', icon: 'bi-speedometer2', text: 'Dashboard', active: true },
            { id: 'evaluaciones', icon: 'bi-clipboard-check', text: 'Evaluaciones' },
            { id: 'nueva', icon: 'bi-plus-circle', text: 'Nueva Evaluación' },
            { id: 'historico', icon: 'bi-clock-history', text: 'Histórico' },
            { id: 'plantillas', icon: 'bi-file-earmark-text', text: 'Plantillas' }
        ];
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a class="nav-link ${item.active ? 'active' : ''}" href="#" data-menu-item="${item.id}">
                    <i class="${item.icon}"></i>
                    ${item.text}
                </a>
            `;
            appMenu.appendChild(li);
        });
        
        // Event listeners del menú
        appMenu.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (link) {
                e.preventDefault();
                const menuItem = link.dataset.menuItem;
                
                // Actualizar estado activo
                appMenu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Manejar la selección
                this.handleMenuSelection(menuItem);
            }
        });
    }
    
    handleMenuSelection(menuItem) {
        switch(menuItem) {
            case 'dashboard':
                this.mostrarVistaDashboard();
                break;
            case 'evaluaciones':
                this.mostrarVistaLista();
                break;
            case 'nueva':
                this.mostrarModalNuevaEvaluacion();
                break;
            case 'historico':
                this.mostrarHistorico();
                break;
            case 'plantillas':
                this.mostrarToast('Gestión de plantillas en desarrollo', 'info');
                break;
        }
    }
    
    mostrarModalNuevaEvaluacion() {
        const modal = new bootstrap.Modal(this.container.querySelector('#modalNuevaEvaluacion'));
        
        // Reset form
        this.container.querySelector('#formNuevaEvaluacion').reset();
        
        // Generar nombre por defecto
        const fechaActual = new Date().toISOString().split('T')[0];
        this.container.querySelector('#nombreEvaluacion').value = `Evaluación ${fechaActual}`;
        
        modal.show();
    }
    
    async crearEvaluacion() {
        const form = this.container.querySelector('#formNuevaEvaluacion');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const datos = {
            nombre: form.querySelector('#nombreEvaluacion').value,
            descripcion: form.querySelector('#descripcionEvaluacion').value,
            objetivo_6meses: parseFloat(form.querySelector('#objetivo6m').value),
            objetivo_1año: parseFloat(form.querySelector('#objetivo1a').value),
            objetivo_2años: parseFloat(form.querySelector('#objetivo2a').value)
        };
        
        try {
            const assessment = await this.services.api.post('/madurez/assessments', datos);
            this.mostrarExito('Evaluación creada correctamente');
            
            // Cerrar modal y recargar
            bootstrap.Modal.getInstance(this.container.querySelector('#modalNuevaEvaluacion')).hide();
            await this.loadData();
            
        } catch (error) {
            console.error('Error creando evaluación:', error);
            this.mostrarError('Error al crear la evaluación');
        }
    }
    
    async completarEvaluacion(assessmentId) {
        try {
            // Navegar a la vista del cuestionario
            const { default: QuestionnaireView } = await import('./views/questionnaire-view.js');
            const questionnaireView = new QuestionnaireView(this.container, this.services.api);
            await questionnaireView.render(assessmentId);
        } catch (error) {
            console.error('Error cargando cuestionario:', error);
            this.mostrarError('Error al cargar el cuestionario');
        }
    }
    
    async verDashboard(assessmentId) {
        try {
            // Navegar a la vista del dashboard específico
            const { default: AssessmentDashboard } = await import('./views/dashboard-view.js');
            const dashboardView = new AssessmentDashboard(this.container, this.services.api);
            await dashboardView.render(assessmentId);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.mostrarError('Error al cargar el dashboard');
        }
    }
    
    async firmarEvaluacion(assessmentId) {
        const firmante = prompt('Ingrese el nombre del firmante:');
        if (!firmante) return;
        
        try {
            await this.services.api.post(`/madurez/assessments/${assessmentId}/sign`, { firmante });
            this.mostrarExito('Evaluación firmada correctamente');
            await this.loadData();
        } catch (error) {
            console.error('Error firmando evaluación:', error);
            this.mostrarError('Error al firmar la evaluación');
        }
    }
    
    async mostrarHistorico() {
        try {
            const { default: HistoryView } = await import('./views/history-view.js');
            const historyView = new HistoryView(this.container, this.services.api);
            await historyView.render();
        } catch (error) {
            console.error('Error cargando histórico:', error);
            this.mostrarError('Error al cargar el histórico');
        }
    }
    
    mostrarExito(mensaje) {
        const toastHtml = `
            <div class="toast align-items-center text-bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-check-circle me-2"></i>${mensaje}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        this.mostrarToast(toastHtml);
    }
    
    mostrarError(mensaje) {
        const toastHtml = `
            <div class="toast align-items-center text-bg-danger border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-exclamation-circle me-2"></i>${mensaje}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        this.mostrarToast(toastHtml);
    }
    
    mostrarToast(html, tipo = 'success') {
        // Crear contenedor si no existe
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
        
        // Agregar toast
        container.insertAdjacentHTML('beforeend', html);
        const toast = container.lastElementChild;
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Eliminar después de ocultar
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}