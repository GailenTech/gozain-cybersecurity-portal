/**
 * Interceptor para añadir autenticación a las requests
 */
class AuthInterceptor {
    constructor(authService) {
        this.authService = authService;
        this.pendingRequests = new Map();
        this.isRefreshing = false;
        this.refreshSubscribers = [];
    }
    
    /**
     * Interceptar request para añadir headers de autenticación
     */
    interceptRequest(config) {
        const authHeaders = this.authService.getAuthHeaders();
        
        // Añadir headers de autenticación
        if (authHeaders) {
            config.headers = { ...config.headers, ...authHeaders };
        }
        
        return config;
    }
    
    /**
     * Interceptar response para manejar errores de autenticación
     */
    async interceptResponse(response, originalRequest) {
        // Si la respuesta es exitosa, devolverla tal como está
        if (response.ok) {
            return response;
        }
        
        // Manejar errores de autenticación
        if (response.status === 401) {
            return this.handleAuthError(response, originalRequest);
        }
        
        // Manejar otros errores
        return response;
    }
    
    /**
     * Manejar errores de autenticación
     */
    async handleAuthError(response, originalRequest) {
        // Evitar loops infinitos
        if (originalRequest.url.includes('/api/auth/refresh')) {
            this.authService.clearAuth();
            this.redirectToLogin();
            return response;
        }
        
        // Si ya estamos refrescando, esperar
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.refreshSubscribers.push((token) => {
                    if (token) {
                        // Reintentar request original con nuevo token
                        this.retryRequest(originalRequest, token).then(resolve);
                    } else {
                        resolve(response);
                    }
                });
            });
        }
        
        // Intentar refrescar token
        return this.refreshToken(originalRequest);
    }
    
    /**
     * Refrescar token de acceso
     */
    async refreshToken(originalRequest) {
        if (!this.authService.refreshToken) {
            this.authService.clearAuth();
            this.redirectToLogin();
            return;
        }
        
        this.isRefreshing = true;
        
        try {
            const newToken = await this.authService.refreshAccessToken();
            
            // Notificar a todos los subscribers
            this.refreshSubscribers.forEach(callback => callback(newToken));
            this.refreshSubscribers = [];
            
            // Reintentar request original
            return this.retryRequest(originalRequest, newToken);
            
        } catch (error) {
            console.error('Error refrescando token:', error);
            
            // Notificar a todos los subscribers que falló
            this.refreshSubscribers.forEach(callback => callback(null));
            this.refreshSubscribers = [];
            
            this.authService.clearAuth();
            this.redirectToLogin();
            
            return Promise.reject(error);
        } finally {
            this.isRefreshing = false;
        }
    }
    
    /**
     * Reintentar request con nuevo token
     */
    async retryRequest(originalRequest, newToken) {
        // Actualizar headers con nuevo token
        const newHeaders = {
            ...originalRequest.headers,
            'Authorization': `Bearer ${newToken}`
        };
        
        // Crear nueva configuración de request
        const newConfig = {
            ...originalRequest,
            headers: newHeaders
        };
        
        // Realizar nueva request
        return fetch(originalRequest.url, newConfig);
    }
    
    /**
     * Redirigir al login
     */
    redirectToLogin() {
        // Mostrar modal de login
        const event = new CustomEvent('show-login-modal', {
            detail: { 
                returnUrl: window.location.href,
                reason: 'Sesión expirada'
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Crear fetch wrapper con interceptor
     */
    createFetch() {
        return async (url, options = {}) => {
            try {
                // Interceptar request
                const config = this.interceptRequest({
                    url,
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: options.body,
                    ...options
                });
                
                // Realizar request
                const response = await fetch(url, config);
                
                // Interceptar response
                return this.interceptResponse(response, { url, ...config });
                
            } catch (error) {
                console.error('Error en fetch interceptado:', error);
                throw error;
            }
        };
    }
    
    /**
     * Wrapper para XMLHttpRequest
     */
    interceptXHR() {
        const self = this;
        const originalXHR = window.XMLHttpRequest;
        
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalSend = xhr.send;
            const originalOpen = xhr.open;
            
            // Interceptar open para capturar URL
            xhr.open = function(method, url, async, user, password) {
                xhr._url = url;
                xhr._method = method;
                return originalOpen.apply(this, arguments);
            };
            
            // Interceptar send para añadir headers
            xhr.send = function(data) {
                // Añadir headers de autenticación
                const authHeaders = self.authService.getAuthHeaders();
                Object.keys(authHeaders).forEach(key => {
                    xhr.setRequestHeader(key, authHeaders[key]);
                });
                
                return originalSend.apply(this, arguments);
            };
            
            return xhr;
        };
    }
}

export default AuthInterceptor;