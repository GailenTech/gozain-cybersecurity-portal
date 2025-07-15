/**
 * Gestor de tokens JWT
 */
class TokenManager {
    constructor() {
        this.token = null;
        this.refreshToken = null;
        this.expirationTime = null;
        this.refreshTimer = null;
        
        // Callbacks
        this.onTokenRefreshed = null;
        this.onTokenExpired = null;
    }
    
    /**
     * Establecer tokens
     */
    setTokens(accessToken, refreshToken = null, expiresIn = 3600) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        this.expirationTime = Date.now() + (expiresIn * 1000);
        
        // Guardar en localStorage
        localStorage.setItem('auth_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        localStorage.setItem('token_expires', this.expirationTime.toString());
        
        // Programar refresco automático
        this.scheduleRefresh();
    }
    
    /**
     * Obtener token de acceso
     */
    getAccessToken() {
        return this.token;
    }
    
    /**
     * Obtener refresh token
     */
    getRefreshToken() {
        return this.refreshToken;
    }
    
    /**
     * Verificar si el token está expirado
     */
    isTokenExpired() {
        if (!this.expirationTime) {
            return true;
        }
        
        // Considerar expirado si faltan menos de 5 minutos
        const bufferTime = 5 * 60 * 1000; // 5 minutos
        return Date.now() >= (this.expirationTime - bufferTime);
    }
    
    /**
     * Programar refresco automático del token
     */
    scheduleRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        if (!this.expirationTime || !this.refreshToken) {
            return;
        }
        
        // Refrescar 5 minutos antes de expirar
        const refreshTime = this.expirationTime - Date.now() - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshAccessToken();
            }, refreshTime);
        }
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
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Actualizar tokens
            this.setTokens(
                data.access_token, 
                this.refreshToken, 
                data.expires_in || 3600
            );
            
            // Notificar que se refrescó el token
            if (this.onTokenRefreshed) {
                this.onTokenRefreshed(data.access_token);
            }
            
            return data.access_token;
            
        } catch (error) {
            console.error('Error refrescando token:', error);
            this.clearTokens();
            
            if (this.onTokenExpired) {
                this.onTokenExpired();
            }
            
            throw error;
        }
    }
    
    /**
     * Limpiar tokens
     */
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        this.expirationTime = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires');
        
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    /**
     * Cargar tokens desde localStorage
     */
    loadTokens() {
        this.token = localStorage.getItem('auth_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        
        const expires = localStorage.getItem('token_expires');
        if (expires) {
            this.expirationTime = parseInt(expires, 10);
        }
        
        // Verificar si el token está expirado
        if (this.token && this.isTokenExpired()) {
            if (this.refreshToken) {
                // Intentar refrescar el token
                this.refreshAccessToken().catch(() => {
                    this.clearTokens();
                });
            } else {
                this.clearTokens();
            }
        } else if (this.token) {
            // Programar refresco si el token es válido
            this.scheduleRefresh();
        }
    }
    
    /**
     * Decodificar payload del JWT (sin verificar firma)
     */
    decodeToken(token = null) {
        const tokenToUse = token || this.token;
        
        if (!tokenToUse) {
            return null;
        }
        
        try {
            const parts = tokenToUse.split('.');
            if (parts.length !== 3) {
                return null;
            }
            
            const payload = parts[1];
            const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            
            return JSON.parse(decodedPayload);
            
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    }
    
    /**
     * Obtener información del usuario desde el token
     */
    getUserFromToken() {
        const payload = this.decodeToken();
        
        if (!payload) {
            return null;
        }
        
        return {
            id: payload.user_id,
            email: payload.email,
            nombre: payload.nombre,
            org_id: payload.org_id,
            permissions: payload.permissions,
            roles: payload.roles,
            exp: payload.exp,
            iat: payload.iat
        };
    }
    
    /**
     * Verificar si el usuario tiene un permiso específico
     */
    hasPermission(module, action) {
        const user = this.getUserFromToken();
        
        if (!user || !user.permissions) {
            return false;
        }
        
        const modulePerms = user.permissions[module] || [];
        return modulePerms.includes(action) || user.roles.includes('admin');
    }
    
    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(role) {
        const user = this.getUserFromToken();
        
        if (!user || !user.roles) {
            return false;
        }
        
        return user.roles.includes(role);
    }
}

export default TokenManager;