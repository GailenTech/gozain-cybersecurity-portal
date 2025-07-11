// Módulo de Gestión de Impactos de Negocio
export default class ImpactosApp {
    constructor(options) {
        this.container = options.container;
        this.organization = options.organization;
        this.services = options.services;
        this.config = options.config;
        
        // Estado local
        this.impactos = [];
        this.plantillas = {};
        this.impactoSeleccionado = null;
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
            <div class="impactos-app fade-in">
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
                
                <!-- Resumen -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-bg-primary">
                            <div class="card-body">
                                <h6 class="card-title">Procesados Hoy</h6>
                                <h3 class="mb-0" id="statHoy">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-warning">
                            <div class="card-body">
                                <h6 class="card-title">Pendientes</h6>
                                <h3 class="mb-0" id="statPendientes">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-success">
                            <div class="card-body">
                                <h6 class="card-title">Esta Semana</h6>
                                <h3 class="mb-0" id="statSemana">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-bg-info">
                            <div class="card-body">
                                <h6 class="card-title">Total</h6>
                                <h3 class="mb-0" id="statTotal">0</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Filtros -->
                <div class="card mb-4" id="filtrosSection">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Tipo de Impacto</label>
                                <select class="form-select" id="filtroTipo">
                                    <option value="">Todos</option>
                                    <option value="alta_empleado">Alta de Empleado</option>
                                    <option value="baja_empleado">Baja de Empleado</option>
                                    <option value="nuevo_cliente">Nuevo Cliente</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="filtroEstado">
                                    <option value="">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="procesado">Procesado</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Rango de Fechas</label>
                                <div class="input-group">
                                    <input type="date" class="form-control" id="filtroFechaDesde">
                                    <span class="input-group-text">hasta</span>
                                    <input type="date" class="form-control" id="filtroFechaHasta">
                                </div>
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button class="btn btn-primary w-100" id="btnFiltrar">
                                    <i class="bi bi-funnel"></i> Filtrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Dashboard (visible por defecto) -->
                <div id="dashboardView">
                    <!-- El contenido del dashboard se cargará dinámicamente -->
                </div>
                
                <!-- Vista de tareas (oculta por defecto) -->
                <div id="tareasView" style="display: none;">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Tareas Pendientes</h5>
                            <button class="btn btn-sm btn-outline-primary" id="btnActualizarTareas">
                                <i class="bi bi-arrow-clockwise"></i> Actualizar
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input type="checkbox" class="form-check-input" id="selectAllTareas">
                                            </th>
                                            <th>Tarea</th>
                                            <th>Responsable</th>
                                            <th>Prioridad</th>
                                            <th>Fecha Límite</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tablaTareas">
                                        <tr>
                                            <td colspan="7" class="text-center">
                                                <div class="loader"></div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-3" id="accionesMasivas" style="display: none;">
                                <button class="btn btn-success btn-sm" id="btnCompletarSeleccionadas">
                                    <i class="bi bi-check-all"></i> Completar seleccionadas
                                </button>
                                <button class="btn btn-warning btn-sm" id="btnPosponer">
                                    <i class="bi bi-calendar-plus"></i> Posponer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Lista de impactos (oculta por defecto) -->
                <div id="listaView" class="card" style="display: none;">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tipo</th>
                                        <th>Usuario</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tablaImpactos">
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
            
            <!-- Modal para nuevo impacto -->
            <div class="modal fade" id="modalNuevoImpacto" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuevo Impacto de Negocio</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Tipo de Impacto*</label>
                                <select class="form-select" id="tipoImpacto">
                                    <option value="">Seleccione un tipo...</option>
                                    <optgroup label="Gestión de Personal">
                                        <option value="alta_empleado">Alta de Empleado</option>
                                        <option value="baja_empleado">Baja de Empleado</option>
                                        <option value="cambio_rol">Cambio de Rol/Departamento</option>
                                        <option value="configuracion_remoto">Configuración Trabajo Remoto</option>
                                    </optgroup>
                                    <optgroup label="Gestión de Clientes y Proyectos">
                                        <option value="nuevo_cliente">Alta de Cliente</option>
                                        <option value="nuevo_proyecto">Inicio de Proyecto</option>
                                    </optgroup>
                                    <optgroup label="Proveedores y Contratos">
                                        <option value="alta_proveedor">Alta de Proveedor</option>
                                        <option value="renovacion_contrato">Renovación de Contrato/Licencia</option>
                                    </optgroup>
                                    <optgroup label="Infraestructura y Sistemas">
                                        <option value="cambio_sistema">Cambio de Sistema/Infraestructura</option>
                                        <option value="nueva_sede">Apertura de Nueva Sede/Oficina</option>
                                        <option value="despliegue_produccion">Despliegue a Producción</option>
                                    </optgroup>
                                    <optgroup label="Seguridad y Cumplimiento">
                                        <option value="incidente_seguridad">Incidente de Seguridad</option>
                                        <option value="auditoria_externa">Auditoría Externa</option>
                                        <option value="solicitud_gdpr">Solicitud GDPR/Privacidad</option>
                                        <option value="campana_seguridad">Campaña de Concienciación</option>
                                    </optgroup>
                                    <optgroup label="Gestión de Crisis">
                                        <option value="activacion_bcp">Activación Plan Continuidad (BCP)</option>
                                        <option value="fusion_empresa">Fusión/Adquisición de Empresa</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div id="camposDinamicos">
                                <!-- Se llenarán dinámicamente según el tipo -->
                            </div>
                            <div id="vistaPrevia" class="alert alert-info d-none">
                                <h6>Vista Previa de Cambios</h6>
                                <ul id="listaVistaPrevia" class="mb-0"></ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnCrearImpacto" disabled>
                                Crear Impacto
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal para detalles de impacto -->
            <div class="modal fade" id="modalDetalleImpacto" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle del Impacto</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="detalleImpactoContent">
                            <!-- Se llenará dinámicamente -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-success" id="btnProcesarImpacto" style="display: none;">
                                <i class="bi bi-play-circle"></i> Procesar Impacto
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Botones de vista
        this.container.querySelector('#btnVistaLista')?.addEventListener('click', () => {
            this.mostrarVistaLista();
        });
        
        this.container.querySelector('#btnVistaDashboard')?.addEventListener('click', () => {
            this.mostrarVistaDashboard();
        });
        
        // Cambio de tipo de impacto
        this.container.querySelector('#tipoImpacto').addEventListener('change', (e) => {
            this.cargarPlantilla(e.target.value);
        });
        
        // Crear impacto
        this.container.querySelector('#btnCrearImpacto').addEventListener('click', () => {
            this.crearImpacto();
        });
        
        // Filtrar
        this.container.querySelector('#btnFiltrar').addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        // Procesar impacto
        this.container.querySelector('#btnProcesarImpacto').addEventListener('click', () => {
            this.procesarImpacto();
        });
    }
    
