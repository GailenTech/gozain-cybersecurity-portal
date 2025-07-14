/**
 * Store Vuex para el módulo de Inventario
 */

export const inventarioStore = window.Vuex.createStore({
    state() {
        return {
            // Estado de la aplicación
            currentView: 'dashboard', // 'dashboard' o 'inventario'
            loading: false,
            error: null,
            services: null, // Inyectado desde la app
            
            // Datos
            activos: [],
            departamentos: [],
            estadisticas: {
                total: 0,
                por_tipo: {},
                por_estado: {},
                por_criticidad: {},
                por_departamento: {}
            },
            
            // Filtros
            filtros: {
                tipo: '',
                departamento: '',
                busqueda: ''
            },
            
            // Modal
            modalActivo: {
                show: false,
                modo: 'nuevo', // 'nuevo' o 'editar'
                activo: null
            },
            modalImportar: {
                show: false,
                archivo: null,
                preview: null
            },
            
            // Organización actual
            organizationId: null
        };
    },

    mutations: {
        SET_CURRENT_VIEW(state, view) {
            state.currentView = view;
        },
        
        SET_LOADING(state, loading) {
            state.loading = loading;
        },
        
        SET_ERROR(state, error) {
            state.error = error;
        },
        
        SET_ORGANIZATION(state, orgId) {
            state.organizationId = orgId;
        },
        
        SET_SERVICES(state, services) {
            state.services = services;
        },
        
        SET_ACTIVOS(state, activos) {
            state.activos = activos;
        },
        
        SET_DEPARTAMENTOS(state, departamentos) {
            state.departamentos = departamentos;
        },
        
        SET_ESTADISTICAS(state, estadisticas) {
            state.estadisticas = estadisticas;
        },
        
        SET_FILTROS(state, filtros) {
            state.filtros = { ...state.filtros, ...filtros };
        },
        
        RESET_FILTROS(state) {
            state.filtros = {
                tipo: '',
                departamento: '',
                busqueda: ''
            };
        },
        
        // Modal Activo
        SHOW_MODAL_ACTIVO(state, { modo = 'nuevo', activo = null } = {}) {
            state.modalActivo = {
                show: true,
                modo,
                activo: activo ? { ...activo } : null
            };
        },
        
        HIDE_MODAL_ACTIVO(state) {
            state.modalActivo = {
                show: false,
                modo: 'nuevo',
                activo: null
            };
        },
        
        // Modal Importar
        SHOW_MODAL_IMPORTAR(state) {
            state.modalImportar = {
                show: true,
                archivo: null,
                preview: null
            };
        },
        
        HIDE_MODAL_IMPORTAR(state) {
            state.modalImportar = {
                show: false,
                archivo: null,
                preview: null
            };
        },
        
        SET_IMPORT_PREVIEW(state, preview) {
            state.modalImportar.preview = preview;
        }
    },

    actions: {
        async cargarActivos({ commit, state }, forzar = false) {
            if (!state.organizationId) return;
            
            commit('SET_LOADING', true);
            commit('SET_ERROR', null);
            
            try {
                const params = new URLSearchParams(state.filtros);
                const api = state.services?.api || window.gozainApp?.services?.api;
                if (!api) throw new Error('API service not available');
                const response = await api.get(`/inventario/activos?${params}`);
                commit('SET_ACTIVOS', response);
                
                // Actualizar departamentos
                const departamentos = [...new Set(response.map(a => a.departamento).filter(Boolean))];
                commit('SET_DEPARTAMENTOS', departamentos.sort());
            } catch (error) {
                console.error('Error cargando activos:', error);
                commit('SET_ERROR', 'Error al cargar los activos');
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async cargarEstadisticas({ commit, state }) {
            if (!state.organizationId) return;
            
            try {
                const api = state.services?.api || window.gozainApp?.services?.api;
                if (!api) throw new Error('API service not available');
                const response = await api.get('/inventario/estadisticas');
                commit('SET_ESTADISTICAS', response);
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                commit('SET_ERROR', 'Error al cargar las estadísticas');
            }
        },

        async crearActivo({ commit, dispatch, state }, activo) {
            commit('SET_LOADING', true);
            try {
                const api = state.services?.api || window.gozainApp?.services?.api;
                if (!api) throw new Error('API service not available');
                await api.post('/inventario/activos', activo);
                
                // Recargar datos
                await dispatch('cargarActivos');
                
                // Mostrar notificación
                window.gozainApp.eventBus.emit('shell:showToast', {
                    message: 'Activo creado correctamente',
                    type: 'success'
                });
                
                return true;
            } catch (error) {
                console.error('Error creando activo:', error);
                commit('SET_ERROR', 'Error al crear el activo');
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async actualizarActivo({ commit, dispatch, state }, { id, activo }) {
            commit('SET_LOADING', true);
            try {
                const api = state.services?.api || window.gozainApp?.services?.api;
                if (!api) throw new Error('API service not available');
                await api.put(`/inventario/activos/${id}`, activo);
                
                // Recargar datos
                await dispatch('cargarActivos');
                
                // Mostrar notificación
                window.gozainApp.eventBus.emit('shell:showToast', {
                    message: 'Activo actualizado correctamente',
                    type: 'success'
                });
                
                return true;
            } catch (error) {
                console.error('Error actualizando activo:', error);
                commit('SET_ERROR', 'Error al actualizar el activo');
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async eliminarActivo({ commit, dispatch, state }, id) {
            if (!confirm('¿Está seguro de eliminar este activo?')) {
                return false;
            }
            
            commit('SET_LOADING', true);
            try {
                const api = state.services?.api || window.gozainApp?.services?.api;
                if (!api) throw new Error('API service not available');
                await api.delete(`/inventario/activos/${id}`);
                
                // Recargar datos
                await dispatch('cargarActivos');
                
                // Mostrar notificación
                window.gozainApp.eventBus.emit('shell:showToast', {
                    message: 'Activo eliminado correctamente',
                    type: 'success'
                });
                
                return true;
            } catch (error) {
                console.error('Error eliminando activo:', error);
                commit('SET_ERROR', 'Error al eliminar el activo');
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        cambiarVista({ commit, dispatch }, vista) {
            commit('SET_CURRENT_VIEW', vista);
            
            // Cargar datos según la vista
            if (vista === 'dashboard') {
                dispatch('cargarEstadisticas');
            } else {
                dispatch('cargarActivos');
            }
        },

        aplicarFiltros({ commit, dispatch }, filtros) {
            commit('SET_FILTROS', filtros);
            dispatch('cargarActivos');
        }
    },

    getters: {
        activosFiltrados(state) {
            // Los filtros ya se aplican en el backend
            return state.activos;
        },
        
        totalActivos(state) {
            return state.activos.length;
        },
        
        tiposActivo() {
            return ['Hardware', 'Software', 'Servicio', 'Información', 'Personal'];
        },
        
        estadosActivo() {
            return ['Activo', 'Inactivo', 'En mantenimiento'];
        },
        
        criticidades() {
            return ['Baja', 'Normal', 'Importante', 'Crítica'];
        },
        
        clasificaciones() {
            return ['Público', 'Interno', 'Confidencial', 'Secreto'];
        }
    }
});