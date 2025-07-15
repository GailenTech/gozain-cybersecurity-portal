"""
Proveedor OAuth para Google Workspace
"""
import requests
from typing import Dict, Any
from .base_provider import BaseOAuthProvider

class GoogleOAuthProvider(BaseOAuthProvider):
    """Proveedor OAuth para Google Workspace"""
    
    AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    TOKEN_URL = 'https://oauth2.googleapis.com/token'
    USERINFO_URL = 'https://www.googleapis.com/oauth2/v1/userinfo'
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.scopes = config.get('scopes', ['openid', 'email', 'profile'])
    
    def get_authorization_url(self, state: str, org_id: str) -> str:
        """Generar URL de autorización para Google"""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'response_type': 'code',
            'state': state,
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        # Añadir domain hint si está configurado
        allowed_domains = self.config.get('allowed_domains', [])
        if allowed_domains:
            params['hd'] = allowed_domains[0]
        
        return self.build_url(self.AUTHORIZATION_URL, params)
    
    def exchange_code_for_token(self, code: str, state: str) -> Dict[str, Any]:
        """Intercambiar código por token de Google"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri
        }
        
        response = requests.post(self.TOKEN_URL, data=data)
        response.raise_for_status()
        
        return response.json()
    
    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Obtener información del usuario de Google"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(self.USERINFO_URL, headers=headers)
        response.raise_for_status()
        
        user_info = response.json()
        
        # Normalizar información del usuario
        return {
            'id': user_info.get('id'),
            'email': user_info.get('email'),
            'nombre': user_info.get('name'),
            'picture': user_info.get('picture'),
            'verified_email': user_info.get('verified_email', False),
            'domain': user_info.get('hd')  # Dominio de Google Workspace
        }
    
    def validate_token(self, access_token: str) -> bool:
        """Validar token de acceso de Google"""
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            response = requests.get(self.USERINFO_URL, headers=headers)
            return response.status_code == 200
        except:
            return False
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refrescar token de acceso"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        response = requests.post(self.TOKEN_URL, data=data)
        response.raise_for_status()
        
        return response.json()