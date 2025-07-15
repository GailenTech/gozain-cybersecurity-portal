"""
Rutas de administración de usuarios y permisos
"""
from flask import Blueprint, request, jsonify, current_app
from .user_service import UserService
from .session_service import SessionService
from .auth_middleware import require_auth, require_role

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@require_auth()
@require_role('admin')
def get_users():
    """Obtener lista de usuarios de la organización"""
    try:
        from flask import g
        org_id = g.organization_id
        
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        
        # Filtros opcionales
        query = request.args.get('q')
        active_only = request.args.get('active', 'true').lower() == 'true'
        
        users = user_service.search_users(org_id, query)
        
        if active_only:
            users = [user for user in users if user.activo]
        
        # Convertir a diccionarios
        users_data = [user.to_dict() for user in users]
        
        return jsonify({
            'users': users_data,
            'total': len(users_data)
        })
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo usuarios: {e}")
        return jsonify({'error': 'Error obteniendo usuarios'}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_auth()
@require_role('admin')
def get_user(user_id):
    """Obtener detalles de un usuario específico"""
    try:
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        user = user_service.get_user(user_id)
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Obtener sesiones activas
        session_service = SessionService(current_app.config.get('DATA_DIR', 'data'))
        sessions = session_service.get_user_sessions(user_id)
        
        user_data = user.to_dict()
        user_data['sesiones_activas'] = len(sessions)
        user_data['ultima_session'] = sessions[0].creada.isoformat() if sessions else None
        
        return jsonify(user_data)
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo usuario: {e}")
        return jsonify({'error': 'Error obteniendo usuario'}), 500

@admin_bp.route('/users/<user_id>/permissions', methods=['PUT'])
@require_auth()
@require_role('admin')
def update_user_permissions(user_id):
    """Actualizar permisos de un usuario"""
    try:
        data = request.get_json()
        permissions = data.get('permissions', {})
        
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        
        if not user_service.get_user(user_id):
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        success = user_service.update_user_permissions(user_id, permissions)
        
        if success:
            return jsonify({'message': 'Permisos actualizados correctamente'})
        else:
            return jsonify({'error': 'Error actualizando permisos'}), 500
    
    except Exception as e:
        current_app.logger.error(f"Error actualizando permisos: {e}")
        return jsonify({'error': 'Error actualizando permisos'}), 500

@admin_bp.route('/users/<user_id>/roles', methods=['PUT'])
@require_auth()
@require_role('admin')
def update_user_roles(user_id):
    """Actualizar roles de un usuario"""
    try:
        data = request.get_json()
        action = data.get('action')  # 'add' o 'remove'
        role = data.get('role')
        
        if not action or not role:
            return jsonify({'error': 'Acción y rol requeridos'}), 400
        
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        
        if not user_service.get_user(user_id):
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        if action == 'add':
            success = user_service.add_user_role(user_id, role)
        elif action == 'remove':
            success = user_service.remove_user_role(user_id, role)
        else:
            return jsonify({'error': 'Acción inválida'}), 400
        
        if success:
            return jsonify({'message': f'Rol {action}ed correctamente'})
        else:
            return jsonify({'error': f'Error {action}ing rol'}), 500
    
    except Exception as e:
        current_app.logger.error(f"Error actualizando roles: {e}")
        return jsonify({'error': 'Error actualizando roles'}), 500

@admin_bp.route('/users/<user_id>/activate', methods=['POST'])
@require_auth()
@require_role('admin')
def activate_user(user_id):
    """Activar usuario"""
    try:
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        
        if not user_service.get_user(user_id):
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        success = user_service.activate_user(user_id)
        
        if success:
            return jsonify({'message': 'Usuario activado correctamente'})
        else:
            return jsonify({'error': 'Error activando usuario'}), 500
    
    except Exception as e:
        current_app.logger.error(f"Error activando usuario: {e}")
        return jsonify({'error': 'Error activando usuario'}), 500

@admin_bp.route('/users/<user_id>/deactivate', methods=['POST'])
@require_auth()
@require_role('admin')
def deactivate_user(user_id):
    """Desactivar usuario"""
    try:
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        
        if not user_service.get_user(user_id):
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        success = user_service.deactivate_user(user_id)
        
        if success:
            # Invalidar todas las sesiones del usuario
            session_service = SessionService(current_app.config.get('DATA_DIR', 'data'))
            sessions = session_service.get_user_sessions(user_id)
            for session in sessions:
                session_service.invalidate_session(session.id)
            
            return jsonify({'message': 'Usuario desactivado correctamente'})
        else:
            return jsonify({'error': 'Error desactivando usuario'}), 500
    
    except Exception as e:
        current_app.logger.error(f"Error desactivando usuario: {e}")
        return jsonify({'error': 'Error desactivando usuario'}), 500

@admin_bp.route('/sessions', methods=['GET'])
@require_auth()
@require_role('admin')
def get_active_sessions():
    """Obtener sesiones activas de la organización"""
    try:
        from flask import g
        org_id = g.organization_id
        
        session_service = SessionService(current_app.config.get('DATA_DIR', 'data'))
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        
        # Obtener todas las sesiones activas
        all_sessions = []
        for session in session_service.sessions.values():
            if (session.organizacion_id == org_id and 
                session.activa and 
                not session.is_expired()):
                
                # Obtener información del usuario
                user = user_service.get_user(session.usuario_id)
                session_data = session.to_dict()
                session_data['usuario'] = {
                    'nombre': user.nombre if user else 'Desconocido',
                    'email': user.email if user else 'Desconocido'
                }
                all_sessions.append(session_data)
        
        return jsonify({
            'sessions': all_sessions,
            'total': len(all_sessions)
        })
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo sesiones: {e}")
        return jsonify({'error': 'Error obteniendo sesiones'}), 500

@admin_bp.route('/sessions/<session_id>/revoke', methods=['POST'])
@require_auth()
@require_role('admin')
def revoke_session(session_id):
    """Revocar una sesión específica"""
    try:
        session_service = SessionService(current_app.config.get('DATA_DIR', 'data'))
        
        success = session_service.invalidate_session(session_id)
        
        if success:
            return jsonify({'message': 'Sesión revocada correctamente'})
        else:
            return jsonify({'error': 'Sesión no encontrada'}), 404
    
    except Exception as e:
        current_app.logger.error(f"Error revocando sesión: {e}")
        return jsonify({'error': 'Error revocando sesión'}), 500

@admin_bp.route('/permissions/templates', methods=['GET'])
@require_auth()
@require_role('admin')
def get_permission_templates():
    """Obtener plantillas de permisos predefinidas"""
    try:
        templates = {
            'usuario_basico': {
                'nombre': 'Usuario Básico',
                'descripcion': 'Permisos de lectura en todos los módulos',
                'permisos': {
                    'inventario': ['read'],
                    'impactos': ['read'],
                    'madurez': ['read']
                },
                'roles': ['usuario']
            },
            'analista': {
                'nombre': 'Analista',
                'descripcion': 'Permisos de lectura y escritura en módulos principales',
                'permisos': {
                    'inventario': ['read', 'write'],
                    'impactos': ['read', 'write'],
                    'madurez': ['read', 'write']
                },
                'roles': ['usuario', 'analista']
            },
            'auditor': {
                'nombre': 'Auditor',
                'descripcion': 'Permisos de lectura, escritura y auditoría',
                'permisos': {
                    'inventario': ['read', 'write', 'audit'],
                    'impactos': ['read', 'write', 'audit'],
                    'madurez': ['read', 'write', 'audit']
                },
                'roles': ['usuario', 'auditor']
            },
            'administrador': {
                'nombre': 'Administrador',
                'descripcion': 'Todos los permisos incluido administración',
                'permisos': {
                    'inventario': ['read', 'write', 'delete', 'admin'],
                    'impactos': ['read', 'write', 'delete', 'admin'],
                    'madurez': ['read', 'write', 'delete', 'admin']
                },
                'roles': ['usuario', 'admin']
            }
        }
        
        return jsonify(templates)
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo plantillas: {e}")
        return jsonify({'error': 'Error obteniendo plantillas'}), 500

@admin_bp.route('/users/<user_id>/apply-template', methods=['POST'])
@require_auth()
@require_role('admin')
def apply_permission_template(user_id):
    """Aplicar plantilla de permisos a un usuario"""
    try:
        data = request.get_json()
        template_id = data.get('template_id')
        
        if not template_id:
            return jsonify({'error': 'template_id requerido'}), 400
        
        # Obtener plantillas
        response = get_permission_templates()
        templates = response.get_json()
        
        if template_id not in templates:
            return jsonify({'error': 'Plantilla no encontrada'}), 404
        
        template = templates[template_id]
        
        user_service = UserService(current_app.config.get('DATA_DIR', 'data'))
        user = user_service.get_user(user_id)
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Aplicar permisos
        user_service.update_user_permissions(user_id, template['permisos'])
        
        # Aplicar roles
        for role in template['roles']:
            user_service.add_user_role(user_id, role)
        
        return jsonify({'message': f'Plantilla {template["nombre"]} aplicada correctamente'})
    
    except Exception as e:
        current_app.logger.error(f"Error aplicando plantilla: {e}")
        return jsonify({'error': 'Error aplicando plantilla'}), 500