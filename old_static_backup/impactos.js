// Variables globales
let tiposImpacto = [];
let impactosData = [];
let impactoActual = null;
let chartTipos = null;


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
    
    // Verificar autenticación
    const orgId = localStorage.getItem('organizacion_id');
    const orgNombre = localStorage.getItem('organizacion_nombre');
    
    if (!orgId) {
        window.location.href = '/login';
        return;
    }
    
    // Mostrar nombre de organización en el nav de impactos
    const orgElement = document.querySelector('#orgNombreNav');
    if (orgElement && orgNombre) {
        orgElement.textContent = orgNombre;
    }

    // Cargar datos iniciales
    cargarTiposImpacto();
    cargarEstadisticas();
    cargarImpactosRecientes();

    // Event listeners para navegación
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const vista = this.getAttribute('data-view');
            mostrarVista(vista);
        });
    });

    // Event listener para confirmar cambios
    const confirmarCambios = document.getElementById('confirmarCambios');
    if (confirmarCambios) {
        confirmarCambios.addEventListener('change', function() {
            const btnCrear = document.getElementById('btnCrearImpacto');
            if (btnCrear) btnCrear.disabled = !this.checked;
        });
    }

    // Event listener para form de nuevo impacto
    const formNuevo = document.getElementById('formNuevoImpacto');
    if (formNuevo) {
        formNuevo.addEventListener('submit', crearImpacto);
    }
});

// Navegación entre vistas
function mostrarVista(vista) {
    // Ocultar todas las vistas
    document.querySelectorAll('.vista-contenido').forEach(v => {
        v.style.display = 'none';
    });

    // Actualizar navegación activa
    document.querySelectorAll('[data-view]').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-view') === vista) {
            link.classList.add('active');
        }
    });

    // Mostrar vista seleccionada
    document.getElementById(`vista-${vista}`).style.display = 'block';

    // Cargar datos específicos de la vista
    switch(vista) {
        case 'dashboard':
            cargarEstadisticas();
            cargarImpactosRecientes();
            break;
        case 'lista':
            cargarListaImpactos();
            break;
        case 'tareas':
            cargarTareas();
            break;
    }
}

// Volver al inventario principal
function volverAlInventario() {
    window.location.href = '/';
}

// Cargar tipos de impacto disponibles
async function cargarTiposImpacto() {
    try {
        const response = await fetch('/api/impactos/tipos', { headers: getHeaders() });
        const data = await response.json();
        
        if (data.success) {
            tiposImpacto = data.tipos;
            
            // Llenar select de nuevo impacto
            const select = document.querySelector('#tipoImpacto');
            if (select) {
                select.innerHTML = '<option value="">Seleccione un tipo...</option>';
            
            tiposImpacto.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                select.appendChild(option);
            });

            }
            
            // Llenar filtro de tipos
            const filtroTipo = document.querySelector('#filtroTipoImpacto');
            if (filtroTipo) {
                filtroTipo.innerHTML = '<option value="">Todos los tipos</option>';
            
            tiposImpacto.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                filtroTipo.appendChild(option);
            });
            }
        }
    } catch (error) {
        console.error('Error cargando tipos de impacto:', error);
    }
}

