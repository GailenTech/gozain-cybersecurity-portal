"""
Rutas de autenticación OAuth
"""
from flask import Blueprint, request, jsonify, redirect, session, current_app, Response
import json
from .oauth_service import OAuthService
from .auth_middleware import require_auth, get_current_user

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/providers', methods=['GET'])
def get_providers():
    """Obtener proveedores OAuth disponibles para una organización"""
    org_id = request.args.get('org_id')
    if not org_id:
        return jsonify({'error': 'org_id requerido'}), 400
    
    try:
        # Obtener URL base desde el request
        base_url = request.url_root.rstrip('/')
        
        oauth_service = OAuthService(current_app.config.get('DATA_DIR', 'data'))
        provider = oauth_service.get_provider(org_id, base_url)
        
        if not provider:
            return jsonify({'error': 'Organización no encontrada o sin configuración OAuth'}), 404
        
        # Obtener configuración de la organización
        org = oauth_service.organizations.get(org_id)
        oauth_config = org.get('oauth_config', {})
        
        return jsonify({
            'provider': oauth_config.get('provider'),
            'available': True
        })
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo proveedores: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@auth_bp.route('/login', methods=['GET'])
def login():
    """Iniciar flujo de autenticación OAuth"""
    org_id = request.args.get('org_id')
    if not org_id:
        return jsonify({'error': 'org_id requerido'}), 400
    
    try:
        # Obtener URL base desde el request
        base_url = request.url_root.rstrip('/')
        
        oauth_service = OAuthService(current_app.config.get('DATA_DIR', 'data'))
        auth_data = oauth_service.get_authorization_url(org_id, base_url)
        
        # Guardar state en sesión para validación
        session['oauth_state'] = auth_data['state']
        session['oauth_org_id'] = org_id
        
        return jsonify(auth_data)
    
    except Exception as e:
        current_app.logger.error(f"Error en login: {e}")
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/callback', methods=['GET'])
def callback():
    """Callback de OAuth"""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    
    if error:
        return jsonify({'error': f'OAuth error: {error}'}), 400
    
    if not code or not state:
        return jsonify({'error': 'Código o state faltante'}), 400
    
    # Verificar state
    if state != session.get('oauth_state'):
        return jsonify({'error': 'State inválido'}), 400
    
    org_id = session.get('oauth_org_id')
    if not org_id:
        return jsonify({'error': 'Organización no encontrada en sesión'}), 400
    
    try:
        # Obtener URL base desde el request
        base_url = request.url_root.rstrip('/')
        
        oauth_service = OAuthService(current_app.config.get('DATA_DIR', 'data'))
        
        # Obtener IP y User-Agent
        ip = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        auth_result = oauth_service.handle_callback(
            code=code,
            state=state,
            org_id=org_id,
            ip=ip,
            user_agent=user_agent,
            base_url=base_url
        )
        
        # Limpiar sesión
        session.pop('oauth_state', None)
        session.pop('oauth_org_id', None)
        
        # Devolver una página HTML que maneja el token y redirige
        html_response = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Autenticando...</title>
            <script>
                // Guardar tokens en localStorage
                const authResult = {json.dumps(auth_result)};
                
                localStorage.setItem('auth_token', authResult.access_token);
                if (authResult.refresh_token) {{
                    localStorage.setItem('refresh_token', authResult.refresh_token);
                }}
                localStorage.setItem('user_info', JSON.stringify(authResult.user));
                
                // Redirigir a la página principal
                window.location.href = '/';
            </script>
        </head>
        <body>
            <p>Autenticando...</p>
        </body>
        </html>
        """
        
        return Response(html_response, mimetype='text/html')
    
    except Exception as e:
        current_app.logger.error(f"Error en callback: {e}")
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refrescar token de acceso"""
    data = request.get_json()
    refresh_token = data.get('refresh_token')
    
    if not refresh_token:
        return jsonify({'error': 'refresh_token requerido'}), 400
    
    try:
        oauth_service = OAuthService(current_app.config.get('DATA_DIR', 'data'))
        result = oauth_service.refresh_token(refresh_token)
        return jsonify(result)
    
    except Exception as e:
        current_app.logger.error(f"Error refrescando token: {e}")
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/logout', methods=['POST'])
@require_auth()
def logout():
    """Cerrar sesión"""
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            oauth_service = OAuthService(current_app.config.get('DATA_DIR', 'data'))
            oauth_service.logout(token)
        
        return jsonify({'message': 'Sesión cerrada correctamente'})
    
    except Exception as e:
        current_app.logger.error(f"Error en logout: {e}")
        return jsonify({'error': 'Error cerrando sesión'}), 500

@auth_bp.route('/me', methods=['GET'])
@require_auth()
def get_current_user_info():
    """Obtener información del usuario actual"""
    try:
        user = get_current_user()
        return jsonify({
            'user': {
                'id': user['user_id'],
                'email': user['email'],
                'nombre': user['nombre'],
                'org_id': user['org_id'],
                'permissions': user['permissions'],
                'roles': user['roles']
            }
        })
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo usuario: {e}")
        return jsonify({'error': 'Error obteniendo información del usuario'}), 500

@auth_bp.route('/validate', methods=['POST'])
def validate_token():
    """Validar token JWT"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token requerido'}), 400
    
    try:
        oauth_service = OAuthService(current_app.config.get('DATA_DIR', 'data'))
        is_valid = oauth_service.validate_token(token)
        
        if is_valid:
            user = oauth_service.get_user_from_token(token)
            return jsonify({
                'valid': True,
                'user': user.to_dict() if user else None
            })
        else:
            return jsonify({'valid': False})
    
    except Exception as e:
        current_app.logger.error(f"Error validando token: {e}")
        return jsonify({'error': 'Error validando token'}), 500