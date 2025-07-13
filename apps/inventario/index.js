// Módulo de Inventario de Activos ISO 27001
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
        
        // Configurar listeners de eventos del dashboard
        this.setupDashboardEventListeners();
        
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
            <div class="inventario-app fade-in" data-current-view="dashboard">
                <div class="d-flex justify-content-end mb-4">
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-secondary" id="btnVistaLista" title="Vista de Lista">
                            <i class="bi bi-list-ul"></i>
                        </button>
                        <button class="btn btn-outline-secondary" id="btnVistaDashboard" title="Vista de Dashboard">
                            <i class="bi bi-grid-3x3-gap"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Filtros -->
                <div class="card mb-4" id="filtrosSection">
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
                
                <!-- Estadísticas -->
                <div class="row mb-4" id="estadisticas">
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
                
                <!-- Dashboard (visible por defecto) -->
                <div id="dashboardView">
                    <!-- El contenido del dashboard se cargará dinámicamente -->
                </div>
                
                <!-- Tabla de activos (oculta por defecto) -->
                <div id="listaView" class="card d-none">
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
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i> Formatos soportados: CSV, Excel (.xlsx)
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Seleccionar archivo</label>
                                <input type="file" class="form-control" id="archivoImportar" accept=".csv,.xlsx">
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="reemplazarExistentes">
                                    <label class="form-check-label" for="reemplazarExistentes">
                                        Reemplazar activos existentes
                                    </label>
                                </div>
                            </div>
                            
                            <div id="previewImportar" class="d-none">
                                <h6>Vista previa:</h6>
                                <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                                    <table class="table table-sm" id="tablaPreview">
                                        <thead></thead>
                                        <tbody></tbody>
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
    
    setupEventListeners() {
        // Botones de vista
        const btnLista = this.container.querySelector('#btnVistaLista');
        const btnDashboard = this.container.querySelector('#btnVistaDashboard');
        
        if (btnLista) {
            btnLista.addEventListener('click', () => {
                this.mostrarVistaLista();
            });
        }
        
        if (btnDashboard) {
            btnDashboard.addEventListener('click', () => {
                this.mostrarVistaDashboard();
            });
        }
        
        // Botón buscar
        this.container.querySelector('#btnBuscar').addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        // Enter en búsqueda
        this.container.querySelector('#filtroBusqueda').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.aplicarFiltros();
            }
        });
        
        // Cambios en filtros
        this.container.querySelector('#filtroTipo').addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        this.container.querySelector('#filtroDepartamento').addEventListener('change', () => {
            this.aplicarFiltros();
        });
        
        // Guardar activo
        this.container.querySelector('#btnGuardarActivo').addEventListener('click', () => {
            this.guardarActivo();
        });
        
        // Escuchar cambios de organización
        this.services.eventBus.on('organization:changed', () => {
            this.loadData();
        });
    }
    
    async loadData() {
        try {
            // Cargar activos
            await this.cargarActivos();
            
            // Cargar departamentos
            await this.cargarDepartamentos();
            
            // Cargar estadísticas
            await this.actualizarEstadisticas();
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.mostrarError('Error al cargar los datos');
        }
    }
    
    async cargarActivos() {
        try {
            const params = new URLSearchParams(this.filtros);
            this.activos = await this.services.api.get(`/inventario/activos?${params}`);
            this.renderTablaActivos();
        } catch (error) {
            console.error('Error cargando activos:', error);
            this.mostrarError('Error al cargar los activos');
        }
    }
    
    async cargarDepartamentos() {
        try {
            const departamentos = await this.services.api.get('/inventario/departamentos');
            const select = this.container.querySelector('#filtroDepartamento');
            
            // Si no existe el select (no estamos en vista con filtros), no hacer nada
            if (!select) {
                return;
            }
            
            select.innerHTML = '<option value="">Todos</option>';
            departamentos.forEach(depto => {
                const option = document.createElement('option');
                option.value = depto;
                option.textContent = depto;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando departamentos:', error);
        }
    }
    
    async actualizarEstadisticas() {
        try {
            const stats = await this.services.api.get('/inventario/estadisticas');
            
            // Actualizar solo si existen los elementos
            const statTotal = this.container.querySelector('#statTotal');
            if (statTotal) statTotal.textContent = stats.total || 0;
            
            const statActivos = this.container.querySelector('#statActivos');
            if (statActivos) statActivos.textContent = stats.por_estado?.Activo || 0;
            
            const statMantenimiento = this.container.querySelector('#statMantenimiento');
            if (statMantenimiento) statMantenimiento.textContent = stats.por_estado?.['En mantenimiento'] || 0;
            
            const statCriticos = this.container.querySelector('#statCriticos');
            if (statCriticos) statCriticos.textContent = stats.por_criticidad?.Crítica || 0;
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }
    
    renderTablaActivos() {
        const tbody = this.container.querySelector('#tablaActivos');
        
        // Si no existe la tabla (no estamos en vista lista), no hacer nada
        if (!tbody) {
            return;
        }
        
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
    
    aplicarFiltros() {
        this.filtros = {
            tipo: this.container.querySelector('#filtroTipo').value,
            departamento: this.container.querySelector('#filtroDepartamento').value,
            busqueda: this.container.querySelector('#filtroBusqueda').value
        };
        this.cargarActivos();
    }
    
    mostrarModalActivo(activo = null) {
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
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const datos = {
            tipo: form.querySelector('#tipoActivo').value,
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
                await this.services.api.put(`/inventario/activos/${this.activoEditando.id}`, datos);
                this.mostrarExito('Activo actualizado correctamente');
            } else {
                // Crear
                await this.services.api.post('/inventario/activos', datos);
                this.mostrarExito('Activo creado correctamente');
            }
            
            // Cerrar modal y recargar
            bootstrap.Modal.getInstance(this.container.querySelector('#modalActivo')).hide();
            await this.loadData();
            
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
            await this.services.api.delete(`/inventario/activos/${id}`);
            this.mostrarExito('Activo eliminado correctamente');
            await this.loadData();
        } catch (error) {
            console.error('Error eliminando activo:', error);
            this.mostrarError('Error al eliminar el activo');
        }
    }
    
    mostrarExito(mensaje) {
        // Crear toast de éxito
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
        // Crear toast de error
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
    
    mostrarToast(mensaje, tipo = 'success') {
        // Si es solo un mensaje, crear el HTML
        if (typeof mensaje === 'string') {
            const iconos = {
                success: 'bi-check-circle',
                error: 'bi-exclamation-circle',
                info: 'bi-info-circle',
                warning: 'bi-exclamation-triangle'
            };
            const clases = {
                success: 'text-bg-success',
                error: 'text-bg-danger',
                info: 'text-bg-info',
                warning: 'text-bg-warning'
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
            this.mostrarToastHtml(html);
        } else {
            // Si es HTML directo
            this.mostrarToastHtml(mensaje);
        }
    }
    
    mostrarToastHtml(html) {
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
    
    mostrarVistaLista() {
        // Cambiar estado de botones
        this.container.querySelector('#btnVistaLista').classList.add('active');
        this.container.querySelector('#btnVistaDashboard').classList.remove('active');
        
        // Mostrar/ocultar vistas usando clases CSS
        const listaView = this.container.querySelector('#listaView');
        const dashboardView = this.container.querySelector('#dashboardView');
        
        if (listaView) {
            listaView.classList.remove('d-none');
        }
        
        if (dashboardView) {
            dashboardView.classList.add('d-none');
        }
        
        // Agregar atributo para testing - en el elemento correcto
        const inventarioApp = this.container.querySelector('.inventario-app');
        if (inventarioApp) {
            inventarioApp.setAttribute('data-current-view', 'lista');
        }
        
        // Mostrar filtros en vista lista
        const filtrosSection = this.container.querySelector('#filtrosSection');
        if (filtrosSection) {
            filtrosSection.classList.remove('d-none');
        }
        
        // Actualizar menú lateral
        const appMenu = document.getElementById('appMenu');
        if (appMenu) {
            appMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.menuItem === 'inventario') {
                    link.classList.add('active');
                }
            });
        }
    }
    
    async mostrarVistaDashboard() {
        // Cambiar estado de botones
        this.container.querySelector('#btnVistaLista').classList.remove('active');
        this.container.querySelector('#btnVistaDashboard').classList.add('active');
        
        // Mostrar/ocultar vistas usando clases CSS
        this.container.querySelector('#listaView').classList.add('d-none');
        this.container.querySelector('#dashboardView').classList.remove('d-none');
        
        // Agregar atributo para testing - en el elemento correcto
        const inventarioApp = this.container.querySelector('.inventario-app');
        if (inventarioApp) {
            inventarioApp.setAttribute('data-current-view', 'dashboard');
        }
        
        // Ocultar filtros en vista dashboard
        const filtrosSection = this.container.querySelector('#filtrosSection');
        if (filtrosSection) {
            filtrosSection.classList.add('d-none');
        }
        
        // Actualizar menú lateral
        const appMenu = document.getElementById('appMenu');
        if (appMenu) {
            appMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.menuItem === 'dashboard') {
                    link.classList.add('active');
                }
            });
        }
        
        // Cargar dashboard si existe
        try {
            const { default: Dashboard } = await import('./dashboard.js');
            const dashboard = new Dashboard(this.container.querySelector('#dashboardView'), this.services.api);
            await dashboard.render();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.container.querySelector('#dashboardView').innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Dashboard en desarrollo
                </div>
            `;
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
            { id: 'inventario', icon: 'bi-box-seam', text: 'Inventario' },
            { id: 'nuevo', icon: 'bi-plus-circle', text: 'Nuevo Activo' },
            { id: 'importar', icon: 'bi-upload', text: 'Importar' },
            { id: 'reportes', icon: 'bi-file-earmark-bar-graph', text: 'Reportes' },
            { id: 'auditoria', icon: 'bi-clock-history', text: 'Auditoría' }
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
            case 'inventario':
                this.mostrarVistaLista();
                break;
            case 'nuevo':
                this.mostrarModalActivo();
                break;
            case 'importar':
                this.mostrarModalImportar();
                break;
            case 'reportes':
                // TODO: Implementar reportes
                this.mostrarToast('Reportes en desarrollo', 'info');
                break;
            case 'auditoria':
                // TODO: Implementar auditoría
                this.mostrarToast('Auditoría en desarrollo', 'info');
                break;
        }
    }
    
    setupDashboardEventListeners() {
        // Escuchar eventos del dashboard
        const eventBus = this.services.eventBus;
        
        // Exportar
        eventBus.on('inventario:export', (data) => {
            if (data.format === 'csv') {
                // TODO: Implementar exportación CSV
                this.mostrarToast('Exportación CSV en desarrollo', 'info');
            } else if (data.format === 'excel') {
                // TODO: Implementar exportación Excel
                this.mostrarToast('Exportación Excel en desarrollo', 'info');
            }
        });
        
        // Nuevo activo
        eventBus.on('inventario:new', () => {
            this.mostrarModalActivo();
        });
        
        // Ver lista
        eventBus.on('inventario:viewList', () => {
            this.mostrarVistaLista();
        });
        
        // Importar
        eventBus.on('inventario:import', () => {
            this.mostrarModalImportar();
        });
        
        // Filtrar
        eventBus.on('inventario:filter', (filtros) => {
            // Cambiar a vista de lista y aplicar filtros
            this.mostrarVistaLista();
            
            // Aplicar filtros
            if (filtros.tipo) {
                this.filtros.tipo = filtros.tipo;
                const selectTipo = this.container.querySelector('#filtroTipo');
                if (selectTipo) {
                    selectTipo.value = filtros.tipo;
                }
            }
            
            if (filtros.departamento) {
                this.filtros.departamento = filtros.departamento;
                const selectDepto = this.container.querySelector('#filtroDepartamento');
                if (selectDepto) {
                    // Crear opción si no existe
                    let option = Array.from(selectDepto.options).find(opt => opt.text === filtros.departamento);
                    if (!option) {
                        option = new Option(filtros.departamento, filtros.departamento);
                        selectDepto.add(option);
                    }
                    selectDepto.value = filtros.departamento;
                }
            }
            
            this.aplicarFiltros();
        });
    }
    
    mostrarModalImportar() {
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
        const reemplazar = this.container.querySelector('#reemplazarExistentes').checked;
        const fileInput = this.container.querySelector('#archivoImportar');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('reemplazar', reemplazar);
            
            // Mostrar loading
            this.mostrarToast('Importando activos...', 'info');
            
            const response = await fetch(`${window.location.origin}/api/inventario/importar`, {
                method: 'POST',
                headers: {
                    'X-Organization-Id': this.organization
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al importar');
            }
            
            const resultado = await response.json();
            
            // Mostrar resultado
            this.mostrarExito(`Se importaron ${resultado.importados} activos correctamente`);
            
            // Recargar datos
            await this.loadData();
            
        } catch (error) {
            console.error('Error importando:', error);
            this.mostrarError(`Error al importar: ${error.message}`);
        }
    }
    
    async exportarActivos() {
        try {
            const params = new URLSearchParams(this.filtros);
            const response = await fetch(`${window.location.origin}/api/inventario/exportar?${params}`, {
                headers: {
                    'X-Organization-Id': this.organization
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al exportar');
            }
            
            // Descargar archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activos_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.mostrarExito('Activos exportados correctamente');
            
        } catch (error) {
            console.error('Error exportando:', error);
            this.mostrarError('Error al exportar activos');
        }
    }
}