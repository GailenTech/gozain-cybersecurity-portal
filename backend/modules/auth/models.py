"""
Modelos de datos para autenticación
"""
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class OAuthConfig:
    """Configuración OAuth para una organización"""
    provider: str  # google, microsoft, okta, auth0
    client_id: str
    client_secret: str
    tenant_id: Optional[str] = None  # para Microsoft
    allowed_domains: List[str] = None
    require_domain_match: bool = True
    custom_claims: Dict[str, str] = None
    
    def __post_init__(self):
        if self.allowed_domains is None:
            self.allowed_domains = []
        if self.custom_claims is None:
            self.custom_claims = {}

@dataclass
class SecurityConfig:
    """Configuración de seguridad para una organización"""
    require_mfa: bool = False
    session_timeout: int = 3600  # segundos
    ip_whitelist: List[str] = None
    
    def __post_init__(self):
        if self.ip_whitelist is None:
            self.ip_whitelist = []

@dataclass
class User:
    """Modelo de usuario"""
    id: str
    email: str
    nombre: str
    organizacion_id: str
    oauth_provider: str
    oauth_id: str
    permisos: Dict[str, List[str]]
    roles: List[str]
    ultimo_acceso: Optional[datetime] = None
    activo: bool = True
    metadata: Dict[str, str] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if self.ultimo_acceso is None:
            self.ultimo_acceso = datetime.utcnow()
    
    def has_permission(self, module: str, action: str) -> bool:
        """Verificar si el usuario tiene un permiso específico"""
        module_perms = self.permisos.get(module, [])
        return action in module_perms or 'admin' in self.roles
    
    def to_dict(self) -> Dict:
        """Convertir a diccionario para JSON"""
        data = asdict(self)
        if self.ultimo_acceso:
            data['ultimo_acceso'] = self.ultimo_acceso.isoformat()
        return data

@dataclass
class Session:
    """Modelo de sesión"""
    id: str
    usuario_id: str
    organizacion_id: str
    token: str
    refresh_token: Optional[str] = None
    creada: Optional[datetime] = None
    expira: Optional[datetime] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    activa: bool = True
    
    def __post_init__(self):
        if self.creada is None:
            self.creada = datetime.utcnow()
    
    def is_expired(self) -> bool:
        """Verificar si la sesión está expirada"""
        if not self.expira:
            return False
        return datetime.utcnow() > self.expira
    
    def to_dict(self) -> Dict:
        """Convertir a diccionario para JSON"""
        data = asdict(self)
        if self.creada:
            data['creada'] = self.creada.isoformat()
        if self.expira:
            data['expira'] = self.expira.isoformat()
        return data

@dataclass
class TokenPayload:
    """Payload del JWT"""
    user_id: str
    email: str
    nombre: str
    org_id: str
    permissions: Dict[str, List[str]]
    roles: List[str]
    exp: int
    iat: int
    
    def to_dict(self) -> Dict:
        """Convertir a diccionario para JWT"""
        return asdict(self)