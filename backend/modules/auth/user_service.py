"""
Servicio de gestión de usuarios
"""
import json
import os
import secrets
from datetime import datetime
from typing import Dict, Optional, List
from .models import User

class UserService:
    """Servicio para gestión de usuarios"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, 'users.json')
        self.users = self._load_users()
    
    def _load_users(self) -> Dict[str, User]:
        """Cargar usuarios desde archivo"""
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    users = {}
                    for user_id, user_data in data.items():
                        user = User(**user_data)
                        if user_data.get('ultimo_acceso'):
                            user.ultimo_acceso = datetime.fromisoformat(user_data['ultimo_acceso'])
                        users[user_id] = user
                    return users
            except Exception as e:
                print(f"Error cargando usuarios: {e}")
                return {}
        return {}
    
    def _save_users(self):
        """Guardar usuarios en archivo"""
        os.makedirs(self.data_dir, exist_ok=True)
        
        data = {}
        for user_id, user in self.users.items():
            data[user_id] = user.to_dict()
        
        with open(self.users_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def create_or_update_user(self, email: str, nombre: str, organizacion_id: str,
                             oauth_provider: str, oauth_id: str, 
                             metadata: Dict = None) -> User:
        """Crear o actualizar usuario"""
        # Buscar usuario existente por email y organización
        existing_user = self.get_user_by_email(email, organizacion_id)
        
        if existing_user:
            # Actualizar usuario existente
            existing_user.nombre = nombre
            existing_user.oauth_provider = oauth_provider
            existing_user.oauth_id = oauth_id
            existing_user.ultimo_acceso = datetime.utcnow()
            existing_user.activo = True
            
            if metadata:
                existing_user.metadata.update(metadata)
            
            self._save_users()
            return existing_user
        else:
            # Crear nuevo usuario
            user_id = f"usr_{secrets.token_urlsafe(8)}"
            
            # Permisos por defecto
            default_permissions = {
                'inventario': ['read'],
                'impactos': ['read'],
                'madurez': ['read']
            }
            
            user = User(
                id=user_id,
                email=email,
                nombre=nombre,
                organizacion_id=organizacion_id,
                oauth_provider=oauth_provider,
                oauth_id=oauth_id,
                permisos=default_permissions,
                roles=['usuario'],
                ultimo_acceso=datetime.utcnow(),
                activo=True,
                metadata=metadata or {}
            )
            
            self.users[user_id] = user
            self._save_users()
            return user
    
    def get_user(self, user_id: str) -> Optional[User]:
        """Obtener usuario por ID"""
        return self.users.get(user_id)
    
    def get_user_by_email(self, email: str, organizacion_id: str = None) -> Optional[User]:
        """Obtener usuario por email"""
        for user in self.users.values():
            if user.email.lower() == email.lower():
                if organizacion_id is None or user.organizacion_id == organizacion_id:
                    return user
        return None
    
    def get_users_by_organization(self, organizacion_id: str) -> List[User]:
        """Obtener usuarios de una organización"""
        return [user for user in self.users.values() 
                if user.organizacion_id == organizacion_id and user.activo]
    
    def update_user_permissions(self, user_id: str, permissions: Dict[str, List[str]]) -> bool:
        """Actualizar permisos de usuario"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        user.permisos = permissions
        self._save_users()
        return True
    
    def add_user_role(self, user_id: str, role: str) -> bool:
        """Añadir rol a usuario"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        if role not in user.roles:
            user.roles.append(role)
            self._save_users()
        return True
    
    def remove_user_role(self, user_id: str, role: str) -> bool:
        """Remover rol de usuario"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        if role in user.roles:
            user.roles.remove(role)
            self._save_users()
        return True
    
    def deactivate_user(self, user_id: str) -> bool:
        """Desactivar usuario"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        user.activo = False
        self._save_users()
        return True
    
    def activate_user(self, user_id: str) -> bool:
        """Activar usuario"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        user.activo = True
        self._save_users()
        return True
    
    def update_last_access(self, user_id: str) -> bool:
        """Actualizar último acceso"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        user.ultimo_acceso = datetime.utcnow()
        self._save_users()
        return True
    
    def search_users(self, organizacion_id: str, query: str = None) -> List[User]:
        """Buscar usuarios"""
        users = self.get_users_by_organization(organizacion_id)
        
        if not query:
            return users
        
        query = query.lower()
        filtered_users = []
        
        for user in users:
            if (query in user.nombre.lower() or 
                query in user.email.lower() or 
                any(query in role.lower() for role in user.roles)):
                filtered_users.append(user)
        
        return filtered_users