    async loadData() {
        try {
            await this.cargarImpactos();
            this.actualizarEstadisticas();
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.mostrarError('Error al cargar los datos');
        }
    }
    
    async cargarImpactos() {
        try {
            const response = await this.services.api.get('/impactos');
            // Manejar respuesta vacía o error
            if (response && response.impactos) {
                this.impactos = response.impactos;
            } else if (Array.isArray(response)) {
                this.impactos = response;
            } else {
                this.impactos = [];
            }
            this.renderTablaImpactos();
        } catch (error) {
            console.error('Error cargando impactos:', error);
            // No mostrar error si simplemente no hay datos
            if (error.status !== 404) {
                this.mostrarError('Error al cargar los impactos');
            }
            this.impactos = [];
            this.renderTablaImpactos();
        }
    }
    
    renderTablaImpactos() {
        const tbody = this.container.querySelector('#tablaImpactos');
        
        if (this.impactos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        No se encontraron impactos
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.impactos.map(impacto => {
            const fecha = new Date(impacto.fecha_creacion);
            const fechaFormateada = fecha.toLocaleDateString('es-ES');
            
            return `
                <tr>
                    <td>
                        <code>${impacto.id.substring(0, 8)}</code>
                    </td>
                    <td>${this.getTipoLabel(impacto.tipo)}</td>
                    <td>${impacto.usuario_creador}</td>
                    <td>${fechaFormateada}</td>
                    <td>
                        <span class="badge ${this.getEstadoClass(impacto.estado)}">
                            ${this.getEstadoLabel(impacto.estado)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.gozainApp.navigation.getCurrentApp().verDetalle('${impacto.id}')">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    getTipoLabel(tipo) {
        const labels = {
            'alta_empleado': 'Alta de Empleado',
            'baja_empleado': 'Baja de Empleado',
            'nuevo_cliente': 'Nuevo Cliente'
        };
        return labels[tipo] || tipo;
    }
    
    getEstadoClass(estado) {
        const clases = {
            'pendiente': 'bg-warning',
            'procesado': 'bg-success',
            'error': 'bg-danger'
        };
        return clases[estado] || 'bg-secondary';
    }
    
    getEstadoLabel(estado) {
        const labels = {
            'pendiente': '⏳ Pendiente',
            'procesado': '✓ Procesado',
            'error': '❌ Error'
        };
        return labels[estado] || estado;
    }
    
    actualizarEstadisticas() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        hace7Dias.setHours(0, 0, 0, 0);
        
        let statsHoy = 0;
        let statsPendientes = 0;
        let statsSemana = 0;
        let statsCompletados = 0;
        
        this.impactos.forEach(impacto => {
            const fecha = new Date(impacto.fecha_creacion);
            
            if (impacto.estado === 'pendiente') {
                statsPendientes++;
            } else if (impacto.estado === 'procesado') {
                statsCompletados++;
            }
            
            if (fecha >= hoy && impacto.estado === 'procesado') {
                statsHoy++;
            }
            
            if (fecha >= hace7Dias) {
                statsSemana++;
            }
        });
        
        // Actualizar cards principales
        this.container.querySelector('#statHoy').textContent = statsHoy;
        this.container.querySelector('#statPendientes').textContent = statsPendientes;
        this.container.querySelector('#statSemana').textContent = statsSemana;
        this.container.querySelector('#statTotal').textContent = this.impactos.length;
        
        // Actualizar contadores del menú
        const menuPendientes = document.querySelector('#menuStatPendientes');
        const menuCompletados = document.querySelector('#menuStatCompletados');
        
        if (menuPendientes) menuPendientes.textContent = statsPendientes;
        if (menuCompletados) menuCompletados.textContent = statsCompletados;
        
        // Calcular y actualizar tareas
        const tareas = this.generarTareasDesdeProcesados();
        const menuTareas = document.querySelector('#menuStatTareas');
        const badgeTareas = document.querySelector('.nav-link[data-menu-item="tareas"] .badge');
        
        if (menuTareas) menuTareas.textContent = tareas.length;
        if (badgeTareas) badgeTareas.textContent = tareas.length;
    }
    
    mostrarModalNuevoImpacto() {
        const modalEl = this.container.querySelector('#modalNuevoImpacto');
        if (!modalEl) return;
        
        this.modalNuevo = new bootstrap.Modal(modalEl);
        
        // Resetear formulario
        const tipoSelect = this.container.querySelector('#tipoImpacto');
        const camposDinamicos = this.container.querySelector('#camposDinamicos');
        const vistaPrevia = this.container.querySelector('#vistaPrevia');
        const btnCrear = this.container.querySelector('#btnCrearImpacto');
        
        if (tipoSelect) tipoSelect.value = '';
        if (camposDinamicos) camposDinamicos.innerHTML = '';
        if (vistaPrevia) vistaPrevia.classList.add('d-none');
        if (btnCrear) btnCrear.disabled = true;
        
        this.modalNuevo.show();
    }
    
    async cargarPlantilla(tipo) {
        if (!tipo) {
            this.container.querySelector('#camposDinamicos').innerHTML = '';
            this.container.querySelector('#btnCrearImpacto').disabled = true;
            return;
        }
        
        try {
            const plantilla = await this.services.api.get(`/impactos/plantillas/${tipo}`);
            this.plantillas[tipo] = plantilla;
            this.renderCamposDinamicos(plantilla);
            this.container.querySelector('#btnCrearImpacto').disabled = false;
        } catch (error) {
            console.error('Error cargando plantilla:', error);
            this.mostrarError('Error al cargar la plantilla');
        }
    }
    
    renderCamposDinamicos(plantilla) {
        const container = this.container.querySelector('#camposDinamicos');
        
        container.innerHTML = plantilla.campos.map(campo => {
            let inputHtml = '';
            
            switch (campo.tipo) {
                case 'text':
                    inputHtml = `<input type="text" class="form-control" id="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
                    break;
                    
                case 'date':
                    inputHtml = `<input type="date" class="form-control" id="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
                    break;
                    
                case 'select':
                    inputHtml = `
                        <select class="form-select" id="${campo.id}" ${campo.requerido ? 'required' : ''}>
                            <option value="">Seleccionar...</option>
                            ${campo.opciones.map(op => `<option value="${op}">${op}</option>`).join('')}
                        </select>
                    `;
                    break;
                    
                case 'checkbox':
                    inputHtml = `
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="${campo.id}">
                            <label class="form-check-label" for="${campo.id}">Sí</label>
                        </div>
                    `;
                    break;
                    
                case 'textarea':
                    inputHtml = `<textarea class="form-control" id="${campo.id}" rows="3" ${campo.requerido ? 'required' : ''}></textarea>`;
                    break;
                    
                case 'number':
                    inputHtml = `<input type="number" class="form-control" id="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
                    break;
                    
                case 'email':
                    inputHtml = `<input type="email" class="form-control" id="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
                    break;
                    
                case 'datetime':
                    inputHtml = `<input type="datetime-local" class="form-control" id="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
                    break;
            }
            
            return `
                <div class="mb-3">
                    <label class="form-label">${campo.label}${campo.requerido ? '*' : ''}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');
        
        // Actualizar vista previa
        this.actualizarVistaPrevia(plantilla);
    }
    
    actualizarVistaPrevia(plantilla) {
        const vistaPrevia = this.container.querySelector('#vistaPrevia');
        const lista = this.container.querySelector('#listaVistaPrevia');
        
        let items = [];
        
        if (plantilla.activos_base) {
            items.push(`Se crearán ${plantilla.activos_base.length} nuevos activos`);
        }
        
        if (plantilla.tareas) {
            items.push(`Se generarán ${plantilla.tareas.length} tareas de seguimiento`);
        }
        
        lista.innerHTML = items.map(item => `<li>${item}</li>`).join('');
        vistaPrevia.classList.remove('d-none');
    }
    
    async crearImpacto() {
        const tipo = this.container.querySelector('#tipoImpacto').value;
        const plantilla = this.plantillas[tipo];
        
        if (!plantilla) return;
        
        // Recopilar datos del formulario
        const datos = {};
        plantilla.campos.forEach(campo => {
            const elemento = this.container.querySelector(`#${campo.id}`);
            if (campo.tipo === 'checkbox') {
                datos[campo.id] = elemento.checked;
            } else {
                datos[campo.id] = elemento.value;
            }
        });
        
        try {
            const nuevoImpacto = await this.services.api.post('/impactos', {
                tipo,
                datos
            });
            
            this.mostrarExito('Impacto creado correctamente');
            
            // Cerrar modal y recargar
            if (this.modalNuevo) {
                this.modalNuevo.hide();
            }
            await this.loadData();
            
            // Mostrar detalles del nuevo impacto
            this.verDetalle(nuevoImpacto.id);
            
        } catch (error) {
            console.error('Error creando impacto:', error);
            this.mostrarError('Error al crear el impacto');
        }
    }
    
