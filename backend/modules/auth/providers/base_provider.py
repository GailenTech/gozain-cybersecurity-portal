"""
Proveedor base para OAuth
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from urllib.parse import urlencode
import secrets
import hashlib
import base64

class BaseOAuthProvider(ABC):
    """Clase base para proveedores OAuth"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client_id = config['client_id']
        self.client_secret = config['client_secret']
        self.redirect_uri = config.get('redirect_uri')
        
    @abstractmethod
    def get_authorization_url(self, state: str, org_id: str) -> str:
        """Generar URL de autorización"""
        pass
    
    @abstractmethod
    def exchange_code_for_token(self, code: str, state: str) -> Dict[str, Any]:
        """Intercambiar código por token"""
        pass
    
    @abstractmethod
    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Obtener información del usuario"""
        pass
    
    @abstractmethod
    def validate_token(self, access_token: str) -> bool:
        """Validar token de acceso"""
        pass
    
    def generate_state(self) -> str:
        """Generar state para CSRF protection"""
        return secrets.token_urlsafe(32)
    
    def generate_pkce_challenge(self) -> tuple[str, str]:
        """Generar code verifier y challenge para PKCE"""
        code_verifier = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')
        return code_verifier, code_challenge
    
    def build_url(self, base_url: str, params: Dict[str, Any]) -> str:
        """Construir URL con parámetros"""
        return f"{base_url}?{urlencode(params)}"
    
    def validate_domain(self, email: str, allowed_domains: list) -> bool:
        """Validar dominio del email"""
        if not allowed_domains:
            return True
        
        domain = email.split('@')[1].lower()
        return domain in [d.lower() for d in allowed_domains]