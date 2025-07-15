/**
 * Página de Tareas de Impactos
 */
export const TareasPage = {
    name: 'ImpactosTareasPage',
    
    data() {
        return {
            loading: false,
            tareas: [],
            tareasSeleccionadas: new Set(),
            filtros: {
                prioridad: '',
                responsable: '',
                fechaLimite: '',
                impactoId: '',
                estado: ''
            },
            mostrarModalPosponer: false,
            mostrarModalPosponerMasivo: false,
            mostrarModalDetalle: false,
            tareaSeleccionada: null,
            formPosponer: {
                fechaLimite: '',
                comentarios: ''
            },
            formPosponerMasivo: {
                fechaLimite: '',
                comentarios: ''
            },
            formDetalle: {
                comentarios: ''
            },
            prioridades: [
                { value: 'alta', label: 'Alta', class: 'text-danger' },
                { value: 'media', label: 'Media', class: 'text-warning' },
                { value: 'baja', label: 'Baja', class: 'text-info' }
            ],
            estados: [
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'completada', label: 'Completada' },
                { value: 'cancelada', label: 'Cancelada' }
            ],
            fechasLimite: [
                { value: 'hoy', label: 'Hoy' },
                { value: 'manana', label: 'Hasta mañana' },
                { value: 'esta_semana', label: 'Esta semana' },
                { value: 'este_mes', label: 'Este mes' },
                { value: 'vencidas', label: 'Vencidas' }
            ]
        };
    },
    
    computed: {
        tareasFiltradas() {
            if (!this.tareas) return [];
            return this.tareas.filter(tarea => {
                if (this.filtros.prioridad && tarea.prioridad !== this.filtros.prioridad) return false;
                if (this.filtros.responsable && !tarea.responsable?.toLowerCase().includes(this.filtros.responsable.toLowerCase())) return false;
                if (this.filtros.fechaLimite && !this.cumpleFiltroFecha(tarea, this.filtros.fechaLimite)) return false;
                if (this.filtros.impactoId && tarea.impacto_id !== this.filtros.impactoId) return false;
                if (this.filtros.estado && tarea.estado !== this.filtros.estado) return false;
                return true;
            });
        },
        
        tieneTareas() {
            return this.tareasFiltradas && this.tareasFiltradas.length > 0;
        },
        
        todasSeleccionadas() {
            return this.tareasFiltradas.length > 0 && 
                   this.tareasFiltradas.every(tarea => this.tareasSeleccionadas.has(tarea.id));
        },
        
        algunasSeleccionadas() {
            return this.tareasSeleccionadas.size > 0;
        },
        
        contadorSeleccionadas() {
            return this.tareasSeleccionadas.size;
        }
    },
    
    methods: {
        async cargarTareas() {
            this.loading = true;
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const response = await api.get('/impactos/tareas');
                this.tareas = response || [];
            } catch (error) {
                console.error('Error cargando tareas:', error);
                this.mostrarError('Error al cargar las tareas');
                this.tareas = [];
            } finally {
                this.loading = false;
            }
        },
        
        aplicarFiltros() {
            // Los filtros se aplican automáticamente mediante computed
        },
        
        cumpleFiltroFecha(tarea, filtroFecha) {
            if (!tarea.fecha_limite || !filtroFecha) return true;
            
            const fechaTarea = new Date(tarea.fecha_limite);
            fechaTarea.setHours(0, 0, 0, 0); // Normalizar para comparación
            
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
            
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);
            
            const finSemana = new Date(hoy);
            finSemana.setDate(finSemana.getDate() + (7 - hoy.getDay()));
            
            const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
            
            switch (filtroFecha) {
                case 'hoy':
                    return fechaTarea.getTime() === hoy.getTime();
                    
                case 'manana':
                    return fechaTarea >= hoy && fechaTarea <= manana;
                    
                case 'esta_semana':
                    return fechaTarea >= hoy && fechaTarea <= finSemana;
                    
                case 'este_mes':
                    return fechaTarea >= hoy && fechaTarea <= finMes;
                    
                case 'vencidas':
                    return fechaTarea < hoy;
                    
                default:
                    return true;
            }
        },
        
        limpiarFiltros() {
            Object.keys(this.filtros).forEach(key => {
                this.filtros[key] = '';
            });
            // Si venimos de un impacto específico, limpiar también la query
            if (this.$route.query.impactoId) {
                this.$router.push({ name: 'tareas' });
            }
        },
        
        toggleSeleccionarTodas() {
            if (this.todasSeleccionadas) {
                this.tareasSeleccionadas.clear();
            } else {
                this.tareasFiltradas.forEach(tarea => {
                    this.tareasSeleccionadas.add(tarea.id);
                });
            }
            // Forzar re-render
            this.tareasSeleccionadas = new Set(this.tareasSeleccionadas);
        },
        
        toggleSeleccionarTarea(tareaId) {
            if (this.tareasSeleccionadas.has(tareaId)) {
                this.tareasSeleccionadas.delete(tareaId);
            } else {
                this.tareasSeleccionadas.add(tareaId);
            }
            // Forzar re-render
            this.tareasSeleccionadas = new Set(this.tareasSeleccionadas);
        },
        
        async completarTarea(tarea) {
            if (!confirm(`¿Está seguro de que desea completar la tarea "${tarea.descripcion}"?`)) {
                return;
            }
            
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const response = await api.post(`/impactos/tareas/${tarea.id}/completar`, {
                    usuario: 'Usuario', // TODO: Obtener usuario actual
                    comentarios: ''
                });
                
                if (response.success) {
                    this.mostrarExito('Tarea completada correctamente');
                    await this.cargarTareas();
                } else {
                    this.mostrarError(response.error || 'Error al completar la tarea');
                }
            } catch (error) {
                console.error('Error completando tarea:', error);
                this.mostrarError('Error al completar la tarea');
            }
        },
        
        async completarSeleccionadas() {
            if (this.tareasSeleccionadas.size === 0) return;
            
            if (!confirm(`¿Está seguro de que desea completar ${this.tareasSeleccionadas.size} tarea(s)?`)) {
                return;
            }

            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const tareaIds = Array.from(this.tareasSeleccionadas);
                const response = await api.post('/impactos/tareas/completar-masivo', { 
                    tareas: tareaIds,
                    usuario: 'Usuario', // TODO: Obtener usuario actual
                    comentarios: 'Completadas en lote'
                });
                
                if (response.success) {
                    this.mostrarExito(response.message);
                    this.tareasSeleccionadas.clear();
                    await this.cargarTareas();
                } else {
                    this.mostrarError(response.error || 'Error al completar las tareas seleccionadas');
                }
            } catch (error) {
                console.error('Error completando tareas:', error);
                this.mostrarError('Error al completar las tareas seleccionadas');
            }
        },
        
        abrirModalPosponerMasivo() {
            if (this.tareasSeleccionadas.size === 0) return;
            
            // Calcular fecha límite más común o más próxima de las tareas seleccionadas
            const tareasSeleccionadasArray = this.tareasFiltradas.filter(tarea => 
                this.tareasSeleccionadas.has(tarea.id)
            );
            
            let fechaDefecto = '';
            if (tareasSeleccionadasArray.length > 0) {
                // Usar la fecha límite más próxima (más temprana) como defecto
                const fechasLimite = tareasSeleccionadasArray
                    .map(tarea => tarea.fecha_limite)
                    .filter(fecha => fecha)
                    .sort();
                    
                if (fechasLimite.length > 0) {
                    fechaDefecto = fechasLimite[0].split('T')[0];
                }
            }
            
            this.formPosponerMasivo.fechaLimite = fechaDefecto;
            this.formPosponerMasivo.comentarios = '';
            this.mostrarModalPosponerMasivo = true;
        },
        
        cerrarModalPosponerMasivo() {
            this.mostrarModalPosponerMasivo = false;
            this.formPosponerMasivo.fechaLimite = '';
            this.formPosponerMasivo.comentarios = '';
        },
        
        async posponerSeleccionadas() {
            if (this.tareasSeleccionadas.size === 0) return;
            
            if (!this.formPosponerMasivo.fechaLimite) {
                this.mostrarError('Fecha límite es requerida');
                return;
            }

            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const tareaIds = Array.from(this.tareasSeleccionadas);
                const response = await api.post('/impactos/tareas/posponer', { 
                    tareas: tareaIds, 
                    nueva_fecha: this.formPosponerMasivo.fechaLimite,
                    usuario: 'Usuario', // TODO: Obtener usuario actual
                    comentarios: this.formPosponerMasivo.comentarios || 'Pospuestas en lote'
                });
                
                if (response.success) {
                    this.mostrarExito(response.message);
                    this.tareasSeleccionadas.clear();
                    this.cerrarModalPosponerMasivo();
                    await this.cargarTareas();
                } else {
                    this.mostrarError(response.error || 'Error al posponer las tareas seleccionadas');
                }
            } catch (error) {
                console.error('Error posponiendo tareas:', error);
                this.mostrarError('Error al posponer las tareas seleccionadas');
            }
        },
        
        verDetalleImpacto(impactoId) {
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('impactos:showModal', { type: 'detalle', impactoId });
            }
        },
        
        abrirModalPosponer(tarea) {
            this.tareaSeleccionada = tarea;
            this.formPosponer.fechaLimite = tarea.fecha_limite ? tarea.fecha_limite.split('T')[0] : '';
            this.formPosponer.comentarios = '';
            this.mostrarModalPosponer = true;
        },
        
        cerrarModalPosponer() {
            this.mostrarModalPosponer = false;
            this.tareaSeleccionada = null;
            this.formPosponer.fechaLimite = '';
            this.formPosponer.comentarios = '';
        },
        
        async posponerTarea() {
            if (!this.tareaSeleccionada || !this.formPosponer.fechaLimite) {
                this.mostrarError('Fecha límite es requerida');
                return;
            }
            
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const response = await api.post(`/impactos/tareas/${this.tareaSeleccionada.id}/posponer`, {
                    nueva_fecha: this.formPosponer.fechaLimite,
                    usuario: 'Usuario',
                    comentarios: this.formPosponer.comentarios || 'Tarea pospuesta'
                });
                
                if (response.success) {
                    this.mostrarExito('Tarea pospuesta correctamente');
                    this.cerrarModalPosponer();
                    await this.cargarTareas();
                } else {
                    this.mostrarError(response.error || 'Error al posponer la tarea');
                }
            } catch (error) {
                console.error('Error posponiendo tarea:', error);
                this.mostrarError('Error al posponer la tarea');
            }
        },
        
        abrirModalDetalle(tarea) {
            this.tareaSeleccionada = tarea;
            this.formDetalle.comentarios = '';
            this.mostrarModalDetalle = true;
        },
        
        cerrarModalDetalle() {
            this.mostrarModalDetalle = false;
            this.tareaSeleccionada = null;
            this.formDetalle.comentarios = '';
        },
        
        async guardarComentario() {
            if (!this.tareaSeleccionada || !this.formDetalle.comentarios.trim()) {
                this.mostrarError('Comentario es requerido');
                return;
            }
            
            try {
                const api = window.gozainApp?.services?.api;
                if (!api) {
                    console.error('API no disponible');
                    return;
                }
                
                const response = await api.post(`/impactos/tareas/${this.tareaSeleccionada.id}/comentario`, {
                    comentarios: this.formDetalle.comentarios,
                    usuario: 'Usuario'
                });
                
                if (response.success) {
                    this.mostrarExito('Comentario agregado correctamente');
                    
                    // Recargar las tareas y actualizar la tarea seleccionada
                    await this.cargarTareas();
                    
                    // Buscar la tarea actualizada y mantenerla seleccionada
                    const tareaActualizada = this.tareas.find(t => t.id === this.tareaSeleccionada.id);
                    if (tareaActualizada) {
                        this.tareaSeleccionada = tareaActualizada;
                    }
                    
                    // Limpiar el formulario de comentarios
                    this.formDetalle.comentarios = '';
                } else {
                    this.mostrarError(response.error || 'Error al agregar comentario');
                }
            } catch (error) {
                console.error('Error agregando comentario:', error);
                this.mostrarError('Error al agregar comentario');
            }
        },
        
        getPrioridadClass(prioridad) {
            const clases = {
                'alta': 'text-danger',
                'media': 'text-warning', 
                'baja': 'text-info'
            };
            return clases[prioridad] || 'text-secondary';
        },
        
        getPrioridadLabel(prioridad) {
            const prioridadObj = this.prioridades.find(p => p.value === prioridad);
            return prioridadObj ? prioridadObj.label : prioridad;
        },
        
        formatearFecha(fecha) {
            return new Date(fecha).toLocaleDateString('es-ES');
        },
        
        formatearFechaHora(fecha) {
            return new Date(fecha).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        formatearCambioHistorial(cambio) {
            let descripcion = cambio.accion;
            
            switch (cambio.accion) {
                case 'posponer':
                    if (cambio.fecha_anterior && cambio.fecha_nueva) {
                        descripcion = `Posponer de ${this.formatearFecha(cambio.fecha_anterior)} a ${this.formatearFecha(cambio.fecha_nueva)}`;
                    } else {
                        descripcion = 'Posponer';
                    }
                    break;
                case 'completar':
                    if (cambio.estado_anterior && cambio.estado_nuevo) {
                        descripcion = `Completar (${cambio.estado_anterior} → ${cambio.estado_nuevo})`;
                    } else {
                        descripcion = 'Completar';
                    }
                    break;
                case 'comentario':
                    descripcion = 'Comentario';
                    break;
                default:
                    descripcion = cambio.accion;
            }
            
            return cambio.comentarios ? `${descripcion}: ${cambio.comentarios}` : descripcion;
        },
        
        esFechaVencida(fecha) {
            return new Date(fecha) < new Date();
        },
        
        esFechaProxima(fecha) {
            const fechaTarea = new Date(fecha);
            const hoy = new Date();
            const diferencia = fechaTarea.getTime() - hoy.getTime();
            const diasDiferencia = diferencia / (1000 * 3600 * 24);
            return diasDiferencia <= 3 && diasDiferencia >= 0;
        },
        
        mostrarError(mensaje) {
            console.error(mensaje);
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('shell:showToast', {
                    message: mensaje,
                    type: 'error',
                    duration: 5000
                });
            } else {
                alert(`Error: ${mensaje}`);
            }
        },
        
        mostrarExito(mensaje) {
            console.log(mensaje);
            const eventBus = window.gozainApp?.eventBus;
            if (eventBus) {
                eventBus.emit('shell:showToast', {
                    message: mensaje,
                    type: 'success',
                    duration: 3000
                });
            } else {
                alert(`Éxito: ${mensaje}`);
            }
        },
        
        getEstadoClass(estado) {
            const clases = {
                'pendiente': 'badge bg-warning text-dark',
                'completada': 'badge bg-success',
                'cancelada': 'badge bg-danger'
            };
            return clases[estado] || 'badge bg-secondary';
        },
        
        getEstadoText(estado) {
            const textos = {
                'pendiente': 'Pendiente',
                'completada': 'Completada',
                'cancelada': 'Cancelada'
            };
            return textos[estado] || estado;
        },
        
        getTipoImpactoLabel(tipo) {
            const tipos = {
                'alta_empleado': 'Alta de Empleado',
                'baja_empleado': 'Baja de Empleado',
                'cambio_rol': 'Cambio de Rol',
                'nuevo_proyecto': 'Nuevo Proyecto',
                'acceso_sistema': 'Acceso a Sistema'
            };
            return tipos[tipo] || tipo;
        }
    },
    
    watch: {
        '$route.query.impactoId': {
            immediate: true,
            handler(newImpactoId) {
                if (newImpactoId) {
                    this.filtros.impactoId = newImpactoId;
                } else {
                    this.filtros.impactoId = '';
                }
            }
        }
    },
    
    mounted() {
        // Verificar si hay un impactoId en la query
        if (this.$route.query.impactoId) {
            this.filtros.impactoId = this.$route.query.impactoId;
        }
        this.cargarTareas();
    },
    
    template: `
        <div class="tareas-impactos">
            <!-- Filtros y acciones -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Tareas Pendientes</h5>
                    <button class="btn btn-sm btn-outline-primary" @click="cargarTareas" :disabled="loading">
                        <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                        Actualizar
                    </button>
                </div>
                <div class="card-body">
                    <!-- Indicador de filtro por impacto -->
                    <div v-if="filtros.impactoId" class="alert alert-info d-flex justify-content-between align-items-center mb-3">
                        <span>
                            <i class="bi bi-funnel"></i>
                            Mostrando solo tareas del impacto: <code>{{ filtros.impactoId }}</code>
                        </span>
                        <button class="btn btn-sm btn-outline-info" @click="filtros.impactoId = ''; $router.push({ name: 'tareas' })">
                            <i class="bi bi-x"></i> Mostrar todas
                        </button>
                    </div>
                    
                    <div class="row g-3 mb-3">
                        <div class="col-md-2">
                            <label class="form-label">Prioridad</label>
                            <select class="form-select" v-model="filtros.prioridad">
                                <option value="">Todas las prioridades</option>
                                <option v-for="prioridad in prioridades" :key="prioridad.value" :value="prioridad.value">
                                    {{ prioridad.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Estado</label>
                            <select class="form-select" v-model="filtros.estado">
                                <option value="">Todos los estados</option>
                                <option v-for="estado in estados" :key="estado.value" :value="estado.value">
                                    {{ estado.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Responsable</label>
                            <input type="text" class="form-control" v-model="filtros.responsable" 
                                   placeholder="Filtrar por responsable">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Fecha Límite</label>
                            <select class="form-select" v-model="filtros.fechaLimite">
                                <option value="">Todas las fechas</option>
                                <option v-for="fecha in fechasLimite" :key="fecha.value" :value="fecha.value">
                                    {{ fecha.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn btn-outline-secondary w-100" @click="limpiarFiltros">
                                <i class="bi bi-x"></i> Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    <!-- Acciones masivas -->
                    <div v-if="algunasSeleccionadas" class="alert alert-info d-flex justify-content-between align-items-center" id="accionesMasivas">
                        <span>{{ contadorSeleccionadas }} tarea(s) seleccionada(s)</span>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-success" @click="completarSeleccionadas" id="btnCompletarSeleccionadas">
                                <i class="bi bi-check-all"></i> Completar
                            </button>
                            <button class="btn btn-warning" @click="abrirModalPosponerMasivo" id="btnPosponer">
                                <i class="bi bi-calendar-plus"></i> Posponer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de tareas -->
            <div class="card">
                <div class="card-body">
                    <!-- Loading state -->
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary"></div>
                        <p class="mt-2 mb-0 text-muted">Cargando tareas...</p>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="!tieneTareas" class="text-center py-5">
                        <i class="bi bi-check-circle display-4 text-success"></i>
                        <h5 class="mt-3 text-muted">No hay tareas pendientes</h5>
                        <p class="text-muted">
                            Todas las tareas han sido completadas o no hay tareas que coincidan con los filtros.
                        </p>
                    </div>

                    <!-- Tabla -->
                    <div v-else class="table-responsive">
                        <table class="table table-hover" id="tablaTareas">
                            <thead>
                                <tr>
                                    <th>
                                        <input 
                                            type="checkbox" 
                                            class="form-check-input" 
                                            id="selectAllTareas"
                                            :checked="todasSeleccionadas"
                                            @change="toggleSeleccionarTodas"
                                        >
                                    </th>
                                    <th>Tarea</th>
                                    <th>Responsable</th>
                                    <th>Prioridad</th>
                                    <th>Fecha Límite</th>
                                    <th>Estado</th>
                                    <th>Impacto</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="tarea in tareasFiltradas" :key="tarea.id"
                                    :class="{ 'table-danger': esFechaVencida(tarea.fecha_limite), 'table-warning': esFechaProxima(tarea.fecha_limite) }">
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            class="form-check-input tarea-checkbox"
                                            :checked="tareasSeleccionadas.has(tarea.id)"
                                            @change="toggleSeleccionarTarea(tarea.id)"
                                        >
                                    </td>
                                    <td>
                                        <div>
                                            <strong>{{ tarea.descripcion }}</strong>
                                        </div>
                                    </td>
                                    <td>{{ tarea.responsable || 'Sin asignar' }}</td>
                                    <td>
                                        <span :class="getPrioridadClass(tarea.prioridad)">
                                            <i class="bi bi-circle-fill"></i>
                                            {{ getPrioridadLabel(tarea.prioridad) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span :class="{ 'text-danger': esFechaVencida(tarea.fecha_limite), 'text-warning': esFechaProxima(tarea.fecha_limite) }">
                                            {{ formatearFecha(tarea.fecha_limite) }}
                                            <i v-if="esFechaVencida(tarea.fecha_limite)" class="bi bi-exclamation-triangle ms-1"></i>
                                        </span>
                                    </td>
                                    <td>
                                        <span :class="getEstadoClass(tarea.estado)">
                                            {{ getEstadoText(tarea.estado) }}
                                        </span>
                                    </td>
                                    <td>
                                        <a href="#" @click.prevent="verDetalleImpacto(tarea.impacto_id)"
                                           class="text-decoration-none"
                                           :title="getTipoImpactoLabel(tarea.impacto_tipo) + ': ' + (tarea.impacto_descripcion || '')">
                                            <code>{{ tarea.impacto_id }}</code>
                                        </a>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-1">
                                            <button 
                                                v-if="tarea.estado === 'pendiente'"
                                                class="btn btn-sm btn-outline-success"
                                                @click="completarTarea(tarea)"
                                                title="Completar tarea"
                                            >
                                                <i class="bi bi-check"></i>
                                            </button>
                                            <button 
                                                v-if="tarea.estado === 'pendiente'"
                                                class="btn btn-sm btn-outline-warning"
                                                @click="abrirModalPosponer(tarea)"
                                                title="Posponer tarea"
                                            >
                                                <i class="bi bi-calendar-plus"></i>
                                            </button>
                                            <button 
                                                class="btn btn-sm btn-outline-info"
                                                @click="abrirModalDetalle(tarea)"
                                                title="Ver detalles y comentarios"
                                            >
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <span v-if="tarea.estado === 'completada'" class="text-success d-flex align-items-center">
                                                <i class="bi bi-check-circle me-1"></i>
                                                Completada
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Modal Posponer Tarea -->
            <div v-if="mostrarModalPosponer" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Posponer Tarea</h5>
                            <button type="button" class="btn-close" @click="cerrarModalPosponer"></button>
                        </div>
                        <div class="modal-body">
                            <div v-if="tareaSeleccionada">
                                <h6>{{ tareaSeleccionada.descripcion }}</h6>
                                <p class="text-muted">Responsable: {{ tareaSeleccionada.responsable }}</p>
                                
                                <div class="mb-3">
                                    <label class="form-label">Nueva Fecha Límite *</label>
                                    <input type="date" class="form-control" v-model="formPosponer.fechaLimite" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Motivo (opcional)</label>
                                    <textarea class="form-control" v-model="formPosponer.comentarios" 
                                              rows="3" placeholder="Explica por qué se pospone la tarea..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cerrarModalPosponer">Cancelar</button>
                            <button type="button" class="btn btn-warning" @click="posponerTarea">
                                <i class="bi bi-calendar-plus"></i> Posponer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Posponer Masivo -->
            <div v-if="mostrarModalPosponerMasivo" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Posponer {{ tareasSeleccionadas.size }} Tarea(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalPosponerMasivo"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                Se pospondrán {{ tareasSeleccionadas.size }} tareas seleccionadas a la nueva fecha límite.
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Nueva Fecha Límite *</label>
                                <input type="date" class="form-control" v-model="formPosponerMasivo.fechaLimite" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Motivo (opcional)</label>
                                <textarea class="form-control" v-model="formPosponerMasivo.comentarios" 
                                          rows="3" placeholder="Explica por qué se posponen las tareas..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cerrarModalPosponerMasivo">Cancelar</button>
                            <button type="button" class="btn btn-warning" @click="posponerSeleccionadas">
                                <i class="bi bi-calendar-plus"></i> Posponer {{ tareasSeleccionadas.size }} Tarea(s)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Detalle de Tarea -->
            <div v-if="mostrarModalDetalle" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles de Tarea</h5>
                            <button type="button" class="btn-close" @click="cerrarModalDetalle"></button>
                        </div>
                        <div class="modal-body">
                            <div v-if="tareaSeleccionada">
                                <div class="row mb-3">
                                    <div class="col-md-8">
                                        <h6>{{ tareaSeleccionada.descripcion }}</h6>
                                        <p class="text-muted mb-1">Responsable: {{ tareaSeleccionada.responsable }}</p>
                                        <p class="text-muted mb-1">Fecha límite: {{ formatearFecha(tareaSeleccionada.fecha_limite) }}</p>
                                        <p class="text-muted">Estado: 
                                            <span :class="getEstadoClass(tareaSeleccionada.estado)">
                                                {{ getEstadoText(tareaSeleccionada.estado) }}
                                            </span>
                                        </p>
                                    </div>
                                    <div class="col-md-4">
                                        <a href="#" @click.prevent="verDetalleImpacto(tareaSeleccionada.impacto_id)"
                                           class="btn btn-outline-primary btn-sm">
                                            <i class="bi bi-arrow-up-right-square"></i>
                                            Ver Impacto {{ tareaSeleccionada.impacto_id }}
                                        </a>
                                    </div>
                                </div>
                                
                                <!-- Historial de cambios -->
                                <div v-if="tareaSeleccionada.historial_cambios && tareaSeleccionada.historial_cambios.length > 0" class="mb-3">
                                    <h6>Historial de Cambios</h6>
                                    <div class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
                                        <div v-for="cambio in tareaSeleccionada.historial_cambios" :key="cambio.fecha" 
                                             class="small border-bottom pb-1 mb-1">
                                            <strong>{{ formatearFechaHora(cambio.fecha) }}</strong> - {{ cambio.usuario }}<br>
                                            <span class="text-muted">{{ formatearCambioHistorial(cambio) }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Agregar comentario -->
                                <div class="mb-3">
                                    <label class="form-label">Agregar Comentario</label>
                                    <textarea class="form-control" v-model="formDetalle.comentarios" 
                                              rows="4" placeholder="Escribe un comentario sobre esta tarea..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cerrarModalDetalle">Cerrar</button>
                            <button type="button" class="btn btn-primary" @click="guardarComentario"
                                    :disabled="!formDetalle.comentarios.trim()">
                                <i class="bi bi-chat-left-text"></i> Guardar Comentario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};