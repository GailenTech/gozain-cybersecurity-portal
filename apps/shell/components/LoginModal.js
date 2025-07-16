/**
 * Modal de login para autenticación OAuth
 */
class LoginModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.returnUrl = null;
        this.organizations = [];
        
        this.init();
    }
    
    init() {
        this.createModal();
        this.setupEventListeners();
        this.loadOrganizations();
    }
    
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal fade';
        this.modal.id = 'loginModal';
        this.modal.setAttribute('tabindex', '-1');
        this.modal.setAttribute('aria-hidden', 'true');
        
        this.modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-sign-in-alt me-2"></i>
                            Iniciar Sesión
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <div class="mb-3">
                                <h2 class="text-primary fw-bold">
                                    <i class="bi bi-shield-check"></i> Gozain
                                </h2>
                                <p class="text-muted small">Portal de Ciberseguridad</p>
                            </div>
                            <h6 class="text-muted">Selecciona tu organización para continuar</h6>
                        </div>
                        
                        <div id="organization-selector" class="mb-4">
                            <label class="form-label">Organización</label>
                            <select class="form-select" id="organization-select">
                                <option value="">Seleccionar organización...</option>
                            </select>
                        </div>
                        
                        <div id="login-options" class="d-none">
                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-primary btn-lg" id="login-google">
                                    <i class="fab fa-google me-2"></i>
                                    Continuar con Google
                                </button>
                                <button type="button" class="btn btn-outline-primary btn-lg" id="login-microsoft" style="display: none;">
                                    <i class="fab fa-microsoft me-2"></i>
                                    Continuar con Microsoft
                                </button>
                            </div>
                        </div>
                        
                        <div id="login-loading" class="text-center d-none">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mt-2 text-muted">Redirigiendo a tu proveedor de autenticación...</p>
                        </div>
                        
                        <div id="login-error" class="alert alert-danger d-none" role="alert">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            <span id="error-message"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="text-center w-100">
                            <small class="text-muted">
                                <i class="fas fa-shield-alt me-1"></i>
                                Autenticación segura con OAuth 2.0
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
    }
    
    setupEventListeners() {
        // Listener para mostrar modal
        document.addEventListener('show-login-modal', (event) => {
            this.returnUrl = event.detail?.returnUrl || window.location.href;
            this.show();
        });
        
        // Selector de organización
        const orgSelect = this.modal.querySelector('#organization-select');
        orgSelect.addEventListener('change', (e) => {
            this.onOrganizationChange(e.target.value);
        });
        
        // Botones de login
        const googleBtn = this.modal.querySelector('#login-google');
        const microsoftBtn = this.modal.querySelector('#login-microsoft');
        
        googleBtn.addEventListener('click', () => this.loginWithProvider('google'));
        microsoftBtn.addEventListener('click', () => this.loginWithProvider('microsoft'));
        
        // Listener para callback de OAuth
        if (window.location.search.includes('code=')) {
            this.handleOAuthCallback();
        }
    }
    
    async loadOrganizations() {
        try {
            // Cargar organizaciones disponibles
            const response = await fetch('/api/organizations');
            if (response.ok) {
                const data = await response.json();
                this.organizations = data;
                this.populateOrganizationSelector();
            }
        } catch (error) {
            console.error('Error cargando organizaciones:', error);
        }
    }
    
    populateOrganizationSelector() {
        const select = this.modal.querySelector('#organization-select');
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar organización...</option>';
        
        // Añadir organizaciones
        this.organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org.id;
            option.textContent = org.nombre;
            select.appendChild(option);
        });
    }
    
    async onOrganizationChange(orgId) {
        const loginOptions = this.modal.querySelector('#login-options');
        const googleBtn = this.modal.querySelector('#login-google');
        const microsoftBtn = this.modal.querySelector('#login-microsoft');
        
        if (!orgId) {
            loginOptions.classList.add('d-none');
            return;
        }
        
        try {
            // Obtener proveedores disponibles para la organización
            const response = await fetch(`/api/auth/providers?org_id=${orgId}`);
            
            if (response.ok) {
                const data = await response.json();
                const provider = data.provider;
                
                // Mostrar botón apropiado
                googleBtn.style.display = provider === 'google' ? 'block' : 'none';
                microsoftBtn.style.display = provider === 'microsoft' ? 'block' : 'none';
                
                loginOptions.classList.remove('d-none');
                this.hideError();
            } else {
                this.showError('Error obteniendo proveedores de autenticación');
            }
        } catch (error) {
            console.error('Error obteniendo proveedores:', error);
            this.showError('Error de conexión');
        }
    }
    
    async loginWithProvider(provider) {
        const orgId = this.modal.querySelector('#organization-select').value;
        
        if (!orgId) {
            this.showError('Selecciona una organización');
            return;
        }
        
        try {
            this.showLoading();
            
            // Iniciar flujo de autenticación
            await window.authService.login(orgId);
            
        } catch (error) {
            console.error('Error iniciando autenticación:', error);
            this.hideLoading();
            this.showError('Error iniciando autenticación: ' + error.message);
        }
    }
    
    async handleOAuthCallback() {
        try {
            this.showLoading();
            await window.authService.handleCallback();
            this.hide();
        } catch (error) {
            console.error('Error en callback OAuth:', error);
            this.hideLoading();
            this.showError('Error en autenticación: ' + error.message);
        }
    }
    
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.resetModal();
        
        // Usar Bootstrap modal
        const bsModal = new bootstrap.Modal(this.modal);
        bsModal.show();
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        const bsModal = bootstrap.Modal.getInstance(this.modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    resetModal() {
        this.modal.querySelector('#organization-select').value = '';
        this.modal.querySelector('#login-options').classList.add('d-none');
        this.hideLoading();
        this.hideError();
    }
    
    showLoading() {
        this.modal.querySelector('#login-loading').classList.remove('d-none');
        this.modal.querySelector('#login-options').classList.add('d-none');
        this.modal.querySelector('#organization-selector').classList.add('d-none');
    }
    
    hideLoading() {
        this.modal.querySelector('#login-loading').classList.add('d-none');
        this.modal.querySelector('#login-options').classList.remove('d-none');
        this.modal.querySelector('#organization-selector').classList.remove('d-none');
    }
    
    showError(message) {
        const errorDiv = this.modal.querySelector('#login-error');
        const errorMessage = this.modal.querySelector('#error-message');
        
        errorMessage.textContent = message;
        errorDiv.classList.remove('d-none');
    }
    
    hideError() {
        this.modal.querySelector('#login-error').classList.add('d-none');
    }
}

// Crear instancia global
window.loginModal = new LoginModal();

export default window.loginModal;