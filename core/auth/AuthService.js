/**
 * Servicio de autenticación OAuth
 */
class AuthService {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.user = null;
        this.authenticated = false;
        this.organizationId = null;
        
        // Callbacks para eventos
        this.onAuthChange = null;
        this.onTokenExpired = null;
        
        // Inicializar estado
        this.init();
    }
    
    async init() {
        if (this.token) {
            try {
                await this.validateToken();
                this.scheduleTokenRefresh();
            } catch (error) {
                console.warn('Token inválido al inicializar:', error);
                this.clearAuth();
            }
        }
    }
    
    /**
     * Obtener proveedores disponibles para una organización
     */
    async getProviders(organizationId) {
        const response = await fetch(`/api/auth/providers?org_id=${organizationId}`);
        if (!response.ok) {
            throw new Error('Error obteniendo proveedores');
        }
        return response.json();
    }
    
    /**
     * Iniciar flujo de autenticación
     */
    async login(organizationId) {
        try {
            const response = await fetch(`/api/auth/login?org_id=${organizationId}`);
            if (!response.ok) {
                throw new Error('Error iniciando autenticación');
            }
            
            const { redirect_url } = await response.json();
            
            // Guardar estado para callback
            sessionStorage.setItem('auth_state', JSON.stringify({
                organizationId,
                returnUrl: window.location.href,
                timestamp: Date.now()
            }));
            
            // Redirigir al proveedor OAuth
            window.location.href = redirect_url;
            
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }
    
    /**
     * Manejar callback de OAuth
     */
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
            throw new Error(`Error OAuth: ${error}`);
        }
        
        if (!code) {
            throw new Error('Código de autorización no recibido');
        }
        
        try {
            const response = await fetch('/api/auth/callback', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Error en callback OAuth');
            }
            
            const authData = await response.json();
            
            // Establecer tokens y usuario
            this.setTokens(authData.access_token, authData.refresh_token);
            this.setUser(authData.user);
            
            // Restaurar estado
            const authState = JSON.parse(sessionStorage.getItem('auth_state') || '{}');
            sessionStorage.removeItem('auth_state');
            
            // Limpiar URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirigir a la URL original
            if (authState.returnUrl) {
                window.location.href = authState.returnUrl;
            } else {
                window.location.href = '/';
            }
            
        } catch (error) {
            console.error('Error en callback:', error);
            throw error;
        }
    }
    
    /**
     * Establecer tokens
     */
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        
        localStorage.setItem('auth_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        
        this.authenticated = true;
        this.scheduleTokenRefresh();
        
        if (this.onAuthChange) {
            this.onAuthChange(true, this.user);
        }
    }
    
    /**
     * Establecer información del usuario
     */
    setUser(user) {
        this.user = user;
        this.organizationId = user.organizacion_id;
        localStorage.setItem('user_info', JSON.stringify(user));
    }
    
    /**
     * Refrescar token de acceso
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No hay refresh token disponible');
        }
        
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.refreshToken
                })
            });
            
            if (!response.ok) {
                throw new Error('Error refrescando token');
            }
            
            const { access_token } = await response.json();
            this.token = access_token;
            localStorage.setItem('auth_token', access_token);
            
            this.scheduleTokenRefresh();
            return access_token;
            
        } catch (error) {
            console.error('Error refrescando token:', error);
            this.clearAuth();
            throw error;
        }
    }
    
    /**
     * Programar refresco automático del token
     */
    scheduleTokenRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        // Refrescar 5 minutos antes de expirar (55 minutos)
        const refreshTime = 55 * 60 * 1000; // 55 minutos en ms
        
        this.refreshTimer = setTimeout(async () => {
            try {
                await this.refreshAccessToken();
            } catch (error) {
                console.error('Error en refresco automático:', error);
                if (this.onTokenExpired) {
                    this.onTokenExpired();
                }
            }
        }, refreshTime);
    }
    
    /**
     * Validar token actual
     */
    async validateToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.token
                })
            });
            
            if (!response.ok) {
                return false;
            }
            
            const { valid, user } = await response.json();
            
            if (valid && user) {
                this.setUser(user);
                this.authenticated = true;
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Error validando token:', error);
            return false;
        }
    }
    
    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearAuth();
        }
    }
    
    /**
     * Limpiar autenticación
     */
    clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        this.authenticated = false;
        this.organizationId = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        if (this.onAuthChange) {
            this.onAuthChange(false, null);
        }
    }
    
    /**
     * Obtener token para requests
     */
    getAuthHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`
            };
        }
        
        // Compatibilidad temporal con header de organización
        if (this.organizationId) {
            return {
                'X-Organization-Id': this.organizationId
            };
        }
        
        return {};
    }
    
    /**
     * Verificar si el usuario tiene un permiso específico
     */
    hasPermission(module, action) {
        if (!this.user || !this.user.permisos) {
            return false;
        }
        
        const modulePerms = this.user.permisos[module] || [];
        return modulePerms.includes(action) || this.user.roles.includes('admin');
    }
    
    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(role) {
        if (!this.user || !this.user.roles) {
            return false;
        }
        
        return this.user.roles.includes(role);
    }
    
    /**
     * Obtener información del usuario actual
     */
    getUser() {
        return this.user;
    }
    
    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return this.authenticated && this.token;
    }
    
    /**
     * Obtener ID de organización
     */
    getOrganizationId() {
        return this.organizationId;
    }
}

// Crear instancia global
window.authService = new AuthService();