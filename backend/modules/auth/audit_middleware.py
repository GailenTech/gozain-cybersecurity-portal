"""
Middleware para capturar automáticamente acciones de auditoría
"""
from functools import wraps
from flask import request, g, current_app
from .audit_service import AuditService

def audit_action(modulo: str, accion: str, recurso: str = None):
    """Decorador para auditar acciones automáticamente"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Obtener información del usuario actual
            user = getattr(g, 'user', None)
            org_id = getattr(g, 'organization_id', None)
            
            if not user or not org_id:
                # Si no hay usuario autenticado, ejecutar sin auditoría
                return f(*args, **kwargs)
            
            # Información de la request
            ip = request.remote_addr
            user_agent = request.headers.get('User-Agent')
            
            # Obtener datos de la request para detalles
            request_data = {}
            if request.method == 'POST' or request.method == 'PUT':
                try:
                    request_data = request.get_json() or {}
                except:
                    request_data = {}
            
            # Parámetros de la URL
            url_params = dict(request.args)
            if kwargs:
                url_params.update(kwargs)
            
            # Ejecutar la función
            try:
                result = f(*args, **kwargs)
                
                # Registrar auditoría exitosa
                audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
                
                detalles = {
                    'metodo': request.method,
                    'url': request.url,
                    'parametros': url_params,
                    'datos_request': request_data,
                    'codigo_respuesta': getattr(result, 'status_code', 200) if hasattr(result, 'status_code') else 200
                }
                
                # Determinar el recurso si no se especificó
                recurso_final = recurso or request.path
                
                audit_service.log_action(
                    usuario_id=user.get('user_id'),
                    usuario_email=user.get('email'),
                    organizacion_id=org_id,
                    modulo=modulo,
                    accion=accion,
                    recurso=recurso_final,
                    detalles=detalles,
                    ip=ip,
                    user_agent=user_agent,
                    resultado='success'
                )
                
                return result
                
            except Exception as e:
                # Registrar auditoría de error
                audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
                
                detalles = {
                    'metodo': request.method,
                    'url': request.url,
                    'parametros': url_params,
                    'datos_request': request_data,
                    'error': str(e),
                    'tipo_error': type(e).__name__
                }
                
                recurso_final = recurso or request.path
                
                audit_service.log_action(
                    usuario_id=user.get('user_id'),
                    usuario_email=user.get('email'),
                    organizacion_id=org_id,
                    modulo=modulo,
                    accion=accion,
                    recurso=recurso_final,
                    detalles=detalles,
                    ip=ip,
                    user_agent=user_agent,
                    resultado='error'
                )
                
                # Re-lanzar la excepción
                raise
        
        return decorated_function
    return decorator

def log_manual_action(modulo: str, accion: str, recurso: str, 
                     detalles: dict = None, resultado: str = 'success'):
    """Registrar manualmente una acción de auditoría"""
    try:
        user = getattr(g, 'user', None)
        org_id = getattr(g, 'organization_id', None)
        
        if not user or not org_id:
            return
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        
        ip = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        audit_service.log_action(
            usuario_id=user.get('user_id'),
            usuario_email=user.get('email'),
            organizacion_id=org_id,
            modulo=modulo,
            accion=accion,
            recurso=recurso,
            detalles=detalles or {},
            ip=ip,
            user_agent=user_agent,
            resultado=resultado
        )
        
    except Exception as e:
        current_app.logger.error(f"Error registrando auditoría manual: {e}")

class AuditMiddleware:
    """Middleware para auditoría automática"""
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Inicializar middleware con la app"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Ejecutar antes de cada request"""
        g.audit_start_time = None
        
        # Solo auditar si hay usuario autenticado
        if hasattr(g, 'user') and g.user:
            import time
            g.audit_start_time = time.time()
    
    def after_request(self, response):
        """Ejecutar después de cada request"""
        # Solo auditar requests autenticadas y exitosas
        if (hasattr(g, 'user') and g.user and 
            hasattr(g, 'audit_start_time') and g.audit_start_time and
            response.status_code < 400):
            
            # Calcular tiempo de respuesta
            import time
            response_time = time.time() - g.audit_start_time
            
            # Auditar solo requests que modifican datos
            if request.method in ['POST', 'PUT', 'DELETE']:
                try:
                    audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
                    
                    # Determinar módulo basado en la URL
                    modulo = self._extract_module_from_path(request.path)
                    
                    # Determinar acción basada en el método HTTP
                    accion = self._map_method_to_action(request.method)
                    
                    detalles = {
                        'metodo': request.method,
                        'url': request.url,
                        'codigo_respuesta': response.status_code,
                        'tiempo_respuesta': response_time,
                        'content_type': response.content_type
                    }
                    
                    audit_service.log_action(
                        usuario_id=g.user.get('user_id'),
                        usuario_email=g.user.get('email'),
                        organizacion_id=g.organization_id,
                        modulo=modulo,
                        accion=accion,
                        recurso=request.path,
                        detalles=detalles,
                        ip=request.remote_addr,
                        user_agent=request.headers.get('User-Agent'),
                        resultado='success'
                    )
                    
                except Exception as e:
                    current_app.logger.error(f"Error en auditoría automática: {e}")
        
        return response
    
    def _extract_module_from_path(self, path):
        """Extraer módulo de la ruta"""
        if '/inventario' in path:
            return 'inventario'
        elif '/impactos' in path:
            return 'impactos'
        elif '/madurez' in path:
            return 'madurez'
        elif '/auth' in path:
            return 'auth'
        elif '/admin' in path:
            return 'admin'
        else:
            return 'sistema'
    
    def _map_method_to_action(self, method):
        """Mapear método HTTP a acción"""
        mapping = {
            'GET': 'read',
            'POST': 'create',
            'PUT': 'update',
            'DELETE': 'delete',
            'PATCH': 'update'
        }
        return mapping.get(method, 'unknown')