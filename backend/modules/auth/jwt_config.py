"""
Configuración JWT
"""
import os
import secrets
from datetime import datetime, timedelta

class JWTConfig:
    """Configuración para JWT"""
    
    # Clave secreta para firmar tokens
    SECRET_KEY = os.environ.get('JWT_SECRET', 'dev-secret-key-change-in-production')
    
    # Algoritmo de firma
    ALGORITHM = 'HS256'
    
    # Tiempo de expiración del token (1 hora)
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    
    # Tiempo de expiración del refresh token (7 días)
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    # Issuer del token
    ISSUER = 'inventario-activos'
    
    # Audiencia del token
    AUDIENCE = 'inventario-activos-users'
    
    @classmethod
    def generate_secret_key(cls):
        """Generar una nueva clave secreta"""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def get_expiration_time(cls, minutes=None):
        """Obtener tiempo de expiración"""
        if minutes is None:
            minutes = cls.ACCESS_TOKEN_EXPIRE_MINUTES
        return datetime.utcnow() + timedelta(minutes=minutes)
    
    @classmethod
    def get_refresh_expiration_time(cls, days=None):
        """Obtener tiempo de expiración para refresh token"""
        if days is None:
            days = cls.REFRESH_TOKEN_EXPIRE_DAYS
        return datetime.utcnow() + timedelta(days=days)