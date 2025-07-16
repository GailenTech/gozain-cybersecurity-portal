"""
Servicio principal de OAuth
"""
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from .models import OAuthConfig, User, Session
from .providers import GoogleOAuthProvider, BaseOAuthProvider
from .session_service import SessionService
from .user_service import UserService

class OAuthService:
    """Servicio principal para gestión OAuth"""
    
    def __init__(self, data_dir: str = "data", storage_service=None):
        self.data_dir = data_dir
        self.storage_service = storage_service
        self.session_service = SessionService(data_dir)
        self.user_service = UserService(data_dir)
        self.providers = {}
        self._load_organizations()
    
    def _load_organizations(self):
        """Cargar configuraciones de organizaciones"""
        if self.storage_service:
            # Usar servicio de almacenamiento (GCS en producción)
            data = self.storage_service.leer_archivo('organizaciones.json')
            self.organizations = data if data else {}
        else:
            # Usar almacenamiento local
            orgs_file = os.path.join(self.data_dir, 'organizaciones.json')
            if os.path.exists(orgs_file):
                with open(orgs_file, 'r', encoding='utf-8') as f:
                    self.organizations = json.load(f)
            else:
                self.organizations = {}
    
    def get_provider(self, org_id: str, base_url: str = None) -> Optional[BaseOAuthProvider]:
        """Obtener proveedor OAuth para una organización"""
        # Usar una clave única que incluya base_url para cachear providers por URL
        cache_key = f"{org_id}:{base_url}" if base_url else org_id
        
        if cache_key not in self.providers:
            org = self.organizations.get(org_id)
            if not org or 'oauth_config' not in org:
                return None
            
            oauth_config = org['oauth_config']
            provider_type = oauth_config.get('provider', 'google')
            
            # Configurar redirect URI con URL completa
            config = oauth_config.copy()
            if base_url:
                config['redirect_uri'] = f"{base_url}/api/auth/callback"
            else:
                # Fallback para desarrollo local
                config['redirect_uri'] = "http://localhost:8888/api/auth/callback"
            
            if provider_type == 'google':
                self.providers[cache_key] = GoogleOAuthProvider(config)
            else:
                raise ValueError(f"Proveedor no soportado: {provider_type}")
        
        return self.providers[cache_key]
    
    def get_authorization_url(self, org_id: str, base_url: str = None) -> Dict[str, str]:
        """Generar URL de autorización"""
        provider = self.get_provider(org_id, base_url)
        if not provider:
            raise ValueError(f"Organización no encontrada o sin configuración OAuth: {org_id}")
        
        state = provider.generate_state()
        auth_url = provider.get_authorization_url(state, org_id)
        
        return {
            'redirect_url': auth_url,
            'state': state
        }
    
    def handle_callback(self, code: str, state: str, org_id: str, 
                       ip: str = None, user_agent: str = None, base_url: str = None) -> Dict[str, Any]:
        """Manejar callback de OAuth"""
        provider = self.get_provider(org_id, base_url)
        if not provider:
            raise ValueError(f"Organización no encontrada: {org_id}")
        
        # Intercambiar código por token
        token_response = provider.exchange_code_for_token(code, state)
        access_token = token_response.get('access_token')
        refresh_token = token_response.get('refresh_token')
        
        if not access_token:
            raise ValueError("No se pudo obtener token de acceso")
        
        # Obtener información del usuario
        user_info = provider.get_user_info(access_token)
        
        # Validar dominio si está configurado
        org = self.organizations[org_id]
        oauth_config = org['oauth_config']
        
        if oauth_config.get('require_domain_match', True):
            allowed_domains = oauth_config.get('allowed_domains', [])
            if not provider.validate_domain(user_info['email'], allowed_domains):
                raise ValueError(f"Dominio no permitido: {user_info['email']}")
        
        # Crear o actualizar usuario
        user = self.user_service.create_or_update_user(
            email=user_info['email'],
            nombre=user_info['nombre'],
            organizacion_id=org_id,
            oauth_provider=oauth_config['provider'],
            oauth_id=user_info['id'],
            metadata={
                'picture': user_info.get('picture'),
                'domain': user_info.get('domain')
            }
        )
        
        # Crear sesión
        session = self.session_service.create_session(
            usuario_id=user.id,
            organizacion_id=org_id,
            access_token=access_token,
            refresh_token=refresh_token,
            ip=ip,
            user_agent=user_agent
        )
        
        return {
            'access_token': session.token,  # JWT token
            'refresh_token': session.refresh_token,
            'user': user.to_dict(),
            'expires_in': 3600  # 1 hora
        }
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refrescar token de acceso"""
        session = self.session_service.get_session_by_refresh_token(refresh_token)
        if not session or session.is_expired():
            raise ValueError("Refresh token inválido o expirado")
        
        provider = self.get_provider(session.organizacion_id)
        if not provider:
            raise ValueError("Proveedor no encontrado")
        
        # Refrescar token con el proveedor
        token_response = provider.refresh_token(session.refresh_token)
        new_access_token = token_response.get('access_token')
        
        if not new_access_token:
            raise ValueError("No se pudo refrescar el token")
        
        # Actualizar sesión
        updated_session = self.session_service.update_session_token(
            session.id, 
            new_access_token
        )
        
        return {
            'access_token': updated_session.token,
            'expires_in': 3600
        }
    
    def logout(self, token: str) -> bool:
        """Cerrar sesión"""
        return self.session_service.invalidate_session_by_token(token)
    
    def get_user_from_token(self, token: str) -> Optional[User]:
        """Obtener usuario desde token JWT"""
        session = self.session_service.get_session_by_token(token)
        if not session or session.is_expired():
            return None
        
        return self.user_service.get_user(session.usuario_id)
    
    def validate_token(self, token: str) -> bool:
        """Validar token JWT"""
        session = self.session_service.get_session_by_token(token)
        return session is not None and not session.is_expired()