    async verDetalle(impactoId) {
        const impacto = this.impactos.find(i => i.id === impactoId);
        if (!impacto) return;
        
        this.impactoSeleccionado = impacto;
        
        const modalEl = this.container.querySelector('#modalDetalleImpacto');
        if (!modalEl) return;
        
        // Almacenar referencia al modal para poder cerrarlo después
        this.modalDetalle = new bootstrap.Modal(modalEl);
        const content = this.container.querySelector('#detalleImpactoContent');
        const btnProcesar = this.container.querySelector('#btnProcesarImpacto');
        
        // Mostrar/ocultar botón procesar
        if (btnProcesar) {
            btnProcesar.style.display = impacto.estado === 'pendiente' ? 'block' : 'none';
        }
        
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información General</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>ID:</th>
                            <td><code>${impacto.id}</code></td>
                        </tr>
                        <tr>
                            <th>Tipo:</th>
                            <td>${this.getTipoLabel(impacto.tipo)}</td>
                        </tr>
                        <tr>
                            <th>Estado:</th>
                            <td>
                                <span class="badge ${this.getEstadoClass(impacto.estado)}">
                                    ${this.getEstadoLabel(impacto.estado)}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <th>Creado:</th>
                            <td>${new Date(impacto.fecha_creacion).toLocaleString('es-ES')}</td>
                        </tr>
                        ${impacto.fecha_procesamiento ? `
                        <tr>
                            <th>Procesado:</th>
                            <td>${new Date(impacto.fecha_procesamiento).toLocaleString('es-ES')}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Datos del Impacto</h6>
                    <table class="table table-sm">
                        ${Object.entries(impacto.datos || {}).map(([key, value]) => `
                            <tr>
                                <th>${this.formatFieldName(key)}:</th>
                                <td>${value}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
            
            ${impacto.estado === 'procesado' && impacto.acciones_ejecutadas ? `
            <hr>
            <h6>Acciones Ejecutadas</h6>
            <div class="row">
                ${impacto.acciones_ejecutadas.activos_creados?.length > 0 ? `
                <div class="col-md-6">
                    <p><strong>Activos Creados (${impacto.acciones_ejecutadas.activos_creados.length}):</strong></p>
                    <ul>
                        ${impacto.acciones_ejecutadas.activos_creados.map(a => `
                            <li>${a.nombre} (${a.tipo})</li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${impacto.acciones_ejecutadas.tareas_creadas?.length > 0 ? `
                <div class="col-md-6">
                    <p><strong>Tareas Generadas (${impacto.acciones_ejecutadas.tareas_creadas.length}):</strong></p>
                    <ul>
                        ${impacto.acciones_ejecutadas.tareas_creadas.map(t => `
                            <li>${t.descripcion} - ${t.responsable}</li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${impacto.estado === 'error' ? `
            <div class="alert alert-danger">
                <strong>Error:</strong> ${impacto.error || 'Error desconocido'}
            </div>
            ` : ''}
        `;
        
        this.modalDetalle.show();
    }
    
    formatFieldName(fieldName) {
        return fieldName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    async procesarImpacto() {
        if (!this.impactoSeleccionado || this.impactoSeleccionado.estado !== 'pendiente') {
            return;
        }
        
        if (!confirm('¿Está seguro de procesar este impacto? Esta acción creará activos y tareas automáticamente.')) {
            return;
        }
        
        try {
            const resultado = await this.services.api.post(`/impactos/${this.impactoSeleccionado.id}/procesar`);
            
            if (resultado.success) {
                this.mostrarExito('Impacto procesado correctamente');
                
                // Notificar a otros módulos
                this.services.eventBus.emit('impacto:procesado', {
                    impacto: this.impactoSeleccionado,
                    resultado: resultado.resultado
                });
                
                // Cerrar modal y recargar
                if (this.modalDetalle) {
                    this.modalDetalle.hide();
                    
                    // Limpiar backdrop manualmente si es necesario
                    setTimeout(() => {
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                        document.body.classList.remove('modal-open');
                        document.body.style.removeProperty('padding-right');
                    }, 300);
                }
                await this.loadData();
            } else {
                this.mostrarError(resultado.error || 'Error al procesar el impacto');
            }
            
        } catch (error) {
            console.error('Error procesando impacto:', error);
            this.mostrarError('Error al procesar el impacto');
        }
    }
    
    aplicarFiltros() {
        const filtros = {
            tipo: this.container.querySelector('#filtroTipo').value,
            estado: this.container.querySelector('#filtroEstado').value,
            fecha_desde: this.container.querySelector('#filtroFechaDesde').value,
            fecha_hasta: this.container.querySelector('#filtroFechaHasta').value
        };
        
        // TODO: Implementar filtrado en el backend
        this.cargarImpactos();
    }
    
    mostrarExito(mensaje) {
        this.mostrarToast(mensaje, 'success');
    }
    
    mostrarError(mensaje) {
        this.mostrarToast(mensaje, 'error');
    }
    
    mostrarAdvertencia(mensaje) {
        this.mostrarToast(mensaje, 'warning');
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
    
    setupModuleMenu() {
        // Obtener el menú lateral
        const appMenu = document.getElementById('appMenu');
        if (!appMenu) return;
        
        // Limpiar el menú actual
        appMenu.innerHTML = '';
        
        // Menú lateral con estructura de la imagen
        const menuHtml = `
            <li class="nav-item">
                <a class="nav-link active" href="#" data-menu-item="dashboard">
                    <i class="bi bi-speedometer2"></i>
                    Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-menu-item="nuevo">
                    <i class="bi bi-plus-circle"></i>
                    Nuevo Impacto
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-menu-item="lista">
                    <i class="bi bi-list-ul"></i>
                    Lista de Impactos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-menu-item="tareas">
                    <i class="bi bi-check2-square"></i>
                    Tareas Pendientes
                    <span class="badge bg-info ms-2">0</span>
                </a>
            </li>
            
            <hr class="my-3">
            
            <li class="nav-item">
                <div class="px-3 py-2">
                    <h6 class="text-muted mb-2">Resumen</h6>
                    <div class="small">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Pendientes:</span>
                            <span class="badge bg-warning" id="menuStatPendientes">0</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                            <span>Completados:</span>
                            <span class="badge bg-success" id="menuStatCompletados">0</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Tareas:</span>
                            <span class="badge bg-info" id="menuStatTareas">0</span>
                        </div>
                    </div>
                </div>
            </li>
        `;
        
        appMenu.innerHTML = menuHtml;
        
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
            case 'lista':
                this.mostrarVistaLista();
                break;
            case 'nuevo':
                this.mostrarModalNuevoImpacto();
                break;
            case 'tareas':
                this.mostrarVistaTareas();
                break;
        }
    }
    
    setupDashboardEventListeners() {
        // Escuchar eventos del dashboard
        const eventBus = this.services.eventBus;
        
        // Nuevo impacto desde dashboard
        eventBus.on('impactos:new', () => {
            this.mostrarModalNuevoImpacto();
        });
    }
    
    mostrarVistaTareas() {
        // Ocultar todas las vistas
        const listaView = this.container.querySelector('#listaView');
        const dashboardView = this.container.querySelector('#dashboardView');
        const tareasView = this.container.querySelector('#tareasView');
        
        if (listaView) listaView.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'none';
        if (tareasView) tareasView.style.display = 'block';
        
        // Ocultar filtros en vista de tareas
        const filtrosSection = this.container.querySelector('#filtrosSection');
        if (filtrosSection) {
            filtrosSection.style.display = 'none';
        }
        
        // Actualizar menú lateral
        const appMenu = document.getElementById('appMenu');
        if (appMenu) {
            appMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.menuItem === 'tareas') {
                    link.classList.add('active');
                }
            });
        }
        
        // Cargar tareas
        this.cargarTareas();
        
        // Configurar event listeners de tareas si no están configurados
        this.setupTareasEventListeners();
    }
    
    async cargarTareas() {
        try {
            // Usar API real de tareas
            const response = await this.services.api.get('/impactos/tareas');
            if (response.success) {
                this.renderTablaTareas(response.tareas || []);
            } else {
                // Si falla, usar simulación como fallback
                const tareas = this.generarTareasDesdeProcesados();
                this.renderTablaTareas(tareas);
            }
        } catch (error) {
            console.error('Error cargando tareas:', error);
            // Usar simulación como fallback
            const tareas = this.generarTareasDesdeProcesados();
            this.renderTablaTareas(tareas);
        }
    }
    
    generarTareasDesdeProcesados() {
        const tareas = [];
        
        this.impactos.forEach(impacto => {
            if (impacto.estado === 'procesado' && impacto.acciones_ejecutadas?.tareas_creadas) {
                impacto.acciones_ejecutadas.tareas_creadas.forEach(tarea => {
                    tareas.push({
                        id: `${impacto.id}-${tareas.length}`,
                        descripcion: tarea.descripcion,
                        responsable: tarea.responsable,
                        prioridad: tarea.prioridad || 'Normal',
                        fecha_limite: tarea.fecha_limite || this.calcularFechaLimite(7),
                        estado: 'Pendiente',
                        impacto_id: impacto.id,
                        tipo_impacto: this.getTipoLabel(impacto.tipo)
                    });
                });
            }
        });
        
        return tareas;
    }
    
    calcularFechaLimite(dias) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + dias);
        return fecha.toISOString().split('T')[0];
    }
    
    renderTablaTareas(tareas) {
        const tbody = this.container.querySelector('#tablaTareas');
        
        if (tareas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        No hay tareas pendientes
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = tareas.map(tarea => {
            const fechaLimite = new Date(tarea.fecha_limite);
            const hoy = new Date();
            const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
            const urgente = diasRestantes <= 3;
            
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input tarea-checkbox" data-tarea-id="${tarea.id}">
                    </td>
                    <td>
                        <div>
                            <strong>${tarea.descripcion}</strong>
                            <br>
                            <small class="text-muted">Origen: ${tarea.tipo_impacto}</small>
                        </div>
                    </td>
                    <td>${tarea.responsable}</td>
                    <td>
                        <span class="badge ${this.getPrioridadClass(tarea.prioridad)}">
                            ${tarea.prioridad}
                        </span>
                    </td>
                    <td>
                        <span class="${urgente ? 'text-danger fw-bold' : ''}">
                            ${fechaLimite.toLocaleDateString('es-ES')}
                        </span>
                        ${urgente ? '<br><small class="text-danger">Urgente</small>' : ''}
                    </td>
                    <td>
                        <span class="badge bg-warning">
                            ${tarea.estado}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="window.gozainApp.navigation.getCurrentApp().completarTarea('${tarea.id}')">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="window.gozainApp.navigation.getCurrentApp().verDetalleImpacto('${tarea.impacto_id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Actualizar contador en el menú
        const badgeTareas = this.container.querySelector('.nav-link[data-menu-item="tareas"] .badge');
        if (badgeTareas) {
            badgeTareas.textContent = tareas.length;
        }
    }
    
    getPrioridadClass(prioridad) {
        const clases = {
            'Alta': 'bg-danger',
            'Normal': 'bg-primary',
            'Baja': 'bg-secondary'
        };
        return clases[prioridad] || 'bg-secondary';
    }
    
    setupTareasEventListeners() {
        if (this.tareasListenersSetup) return;
        
        // Botón actualizar
        this.container.querySelector('#btnActualizarTareas')?.addEventListener('click', () => {
            this.cargarTareas();
        });
        
        // Checkbox seleccionar todo
        this.container.querySelector('#selectAllTareas')?.addEventListener('change', (e) => {
            const checkboxes = this.container.querySelectorAll('.tarea-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            this.actualizarAccionesMasivas();
        });
        
        // Checkboxes individuales
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('tarea-checkbox')) {
                this.actualizarAccionesMasivas();
            }
        });
        
        // Botón completar seleccionadas
        this.container.querySelector('#btnCompletarSeleccionadas')?.addEventListener('click', () => {
            this.completarTareasSeleccionadas();
        });
        
        // Botón posponer
        this.container.querySelector('#btnPosponer')?.addEventListener('click', () => {
            this.posponerTareasSeleccionadas();
        });
        
        this.tareasListenersSetup = true;
    }
    
    actualizarAccionesMasivas() {
        const checkboxes = this.container.querySelectorAll('.tarea-checkbox:checked');
        const accionesMasivas = this.container.querySelector('#accionesMasivas');
        
        if (accionesMasivas) {
            accionesMasivas.style.display = checkboxes.length > 0 ? 'block' : 'none';
        }
    }
    
    async completarTarea(tareaId) {
        try {
            // Usar API real para completar tarea
            const response = await this.services.api.post(`/impactos/tareas/${tareaId}/completar`, {
                comentarios: ''
            });
            
            if (response.success) {
                this.mostrarExito('Tarea marcada como completada');
                await this.cargarTareas(); // Recargar tareas
            } else {
                this.mostrarError(response.message || 'Error al completar la tarea');
            }
        } catch (error) {
            console.error('Error completando tarea:', error);
            this.mostrarError('Error al completar la tarea');
        }
    }
    
    async completarTareasSeleccionadas() {
        const checkboxes = this.container.querySelectorAll('.tarea-checkbox:checked');
        const count = checkboxes.length;
        
        if (count === 0) return;
        
        if (confirm(`¿Marcar ${count} tarea(s) como completadas?`)) {
            let completadas = 0;
            let errores = 0;
            
            // Completar cada tarea seleccionada
            for (const checkbox of checkboxes) {
                const tareaId = checkbox.value;
                try {
                    const response = await this.services.api.post(`/impactos/tareas/${tareaId}/completar`, {
                        comentarios: 'Completada en lote'
                    });
                    
                    if (response.success) {
                        completadas++;
                    } else {
                        errores++;
                    }
                } catch (error) {
                    console.error(`Error completando tarea ${tareaId}:`, error);
                    errores++;
                }
            }
            
            // Mostrar resultado
            if (completadas > 0 && errores === 0) {
                this.mostrarExito(`${completadas} tareas marcadas como completadas`);
            } else if (completadas > 0 && errores > 0) {
                this.mostrarAdvertencia(`${completadas} tareas completadas, ${errores} errores`);
            } else {
                this.mostrarError('Error al completar las tareas');
            }
            
            // Recargar tareas
            await this.cargarTareas();
        }
    }
    
    verDetalleImpacto(impactoId) {
        this.verDetalle(impactoId);
    }
    
    posponerTareasSeleccionadas() {
        const checkboxes = this.container.querySelectorAll('.tarea-checkbox:checked');
        const count = checkboxes.length;
        
        if (count === 0) {
            this.mostrarAdvertencia('Seleccione al menos una tarea para posponer');
            return;
        }
        
        // Por ahora mostrar mensaje informativo
        this.mostrarAdvertencia('La funcionalidad de posponer tareas estará disponible próximamente');
        
        // TODO: Implementar modal para seleccionar nueva fecha
        // TODO: Crear endpoint en el backend para actualizar fecha de tareas
    }
    
    mostrarVistaLista() {
        // Cambiar estado de botones
        const btnLista = this.container.querySelector('#btnVistaLista');
        const btnDashboard = this.container.querySelector('#btnVistaDashboard');
        
        if (btnLista) btnLista.classList.add('active');
        if (btnDashboard) btnDashboard.classList.remove('active');
        
        // Mostrar/ocultar vistas
        const listaView = this.container.querySelector('#listaView');
        const dashboardView = this.container.querySelector('#dashboardView');
        const tareasView = this.container.querySelector('#tareasView');
        
        if (listaView) listaView.style.display = 'block';
        if (dashboardView) dashboardView.style.display = 'none';
        if (tareasView) tareasView.style.display = 'none';
        
        // Mostrar filtros en vista lista
        const filtrosSection = this.container.querySelector('#filtrosSection');
        if (filtrosSection) {
            filtrosSection.style.display = 'block';
        }
        
        // Actualizar menú lateral
        const appMenu = document.getElementById('appMenu');
        if (appMenu) {
            appMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.menuItem === 'lista') {
                    link.classList.add('active');
                }
            });
        }
    }
    
    async mostrarVistaDashboard() {
        // Cambiar estado de botones
        const btnLista = this.container.querySelector('#btnVistaLista');
        const btnDashboard = this.container.querySelector('#btnVistaDashboard');
        
        if (btnLista) btnLista.classList.remove('active');
        if (btnDashboard) btnDashboard.classList.add('active');
        
        // Mostrar/ocultar vistas
        const listaView = this.container.querySelector('#listaView');
        const dashboardView = this.container.querySelector('#dashboardView');
        const tareasView = this.container.querySelector('#tareasView');
        
        if (listaView) listaView.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'block';
        if (tareasView) tareasView.style.display = 'none';
        
        // Ocultar filtros en vista dashboard
        const filtrosSection = this.container.querySelector('#filtrosSection');
        if (filtrosSection) {
            filtrosSection.style.display = 'none';
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
        
        // Cargar dashboard
        try {
            const { default: Dashboard } = await import('./dashboard.js');
            const dashboard = new Dashboard(dashboardView, this.services.api);
            await dashboard.render();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            if (dashboardView) {
                dashboardView.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i> Dashboard en desarrollo
                    </div>
                `;
            }
        }
    }
}