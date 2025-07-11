// Variables globales
let activosData = [];
let tiposActivos = [];
let chartTipos = null;
let chartDepartamentos = null;

// Estado de filtros activos
let filtrosActivos = {
    tipo: '',
    departamento: '',
    responsable: '',
    busqueda: ''
};

// Configurar headers para todas las peticiones
function getHeaders() {
    const orgId = localStorage.getItem('organizacion_id');
    return {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
    };
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay organización seleccionada
    const orgId = localStorage.getItem('organizacion_id');
    const orgNombre = localStorage.getItem('organizacion_nombre');
    
    if (!orgId) {
        // Redirigir a login si no hay organización
        window.location.href = '/login';
        return;
    }
    
    // Mostrar nombre de organización
    const orgElement = document.getElementById('nombreOrganizacion');
    if (orgElement) {
        orgElement.textContent = orgNombre;
    }
    
    cargarTiposActivos();
    cargarEstadisticas();
    cargarActivos();
    
    // Event listeners
    document.getElementById('formNuevoActivo').addEventListener('submit', crearActivo);
    document.getElementById('formImportar').addEventListener('submit', importarActivos);
    
    // Debug para el input de archivo
    const fileInput = document.getElementById('archivoImportar');
    if (fileInput) {
        // Verificar si algo está bloqueando el click
        fileInput.addEventListener('click', function(e) {
            console.log('Click en input de archivo');
            console.log('Event:', e);
            console.log('Default prevented?', e.defaultPrevented);
            // Forzar el click si está bloqueado
            if (e.defaultPrevented) {
                console.log('Intentando forzar apertura del selector...');
                setTimeout(() => {
                    this.click();
                }, 100);
            }
        }, true); // Captura en fase de captura
        
        fileInput.addEventListener('change', function(e) {
            console.log('Archivo cambiado:', e.target.files);
            if (e.target.files && e.target.files.length > 0) {
                console.log('Archivo seleccionado:', e.target.files[0].name);
            }
        });
        
        // Verificar si hay estilos que lo oculten
        const styles = window.getComputedStyle(fileInput);
        console.log('Input file styles:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            pointerEvents: styles.pointerEvents,
            position: styles.position,
            zIndex: styles.zIndex
        });
    } else {
        console.error('No se encontró el input de archivo');
    }
    
    // La navegación ahora se maneja con navigation.js
});

// Variable para controlar si estamos filtrando
let filtrandoActivos = false;

// Funciones de navegación
function mostrarVista(vista) {
    // Ocultar todas las vistas
    document.querySelectorAll('.vista-contenido').forEach(v => {
        v.style.display = 'none';
    });
    
    // Mostrar vista seleccionada
    document.getElementById(`vista-${vista}`).style.display = 'block';
    
    // Actualizar nav activo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-vista') === vista) {
            link.classList.add('active');
        }
    });
    
    // Cargar datos según la vista (no cargar activos si estamos filtrando)
    if (vista === 'dashboard') {
        cargarEstadisticas();
    } else if (vista === 'activos' && !filtrandoActivos) {
        cargarActivos();
    } else if (vista === 'reportes') {
        cargarReportes();
    } else if (vista === 'auditoria') {
        cargarAuditoria();
    }
    
    // Reset flag después de mostrar vista
    if (vista === 'activos') {
        filtrandoActivos = false;
    }
}

