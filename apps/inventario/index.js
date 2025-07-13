// Módulo de Inventario de Activos ISO 27001 - Refactorizado
export default class InventarioApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        
        // Estado local
        this.activos = [];
        this.filtros = {
            tipo: '',
            departamento: '',
            busqueda: ''
        };
        
        // Vista actual
        this.currentView = null;
    }
    
    async mount() {
        // Configurar API con la organización
        this.services.api.setOrganization(this.organization);
        
        // Configurar menú lateral del módulo
        this.setupModuleMenu();
        
        // Navegar a dashboard por defecto
        await this.navigateToView('dashboard');
    }
    
    async unmount() {
        // Limpiar event listeners si es necesario
        this.container.innerHTML = '';
    }
    
    setupModuleMenu() {
        const eventBus = window.gozainApp?.eventBus;
        
        if (!eventBus) {
            console.warn('EventBus no disponible');
            return;
        }
        
        const menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-3x3-gap' },
            { id: 'inventario', label: 'Inventario', icon: 'bi-list-ul' },
            { id: 'nuevo', label: 'Nuevo Activo', icon: 'bi-plus-circle' },
            { id: 'importar', label: 'Importar', icon: 'bi-upload' },
            { id: 'reportes', label: 'Reportes', icon: 'bi-file-earmark-text' },
            { id: 'auditoria', label: 'Auditoría', icon: 'bi-shield-check' }
        ];
        
        // Notificar al shell para actualizar el menú
        eventBus.emit('shell:updateModuleMenu', {
            moduleId: 'inventario',
            items: menuItems
        });
        
        // Escuchar selecciones del menú
        eventBus.on('shell:moduleMenuSelect', (data) => {
            if (data.moduleId === 'inventario') {
                this.handleMenuSelection(data.itemId);
            }
        });
    }
    
    async handleMenuSelection(menuItem) {
        switch(menuItem) {
            case 'dashboard':
            case 'inventario':
                await this.navigateToView(menuItem);
                break;
            case 'nuevo':
                await this.navigateToView('inventario');
                setTimeout(() => this.mostrarModalActivo(), 100);
                break;
            case 'importar':
                await this.navigateToView('inventario');
                setTimeout(() => this.mostrarModalImportar(), 100);
                break;
            case 'reportes':
                this.mostrarToast('Reportes en desarrollo', 'info');
                break;
            case 'auditoria':
                this.mostrarToast('Auditoría en desarrollo', 'info');
                break;
        }
    }
    
    async navigateToView(view) {
        // Si es la misma vista, no hacer nada
        if (this.currentView === view) return;
        
        this.currentView = view;
        this.container.innerHTML = ''; // Limpiar completamente
        
        // Actualizar menú lateral para mostrar vista activa
        const appMenu = document.getElementById('appMenu');
        if (appMenu) {
            appMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.menuItem === view) {
                    link.classList.add('active');
                }
            });
        }
        
        // Renderizar la vista correspondiente
        switch(view) {
            case 'dashboard':
                await this.renderDashboard();
                break;
            case 'inventario':
                await this.renderInventarioList();
                break;
        }
    }
    
    async renderDashboard() {
        this.container.innerHTML = `
            <div class="dashboard-view fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Dashboard de Inventario</h2>
                    <button class="btn btn-primary" id="btnNuevoActivoDashboard">
                        <i class="bi bi-plus-circle"></i> Nuevo Activo
                    </button>
                </div>
                
                <!-- Estadísticas -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-bg-primary">
                            <div class="card-body">
                                <h6 class="card-title">Total Activos</h6>
                                <h3 class="mb-0" id="statTotal">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-success">
                            <div class="card-body">
                                <h6 class="card-title">Activos</h6>
                                <h3 class="mb-0" id="statActivos">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-warning">
                            <div class="card-body">
                                <h6 class="card-title">En Mantenimiento</h6>
                                <h3 class="mb-0" id="statMantenimiento">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-danger">
                            <div class="card-body">
                                <h6 class="card-title">Críticos</h6>
                                <h3 class="mb-0" id="statCriticos">0</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gráficos -->
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="mb-0">Activos por Tipo</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="chartTipo" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="mb-0">Activos por Departamento</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="chartDepartamento" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Accesos rápidos -->
                <div class="row mt-4">
                    <div class="col-12">
                        <h4>Acciones Rápidas</h4>
                    </div>
                    <div class="col-md-4">
                        <div class="card action-card" id="btnVerInventario">
                            <div class="card-body text-center">
                                <i class="bi bi-list-ul fs-1 text-primary"></i>
                                <h5 class="mt-2">Ver Inventario</h5>
                                <p class="text-muted">Gestionar todos los activos</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card action-card" id="btnImportarDashboard">
                            <div class="card-body text-center">
                                <i class="bi bi-upload fs-1 text-success"></i>
                                <h5 class="mt-2">Importar Activos</h5>
                                <p class="text-muted">Desde Excel o CSV</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card action-card" id="btnReportesDashboard">
                            <div class="card-body text-center">
                                <i class="bi bi-file-earmark-text fs-1 text-warning"></i>
                                <h5 class="mt-2">Generar Reportes</h5>
                                <p class="text-muted">Exportar información</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cargar datos del dashboard
        await this.loadDashboardData();
        
        // Configurar event listeners del dashboard
        this.setupDashboardEventListeners();
    }
    
    async renderInventarioList() {
        this.container.innerHTML = `
            <div class="inventario-list-view fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Inventario de Activos</h2>
                    <button class="btn btn-primary" id="btnNuevoActivo">
                        <i class="bi bi-plus-circle"></i> Nuevo Activo
                    </button>
                </div>
                
                <!-- Filtros -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Tipo de Activo</label>
                                <select class="form-select" id="filtroTipo">
                                    <option value="">Todos</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software">Software</option>
                                    <option value="Servicio">Servicio</option>
                                    <option value="Información">Información</option>
                                    <option value="Personal">Personal</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Departamento</label>
                                <select class="form-select" id="filtroDepartamento">
                                    <option value="">Todos</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Buscar</label>
                                <input type="text" class="form-control" id="filtroBusqueda" placeholder="Buscar por nombre, descripción...">
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button class="btn btn-primary w-100" id="btnBuscar">
                                    <i class="bi bi-search"></i> Buscar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tabla de activos -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Nombre</th>
                                        <th>Responsable</th>
                                        <th>Departamento</th>
                                        <th>Estado</th>
                                        <th>Criticidad</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tablaActivos">
                                    <tr>
                                        <td colspan="7" class="text-center">
                                            <div class="loader"></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.renderModals()}
        `;
        
        // Cargar activos
        await this.cargarActivos();
        
        // Configurar event listeners de la lista
        this.setupListEventListeners();
    }
    
    renderModals() {
        return `
            <!-- Modal para nuevo/editar activo -->
            <div class="modal fade" id="modalActivo" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalActivoTitle">Nuevo Activo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formActivo">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Tipo de Activo*</label>
                                        <select class="form-select" id="tipoActivo" required>
                                            <option value="">Seleccionar...</option>
                                            <option value="Hardware">Hardware</option>
                                            <option value="Software">Software</option>
                                            <option value="Servicio">Servicio</option>
                                            <option value="Información">Información</option>
                                            <option value="Personal">Personal</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Estado*</label>
                                        <select class="form-select" id="estadoActivo" required>
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                            <option value="En mantenimiento">En mantenimiento</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Nombre*</label>
                                        <input type="text" class="form-control" id="nombreActivo" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Responsable*</label>
                                        <input type="text" class="form-control" id="responsableActivo" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Departamento*</label>
                                        <input type="text" class="form-control" id="departamentoActivo" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Clasificación*</label>
                                        <select class="form-select" id="clasificacionActivo" required>
                                            <option value="Público">Público</option>
                                            <option value="Interno">Interno</option>
                                            <option value="Confidencial">Confidencial</option>
                                            <option value="Secreto">Secreto</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Criticidad*</label>
                                        <select class="form-select" id="criticidadActivo" required>
                                            <option value="Baja">Baja</option>
                                            <option value="Normal">Normal</option>
                                            <option value="Importante">Importante</option>
                                            <option value="Crítica">Crítica</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Descripción</label>
                                        <textarea class="form-control" id="descripcionActivo" rows="3"></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarActivo">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal para importar -->
            <div class="modal fade" id="modalImportar" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Importar Activos</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Seleccionar archivo</label>
                                <input type="file" class="form-control" id="archivoImportar" accept=".csv,.xlsx">
                                <div class="form-text">Formatos soportados: CSV, Excel (.xlsx)</div>
                            </div>
                            <div id="previewImportar" class="d-none">
                                <h6>Vista previa:</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead id="tablaPreview"></thead>
                                        <tbody id="tablaPreview"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnConfirmarImportar" disabled>Importar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupDashboardEventListeners() {
        // Botón nuevo activo desde dashboard
        this.container.querySelector('#btnNuevoActivoDashboard')?.addEventListener('click', () => {
            this.mostrarModalActivo();
        });
        
        // Cards de acciones rápidas
        this.container.querySelector('#btnVerInventario')?.addEventListener('click', () => {
            this.navigateToView('inventario');
        });
        
        this.container.querySelector('#btnImportarDashboard')?.addEventListener('click', () => {
            this.navigateToView('inventario').then(() => {
                setTimeout(() => this.mostrarModalImportar(), 100);
            });
        });
        
        this.container.querySelector('#btnReportesDashboard')?.addEventListener('click', () => {
            this.mostrarToast('Reportes en desarrollo', 'info');
        });
    }
    
    setupListEventListeners() {
        // Botón nuevo activo
        this.container.querySelector('#btnNuevoActivo')?.addEventListener('click', () => {
            this.mostrarModalActivo();
        });
        
        // Botón buscar
        this.container.querySelector('#btnBuscar')?.addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        // Enter en búsqueda
        this.container.querySelector('#filtroBusqueda')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.aplicarFiltros();
            }
        });
        
        // Cambios en filtros
        this.container.querySelector('#filtroTipo')?.addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        this.container.querySelector('#filtroDepartamento')?.addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        // Botón guardar activo
        this.container.querySelector('#btnGuardarActivo')?.addEventListener('click', () => {
            this.guardarActivo();
        });
    }
    
    async loadDashboardData() {
        try {
            // Cargar todos los activos para estadísticas
            const response = await this.services.api.getActivos();
            this.activos = response;
            
            // Actualizar estadísticas
            this.actualizarEstadisticas();
            
            // Cargar gráficos
            await this.cargarGraficos();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.mostrarError('Error al cargar el dashboard');
        }
    }
    
    async cargarActivos() {
        try {
            const response = await this.services.api.getActivos(
                this.filtros.tipo,
                this.filtros.departamento,
                this.filtros.busqueda
            );
            
            this.activos = response;
            this.renderTablaActivos();
            
            // Actualizar opciones de departamento
            this.actualizarDepartamentos();
            
        } catch (error) {
            console.error('Error cargando activos:', error);
            this.mostrarError('Error al cargar los activos');
        }
    }
    
    renderTablaActivos() {
        const tbody = this.container.querySelector('#tablaActivos');
        
        if (!tbody) return;
        
        if (this.activos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        No se encontraron activos
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.activos.map(activo => `
            <tr>
                <td>
                    <span class="badge bg-secondary">${activo.tipo || activo.tipo_activo || 'Sin tipo'}</span>
                </td>
                <td>${activo.nombre}</td>
                <td>${activo.responsable || '-'}</td>
                <td>${activo.departamento || '-'}</td>
                <td>
                    <span class="badge ${this.getEstadoClass(activo.estado)}">
                        ${activo.estado}
                    </span>
                </td>
                <td>
                    <span class="badge ${this.getCriticidadClass(activo.criticidad)}">
                        ${activo.criticidad}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.gozainApp.navigation.getCurrentApp().editarActivo('${activo.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.gozainApp.navigation.getCurrentApp().eliminarActivo('${activo.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    aplicarFiltros() {
        this.filtros = {
            tipo: this.container.querySelector('#filtroTipo')?.value || '',
            departamento: this.container.querySelector('#filtroDepartamento')?.value || '',
            busqueda: this.container.querySelector('#filtroBusqueda')?.value || ''
        };
        this.cargarActivos();
    }
    
    actualizarEstadisticas() {
        const stats = {
            total: this.activos.length,
            activos: this.activos.filter(a => a.estado === 'Activo').length,
            mantenimiento: this.activos.filter(a => a.estado === 'En mantenimiento').length,
            criticos: this.activos.filter(a => a.criticidad === 'Crítica').length
        };
        
        // Actualizar UI
        const updateStat = (id, value) => {
            const element = this.container.querySelector(`#${id}`);
            if (element) element.textContent = value;
        };
        
        updateStat('statTotal', stats.total);
        updateStat('statActivos', stats.activos);
        updateStat('statMantenimiento', stats.mantenimiento);
        updateStat('statCriticos', stats.criticos);
    }
    
    actualizarDepartamentos() {
        const departamentos = [...new Set(this.activos.map(a => a.departamento).filter(d => d))];
        const select = this.container.querySelector('#filtroDepartamento');
        
        if (select) {
            const valorActual = select.value;
            select.innerHTML = '<option value="">Todos</option>' + 
                departamentos.map(d => `<option value="${d}">${d}</option>`).join('');
            select.value = valorActual;
        }
    }
    
    async cargarGraficos() {
        // Cargar Chart.js si no está disponible
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }
        
        // Preparar datos para gráficos
        const tiposCount = {};
        const departamentosCount = {};
        
        this.activos.forEach(activo => {
            const tipo = activo.tipo || activo.tipo_activo || 'Sin tipo';
            tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
            
            const depto = activo.departamento || 'Sin departamento';
            departamentosCount[depto] = (departamentosCount[depto] || 0) + 1;
        });
        
        // Gráfico de tipos
        this.renderChart('chartTipo', {
            type: 'doughnut',
            data: {
                labels: Object.keys(tiposCount),
                datasets: [{
                    data: Object.values(tiposCount),
                    backgroundColor: [
                        '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'
                    ]
                }]
            }
        });
        
        // Gráfico de departamentos
        this.renderChart('chartDepartamento', {
            type: 'bar',
            data: {
                labels: Object.keys(departamentosCount),
                datasets: [{
                    label: 'Activos por Departamento',
                    data: Object.values(departamentosCount),
                    backgroundColor: '#0d6efd'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    renderChart(elementId, config) {
        const canvas = this.container.querySelector(`#${elementId}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        new Chart(ctx, config);
    }
    
    async loadChartJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    mostrarModalActivo(activo = null) {
        // Asegurarnos de que el modal existe
        if (!this.container.querySelector('#modalActivo')) {
            // Si estamos en dashboard, navegar a inventario primero
            if (this.currentView === 'dashboard') {
                this.navigateToView('inventario').then(() => {
                    setTimeout(() => this.mostrarModalActivo(activo), 100);
                });
                return;
            }
        }
        
        const modal = new bootstrap.Modal(this.container.querySelector('#modalActivo'));
        const form = this.container.querySelector('#formActivo');
        
        if (activo) {
            // Modo edición
            this.container.querySelector('#modalActivoTitle').textContent = 'Editar Activo';
            this.activoEditando = activo;
            
            // Llenar campos
            form.querySelector('#tipoActivo').value = activo.tipo || activo.tipo_activo || '';
            form.querySelector('#estadoActivo').value = activo.estado;
            form.querySelector('#nombreActivo').value = activo.nombre;
            form.querySelector('#responsableActivo').value = activo.responsable || '';
            form.querySelector('#departamentoActivo').value = activo.departamento || '';
            form.querySelector('#clasificacionActivo').value = activo.clasificacion || 'Interno';
            form.querySelector('#criticidadActivo').value = activo.criticidad || 'Normal';
            form.querySelector('#descripcionActivo').value = activo.descripcion || '';
        } else {
            // Modo nuevo
            this.container.querySelector('#modalActivoTitle').textContent = 'Nuevo Activo';
            this.activoEditando = null;
            form.reset();
        }
        
        modal.show();
    }
    
    async guardarActivo() {
        const form = this.container.querySelector('#formActivo');
        
        // Validar formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Recopilar datos
        const activo = {
            tipo: form.querySelector('#tipoActivo').value,
            tipo_activo: form.querySelector('#tipoActivo').value, // Por compatibilidad
            estado: form.querySelector('#estadoActivo').value,
            nombre: form.querySelector('#nombreActivo').value,
            responsable: form.querySelector('#responsableActivo').value,
            departamento: form.querySelector('#departamentoActivo').value,
            clasificacion: form.querySelector('#clasificacionActivo').value,
            criticidad: form.querySelector('#criticidadActivo').value,
            descripcion: form.querySelector('#descripcionActivo').value
        };
        
        try {
            if (this.activoEditando) {
                // Actualizar
                await this.services.api.updateActivo(this.activoEditando.id, activo);
                this.mostrarToast('Activo actualizado correctamente', 'success');
            } else {
                // Crear
                await this.services.api.createActivo(activo);
                this.mostrarToast('Activo creado correctamente', 'success');
            }
            
            // Cerrar modal
            bootstrap.Modal.getInstance(this.container.querySelector('#modalActivo')).hide();
            
            // Recargar datos según la vista actual
            if (this.currentView === 'dashboard') {
                await this.loadDashboardData();
            } else {
                await this.cargarActivos();
            }
            
        } catch (error) {
            console.error('Error guardando activo:', error);
            this.mostrarError('Error al guardar el activo');
        }
    }
    
    async editarActivo(id) {
        const activo = this.activos.find(a => a.id === id);
        if (activo) {
            this.mostrarModalActivo(activo);
        }
    }
    
    async eliminarActivo(id) {
        if (!confirm('¿Está seguro de eliminar este activo?')) {
            return;
        }
        
        try {
            await this.services.api.deleteActivo(id);
            this.mostrarToast('Activo eliminado correctamente', 'success');
            
            // Recargar datos según la vista actual
            if (this.currentView === 'dashboard') {
                await this.loadDashboardData();
            } else {
                await this.cargarActivos();
            }
        } catch (error) {
            console.error('Error eliminando activo:', error);
            this.mostrarError('Error al eliminar el activo');
        }
    }
    
    mostrarModalImportar() {
        // Asegurarnos de que el modal existe
        if (!this.container.querySelector('#modalImportar')) {
            // Si estamos en dashboard, navegar a inventario primero
            if (this.currentView === 'dashboard') {
                this.navigateToView('inventario').then(() => {
                    setTimeout(() => this.mostrarModalImportar(), 100);
                });
                return;
            }
        }
        
        const modal = new bootstrap.Modal(this.container.querySelector('#modalImportar'));
        const fileInput = this.container.querySelector('#archivoImportar');
        const btnConfirmar = this.container.querySelector('#btnConfirmarImportar');
        const preview = this.container.querySelector('#previewImportar');
        
        // Reset
        fileInput.value = '';
        btnConfirmar.disabled = true;
        preview.classList.add('d-none');
        
        // Event listener para archivo
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) {
                btnConfirmar.disabled = true;
                preview.classList.add('d-none');
                return;
            }
            
            // Validar archivo
            const extension = file.name.split('.').pop().toLowerCase();
            if (!['csv', 'xlsx'].includes(extension)) {
                this.mostrarError('Formato de archivo no soportado');
                fileInput.value = '';
                return;
            }
            
            // Mostrar preview
            await this.mostrarPreviewImportacion(file);
            btnConfirmar.disabled = false;
        });
        
        // Event listener para confirmar
        btnConfirmar.addEventListener('click', async () => {
            await this.procesarImportacion();
            modal.hide();
        });
        
        modal.show();
    }
    
    async mostrarPreviewImportacion(file) {
        const preview = this.container.querySelector('#previewImportar');
        const tablaHead = this.container.querySelector('#tablaPreview thead');
        const tablaBody = this.container.querySelector('#tablaPreview tbody');
        
        try {
            // Leer archivo
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${window.location.origin}/api/inventario/preview-import`, {
                method: 'POST',
                headers: {
                    'X-Organization-Id': this.organization
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Error al procesar archivo');
            }
            
            const data = await response.json();
            this.datosImportacion = data;
            
            // Mostrar headers
            tablaHead.innerHTML = '<tr>' + 
                data.headers.map(h => `<th>${h}</th>`).join('') + 
                '</tr>';
            
            // Mostrar primeras 5 filas
            tablaBody.innerHTML = data.preview.slice(0, 5).map(row => 
                '<tr>' + row.map(cell => `<td>${cell || '-'}</td>`).join('') + '</tr>'
            ).join('');
            
            // Mostrar info
            preview.classList.remove('d-none');
            
            // Mostrar resumen
            const resumen = document.createElement('div');
            resumen.className = 'alert alert-success mt-3';
            resumen.innerHTML = `Se importarán ${data.total} activos`;
            preview.appendChild(resumen);
            
        } catch (error) {
            console.error('Error preview:', error);
            this.mostrarError('Error al procesar el archivo');
        }
    }
    
    async procesarImportacion() {
        try {
            const fileInput = this.container.querySelector('#archivoImportar');
            const file = fileInput.files[0];
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${window.location.origin}/api/inventario/import`, {
                method: 'POST',
                headers: {
                    'X-Organization-Id': this.organization
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Error al importar');
            }
            
            const result = await response.json();
            this.mostrarToast(`Se importaron ${result.imported} activos correctamente`, 'success');
            
            // Recargar datos
            if (this.currentView === 'inventario') {
                await this.cargarActivos();
            }
            
        } catch (error) {
            console.error('Error importando:', error);
            this.mostrarError('Error al importar los activos');
        }
    }
    
    getEstadoClass(estado) {
        const clases = {
            'Activo': 'bg-success',
            'Inactivo': 'bg-secondary',
            'En mantenimiento': 'bg-warning'
        };
        return clases[estado] || 'bg-secondary';
    }
    
    getCriticidadClass(criticidad) {
        const clases = {
            'Baja': 'bg-info',
            'Normal': 'bg-primary',
            'Importante': 'bg-warning',
            'Crítica': 'bg-danger'
        };
        return clases[criticidad] || 'bg-secondary';
    }
    
    mostrarToast(mensaje, tipo = 'info') {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${mensaje}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        const container = document.querySelector('.toast-container') || (() => {
            const div = document.createElement('div');
            div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(div);
            return div;
        })();
        
        container.insertAdjacentHTML('beforeend', toastHtml);
        const toast = container.lastElementChild;
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    mostrarError(mensaje) {
        this.mostrarToast(mensaje, 'danger');
    }
}