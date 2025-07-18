// Aplicación principal de Gozain
import { NavigationManager } from '/core/navigation/navigation.js';
import { EventBus } from '/core/services/event-bus.js';
import { ApiService } from '/core/api/api-service.js';
import { StorageService } from '/core/services/storage-service.js';
import { NotificationService } from '/core/services/notification-service.js';
import ToolSelector from './tool-selector.js';

class GozainApp {
    constructor() {
        this.navigation = new NavigationManager();
        this.eventBus = new EventBus();
        this.api = new ApiService();
        this.storage = new StorageService();
        this.notifications = new NotificationService(this.eventBus);
        
        // Configurar autenticación si está disponible
        if (window.authService) {
            this.api.setAuthService(window.authService);
        }
        
        // Hacer servicios disponibles globalmente
        window.gozainCore = {
            services: {
                navigation: this.navigation,
                eventBus: this.eventBus,
                api: this.api,
                storage: this.storage,
                notifications: this.notifications,
                auth: window.authService || null
            }
        };
        
        // Hacer eventBus disponible directamente en window para compatibilidad
        window.gozainApp = this;
        
        this.init();
    }
    
    async init() {
        // Cargar versión
        this.loadVersion();
        
        // Verificar si venimos del callback OAuth
        if (this.handleOAuthCallback()) {
            return; // El callback manejará el resto del flujo
        }
        
        // Verificar autenticación
        if (window.authService) {
            await this.checkAuthentication();
        }
        
        // Cargar organizaciones
        await this.loadOrganizations();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Registrar aplicaciones disponibles
        this.registerApplications();
        
        // Restaurar estado si hay organización seleccionada
        const selectedOrg = this.storage.get('selectedOrganization');
        if (selectedOrg) {
            const org = this.organizations?.find(o => o.id === selectedOrg);
            if (org) {
                // NO mostrar el selector de herramientas si hay una ruta guardada
                const lastRouteStr = localStorage.getItem('gozain_last_route');
                let shouldShowToolSelector = true;
                
                if (lastRouteStr) {
                    try {
                        const lastRoute = JSON.parse(lastRouteStr);
                        if (lastRoute.organization === selectedOrg && lastRoute.module) {
                            shouldShowToolSelector = false;
                            // Seleccionar organización sin mostrar el selector
                            this.selectOrganizationWithoutToolSelector(selectedOrg, org.nombre);
                            
                            // Cargar el módulo automáticamente
                            setTimeout(() => {
                                const apps = this.navigation.getApps();
                                const appConfig = apps.find(app => app.id === lastRoute.module);
                                if (appConfig) {
                                    console.log('Restaurando aplicación:', lastRoute.module);
                                    this.loadApplication(appConfig.id);
                                }
                            }, 100);
                        }
                    } catch (e) {
                        console.error('Error restaurando ruta:', e);
                    }
                }
                
                if (shouldShowToolSelector) {
                    this.selectOrganization(selectedOrg, org.nombre);
                }
            }
        }
    }
    
    async checkAuthentication() {
        if (!window.authService) return;
        
        const isAuthenticated = window.authService.isAuthenticated();
        if (isAuthenticated) {
            const user = window.authService.getUser();
            console.log('Usuario autenticado:', user);
            // Actualizar organización basada en el usuario
            if (user && user.organizacion_id) {
                window.authService.organizationId = user.organizacion_id;
            }
            
            // Disparar evento para actualizar UI
            const event = new CustomEvent('auth-status-changed', {
                detail: { isAuthenticated: true, user: user }
            });
            document.dispatchEvent(event);
        } else {
            console.log('Usuario no autenticado');
            
            // Disparar evento para actualizar UI
            const event = new CustomEvent('auth-status-changed', {
                detail: { isAuthenticated: false, user: null }
            });
            document.dispatchEvent(event);
        }
    }
    
