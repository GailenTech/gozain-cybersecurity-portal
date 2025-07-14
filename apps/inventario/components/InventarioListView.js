/**
 * Componente Lista de Inventario
 */
export const InventarioListView = {
    name: 'InventarioListView',
    
    template: `
        <div class="inventario-list-view p-4">
            <!-- Encabezado y filtros -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2>Inventario de Activos</h2>
                        <button @click="nuevoActivo" class="btn btn-primary" id="btnNuevoActivo">
                            <i class="bi bi-plus-circle me-2"></i>
                            Nuevo Activo
                        </button>
                    </div>
                    
                    <!-- Filtros -->
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <label class="form-label">Tipo de Activo</label>
                                    <select 
                                        v-model="filtroTipo" 
                                        @change="aplicarFiltros"
                                        class="form-select" 
                                        id="filtroTipo"
                                    >
                                        <option value="">Todos</option>
                                        <option v-for="tipo in tiposActivo" :key="tipo" :value="tipo">
                                            {{ tipo }}
                                        </option>
                                    </select>
                                </div>
                                
                                <div class="col-md-3">
                                    <label class="form-label">Departamento</label>
                                    <select 
                                        v-model="filtroDepartamento"
                                        @change="aplicarFiltros" 
                                        class="form-select" 
                                        id="filtroDepartamento"
                                    >
                                        <option value="">Todos</option>
                                        <option v-for="depto in departamentos" :key="depto" :value="depto">
                                            {{ depto }}
                                        </option>
                                    </select>
                                </div>
                                
                                <div class="col-md-4">
                                    <label class="form-label">Buscar</label>
                                    <div class="input-group">
                                        <input 
                                            v-model="filtroBusqueda"
                                            @keyup.enter="aplicarFiltros"
                                            type="text" 
                                            class="form-control" 
                                            id="filtroBusqueda"
                                            placeholder="Buscar por nombre, responsable..."
                                        >
                                        <button 
                                            @click="aplicarFiltros"
                                            class="btn btn-outline-secondary" 
                                            id="btnBuscar"
                                        >
                                            <i class="bi bi-search"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="col-md-2 d-flex align-items-end">
                                    <button 
                                        @click="limpiarFiltros"
                                        class="btn btn-outline-secondary w-100"
                                    >
                                        <i class="bi bi-x-circle me-2"></i>
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tabla de activos -->
            <div class="row">
                <div class="col-md-12">
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
                                        <tr v-if="activos.length === 0">
                                            <td colspan="7" class="text-center text-muted py-4">
                                                No se encontraron activos
                                            </td>
                                        </tr>
                                        <tr v-for="activo in activos" :key="activo.id">
                                            <td>
                                                <span class="badge bg-secondary">{{ activo.tipo || activo.tipo_activo }}</span>
                                            </td>
                                            <td>{{ activo.nombre }}</td>
                                            <td>{{ activo.responsable || '-' }}</td>
                                            <td>{{ activo.departamento || '-' }}</td>
                                            <td>
                                                <span :class="getEstadoClass(activo.estado)">
                                                    {{ activo.estado }}
                                                </span>
                                            </td>
                                            <td>
                                                <span :class="getCriticidadClass(activo.criticidad)">
                                                    {{ activo.criticidad }}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    @click="editarActivo(activo)"
                                                    class="btn btn-sm btn-outline-primary me-1"
                                                    :data-activo-id="activo.id"
                                                >
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button 
                                                    @click="eliminarActivo(activo.id)"
                                                    class="btn btn-sm btn-outline-danger"
                                                    :data-activo-id="activo.id"
                                                >
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            filtroTipo: '',
            filtroDepartamento: '',
            filtroBusqueda: ''
        };
    },
    
    computed: {
        ...Vuex.mapState({
            activos: state => state.activos,
            departamentos: state => state.departamentos,
            filtros: state => state.filtros
        }),
        
        ...Vuex.mapGetters(['tiposActivo'])
    },
    
    methods: {
        ...Vuex.mapActions(['eliminarActivo']),
        ...Vuex.mapMutations(['SHOW_MODAL_ACTIVO', 'SET_FILTROS', 'RESET_FILTROS']),
        
        nuevoActivo() {
            this.SHOW_MODAL_ACTIVO({ modo: 'nuevo' });
        },
        
        editarActivo(activo) {
            this.SHOW_MODAL_ACTIVO({ modo: 'editar', activo });
        },
        
        aplicarFiltros() {
            this.SET_FILTROS({
                tipo: this.filtroTipo,
                departamento: this.filtroDepartamento,
                busqueda: this.filtroBusqueda
            });
            this.$store.dispatch('cargarActivos');
        },
        
        limpiarFiltros() {
            this.filtroTipo = '';
            this.filtroDepartamento = '';
            this.filtroBusqueda = '';
            this.RESET_FILTROS();
            this.$store.dispatch('cargarActivos');
        },
        
        getEstadoClass(estado) {
            const clases = {
                'Activo': 'badge bg-success',
                'Inactivo': 'badge bg-secondary',
                'En mantenimiento': 'badge bg-warning text-dark'
            };
            return clases[estado] || 'badge bg-secondary';
        },
        
        getCriticidadClass(criticidad) {
            const clases = {
                'Baja': 'badge bg-info text-dark',
                'Normal': 'badge bg-primary',
                'Importante': 'badge bg-warning text-dark',
                'Crítica': 'badge bg-danger'
            };
            return clases[criticidad] || 'badge bg-secondary';
        }
    },
    
    watch: {
        // Sincronizar filtros locales con el store
        filtros: {
            immediate: true,
            handler(newFiltros) {
                this.filtroTipo = newFiltros.tipo || '';
                this.filtroDepartamento = newFiltros.departamento || '';
                this.filtroBusqueda = newFiltros.busqueda || '';
            }
        }
    }
};