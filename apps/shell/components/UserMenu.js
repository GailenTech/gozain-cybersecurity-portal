/**
 * Menú de usuario con información de sesión
 */
class UserMenu {
    constructor() {
        this.container = null;
        this.user = null;
        this.isAuthenticated = false;
        
        this.init();
    }
    
    init() {
        this.createUserMenu();
        this.setupEventListeners();
        this.updateUserInfo();
    }
    
    createUserMenu() {
        // Buscar contenedor existente o crear uno nuevo
        this.container = document.querySelector('#user-menu') || this.createContainer();
        
        this.render();
    }
    
    createContainer() {
        const container = document.createElement('div');
        container.id = 'user-menu';
        container.className = 'user-menu';
        
        // Buscar navbar u otro lugar apropiado
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            navbar.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    render() {
        if (!this.container) return;
        
        if (this.isAuthenticated && this.user) {
            this.renderAuthenticatedUser();
        } else {
            this.renderLoginButton();
        }
    }
    
    renderAuthenticatedUser() {
        this.container.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" id="userMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle me-2"></i>
                    <span class="user-name">${this.user.nombre || this.user.email}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                    <li>
                        <h6 class="dropdown-header">
                            <i class="fas fa-user me-2"></i>
                            ${this.user.nombre || 'Usuario'}
                        </h6>
                    </li>
                    <li>
                        <span class="dropdown-item-text">
                            <small class="text-muted">
                                <i class="fas fa-envelope me-2"></i>
                                ${this.user.email}
                            </small>
                        </span>
                    </li>
                    <li>
                        <span class="dropdown-item-text">
                            <small class="text-muted">
                                <i class="fas fa-building me-2"></i>
                                ${this.getOrganizationName()}
                            </small>
                        </span>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item" href="#" id="view-profile">
                            <i class="fas fa-user-edit me-2"></i>
                            Mi Perfil
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" id="user-permissions">
                            <i class="fas fa-shield-alt me-2"></i>
                            Permisos
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" id="logout-btn">
                            <i class="fas fa-sign-out-alt me-2"></i>
                            Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </div>
        `;
        
        this.setupAuthenticatedListeners();
    }
    
    renderLoginButton() {
        this.container.innerHTML = `
            <button class="btn btn-primary" id="login-btn">
                <i class="fas fa-sign-in-alt me-2"></i>
                Iniciar Sesión
            </button>
        `;
        
        this.setupLoginListener();
    }
    
    setupEventListeners() {
        // Escuchar cambios en autenticación
        if (window.authService) {
            window.authService.onAuthChange = (isAuthenticated, user) => {
                this.isAuthenticated = isAuthenticated;
                this.user = user;
                this.updateUserInfo();
            };
        }
        
        // Escuchar eventos de autenticación
        document.addEventListener('auth-status-changed', (event) => {
            this.isAuthenticated = event.detail.isAuthenticated;
            this.user = event.detail.user;
            this.updateUserInfo();
        });
    }
    
    setupLoginListener() {
        const loginBtn = this.container.querySelector('#login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }
    }
    
    setupAuthenticatedListeners() {
        const logoutBtn = this.container.querySelector('#logout-btn');
        const profileBtn = this.container.querySelector('#view-profile');
        const permissionsBtn = this.container.querySelector('#user-permissions');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfile();
            });
        }
        
        if (permissionsBtn) {
            permissionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPermissions();
            });
        }
    }
    
    updateUserInfo() {
        if (window.authService) {
            this.isAuthenticated = window.authService.isAuthenticated();
            this.user = window.authService.getUser();
        }
        
        this.render();
    }
    
    showLoginModal() {
        const event = new CustomEvent('show-login-modal', {
            detail: { returnUrl: window.location.href }
        });
        document.dispatchEvent(event);
    }
    
    async logout() {
        try {
            await window.authService.logout();
            
            // Mostrar mensaje de éxito
            this.showNotification('Sesión cerrada correctamente', 'success');
            
            // Redirigir o recargar página
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            this.showNotification('Error cerrando sesión', 'error');
        }
    }
    
    showProfile() {
        if (!this.user) return;
        
        // Crear modal de perfil
        const profileModal = this.createProfileModal();
        const bsModal = new bootstrap.Modal(profileModal);
        bsModal.show();
    }
    
    createProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Mi Perfil</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" value="${this.user.nombre || ''}" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" value="${this.user.email || ''}" readonly>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <label class="form-label">Organización</label>
                                <input type="text" class="form-control" value="${this.getOrganizationName()}" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Roles</label>
                                <input type="text" class="form-control" value="${this.user.roles ? this.user.roles.join(', ') : ''}" readonly>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <label class="form-label">Último Acceso</label>
                                <input type="text" class="form-control" value="${this.formatDate(this.user.ultimo_acceso)}" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remover modal al cerrarse
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
        return modal;
    }
    
    showPermissions() {
        if (!this.user || !this.user.permisos) return;
        
        const permissionsModal = this.createPermissionsModal();
        const bsModal = new bootstrap.Modal(permissionsModal);
        bsModal.show();
    }
    
    createPermissionsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        
        // Generar tabla de permisos
        let permissionsTable = '<table class=\"table table-striped\"><thead><tr><th>Módulo</th><th>Permisos</th></tr></thead><tbody>';
        
        for (const [module, permissions] of Object.entries(this.user.permisos || {})) {
            permissionsTable += `<tr><td>${module}</td><td>${permissions.join(', ')}</td></tr>`;
        }
        
        permissionsTable += '</tbody></table>';
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Mis Permisos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <h6>Roles Asignados</h6>
                            <div class="d-flex gap-2 flex-wrap">
                                ${this.user.roles ? this.user.roles.map(role => `<span class="badge bg-primary">${role}</span>`).join('') : ''}
                            </div>
                        </div>
                        <div>
                            <h6>Permisos por Módulo</h6>
                            ${permissionsTable}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remover modal al cerrarse
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
        return modal;
    }
    
    getOrganizationName() {
        if (!this.user) return '';
        
        // Buscar nombre de organización si está disponible
        if (window.loginModal && window.loginModal.organizations) {
            const org = window.loginModal.organizations.find(o => o.id === this.user.organizacion_id);
            return org ? org.nombre : this.user.organizacion_id;
        }
        
        return this.user.organizacion_id || '';
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (error) {
            return dateString;
        }
    }
    
    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Crear instancia global
window.userMenu = new UserMenu();

export default window.userMenu;