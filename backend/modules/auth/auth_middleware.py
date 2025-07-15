"""
Middleware de autenticación
"""
import os
from functools import wraps
from flask import request, jsonify, g, current_app
from .session_service import SessionService
from .user_service import UserService

def require_auth(permissions=None):
    """Decorador para requerir autenticación"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar si OAuth está habilitado
            oauth_enabled = current_app.config.get('OAUTH_ENABLED', False)
            
            if not oauth_enabled:
                # Compatibilidad temporal con header X-Organization-Id
                org_id = request.headers.get('X-Organization-Id')
                if org_id:
                    g.organization_id = org_id
                    g.user = None
                    g.authenticated = False
                    return f(*args, **kwargs)
                else:
                    return jsonify({'error': 'Header X-Organization-Id requerido'}), 401
            
            # Verificar JWT
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Token de autorización requerido'}), 401
            
            token = auth_header.split(' ')[1]
            
            try:
                session_service = SessionService(current_app.config.get('DATA_DIR', 'data'))
                payload = session_service.validate_jwt_token(token)
                
                if not payload:
                    return jsonify({'error': 'Token inválido o expirado'}), 401
                
                g.user = payload
                g.organization_id = payload['org_id']
                g.authenticated = True
                
                # Verificar permisos si se especifican
                if permissions:
                    user_perms = payload.get('permissions', {})
                    if not check_permissions(user_perms, permissions):
                        return jsonify({'error': 'Permisos insuficientes'}), 403
                
                # Actualizar último acceso
                user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
                user_service.update_last_access(payload['user_id'])
                
            except Exception as e:
                current_app.logger.error(f"Error en autenticación: {e}")
                return jsonify({'error': 'Error de autenticación'}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def check_permissions(user_permissions: dict, required_permissions: list) -> bool:
    """Verificar si el usuario tiene los permisos requeridos"""
    if not required_permissions:
        return True
    
    # Formato: ["module:action", "module:action"]
    for permission in required_permissions:
        if ':' not in permission:
            continue
        
        module, action = permission.split(':', 1)
        module_perms = user_permissions.get(module, [])
        
        if action not in module_perms:
            return False
    
    return True

def get_current_user():
    """Obtener usuario actual desde el contexto"""
    return getattr(g, 'user', None)

def get_current_organization():
    """Obtener organización actual desde el contexto"""
    return getattr(g, 'organization_id', None)

def is_authenticated():
    """Verificar si la request está autenticada"""
    return getattr(g, 'authenticated', False)

def require_permission(permission: str):
    """Decorador para requerir un permiso específico"""
    return require_auth([permission])

def require_role(role: str):
    """Decorador para requerir un rol específico"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user or role not in user.get('roles', []):
                return jsonify({'error': 'Rol insuficiente'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator