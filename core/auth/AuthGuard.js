/**
 * Guard de autenticación para proteger rutas
 */
class AuthGuard {
    constructor(authService) {
        this.authService = authService;
    }
    
    /**
     * Verificar si el usuario puede acceder a una ruta
     */
    canActivate(route, requiredPermissions = [], requiredRoles = []) {
        // Verificar autenticación básica
        if (!this.authService.isAuthenticated()) {
            return {
                allowed: false,
                redirect: '/login',
                reason: 'No autenticado'
            };
        }
        
        // Verificar permisos requeridos
        if (requiredPermissions.length > 0) {
            const hasPermissions = requiredPermissions.every(permission => {
                const [module, action] = permission.split(':');
                return this.authService.hasPermission(module, action);
            });
            
            if (!hasPermissions) {
                return {
                    allowed: false,
                    redirect: '/unauthorized',
                    reason: 'Permisos insuficientes'
                };
            }
        }
        
        // Verificar roles requeridos
        if (requiredRoles.length > 0) {
            const hasRoles = requiredRoles.some(role => 
                this.authService.hasRole(role)
            );
            
            if (!hasRoles) {
                return {
                    allowed: false,
                    redirect: '/unauthorized',
                    reason: 'Rol insuficiente'
                };
            }
        }
        
        return { allowed: true };
    }
    
    /**
     * Middleware para proteger rutas
     */
    requireAuth(requiredPermissions = [], requiredRoles = []) {
        return (target, route) => {
            const result = this.canActivate(route, requiredPermissions, requiredRoles);
            
            if (!result.allowed) {
                if (result.redirect === '/login') {
                    this.redirectToLogin();
                } else {
                    this.showUnauthorized(result.reason);
                }
                return false;
            }
            
            return true;
        };
    }
    
    /**
     * Redirigir al login
     */
    redirectToLogin() {
        // Mostrar modal de login en lugar de redirigir
        const event = new CustomEvent('show-login-modal', {
            detail: { returnUrl: window.location.href }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Mostrar mensaje de no autorizado
     */
    showUnauthorized(reason) {
        const event = new CustomEvent('show-unauthorized', {
            detail: { reason }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Verificar permisos para elementos del DOM
     */
    checkElementPermissions(element, permissions = [], roles = []) {
        const hasPermissions = permissions.length === 0 || permissions.every(permission => {
            const [module, action] = permission.split(':');
            return this.authService.hasPermission(module, action);
        });
        
        const hasRoles = roles.length === 0 || roles.some(role => 
            this.authService.hasRole(role)
        );
        
        const canAccess = hasPermissions && hasRoles;
        
        if (!canAccess) {
            element.style.display = 'none';
        } else {
            element.style.display = '';
        }
        
        return canAccess;
    }
}

// Crear instancia global
window.authGuard = new AuthGuard(window.authService);

export default window.authGuard;