// Cargar tipos de activos
async function cargarTiposActivos() {
    try {
        const response = await fetch('/api/tipos_activos', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            tiposActivos = data.tipos;
            
            // Llenar selects
            const selectTipo = document.getElementById('tipoActivo');
            const selectFiltro = document.getElementById('filtroTipo');
            const selectImportar = document.getElementById('tipoImportar');
            
            tiposActivos.forEach(tipo => {
                selectTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
                selectFiltro.innerHTML += `<option value="${tipo}">${tipo}</option>`;
                // No agregar al select de importar porque ya tiene opciones hardcodeadas
                // selectImportar.innerHTML += `<option value="${tipo}">${tipo}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const stats = data.estadisticas;
            
            // Actualizar cards
            document.getElementById('stat-total').textContent = stats.total_activos;
            document.getElementById('stat-hardware').textContent = stats.por_tipo['Hardware'] || 0;
            document.getElementById('stat-software').textContent = stats.por_tipo['Software e Información'] || 0;
            document.getElementById('stat-criticos').textContent = stats.activos_criticos;
            
            // Actualizar gráficos
            actualizarGraficos(stats);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Actualizar gráficos
function actualizarGraficos(stats) {
    // Gráfico de tipos
    const ctxTipos = document.getElementById('chartTipos').getContext('2d');
    if (chartTipos) chartTipos.destroy();
    
    chartTipos = new Chart(ctxTipos, {
        type: 'doughnut',
        data: {
            labels: Object.keys(stats.por_tipo),
            datasets: [{
                data: Object.values(stats.por_tipo),
                backgroundColor: [
                    '#0d6efd',
                    '#6610f2',
                    '#6f42c1',
                    '#d63384',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements[0] ? 'pointer' : 'default';
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const tipo = Object.keys(stats.por_tipo)[index];
                    filtrarPorTipo(tipo);
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Activos por Tipo (Click para filtrar)'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function() {
                            return 'Click para filtrar';
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de departamentos
    const ctxDeptos = document.getElementById('chartDepartamentos').getContext('2d');
    if (chartDepartamentos) chartDepartamentos.destroy();
    
    chartDepartamentos = new Chart(ctxDeptos, {
        type: 'bar',
        data: {
            labels: Object.keys(stats.por_departamento),
            datasets: [{
                label: 'Activos',
                data: Object.values(stats.por_departamento),
                backgroundColor: '#0d6efd'
            }]
        },
        options: {
            responsive: true,
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements[0] ? 'pointer' : 'default';
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const departamento = Object.keys(stats.por_departamento)[index];
                    filtrarPorDepartamento(departamento);
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Activos por Departamento (Click para filtrar)'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function() {
                            return 'Click para filtrar';
                        }
                    }
                }
            }
        }
    });
}

// Cargar activos
async function cargarActivos() {
    try {
        // Cargar todos los activos
        const response = await fetch('/api/activos', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            activosData = data.activos;
            
            // Actualizar filtros desde los selectores
            const tipo = document.getElementById('filtroTipo')?.value || '';
            const departamento = document.getElementById('filtroDepartamento')?.value || '';
            
            filtrosActivos.tipo = tipo;
            filtrosActivos.departamento = departamento;
            
            // Actualizar lista de departamentos
            const departamentos = [...new Set(activosData.map(a => a.departamento))].filter(Boolean).sort();
            const selectDepto = document.getElementById('filtroDepartamento');
            const departamentoActual = selectDepto?.value;
            
            if (selectDepto) {
                selectDepto.innerHTML = '<option value="">Todos los departamentos</option>';
                departamentos.forEach(depto => {
                    const selected = depto === departamentoActual ? 'selected' : '';
                    selectDepto.innerHTML += `<option value="${depto}" ${selected}>${depto}</option>`;
                });
            }
            
            // Aplicar filtros
            aplicarFiltros();
        }
    } catch (error) {
        console.error('Error cargando activos:', error);
    }
}

// Mostrar activos en tabla
function mostrarActivos(activos) {
    const tbody = document.getElementById('tablaActivos');
    tbody.innerHTML = '';
    
    activos.forEach(activo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activo.nombre || 'Sin nombre'}</td>
            <td>${activo.tipo_activo}</td>
            <td>${activo.responsable || '-'}</td>
            <td>${activo.departamento || '-'}</td>
            <td>
                <span class="badge bg-${getEstadoColor(activo.estado)}">
                    ${activo.estado || 'Activo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarActivo('${activo.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarActivo('${activo.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Buscar activos
function buscarActivos() {
    const busqueda = document.getElementById('buscarActivo').value;
    filtrosActivos.busqueda = busqueda;
    aplicarFiltros();
}

// Crear nuevo activo
async function crearActivo(e) {
    e.preventDefault();
    
    const activo = {
        tipo_activo: document.getElementById('tipoActivo').value,
        nombre: document.getElementById('nombreActivo').value,
        responsable: document.getElementById('responsableActivo').value,
        departamento: document.getElementById('departamentoActivo').value,
        sede: document.getElementById('sedeActivo').value,
        descripcion: document.getElementById('descripcionActivo').value,
        clasificacion_seguridad: document.getElementById('clasificacionActivo').value,
        criticidad: document.getElementById('criticidadActivo').value,
        estado: 'Activo'
    };
    
    // Agregar campos específicos según tipo
    if (activo.tipo_activo === 'Hardware') {
        activo.marca = document.getElementById('marcaHardware')?.value;
        activo.modelo = document.getElementById('modeloHardware')?.value;
        activo.numero_serie = document.getElementById('serieHardware')?.value;
    } else if (activo.tipo_activo === 'Software e Información') {
        activo.version = document.getElementById('versionSoftware')?.value;
        activo.licencia = document.getElementById('licenciaSoftware')?.value;
    }
    
    try {
        const response = await fetch('/api/activos', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(activo)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Activo creado exitosamente');
            document.getElementById('formNuevoActivo').reset();
            mostrarVista('activos');
        } else {
            alert('Error al crear activo: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear activo');
    }
}

// Editar activo
async function editarActivo(id) {
    try {
        const response = await fetch(`/api/activos/${id}`, {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const activo = data.activo;
            const modal = new bootstrap.Modal(document.getElementById('modalEditarActivo'));
            
            // Llenar formulario de edición
            const form = document.getElementById('formEditarActivo');
            form.innerHTML = `
                <input type="hidden" id="editId" value="${activo.id}">
                <div class="mb-3">
                    <label class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="editNombre" value="${activo.nombre || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Responsable</label>
                    <input type="text" class="form-control" id="editResponsable" value="${activo.responsable || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" id="editDepartamento" value="${activo.departamento || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Estado</label>
                    <select class="form-select" id="editEstado">
                        <option value="Activo" ${activo.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${activo.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                        <option value="En mantenimiento" ${activo.estado === 'En mantenimiento' ? 'selected' : ''}>En mantenimiento</option>
                        <option value="Retirado" ${activo.estado === 'Retirado' ? 'selected' : ''}>Retirado</option>
                    </select>
                </div>
            `;
            
            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Guardar edición
async function guardarEdicion() {
    const id = document.getElementById('editId').value;
    const activo = {
        nombre: document.getElementById('editNombre').value,
        responsable: document.getElementById('editResponsable').value,
        departamento: document.getElementById('editDepartamento').value,
        estado: document.getElementById('editEstado').value
    };
    
    try {
        const response = await fetch(`/api/activos/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(activo)
        });
        
        const data = await response.json();
        
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditarActivo')).hide();
            cargarActivos();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Eliminar activo
async function eliminarActivo(id) {
    if (!confirm('¿Está seguro de eliminar este activo?')) return;
    
    try {
        const response = await fetch(`/api/activos/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            cargarActivos();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Importar activos
async function importarActivos(e) {
    e.preventDefault();
    console.log('Iniciando importación...');
    
    const fileInput = document.getElementById('archivoImportar');
    const tipoSelect = document.getElementById('tipoImportar');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor seleccione un archivo');
        return;
    }
    
    const file = fileInput.files[0];
    console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo_activo', tipoSelect.value || '');
    
    try {
        const response = await fetch('/api/importar', {
            method: 'POST',
            headers: {
                'X-Organization-Id': localStorage.getItem('organizacion_id')
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            document.getElementById('formImportar').reset();
            mostrarVista('activos');
            cargarActivos(); // Recargar la lista
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error detallado:', error);
        alert('Error al importar archivo: ' + error.message);
    }
}

// Mostrar campos específicos por tipo
function mostrarCamposTipo() {
    const tipo = document.getElementById('tipoActivo').value;
    const container = document.getElementById('camposEspecificos');
    
    if (tipo === 'Hardware') {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label">Marca</label>
                    <input type="text" class="form-control" id="marcaHardware">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Modelo</label>
                    <input type="text" class="form-control" id="modeloHardware">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Número de Serie</label>
                    <input type="text" class="form-control" id="serieHardware">
                </div>
            </div>
        `;
    } else if (tipo === 'Software e Información') {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Versión</label>
                    <input type="text" class="form-control" id="versionSoftware">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Licencia</label>
                    <input type="text" class="form-control" id="licenciaSoftware">
                </div>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

// Cargar reportes
async function cargarReportes() {
    try {
        const response = await fetch('/api/activos', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const activos = data.activos;
            
            // Reporte de responsables
            const responsables = {};
            activos.forEach(a => {
                const resp = a.responsable || 'Sin asignar';
                responsables[resp] = (responsables[resp] || 0) + 1;
            });
            
            let htmlResp = '<ul class="list-group">';
            Object.entries(responsables).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([resp, count]) => {
                htmlResp += `<li class="list-group-item d-flex justify-content-between" style="cursor: pointer;" onclick="filtrarPorResponsable('${resp.replace(/'/g, "\\'")}')">
                    <span><i class="bi bi-person"></i> ${resp}</span>
                    <span class="badge bg-primary">${count}</span>
                </li>`;
            });
            htmlResp += '</ul>';
            document.getElementById('reporteResponsables').innerHTML = htmlResp;
            
            // Reporte de críticos
            const criticos = activos.filter(a => a.criticidad === 'Crítico');
            let htmlCrit = '<ul class="list-group">';
            criticos.slice(0, 10).forEach(activo => {
                htmlCrit += `<li class="list-group-item">
                    <strong>${activo.nombre}</strong><br>
                    <small>${activo.tipo_activo} - ${activo.responsable || 'Sin asignar'}</small>
                </li>`;
            });
            htmlCrit += '</ul>';
            document.getElementById('reporteCriticos').innerHTML = htmlCrit || '<p>No hay activos críticos</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Exportar datos
function exportarDatos() {
    // Crear CSV con todos los campos compatibles con la importación
    const headers = [
        'tipo_activo', 'nombre', 'responsable', 'departamento', 'sede',
        'descripcion', 'marca', 'modelo', 'numero_serie', 'numero_identificacion',
        'fecha_compra', 'garantia', 'condicion', 'estado', 'clasificacion_seguridad',
        'criticidad', 'salida_exterior', 'dispositivo_cpd', 'dispositivo_byod',
        'version', 'tipo_software', 'licencia'
    ];
    
    let csv = headers.join(',') + '\n';
    
    activosData.forEach(activo => {
        const row = headers.map(campo => {
            let valor = activo[campo] || '';
            
            // Convertir booleanos a texto
            if (typeof valor === 'boolean') {
                valor = valor ? 'True' : 'False';
            }
            
            // Escapar valores que contengan comas o comillas
            if (valor.toString().includes(',') || valor.toString().includes('"') || valor.toString().includes('\n')) {
                valor = `"${valor.toString().replace(/"/g, '""')}"`;
            }
            
            return valor;
        });
        
        csv += row.join(',') + '\n';
    });
    
    // Añadir BOM para Excel UTF-8
    const BOM = '\ufeff';
    const csvWithBOM = BOM + csv;
    
    // Descargar archivo
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Cargar todos los activos sin filtros
async function cargarTodosLosActivos() {
    try {
        const response = await fetch('/api/activos', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            activosData = data.activos;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error cargando todos los activos:', error);
        return false;
    }
}

// Aplicar todos los filtros activos
function aplicarFiltros() {
    console.log('Aplicando filtros:', filtrosActivos);
    
    let filtrados = [...activosData];
    
    // Filtrar por tipo
    if (filtrosActivos.tipo) {
        filtrados = filtrados.filter(activo => activo.tipo_activo === filtrosActivos.tipo);
    }
    
    // Filtrar por departamento
    if (filtrosActivos.departamento) {
        filtrados = filtrados.filter(activo => activo.departamento === filtrosActivos.departamento);
    }
    
    // Filtrar por responsable
    if (filtrosActivos.responsable) {
        filtrados = filtrados.filter(activo => activo.responsable === filtrosActivos.responsable);
    }
    
    // Filtrar por búsqueda
    if (filtrosActivos.busqueda) {
        const busqueda = filtrosActivos.busqueda.toLowerCase();
        filtrados = filtrados.filter(activo => {
            return activo.nombre?.toLowerCase().includes(busqueda) ||
                   activo.responsable?.toLowerCase().includes(busqueda) ||
                   activo.descripcion?.toLowerCase().includes(busqueda);
        });
    }
    
    console.log(`Filtrados: ${filtrados.length} de ${activosData.length} activos`);
    
    mostrarActivos(filtrados);
    mostrarFiltrosActivos();
}

// Mostrar qué filtros están activos
function mostrarFiltrosActivos() {
    // Eliminar mensajes anteriores
    const mensajesAnteriores = document.querySelectorAll('#vista-activos .alert-info');
    mensajesAnteriores.forEach(msg => msg.remove());
    
    const filtrosTexto = [];
    
    if (filtrosActivos.tipo) filtrosTexto.push(`Tipo: ${filtrosActivos.tipo}`);
    if (filtrosActivos.departamento) filtrosTexto.push(`Departamento: ${filtrosActivos.departamento}`);
    if (filtrosActivos.responsable) filtrosTexto.push(`Responsable: ${filtrosActivos.responsable}`);
    if (filtrosActivos.busqueda) filtrosTexto.push(`Búsqueda: "${filtrosActivos.busqueda}"`);
    
    if (filtrosTexto.length > 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'alert alert-info alert-dismissible fade show mb-3';
        mensaje.innerHTML = `
            <strong>Filtros activos:</strong> ${filtrosTexto.join(' | ')}
            <button type="button" class="btn btn-sm btn-primary ms-3" onclick="limpiarFiltros()">
                <i class="bi bi-x-circle"></i> Limpiar filtros
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const vistaActivos = document.querySelector('#vista-activos');
        const primerElemento = vistaActivos.querySelector('.row');
        if (primerElemento) {
            vistaActivos.insertBefore(mensaje, primerElemento);
        }
    }
}

// Limpiar todos los filtros
function limpiarFiltros() {
    filtrosActivos = {
        tipo: '',
        departamento: '',
        responsable: '',
        busqueda: ''
    };
    
    // Limpiar inputs
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroDepartamento = document.getElementById('filtroDepartamento');
    const buscarActivo = document.getElementById('buscarActivo');
    
    if (filtroTipo) filtroTipo.value = '';
    if (filtroDepartamento) filtroDepartamento.value = '';
    if (buscarActivo) buscarActivo.value = '';
    
    aplicarFiltros();
}

// Filtrar por tipo desde las gráficas
async function filtrarPorTipo(tipo) {
    console.log('Filtrando por tipo:', tipo);
    
    // Siempre cargar todos los activos para filtrar correctamente
    if (!activosData || activosData.length === 0) {
        await cargarTodosLosActivos();
    }
    
    // Actualizar filtro de tipo
    filtrosActivos.tipo = tipo;
    
    // Actualizar el selector de tipo si existe
    const filtroTipo = document.getElementById('filtroTipo');
    if (filtroTipo) {
        filtroTipo.value = tipo;
    }
    
    // Marcar que estamos filtrando para evitar recargar todos los activos
    filtrandoActivos = true;
    
    // Cambiar a vista de inventario
    mostrarVista('activos');
    
    // Aplicar todos los filtros
    aplicarFiltros();
}

// Filtrar por departamento desde las gráficas
async function filtrarPorDepartamento(departamento) {
    console.log('Filtrando por departamento:', departamento);
    
    // Siempre cargar todos los activos para filtrar correctamente
    if (!activosData || activosData.length === 0) {
        await cargarTodosLosActivos();
    }
    
    // Actualizar filtro de departamento
    filtrosActivos.departamento = departamento;
    
    // Actualizar el selector de departamento si existe
    const filtroDepartamento = document.getElementById('filtroDepartamento');
    if (filtroDepartamento) {
        filtroDepartamento.value = departamento;
    }
    
    // Marcar que estamos filtrando para evitar recargar todos los activos
    filtrandoActivos = true;
    
    // Cambiar a vista de inventario
    mostrarVista('activos');
    
    // Aplicar todos los filtros
    aplicarFiltros();
}

// Filtrar por responsable
async function filtrarPorResponsable(responsable) {
    console.log('Filtrando por responsable:', responsable);
    
    // Siempre cargar todos los activos para filtrar correctamente
    if (!activosData || activosData.length === 0) {
        await cargarTodosLosActivos();
    }
    
    // Actualizar filtro de responsable
    filtrosActivos.responsable = responsable;
    
    // Marcar que estamos filtrando para evitar recargar todos los activos
    filtrandoActivos = true;
    
    // Cambiar a vista de inventario
    mostrarVista('activos');
    
    // Aplicar todos los filtros
    aplicarFiltros();
}

// Ver todos los activos (sin filtros)
async function verTodosLosActivos() {
    console.log('Mostrando todos los activos');
    
    // Limpiar todos los filtros
    limpiarFiltros();
    
    // Cambiar a vista de inventario
    mostrarVista('activos');
}

// Filtrar por criticidad
async function filtrarPorCriticidad(criticidad) {
    console.log('Filtrando por criticidad:', criticidad);
    
    // Siempre cargar todos los activos para filtrar correctamente
    if (!activosData || activosData.length === 0) {
        await cargarTodosLosActivos();
    }
    
    // Limpiar filtros anteriores
    filtrosActivos = {
        tipo: '',
        departamento: '',
        responsable: '',
        busqueda: criticidad
    };
    
    // Aplicar filtro especial para criticidad
    let filtrados = activosData.filter(activo => activo.criticidad === criticidad);
    
    // Marcar que estamos filtrando
    filtrandoActivos = true;
    
    // Cambiar a vista de inventario
    mostrarVista('activos');
    
    // Mostrar resultados
    mostrarActivos(filtrados);
    
    // Mostrar mensaje de filtro activo
    const mensaje = document.createElement('div');
    mensaje.className = 'alert alert-info alert-dismissible fade show mb-3';
    mensaje.innerHTML = `
        <strong>Filtros activos:</strong> Activos ${criticidad}s
        <button type="button" class="btn btn-sm btn-primary ms-3" onclick="limpiarFiltros()">
            <i class="bi bi-x-circle"></i> Limpiar filtros
        </button>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const vistaActivos = document.querySelector('#vista-activos');
    const primerElemento = vistaActivos.querySelector('.row');
    if (primerElemento) {
        // Eliminar mensajes anteriores
        const mensajesAnteriores = vistaActivos.querySelectorAll('.alert-info');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        vistaActivos.insertBefore(mensaje, primerElemento);
    }
}

// Exportar Excel completo con formato Haiko
async function exportarExcelCompleto() {
    const orgId = localStorage.getItem('organizacion_id');
    const orgNombre = localStorage.getItem('organizacion_nombre');
    
    if (!orgId) {
        alert('No se ha seleccionado una organización');
        return;
    }
    
    // Mostrar mensaje de carga
    const btn = event.target.closest('button');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando...';
    
    try {
        const response = await fetch('/api/exportar-excel', {
            method: 'POST',
            headers: {
                'X-Organization-Id': orgId
            }
        });
        
        if (response.ok) {
            // Descargar el archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `inventario_${orgNombre}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            const error = await response.json();
            alert('Error al generar Excel: ' + (error.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al exportar Excel');
    } finally {
        // Restaurar botón
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

// Hacer las funciones disponibles globalmente
window.verTodosLosActivos = verTodosLosActivos;
window.filtrarPorTipo = filtrarPorTipo;
window.filtrarPorDepartamento = filtrarPorDepartamento;
window.filtrarPorResponsable = filtrarPorResponsable;
window.filtrarPorCriticidad = filtrarPorCriticidad;
window.editarActivo = editarActivo;
window.eliminarActivo = eliminarActivo;
window.cargarActivos = cargarActivos;
window.exportarDatos = exportarDatos;
window.exportarExcelCompleto = exportarExcelCompleto;
window.mostrarCamposTipo = mostrarCamposTipo;
window.limpiarFiltros = limpiarFiltros;
window.buscarActivos = buscarActivos;
window.aplicarFiltros = aplicarFiltros;
window.filtrosActivos = filtrosActivos;

// Función para cambiar de organización
function cambiarOrganizacion() {
    if (confirm('¿Desea cambiar de organización? Los cambios no guardados se perderán.')) {
        localStorage.removeItem('organizacion_id');
        localStorage.removeItem('organizacion_nombre');
        window.location.href = '/login';
    }
}
window.cambiarOrganizacion = cambiarOrganizacion;

// Cargar auditoría
async function cargarAuditoria() {
    try {
        const response = await fetch('/api/activos', {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const activos = data.activos;
            let todosLosCambios = [];
            
            // Recopilar todos los cambios de todos los activos
            activos.forEach(activo => {
                if (activo.historial_cambios && Array.isArray(activo.historial_cambios)) {
                    activo.historial_cambios.forEach(cambio => {
                        todosLosCambios.push({
                            ...cambio,
                            activo_id: activo.id,
                            activo_nombre: activo.nombre,
                            activo_tipo: activo.tipo_activo
                        });
                    });
                }
            });
            
            // Ordenar por fecha descendente
            todosLosCambios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            // Aplicar filtros
            const fechaFiltro = document.getElementById('filtroFechaAuditoria')?.value;
            const usuarioFiltro = document.getElementById('filtroUsuarioAuditoria')?.value;
            const tipoFiltro = document.getElementById('filtroTipoAuditoria')?.value;
            
            if (fechaFiltro) {
                const fechaInicio = new Date(fechaFiltro);
                const fechaFin = new Date(fechaFiltro);
                fechaFin.setDate(fechaFin.getDate() + 1);
                todosLosCambios = todosLosCambios.filter(c => {
                    const fechaCambio = new Date(c.fecha);
                    return fechaCambio >= fechaInicio && fechaCambio < fechaFin;
                });
            }
            
            if (usuarioFiltro) {
                todosLosCambios = todosLosCambios.filter(c => c.usuario === usuarioFiltro);
            }
            
            if (tipoFiltro) {
                todosLosCambios = todosLosCambios.filter(c => c.accion.includes(tipoFiltro));
            }
            
            // Mostrar en tabla
            const tbody = document.getElementById('tablaAuditoria');
            tbody.innerHTML = '';
            
            todosLosCambios.slice(0, 100).forEach(cambio => {
                const fecha = new Date(cambio.fecha);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fecha.toLocaleString()}</td>
                    <td>
                        <strong>${cambio.activo_nombre || 'Sin nombre'}</strong><br>
                        <small class="text-muted">${cambio.activo_tipo}</small>
                    </td>
                    <td>${cambio.usuario || 'Sistema'}</td>
                    <td><span class="badge bg-${getAccionColor(cambio.accion)}">${cambio.accion}</span></td>
                    <td>${cambio.campos_modificados ? cambio.campos_modificados.join(', ') : '-'}</td>
                `;
                tbody.appendChild(row);
            });
            
            // Actualizar lista de usuarios para filtro
            // Primero, obtener TODOS los usuarios de TODOS los activos (sin filtrar)
            const todosLosUsuarios = new Set();
            data.activos.forEach(activo => {
                if (activo.historial_cambios && Array.isArray(activo.historial_cambios)) {
                    activo.historial_cambios.forEach(cambio => {
                        todosLosUsuarios.add(cambio.usuario || 'Sistema');
                    });
                }
            });
            
            const usuarios = [...todosLosUsuarios].sort();
            const selectUsuario = document.getElementById('filtroUsuarioAuditoria');
            const valorActual = selectUsuario.value; // Guardar el valor actual
            
            selectUsuario.innerHTML = '<option value="">Todos los usuarios</option>';
            usuarios.forEach(usuario => {
                const selected = usuario === valorActual ? 'selected' : '';
                selectUsuario.innerHTML += `<option value="${usuario}" ${selected}>${usuario}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando auditoría:', error);
    }
}

// Obtener color según acción
function getAccionColor(accion) {
    if (accion.includes('Creación')) return 'success';
    if (accion.includes('Actualización')) return 'primary';
    if (accion.includes('Eliminación')) return 'danger';
    return 'secondary';
}

// Utilidades
function getEstadoColor(estado) {
    const colores = {
        'Activo': 'success',
        'Inactivo': 'secondary',
        'En mantenimiento': 'warning',
        'Retirado': 'danger'
    };
    return colores[estado] || 'primary';
}