// Cargar formulario dinámico según tipo de impacto
async function cargarFormularioDinamico() {
    const tipoSeleccionado = document.getElementById('tipoImpacto')?.value;
    const contenedor = document.getElementById('camposDinamicos');
    const ayuda = document.getElementById('ayudaTipo');
    
    if (!tipoSeleccionado) {
        contenedor.innerHTML = '';
        ayuda.textContent = 'Seleccione un tipo de impacto para comenzar.';
        const vistaPrevia = document.getElementById('vistaPrevia');
        if (vistaPrevia) vistaPrevia.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/impactos/plantilla/${tipoSeleccionado}`, { 
            headers: getHeaders() 
        });
        const data = await response.json();
        
        if (data.success) {
            const plantilla = data.plantilla;
            
            // Actualizar ayuda
            ayuda.innerHTML = `<strong>${plantilla.nombre || 'Plantilla'}</strong><br>
                ${plantilla.descripcion || 'Complete los campos requeridos para este tipo de impacto.'}`;
            
            // Generar campos del formulario
            contenedor.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
            
            let html = '';
            for (const campo of plantilla.campos) {
                html += await generarCampoHTML(campo);
            }
            
            contenedor.innerHTML = html;
            
            // Configurar campos condicionales
            configurarCamposCondicionales(plantilla);
            
            // Agregar listeners para actualizar vista previa
            contenedor.querySelectorAll('input, select, textarea').forEach(input => {
                input.addEventListener('change', actualizarVistaPrevia);
            });
        }
    } catch (error) {
        console.error('Error cargando plantilla:', error);
        mostrarAlerta('Error al cargar el formulario', 'danger');
    }
}

// Generar HTML para un campo del formulario
async function generarCampoHTML(campo) {
    let html = '<div class="mb-3">';
    html += `<label class="form-label">${campo.label}${campo.requerido ? ' *' : ''}</label>`;
    
    switch(campo.tipo) {
        case 'text':
            html += `<input type="text" class="form-control" id="campo_${campo.id}" 
                     name="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
            break;
            
        case 'email':
            html += `<input type="email" class="form-control" id="campo_${campo.id}" 
                     name="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
            break;
            
        case 'date':
            html += `<input type="date" class="form-control" id="campo_${campo.id}" 
                     name="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
            break;
            
        case 'select':
            html += `<select class="form-select" id="campo_${campo.id}" 
                     name="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
            html += '<option value="">Seleccione...</option>';
            campo.opciones.forEach(opcion => {
                html += `<option value="${opcion}">${opcion}</option>`;
            });
            html += '</select>';
            break;
            
        case 'select_dynamic':
            html += `<select class="form-select" id="campo_${campo.id}" 
                     name="${campo.id}" ${campo.requerido ? 'required' : ''}>`;
            html += '<option value="">Cargando opciones...</option>';
            html += '</select>';
            
            // Cargar opciones dinámicamente después de renderizar
            setTimeout(async () => {
                await cargarOpcionesDinamicas(campo);
            }, 100);
            break;
            
        case 'boolean':
            html += `<div class="form-check">
                     <input type="checkbox" class="form-check-input" id="campo_${campo.id}" 
                            name="${campo.id}" ${campo.default ? 'checked' : ''}>
                     <label class="form-check-label" for="campo_${campo.id}">Sí</label>
                     </div>`;
            break;
            
        case 'textarea':
            html += `<textarea class="form-control" id="campo_${campo.id}" 
                     name="${campo.id}" rows="3" ${campo.requerido ? 'required' : ''}></textarea>`;
            break;
    }
    
    html += '</div>';
    return html;
}

// Cargar opciones dinámicas para un campo
async function cargarOpcionesDinamicas(campo) {
    const select = document.getElementById(`campo_${campo.id}`);
    if (!select) return;
    
    try {
        const fuente = campo.fuente;
        // Construir URL con parámetros de configuración
        let url = `/api/impactos/datos-dinamicos/${fuente.tipo}`;
        if (fuente.config) {
            const params = new URLSearchParams(fuente.config);
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Limpiar opciones actuales
            select.innerHTML = '<option value="">Seleccione...</option>';
            
            // Agregar nuevas opciones
            data.datos.forEach(item => {
                const option = document.createElement('option');
                option.value = item.valor;
                option.textContent = item.etiqueta;
                
                // Guardar información extra en data attributes
                if (item.extra) {
                    option.dataset.extra = JSON.stringify(item.extra);
                }
                
                select.appendChild(option);
            });
            
            // Si es de empleados, agregar listener para mostrar resumen
            if (fuente.tipo === 'empleados') {
                select.addEventListener('change', function() {
                    const selectedOption = this.options[this.selectedIndex];
                    if (selectedOption && selectedOption.dataset.extra) {
                        const extra = JSON.parse(selectedOption.dataset.extra);
                        mostrarResumenEmpleado(extra);
                    }
                });
            }
        } else {
            select.innerHTML = '<option value="">Error al cargar opciones</option>';
        }
    } catch (error) {
        console.error('Error cargando opciones dinámicas:', error);
        select.innerHTML = '<option value="">Error al cargar opciones</option>';
    }
}

// Configurar campos condicionales
function configurarCamposCondicionales(plantilla) {
    plantilla.campos.forEach(campo => {
        if (campo.visible_cuando) {
            // Ocultar campo inicialmente
            const campoElement = document.getElementById(`campo_${campo.id}`);
            if (campoElement) {
                const contenedorCampo = campoElement.closest('.mb-3');
                if (contenedorCampo) {
                    contenedorCampo.style.display = 'none';
                }
            }
            
            // Parsear la condición para encontrar el campo del que depende
            const match = campo.visible_cuando.match(/(\w+)\s*==\s*['"]([^'"]+)['"]/);
            if (match) {
                const campoDependiente = match[1];
                const valorEsperado = match[2];
                
                // Agregar listener al campo del que depende
                const inputDependiente = document.getElementById(`campo_${campoDependiente}`);
                if (inputDependiente) {
                    inputDependiente.addEventListener('change', function() {
                        const contenedorCampo = document.getElementById(`campo_${campo.id}`).closest('.mb-3');
                        if (this.value === valorEsperado) {
                            contenedorCampo.style.display = 'block';
                            // Si el campo se hace visible y es requerido, marcarlo como tal
                            if (campo.requerido_cuando) {
                                document.getElementById(`campo_${campo.id}`).setAttribute('required', 'required');
                            }
                        } else {
                            contenedorCampo.style.display = 'none';
                            // Limpiar valor y quitar requerido si se oculta
                            document.getElementById(`campo_${campo.id}`).value = '';
                            document.getElementById(`campo_${campo.id}`).removeAttribute('required');
                        }
                    });
                    
                    // Ejecutar una vez para estado inicial
                    inputDependiente.dispatchEvent(new Event('change'));
                }
            }
        }
    });
}

// Mostrar resumen del empleado seleccionado
function mostrarResumenEmpleado(datosEmpleado) {
    const contenedor = document.getElementById('vistaPrevia');
    const contenido = document.getElementById('previaContenido');
    
    let html = '<h6>Información del empleado:</h6>';
    html += '<div class="row">';
    html += '<div class="col-md-6">';
    html += `<p><strong>Departamento:</strong> ${datosEmpleado.departamento || 'N/A'}</p>`;
    html += `<p><strong>Activos asignados:</strong> ${datosEmpleado.activos_count || 0}</p>`;
    html += '</div>';
    html += '<div class="col-md-6">';
    
    if (datosEmpleado.tipos_activos && datosEmpleado.tipos_activos.length > 0) {
        html += '<p><strong>Tipos de activos:</strong></p>';
        html += '<ul class="small">';
        datosEmpleado.tipos_activos.forEach(tipo => {
            html += `<li>${tipo}</li>`;
        });
        html += '</ul>';
    }
    
    html += '</div>';
    html += '</div>';
    
    if (datosEmpleado.activos && datosEmpleado.activos.length > 0) {
        html += '<h6 class="mt-3">Activos que serán afectados:</h6>';
        html += '<div class="table-responsive" style="max-height: 200px; overflow-y: auto;">';
        html += '<table class="table table-sm">';
        html += '<thead><tr><th>Activo</th><th>Tipo</th><th>Estado</th></tr></thead>';
        html += '<tbody>';
        datosEmpleado.activos.forEach(activo => {
            html += `<tr>
                     <td>${activo.nombre}</td>
                     <td>${activo.tipo}</td>
                     <td><span class="badge bg-secondary">${activo.estado}</span></td>
                     </tr>`;
        });
        html += '</tbody></table></div>';
    }
    
    contenido.innerHTML = html;
    contenedor.style.display = 'block';
}

// Actualizar vista previa de cambios
async function actualizarVistaPrevia() {
    const tipoSeleccionado = document.getElementById('tipoImpacto').value;
    if (!tipoSeleccionado) return;

    // Recopilar datos del formulario
    const datos = {};
    document.querySelectorAll('#camposDinamicos input, #camposDinamicos select, #camposDinamicos textarea').forEach(input => {
        if (input.type === 'checkbox') {
            datos[input.name] = input.checked;
        } else {
            datos[input.name] = input.value;
        }
    });

    // Por ahora, mostrar resumen simple
    // En producción, hacer llamada al servidor para obtener preview real
    const preview = document.getElementById('vistaPrevia');
    const contenido = document.getElementById('previaContenido');
    
    let html = '<ul class="mb-0">';
    html += '<li>Se crearán activos según la plantilla configurada</li>';
    html += '<li>Se generarán tareas de seguimiento automáticas</li>';
    html += '<li>Los cambios serán registrados en la auditoría</li>';
    html += '</ul>';
    
    contenido.innerHTML = html;
    preview.style.display = 'block';
}

// Crear nuevo impacto
async function crearImpacto(e) {
    e.preventDefault();
    
    const tipoSeleccionado = document.getElementById('tipoImpacto').value;
    if (!tipoSeleccionado) {
        mostrarAlerta('Seleccione un tipo de impacto', 'warning');
        return;
    }

    // Recopilar datos del formulario
    const datos = {};
    document.querySelectorAll('#camposDinamicos input, #camposDinamicos select, #camposDinamicos textarea').forEach(input => {
        if (input.type === 'checkbox') {
            datos[input.name] = input.checked;
        } else {
            datos[input.name] = input.value;
        }
    });

    try {
        const response = await fetch('/api/impactos', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                tipo: tipoSeleccionado,
                datos: datos,
                usuario: localStorage.getItem('usuario') || 'Usuario Web'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            impactoActual = result.impacto_id;
            
            // Mostrar botón de procesar
            const btnCrear = document.getElementById('btnCrearImpacto');
            const btnProcesar = document.getElementById('btnProcesarImpacto');
            
            if (btnCrear) btnCrear.style.display = 'none';
            if (btnProcesar) {
                btnProcesar.style.display = 'inline-block';
                btnProcesar.onclick = () => procesarImpacto(result.impacto_id);
            }
            
            mostrarAlerta('Impacto creado exitosamente. Puede procesarlo ahora o más tarde.', 'success');
            
            // Actualizar vista previa con datos reales
            if (result.vista_previa) {
                mostrarVistaPreviaReal(result.vista_previa);
            }
        } else {
            mostrarAlerta(result.message || 'Error al crear el impacto', 'danger');
            if (result.errors) {
                result.errors.forEach(error => {
                    mostrarAlerta(error, 'warning');
                });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al crear el impacto', 'danger');
    }
}

// Mostrar vista previa real del servidor
function mostrarVistaPreviaReal(preview) {
    const contenido = document.getElementById('previaContenido');
    
    let html = '<div class="row">';
    html += '<div class="col-md-4 text-center">';
    html += `<h4 class="text-primary">${preview.activos_crear}</h4>`;
    html += '<p>Activos a crear</p>';
    html += '</div>';
    html += '<div class="col-md-4 text-center">';
    html += `<h4 class="text-warning">${preview.activos_modificar}</h4>`;
    html += '<p>Activos a modificar</p>';
    html += '</div>';
    html += '<div class="col-md-4 text-center">';
    html += `<h4 class="text-info">${preview.tareas_generar}</h4>`;
    html += '<p>Tareas a generar</p>';
    html += '</div>';
    html += '</div>';
    
    if (preview.acciones_detalle && preview.acciones_detalle.length > 0) {
        html += '<hr><h6>Detalle de acciones:</h6><ul>';
        preview.acciones_detalle.forEach(accion => {
            html += `<li><strong>${accion.tipo}:</strong> ${accion.descripcion}</li>`;
        });
        html += '</ul>';
    }
    
    contenido.innerHTML = html;
}

// Procesar impacto
async function procesarImpacto(impactoId, force = false) {
    const mensaje = force 
        ? '¿Está seguro de REPROCESAR este impacto? Se intentará ejecutar nuevamente todas las acciones.' 
        : '¿Está seguro de procesar este impacto? Esta acción no se puede deshacer.';
        
    if (!confirm(mensaje)) {
        return;
    }

    try {
        const response = await fetch(`/api/impactos/${impactoId}/procesar`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                usuario: localStorage.getItem('usuario') || 'Usuario Web',
                force: force
            })
        });

        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('Impacto procesado exitosamente', 'success');
            
            // Mostrar resumen de resultado
            let mensaje = `✅ Procesamiento completado:\n`;
            mensaje += `- ${result.acciones_ejecutadas} acciones ejecutadas\n`;
            mensaje += `- ${result.tareas_generadas} tareas generadas`;
            
            alert(mensaje);
            
            // Recargar datos
            await Promise.all([
                cargarEstadisticas(),
                cargarImpactosRecientes(),
                cargarListaImpactos()
            ]);
            
            // Limpiar formulario y volver al dashboard
            document.getElementById('formNuevoImpacto').reset();
            mostrarVista('dashboard');
        } else {
            // Manejar diferentes tipos de error
            if (response.status === 400 && result.message && result.message.includes('estado error')) {
                // Ofrecer reprocesar si está en estado error
                const reprocesar = confirm(`${result.message}\n\n¿Desea reprocesar este impacto?`);
                if (reprocesar) {
                    procesarImpacto(impactoId, true);
                }
            } else {
                mostrarAlerta(`Error al procesar: ${result.message || result.error || 'Error desconocido'}`, 'danger');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al procesar el impacto. Verifique la consola para más detalles.', 'danger');
    }
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/impactos/estadisticas', { headers: getHeaders() });
        const data = await response.json();
        
        if (data.success) {
            const stats = data.estadisticas;
            
            // Actualizar contadores
            const updateElement = (id, value) => {
                const elem = document.querySelector('#' + id);
                if (elem) elem.textContent = value;
            };
            
            updateElement('stat-pendientes', stats.por_estado.pendiente || 0);
            updateElement('stat-completados', stats.por_estado.completado || 0);
            updateElement('stat-tareas', stats.tareas_pendientes || 0);
            
            updateElement('dashboard-pendientes', stats.por_estado.pendiente || 0);
            updateElement('dashboard-completados', stats.ultimos_7_dias || 0);
            updateElement('dashboard-tareas', stats.tareas_pendientes || 0);
            
            // Actualizar gráfico
            actualizarGraficoTipos(stats.por_tipo);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Actualizar gráfico de tipos
function actualizarGraficoTipos(datosPorTipo) {
    const ctx = document.querySelector('#chartTiposImpacto');
    if (!ctx) return;

    const labels = Object.keys(datosPorTipo);
    const valores = Object.values(datosPorTipo);

    if (chartTipos) {
        chartTipos.destroy();
    }

    chartTipos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#dc3545',
                    '#ffc107',
                    '#17a2b8',
                    '#6c757d'
                ]
            }]
        },
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

// Cargar impactos recientes
async function cargarImpactosRecientes() {
    try {
        const response = await fetch('/api/impactos?limite=5', { headers: getHeaders() });
        const data = await response.json();
        
        if (data.success) {
            const contenedor = document.querySelector('#impactosRecientes');
            if (!contenedor) return;
            
            if (data.impactos.length === 0) {
                contenedor.innerHTML = '<p class="text-muted">No hay impactos recientes</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            data.impactos.slice(0, 5).forEach(impacto => {
                const fecha = new Date(impacto.fecha_creacion).toLocaleDateString();
                const estadoClass = `estado-${impacto.estado}`;
                const tipoNombre = tiposImpacto.find(t => t.id === impacto.tipo)?.nombre || impacto.tipo || 'Sin tipo';
                
                html += `<a href="#" class="list-group-item list-group-item-action" 
                         onclick="verDetalleImpacto('${impacto.id}')">
                         <div class="d-flex justify-content-between align-items-center">
                             <div>
                                 <h6 class="mb-1">${tipoNombre}</h6>
                                 <small>Por ${impacto.usuario_creador} - ${fecha}</small>
                             </div>
                             <span class="badge ${estadoClass}">${impacto.estado}</span>
                         </div>
                         </a>`;
            });
            html += '</div>';
            
            contenedor.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando impactos recientes:', error);
    }
}

// Cargar lista completa de impactos
async function cargarListaImpactos() {
    try {
        const response = await fetch('/api/impactos', { headers: getHeaders() });
        const data = await response.json();
        
        if (data.success) {
            impactosData = data.impactos;
            mostrarTablaImpactos(impactosData);
        }
    } catch (error) {
        console.error('Error cargando lista de impactos:', error);
    }
}

// Mostrar tabla de impactos
function mostrarTablaImpactos(impactos) {
    const tbody = document.getElementById('tablaImpactos');
    
    if (impactos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay impactos registrados</td></tr>';
        return;
    }
    
    let html = '';
    impactos.forEach(impacto => {
        const fecha = new Date(impacto.fecha_creacion).toLocaleString();
        const estadoClass = `estado-${impacto.estado}`;
        const tipoNombre = tiposImpacto.find(t => t.id === impacto.tipo)?.nombre || impacto.tipo || 'Sin tipo';
        
        html += `<tr>
                 <td><code>${impacto.id ? impacto.id.substring(0, 8) : 'Sin ID'}</code></td>
                 <td>${tipoNombre}</td>
                 <td><span class="badge ${estadoClass}">${impacto.estado}</span></td>
                 <td>${impacto.usuario_creador}</td>
                 <td>${fecha}</td>
                 <td>
                     <button class="btn btn-sm btn-info" onclick="verDetalleImpacto('${impacto.id}')">
                         <i class="bi bi-eye"></i>
                     </button>`;
        
        if (impacto.estado === 'pendiente') {
            html += ` <button class="btn btn-sm btn-success" onclick="procesarImpacto('${impacto.id}')" title="Procesar">
                         <i class="bi bi-play-circle"></i>
                     </button>`;
        } else if (impacto.estado === 'error') {
            html += ` <button class="btn btn-sm btn-warning" onclick="procesarImpacto('${impacto.id}', true)" title="Reprocesar">
                         <i class="bi bi-arrow-clockwise"></i>
                     </button>`;
        }
        
        html += `</td></tr>`;
    });
    
    tbody.innerHTML = html;
}

// Ver detalle de impacto
async function verDetalleImpacto(impactoId) {
    try {
        const response = await fetch(`/api/impactos/${impactoId}`, { headers: getHeaders() });
        const data = await response.json();
        
        if (data.success) {
            mostrarModalDetalleImpacto(data.impacto);
        }
    } catch (error) {
        console.error('Error cargando detalle:', error);
    }
}

// Mostrar modal con detalle de impacto
function mostrarModalDetalleImpacto(impacto) {
    const contenido = document.getElementById('detalleImpactoContenido');
    const tipoNombre = tiposImpacto.find(t => t.id === impacto.tipo)?.nombre || impacto.tipo || 'Sin tipo';
    
    let html = `
        <h5>${tipoNombre}</h5>
        <p><strong>ID:</strong> <code>${impacto.id || 'Sin ID'}</code></p>
        <p><strong>Estado:</strong> <span class="badge estado-${impacto.estado || 'desconocido'}">${impacto.estado || 'Desconocido'}</span></p>
        <p><strong>Creado por:</strong> ${impacto.usuario_creador || 'Usuario desconocido'}</p>
        <p><strong>Fecha creación:</strong> ${new Date(impacto.fecha_creacion).toLocaleString()}</p>`;
    
    if (impacto.fecha_procesamiento) {
        html += `<p><strong>Fecha procesamiento:</strong> ${new Date(impacto.fecha_procesamiento).toLocaleString()}</p>`;
    }
    
    // Mostrar error si existe
    if (impacto.error) {
        html += `<div class="alert alert-danger mt-3">
                    <strong>Error:</strong> ${impacto.error}
                 </div>`;
    }
    
    // Datos del impacto
    if (impacto.datos && Object.keys(impacto.datos).length > 0) {
        html += '<hr><h6>Datos del impacto:</h6>';
        html += '<pre class="bg-light p-2">' + JSON.stringify(impacto.datos, null, 2) + '</pre>';
    } else {
        html += '<hr><h6>Datos del impacto:</h6>';
        html += '<p class="text-muted">No hay datos disponibles</p>';
    }
    
    // Acciones ejecutadas
    if (impacto.acciones_ejecutadas && impacto.acciones_ejecutadas.length > 0) {
        html += '<hr><h6>Acciones ejecutadas:</h6><ul>';
        impacto.acciones_ejecutadas.forEach(accion => {
            const icon = accion.exito ? '✅' : '❌';
            const tipo = accion.tipo || 'Acción desconocida';
            const objetivo = accion.id_objetivo || 'Sin objetivo';
            html += `<li>${icon} ${tipo} - ${objetivo}</li>`;
        });
        html += '</ul>';
    }
    
    // Tareas generadas
    if (impacto.tareas_generadas && impacto.tareas_generadas.length > 0) {
        html += '<hr><h6>Tareas generadas:</h6><ul>';
        impacto.tareas_generadas.forEach(tarea => {
            const descripcion = tarea.descripcion || 'Tarea sin descripción';
            const responsable = tarea.responsable || 'Sin asignar';
            html += `<li>${descripcion} (${responsable})</li>`;
        });
        html += '</ul>';
    }
    
    contenido.innerHTML = html;
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleImpacto'));
    modal.show();
}

// Cargar tareas pendientes
async function cargarTareas() {
    const responsable = document.getElementById('filtroResponsableTarea').value;
    const params = responsable ? `?responsable=${responsable}` : '';
    
    try {
        const response = await fetch(`/api/impactos/tareas${params}`, { headers: getHeaders() });
        const data = await response.json();
        
        if (data.success) {
            mostrarListaTareas(data.tareas);
        }
    } catch (error) {
        console.error('Error cargando tareas:', error);
    }
}

// Mostrar lista de tareas
function mostrarListaTareas(tareas) {
    const contenedor = document.getElementById('listaTareas');
    
    if (tareas.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay tareas pendientes</p>';
        return;
    }
    
    let html = '<div class="row">';
    tareas.forEach(tarea => {
        const fechaLimite = tarea.fecha_limite ? new Date(tarea.fecha_limite) : null;
        const hoy = new Date();
        const vencida = fechaLimite && fechaLimite < hoy;
        const claseVencida = vencida ? 'task-overdue' : '';
        
        html += `<div class="col-md-6 mb-3">
                 <div class="card">
                     <div class="card-body task-item ${claseVencida}">
                         <h6 class="card-title">${tarea.descripcion || 'Tarea sin descripción'}</h6>
                         <p class="card-text">
                             <strong>Responsable:</strong> ${tarea.responsable || 'Sin asignar'}<br>
                             <strong>Fecha límite:</strong> ${fechaLimite ? fechaLimite.toLocaleDateString() : 'Sin fecha'}<br>
                             <small class="text-muted">Impacto: ${tarea.impacto_tipo || 'Sin tipo'}</small>
                         </p>
                         <button class="btn btn-sm btn-success" onclick="completarTarea('${tarea.id}')">
                             <i class="bi bi-check2"></i> Completar
                         </button>
                     </div>
                 </div>
                 </div>`;
    });
    html += '</div>';
    
    contenedor.innerHTML = html;
}

// Aplicar filtros de impactos
function aplicarFiltrosImpactos() {
    const busqueda = document.getElementById('buscarImpacto').value.toLowerCase();
    const tipo = document.getElementById('filtroTipoImpacto').value;
    const estado = document.getElementById('filtroEstadoImpacto').value;
    const fechaDesde = document.getElementById('filtroFechaDesde').value;
    const fechaHasta = document.getElementById('filtroFechaHasta').value;
    
    let impactosFiltrados = impactosData;
    
    // Aplicar filtros
    if (busqueda) {
        impactosFiltrados = impactosFiltrados.filter(i => 
            i.id.toLowerCase().includes(busqueda) ||
            i.usuario_creador.toLowerCase().includes(busqueda) ||
            JSON.stringify(i.datos).toLowerCase().includes(busqueda)
        );
    }
    
    if (tipo) {
        impactosFiltrados = impactosFiltrados.filter(i => i.tipo === tipo);
    }
    
    if (estado) {
        impactosFiltrados = impactosFiltrados.filter(i => i.estado === estado);
    }
    
    if (fechaDesde) {
        impactosFiltrados = impactosFiltrados.filter(i => 
            new Date(i.fecha_creacion) >= new Date(fechaDesde)
        );
    }
    
    if (fechaHasta) {
        impactosFiltrados = impactosFiltrados.filter(i => 
            new Date(i.fecha_creacion) <= new Date(fechaHasta + 'T23:59:59')
        );
    }
    
    mostrarTablaImpactos(impactosFiltrados);
}

// Filtrar por estado desde dashboard
function filtrarPorEstado(estado) {
    mostrarVista('lista');
    document.getElementById('filtroEstadoImpacto').value = estado;
    aplicarFiltrosImpactos();
}

// Completar tarea
async function completarTarea(tareaId) {
    if (!confirm('¿Marcar esta tarea como completada?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/impactos/tareas/${tareaId}/completar`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                usuario: localStorage.getItem('usuario') || 'Usuario Web',
                comentarios: ''
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('Tarea completada exitosamente', 'success');
            // Recargar lista de tareas
            cargarTareas();
        } else {
            mostrarAlerta(`Error al completar tarea: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al completar la tarea', 'danger');
    }
}

// Mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
    const alertaHtml = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Insertar alerta al principio del contenedor principal
    const contenedor = document.querySelector('.col-md-12') || document.querySelector('.col-md-10') || document.querySelector('.col-md-10');
    if (!contenedor) return;
    contenedor.insertAdjacentHTML('afterbegin', alertaHtml);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        const alerta = contenedor.querySelector('.alert');
        if (alerta) {
            alerta.remove();
        }
    }, 5000);
}

// Función para exportar impactos
async function exportarImpactos() {
    try {
        const response = await fetch('/api/impactos/exportar', {
            method: 'GET',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al exportar');
        }
        
        // Obtener el blob del archivo
        const blob = await response.blob();
        
        // Crear URL temporal para descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Obtener nombre del archivo del header o usar uno por defecto
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : `impactos_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        mostrarAlerta('Impactos exportados exitosamente', 'success');
    } catch (error) {
        console.error('Error exportando impactos:', error);
        mostrarAlerta('Error al exportar impactos', 'danger');
    }
}

// Función para mostrar modal de importar
function mostrarImportarImpactos() {
    const modal = new bootstrap.Modal(document.getElementById('modalImportarImpactos'));
    modal.show();
}

// Función para importar impactos
async function importarImpactos() {
    const fileInput = document.getElementById('archivoImportarImpactos');
    const procesarAutomaticamente = document.getElementById('procesarImportados').checked;
    
    if (!fileInput.files || fileInput.files.length === 0) {
        mostrarAlerta('Por favor seleccione un archivo', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('archivo', fileInput.files[0]);
    formData.append('procesar_automaticamente', procesarAutomaticamente);
    
    // Agregar organización al formData
    const orgId = localStorage.getItem('organizacion_id');
    formData.append('organizacion_id', orgId);
    
    try {
        const response = await fetch('/api/impactos/importar', {
            method: 'POST',
            headers: {
                'X-Organization-Id': orgId
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta(`${result.cantidad} impactos importados exitosamente`, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalImportarImpactos'));
            modal.hide();
            
            // Limpiar formulario
            document.getElementById('formImportarImpactos').reset();
            
            // Recargar datos
            if (document.getElementById('vista-lista').style.display !== 'none') {
                cargarListaImpactos();
            } else {
                cargarEstadisticas();
                cargarImpactosRecientes();
            }
        } else {
            mostrarAlerta(`Error al importar: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error importando impactos:', error);
        mostrarAlerta('Error al importar el archivo', 'danger');
    }
}