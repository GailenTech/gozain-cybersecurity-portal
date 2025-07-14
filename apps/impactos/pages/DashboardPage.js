// Dashboard de Impactos de Negocio
import { ref, inject, onMounted, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
    setup() {
        const api = inject('api');
        const organization = inject('organization');
        const loading = ref(false);
        
        // Estado del dashboard
        const estadisticas = ref({
            pendientes: 0,
            completados7dias: 0,
            tareasPendientes: 0,
            recientes: [],
            actividad: [],
            porTipo: {}
        });

        const impactosRecientes = ref([]);
        const actividadReciente = ref([]);

        // Computadas
        const tieneImpactosRecientes = computed(() => {
            return impactosRecientes.value && impactosRecientes.value.length > 0;
        });

        const tieneActividad = computed(() => {
            return actividadReciente.value && actividadReciente.value.length > 0;
        });

        // Métodos
        const cargarDashboard = async () => {
            loading.value = true;
            try {
                const [stats, recientes, actividad] = await Promise.all([
                    api.get('/impactos/estadisticas'),
                    api.get('/impactos/recientes?limit=10'),
                    api.get('/impactos/actividad?limit=15')
                ]);

                estadisticas.value = stats;
                impactosRecientes.value = recientes;
                actividadReciente.value = actividad;
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                mostrarError('Error al cargar el dashboard');
            } finally {
                loading.value = false;
            }
        };

        const crearNuevoImpacto = () => {
            // Emitir evento para abrir modal
            const eventBus = inject('eventBus');
            eventBus.emit('impactos:showModal', { type: 'nuevo' });
        };

        const verDetalleImpacto = (impacto) => {
            const eventBus = inject('eventBus');
            eventBus.emit('impactos:showModal', { type: 'detalle', impacto });
        };

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

        const getTipoIcon = (tipo) => {
            const iconos = {
                'alta_empleado': 'bi-person-plus',
                'baja_empleado': 'bi-person-dash',
                'nuevo_cliente': 'bi-building',
                'cambio_config': 'bi-gear'
            };
            return iconos[tipo] || 'bi-circle';
        };

        const formatearFecha = (fecha) => {
            return new Date(fecha).toLocaleDateString('es-ES');
        };

        const formatearFechaHora = (fecha) => {
            return new Date(fecha).toLocaleString('es-ES');
        };

        const mostrarError = (mensaje) => {
            // Implementar notificación de error
            console.error(mensaje);
        };

        // Lifecycle
        onMounted(() => {
            cargarDashboard();
        });

        return {
            loading,
            estadisticas,
            impactosRecientes,
            actividadReciente,
            tieneImpactosRecientes,
            tieneActividad,
            cargarDashboard,
            crearNuevoImpacto,
            verDetalleImpacto,
            getEstadoClass,
            getEstadoText,
            getTipoIcon,
            formatearFecha,
            formatearFechaHora
        };
    },

    template: `
        <div class="dashboard-impactos">
            <!-- Acciones rápidas -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card border-warning cursor-pointer" @click="crearNuevoImpacto">
                        <div class="card-body text-center">
                            <h1 class="text-warning mb-0">
                                <i class="bi bi-plus-circle"></i>
                            </h1>
                            <p class="mb-0">Nuevo Impacto</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-warning">
                        <div class="card-body text-center">
                            <h1 class="text-warning mb-0">{{ estadisticas.pendientes }}</h1>
                            <p class="mb-0">Pendientes</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-success">
                        <div class="card-body text-center">
                            <h1 class="text-success mb-0">{{ estadisticas.completados7dias }}</h1>
                            <p class="mb-0">Completados (7 días)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-info">
                        <div class="card-body text-center">
                            <h1 class="text-info mb-0">{{ estadisticas.tareasPendientes }}</h1>
                            <p class="mb-0">Tareas Pendientes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Impactos Recientes -->
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Impactos Recientes</h5>
                            <button class="btn btn-sm btn-outline-primary" @click="cargarDashboard" :disabled="loading">
                                <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
                            </button>
                        </div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            <div v-if="loading" class="text-center py-4">
                                <div class="spinner-border spinner-border-sm text-primary"></div>
                                <p class="mt-2 mb-0 text-muted">Cargando...</p>
                            </div>
                            
                            <div v-else-if="!tieneImpactosRecientes" class="text-center py-4 text-muted">
                                <i class="bi bi-inbox display-4"></i>
                                <p class="mt-2 mb-0">No hay impactos recientes</p>
                            </div>
                            
                            <div v-else>
                                <div 
                                    v-for="impacto in impactosRecientes" 
                                    :key="impacto.id" 
                                    class="border-bottom pb-2 mb-2 cursor-pointer hover-bg-light"
                                    @click="verDetalleImpacto(impacto)"
                                >
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="flex-grow-1">
                                            <div class="d-flex align-items-center mb-1">
                                                <i :class="getTipoIcon(impacto.tipo)" class="me-2 text-primary"></i>
                                                <h6 class="mb-0">{{ impacto.descripcion || 'Sin descripción' }}</h6>
                                            </div>
                                            <small class="text-muted">
                                                {{ impacto.tipo_nombre }} - {{ formatearFecha(impacto.fecha_creacion) }}
                                            </small>
                                        </div>
                                        <span class="badge" :class="getEstadoClass(impacto.estado)">
                                            {{ getEstadoText(impacto.estado) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actividad Reciente -->
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Actividad Reciente</h5>
                        </div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            <div v-if="loading" class="text-center py-4">
                                <div class="spinner-border spinner-border-sm text-primary"></div>
                                <p class="mt-2 mb-0 text-muted">Cargando...</p>
                            </div>
                            
                            <div v-else-if="!tieneActividad" class="text-center py-4 text-muted">
                                <i class="bi bi-clock-history display-4"></i>
                                <p class="mt-2 mb-0">No hay actividad reciente</p>
                            </div>
                            
                            <div v-else class="timeline">
                                <div 
                                    v-for="(actividad, index) in actividadReciente" 
                                    :key="actividad.id || index"
                                    class="timeline-item d-flex mb-3"
                                >
                                    <div class="timeline-marker me-3">
                                        <div class="rounded-circle bg-primary" style="width: 10px; height: 10px;"></div>
                                    </div>
                                    <div class="timeline-content flex-grow-1">
                                        <h6 class="mb-1">{{ actividad.descripcion }}</h6>
                                        <small class="text-muted">
                                            {{ actividad.usuario || 'Sistema' }} - {{ formatearFechaHora(actividad.fecha) }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen por tipos -->
            <div class="row mt-4" v-if="Object.keys(estadisticas.porTipo || {}).length > 0">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Tipos de Impacto</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div 
                                    v-for="(cantidad, tipo) in estadisticas.porTipo" 
                                    :key="tipo"
                                    class="col-md-3 mb-3"
                                >
                                    <div class="text-center">
                                        <h3 class="text-primary">{{ cantidad }}</h3>
                                        <p class="mb-0 text-muted">{{ tipo }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};