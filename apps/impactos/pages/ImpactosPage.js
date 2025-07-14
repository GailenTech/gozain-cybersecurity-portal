// Lista de Impactos de Negocio
import { ref, inject, onMounted, computed, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const eventBus = inject('eventBus');
        const organization = inject('organization');
        
        // Estado de la página
        const loading = ref(false);
        const impactos = ref([]);
        
        // Filtros
        const filtros = reactive({
            tipo: '',
            estado: '',
            fechaDesde: '',
            fechaHasta: '',
            usuario: ''
        });

        // Opciones para filtros
        const tiposImpacto = ref([
            { value: 'alta_empleado', label: 'Alta de Empleado' },
            { value: 'baja_empleado', label: 'Baja de Empleado' },
            { value: 'nuevo_cliente', label: 'Nuevo Cliente' },
            { value: 'cambio_config', label: 'Cambio de Configuración' }
        ]);

        const estadosImpacto = ref([
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'procesado', label: 'Procesado' },
            { value: 'error', label: 'Error' },
            { value: 'cancelado', label: 'Cancelado' }
        ]);

        // Computadas
        const impactosFiltrados = computed(() => {
            if (!impactos.value) return [];
            return impactos.value;
        });

        const tieneImpactos = computed(() => {
            return impactosFiltrados.value && impactosFiltrados.value.length > 0;
        });

        // Métodos
        const cargarImpactos = async () => {
            loading.value = true;
            try {
                const params = new URLSearchParams();
                
                // Aplicar filtros
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        params.append(key, filtros[key]);
                    }
                });

                const response = await api.get(`/impactos?${params.toString()}`);
                impactos.value = response || [];
            } catch (error) {
                console.error('Error cargando impactos:', error);
                mostrarError('Error al cargar los impactos');
                impactos.value = [];
            } finally {
                loading.value = false;
            }
        };

        const aplicarFiltros = () => {
            cargarImpactos();
        };

        const limpiarFiltros = () => {
            Object.keys(filtros).forEach(key => {
                filtros[key] = '';
            });
            cargarImpactos();
        };

        const crearNuevoImpacto = () => {
            eventBus.emit('impactos:showModal', { type: 'nuevo' });
        };

        const verDetalleImpacto = (impacto) => {
            eventBus.emit('impactos:showModal', { type: 'detalle', impacto });
        };

        const procesarImpacto = async (impacto) => {
            if (!confirm(`¿Está seguro de que desea procesar el impacto ${impacto.id}?`)) {
                return;
            }

            try {
                await api.post(`/impactos/${impacto.id}/procesar`);
                mostrarExito('Impacto procesado correctamente');
                await cargarImpactos();
            } catch (error) {
                console.error('Error procesando impacto:', error);
                mostrarError('Error al procesar el impacto');
            }
        };

        const exportarImpactos = async () => {
            try {
                const params = new URLSearchParams();
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        params.append(key, filtros[key]);
                    }
                });

                const blob = await api.getBlob(`/impactos/export?${params.toString()}`);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `impactos_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Error exportando impactos:', error);
                mostrarError('Error al exportar los impactos');
            }
        };

        // Utilidades
        const getEstadoClass = (estado) => {
            const clases = {
                'pendiente': 'bg-warning',
                'procesado': 'bg-success', 
                'error': 'bg-danger',
                'cancelado': 'bg-secondary'
            };
            return clases[estado] || 'bg-secondary';
        };

        const getEstadoText = (estado) => {
            const textos = {
                'pendiente': 'Pendiente',
                'procesado': 'Procesado',
                'error': 'Error',
                'cancelado': 'Cancelado'
            };
            return textos[estado] || estado;
        };

        const getTipoLabel = (tipo) => {
            const tipoObj = tiposImpacto.value.find(t => t.value === tipo);
            return tipoObj ? tipoObj.label : tipo;
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearFechaHora = (fecha) => {
            return new Date(fecha).toLocaleString('es-ES');
        };

        const mostrarError = (mensaje) => {
            console.error(mensaje);
            // TODO: Implementar toast de error
        };

        const mostrarExito = (mensaje) => {
            console.log(mensaje);
            // TODO: Implementar toast de éxito
        };

        // Lifecycle
        onMounted(() => {
            cargarImpactos();
        });

        return {
            loading,
            impactos,
            filtros,
            tiposImpacto,
            estadosImpacto,
            impactosFiltrados,
            tieneImpactos,
            cargarImpactos,
            aplicarFiltros,
            limpiarFiltros,
            crearNuevoImpacto,
            verDetalleImpacto,
            procesarImpacto,
            exportarImpactos,
            getEstadoClass,
            getEstadoText,
            getTipoLabel,
            formatearFecha,
            formatearFechaHora
        };
    },

    template: `
        <div class="impactos-lista">
            <!-- Filtros -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Filtros</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" @click="exportarImpactos">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                        <button class="btn btn-sm btn-primary" @click="crearNuevoImpacto">
                            <i class="bi bi-plus"></i> Nuevo Impacto
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Tipo de Impacto</label>
                            <select class="form-select" v-model="filtros.tipo">
                                <option value="">Todos los tipos</option>
                                <option v-for="tipo in tiposImpacto" :key="tipo.value" :value="tipo.value">
                                    {{ tipo.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Estado</label>
                            <select class="form-select" v-model="filtros.estado">
                                <option value="">Todos los estados</option>
                                <option v-for="estado in estadosImpacto" :key="estado.value" :value="estado.value">
                                    {{ estado.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Fecha Desde</label>
                            <input type="date" class="form-control" v-model="filtros.fechaDesde">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Fecha Hasta</label>
                            <input type="date" class="form-control" v-model="filtros.fechaHasta">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <div class="btn-group w-100">
                                <button class="btn btn-primary" @click="aplicarFiltros" :disabled="loading">
                                    <i class="bi bi-funnel"></i> Filtrar
                                </button>
                                <button class="btn btn-outline-secondary" @click="limpiarFiltros">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de impactos -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Lista de Impactos</h5>
                    <button class="btn btn-sm btn-outline-primary" @click="cargarImpactos" :disabled="loading">
                        <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                        Actualizar
                    </button>
                </div>
                <div class="card-body">
                    <!-- Loading state -->
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary"></div>
                        <p class="mt-2 mb-0 text-muted">Cargando impactos...</p>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="!tieneImpactos" class="text-center py-5">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <h5 class="mt-3 text-muted">No se encontraron impactos</h5>
                        <p class="text-muted">
                            No hay impactos que coincidan con los filtros seleccionados.
                        </p>
                        <button class="btn btn-primary" @click="crearNuevoImpacto">
                            <i class="bi bi-plus"></i> Crear primer impacto
                        </button>
                    </div>

                    <!-- Tabla -->
                    <div v-else class="table-responsive">
                        <table class="table table-hover" id="tablaImpactos">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Usuario</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="impacto in impactosFiltrados" :key="impacto.id">
                                    <td>
                                        <code>{{ impacto.id.substring(0, 8) }}</code>
                                    </td>
                                    <td>
                                        <span class="badge bg-secondary">
                                            {{ getTipoLabel(impacto.tipo) }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="text-truncate" style="max-width: 200px;" 
                                             :title="impacto.descripcion">
                                            {{ impacto.descripcion || 'Sin descripción' }}
                                        </div>
                                    </td>
                                    <td>{{ impacto.usuario || '-' }}</td>
                                    <td>{{ formatearFecha(impacto.fecha_creacion) }}</td>
                                    <td>
                                        <span class="badge" :class="getEstadoClass(impacto.estado)">
                                            {{ getEstadoText(impacto.estado) }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button 
                                                class="btn btn-outline-primary" 
                                                @click="verDetalleImpacto(impacto)"
                                                title="Ver detalles"
                                            >
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button 
                                                v-if="impacto.estado === 'pendiente'"
                                                class="btn btn-outline-success" 
                                                @click="procesarImpacto(impacto)"
                                                title="Procesar"
                                            >
                                                <i class="bi bi-play-fill"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};