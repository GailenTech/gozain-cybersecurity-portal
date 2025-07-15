"""
Proveedores OAuth
"""
from .base_provider import BaseOAuthProvider
from .google_provider import GoogleOAuthProvider

__all__ = [
    'BaseOAuthProvider',
    'GoogleOAuthProvider'
]