    handleOAuthCallback() {
        // Verificar si estamos en el callback de OAuth
        const hash = window.location.hash;
        if (hash && hash.includes('auth_success')) {
            // Extraer el token del fragment
            const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
            const token = params.get('token');
            
            if (token && window.authService) {
                // Decodificar el JWT para obtener la información del usuario
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    
                    // Guardar el token usando setTokens
                    window.authService.setTokens(token, null);
                    
                    // Establecer el usuario
                    window.authService.setUser({
                        id: payload.user_id,
                        email: payload.email,
                        nombre: payload.nombre,
                        organizacion_id: payload.org_id,
                        roles: payload.roles || [],
                        permisos: payload.permissions || {}
                    });
                    
                    // Limpiar la URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // Recargar la página para inicializar con el usuario autenticado
                    window.location.reload();
                    
                    return true;
                } catch (error) {
                    console.error('Error procesando token:', error);
                }
            }
        }
        return false;
    }
    
    async loadVersion() {
        try {
            const response = await fetch('/version.json');
            if (response.ok) {
                const data = await response.json();
                const versionEl = document.getElementById('versionInfo');
                if (versionEl) {
                    versionEl.textContent = `v${data.version}`;
                }
            }
        } catch (error) {
            console.log('No se pudo cargar la versión');
        }
    }
    
    async loadOrganizations() {
        try {
            const orgs = await this.api.get('/organizations');
            
            // El endpoint ya devuelve un array
            this.organizations = orgs;
            
            // Actualizar botón con organización seleccionada
            const savedOrg = this.storage.get('selectedOrganization');
            if (savedOrg) {
                const org = orgs.find(o => o.id === savedOrg);
                if (org) {
                    document.getElementById('organizationName').textContent = org.nombre;
                }
            }
            
            return orgs;
        } catch (error) {
            console.error('Error cargando organizaciones:', error);
            this.organizations = [];
            return [];
        }
    }
    
    registerApplications() {
        // Registrar aplicaciones disponibles
        const apps = [
            {
                id: 'inventario',
                name: 'Inventario de Activos',
                icon: 'bi-box-seam',
                description: 'Gestión de activos ISO 27001',
                path: '/apps/inventario/index-vue-router-real.js',
                color: '#0d6efd'
            },
            {
                id: 'impactos',
                name: 'Impactos de Negocio',
                icon: 'bi-lightning-charge',
                description: 'Gestión de impactos y cambios',
                path: '/apps/impactos/index-vue-router.js',
                color: '#ffc107'
            },
            {
                id: 'madurez',
                name: 'Madurez en Ciberseguridad',
                icon: 'bi-shield-check',
                description: 'Evaluación de madurez en ciberseguridad',
                path: '/apps/madurez/index-vue-router.js',
                color: '#6f42c1'
            }
        ];
        
        apps.forEach(app => this.navigation.registerApp(app));
    }
    
    setupEventListeners() {
        // Event listeners del eventBus
        this.eventBus.on('shell:setAppMenu', (data) => this.setAppMenu(data));
        this.eventBus.on('shell:updateMenuActiveState', (data) => this.updateMenuActiveState(data));
        this.eventBus.on('shell:showToast', (data) => this.showToast(data));
        
        // Botón selector de herramientas
        const toolSelectorBtn = document.getElementById('toolSelectorButton');
        if (toolSelectorBtn) {
            toolSelectorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showToolSelector();
            });
        }
        
        // Botón de organización
        const btnOrg = document.getElementById('organizationButton');
        if (btnOrg) {
            btnOrg.addEventListener('click', () => {
                this.showOrganizationModal();
            });
        }
        
        // Botón de configuración
        const btnSettings = document.getElementById('btnSettings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
                modal.show();
            });
        }
        
        // Botón de nueva organización en el modal
        const btnNewOrg = document.getElementById('btnNewOrganization');
        if (btnNewOrg) {
            btnNewOrg.addEventListener('click', () => {
                bootstrap.Modal.getInstance(document.getElementById('organizationModal')).hide();
                const newOrgModal = new bootstrap.Modal(document.getElementById('newOrganizationModal'));
                newOrgModal.show();
            });
        }
        
        // Crear nueva organización
        const btnCreateOrg = document.getElementById('btnCreateOrganization');
        if (btnCreateOrg) {
            btnCreateOrg.addEventListener('click', async () => {
                const name = document.getElementById('newOrgName').value.trim();
                if (name) {
                    try {
                        const newOrg = await this.api.post('/organizaciones', { nombre: name });
                        await this.loadOrganizations();
                        document.getElementById('newOrgName').value = '';
                        bootstrap.Modal.getInstance(document.getElementById('newOrganizationModal')).hide();
                        // Seleccionar la nueva organización
                        this.selectOrganization(newOrg.id, newOrg.nombre);
                    } catch (error) {
                        this.notifications.error('Error al crear organización: ' + error.message);
                    }
                }
            });
        }
        
        // Escuchar actualizaciones del menú del módulo
        this.eventBus.on('shell:updateModuleMenu', (data) => {
            this.updateModuleMenu(data);
        });
        
        // Escuchar selecciones del menú del módulo
        this.eventBus.on('shell:moduleMenuSelect', (data) => {
            // Esto se maneja en el módulo directamente
        });
    }
    
    selectOrganization(orgId, orgName) {
        if (!orgId) {
            document.getElementById('welcomeScreen').classList.remove('d-none');
            document.getElementById('appContainer').classList.add('d-none');
            document.getElementById('organizationName').textContent = 'Seleccionar Organización';
            this.storage.remove('selectedOrganization');
            return;
        }
        
        // Si no se proporciona el nombre, buscarlo
        if (!orgName && this.organizations) {
            const org = this.organizations.find(o => o.id === orgId);
            orgName = org ? org.nombre : 'Organización';
        }
        
        this.storage.set('selectedOrganization', orgId);
        this.navigation.setOrganization(orgId);
        document.getElementById('organizationName').textContent = orgName;
        
        document.getElementById('welcomeScreen').classList.add('d-none');
        document.getElementById('appContainer').classList.remove('d-none');
        
        // Mostrar selector de herramientas
        this.showToolSelector();
        
        // Notificar cambio de organización
        this.eventBus.emit('organization:changed', { organizationId: orgId });
    }
    
    selectOrganizationWithoutToolSelector(orgId, orgName) {
        if (!orgId) {
            document.getElementById('welcomeScreen').classList.remove('d-none');
            document.getElementById('appContainer').classList.add('d-none');
            document.getElementById('organizationName').textContent = 'Seleccionar Organización';
            this.storage.remove('selectedOrganization');
            return;
        }
        
        // Si no se proporciona el nombre, buscarlo
        if (!orgName && this.organizations) {
            const org = this.organizations.find(o => o.id === orgId);
            orgName = org ? org.nombre : 'Organización';
        }
        
        this.storage.set('selectedOrganization', orgId);
        this.navigation.setOrganization(orgId);
        document.getElementById('organizationName').textContent = orgName;
        
        document.getElementById('welcomeScreen').classList.add('d-none');
        document.getElementById('appContainer').classList.remove('d-none');
        
        // NO mostrar selector de herramientas
        // Solo notificar cambio de organización
        this.eventBus.emit('organization:changed', { organizationId: orgId });
    }
    
    showOrganizationModal() {
        const modal = new bootstrap.Modal(document.getElementById('organizationModal'));
        const list = document.getElementById('organizationList');
        const selectedOrg = this.storage.get('selectedOrganization');
        
        // Limpiar lista
        list.innerHTML = '';
        
        if (!this.organizations || this.organizations.length === 0) {
            list.innerHTML = '<p class="text-muted text-center py-3">No hay organizaciones disponibles</p>';
        } else {
            // Mostrar organizaciones
            this.organizations.forEach(org => {
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action';
                if (org.id === selectedOrg) {
                    item.classList.add('active');
                }
                
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${org.nombre}</h6>
                            <small class="text-muted">ID: ${org.id.substring(0, 8)}...</small>
                        </div>
                        ${org.id === selectedOrg ? '<i class="bi bi-check-circle-fill text-success"></i>' : ''}
                    </div>
                `;
                
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.selectOrganization(org.id, org.nombre);
                    modal.hide();
                });
                
                list.appendChild(item);
            });
        }
        
        modal.show();
    }
    
    async loadApplication(appId) {
        // Mostrar sidebar cuando se carga una aplicación
        document.body.classList.remove('showing-tool-selector');
        const sidebar = document.getElementById('sidebarMenu');
        if (sidebar) {
            sidebar.classList.remove('d-none');
        }
        
        // Restaurar el ancho del main
        const main = document.getElementById('mainContent');
        if (main) {
            main.className = 'col-md-9 ms-sm-auto col-lg-10 px-md-4';
        }
        
        // Actualizar el selector de herramientas
        const toolBtn = document.getElementById('toolSelectorButton');
        const toolDivider = document.getElementById('toolDivider');
        const apps = this.navigation.getApps();
        const currentApp = apps.find(app => app.id === appId);
        
        if (toolBtn && currentApp) {
            toolBtn.classList.remove('d-none');
            if (toolDivider) toolDivider.classList.remove('d-none');
            
            const toolNameEl = document.getElementById('currentToolName');
            if (toolNameEl) {
                toolNameEl.textContent = currentApp.name;
            }
        }
        
        // Aplicar tema de la aplicación
        document.body.setAttribute('data-app-theme', appId);
        
        const container = document.getElementById('appContainer');
        
        // Mostrar loader
        container.innerHTML = '<div class="loader"></div>';
        
        try {
            await this.navigation.loadApp(appId, container);
        } catch (error) {
            console.error('Error cargando aplicación:', error);
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error al cargar la aplicación</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    showToolSelector() {
        // Limpiar cualquier aplicación activa
        this.navigation.unloadCurrentApp();
        
        // Ocultar sidebar completamente
        document.body.classList.add('showing-tool-selector');
        const sidebar = document.getElementById('sidebarMenu');
        if (sidebar) {
            sidebar.classList.add('d-none');
        }
        
        // Ocultar selector de herramientas
        const toolBtn = document.getElementById('toolSelectorButton');
        const toolDivider = document.getElementById('toolDivider');
        if (toolBtn) toolBtn.classList.add('d-none');
        if (toolDivider) toolDivider.classList.add('d-none');
        
        // Limpiar tema de aplicación
        document.body.removeAttribute('data-app-theme');
        
        // Ajustar el main para usar todo el ancho
        const main = document.getElementById('mainContent');
        if (main) {
            main.className = 'col-12 px-md-4';
        }
        
        // Limpiar menú
        document.getElementById('appMenu').innerHTML = '';
        
        // Crear y mostrar selector de herramientas
        const container = document.getElementById('appContainer');
        const tools = this.navigation.getApps().map(app => ({
            id: app.id,
            name: app.name,
            config: {
                name: app.name,
                icon: app.icon,
                description: app.description
            }
        }));
        
        this.toolSelector = new ToolSelector(container, tools, (tool) => {
            this.loadApplication(tool.id);
        });
        
        this.toolSelector.render();
    }
    
    updateModuleMenu(data) {
        const { moduleId, items } = data;
        const appMenu = document.getElementById('appMenu');
        
        if (!appMenu) return;
        
        // Limpiar menú actual
        appMenu.innerHTML = '';
        
        // Crear elementos del menú
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            
            const a = document.createElement('a');
            a.className = 'nav-link';
            a.href = '#';
            a.setAttribute('data-menu-item', item.id);
            a.innerHTML = `
                <i class="${item.icon} me-2"></i>
                ${item.label}
            `;
            
            // Manejar click
            a.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar clase activa
                appMenu.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                a.classList.add('active');
                
                // Emitir evento de selección
                this.eventBus.emit('shell:moduleMenuSelect', {
                    moduleId,
                    itemId: item.id
                });
            });
            
            li.appendChild(a);
            appMenu.appendChild(li);
        });
        
        // Activar el primer elemento por defecto
        const firstItem = appMenu.querySelector('.nav-link');
        if (firstItem) {
            firstItem.classList.add('active');
        }
    }
    
    setAppMenu(data) {
        const { appId, menu } = data;
        const appMenu = document.getElementById('appMenu');
        
        if (!appMenu) return;
        
        // Limpiar menú actual
        appMenu.innerHTML = '';
        
        // Crear elementos del menú
        menu.forEach(item => {
            if (item.divider) {
                const hr = document.createElement('hr');
                hr.className = 'sidebar-divider';
                appMenu.appendChild(hr);
                return;
            }
            
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.dataset.menuId = item.id; // Guardar ID para referencia
            
            const a = document.createElement('a');
            a.className = 'nav-link' + (item.active ? ' active' : '');
            a.href = '#';
            a.innerHTML = `
                <i class="${item.icon} me-2"></i>
                ${item.label}
            `;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Emitir evento de selección
                this.eventBus.emit(`${appId}:menuAction`, {
                    item: item.id
                });
            });
            
            li.appendChild(a);
            appMenu.appendChild(li);
        });
    }
    
    updateMenuActiveState(data) {
        const { appId, activeItem } = data;
        const appMenu = document.getElementById('appMenu');
        
        if (!appMenu) return;
        
        // Actualizar clases activas basado en el data-menu-id
        appMenu.querySelectorAll('.nav-item').forEach((li) => {
            const link = li.querySelector('.nav-link');
            if (!link) return;
            
            // Comparar el ID del menú con el item activo
            const menuId = li.dataset.menuId;
            
            if (menuId === activeItem) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    showToast(data) {
        const { message, type = 'info', duration = 3000 } = data;
        this.notifications.show(message, type, duration);
    }
}

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gozainApp = new GozainApp();
});