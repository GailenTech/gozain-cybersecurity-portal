"""
Servicio de gestión de sesiones
"""
import json
import os
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from .models import Session, TokenPayload

class SessionService:
    """Servicio para gestión de sesiones"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.sessions_file = os.path.join(data_dir, 'sessions.json')
        self.jwt_secret = os.environ.get('JWT_SECRET', 'dev-secret-key')
        self.sessions = self._load_sessions()
    
    def _load_sessions(self) -> Dict[str, Session]:
        """Cargar sesiones desde archivo"""
        if os.path.exists(self.sessions_file):
            try:
                with open(self.sessions_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    sessions = {}
                    for session_id, session_data in data.items():
                        session = Session(**session_data)
                        if session_data.get('creada'):
                            session.creada = datetime.fromisoformat(session_data['creada'])
                        if session_data.get('expira'):
                            session.expira = datetime.fromisoformat(session_data['expira'])
                        sessions[session_id] = session
                    return sessions
            except Exception as e:
                print(f"Error cargando sesiones: {e}")
                return {}
        return {}
    
    def _save_sessions(self):
        """Guardar sesiones en archivo"""
        os.makedirs(self.data_dir, exist_ok=True)
        
        data = {}
        for session_id, session in self.sessions.items():
            data[session_id] = session.to_dict()
        
        with open(self.sessions_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def create_session(self, usuario_id: str, organizacion_id: str, 
                      access_token: str, refresh_token: str = None,
                      ip: str = None, user_agent: str = None) -> Session:
        """Crear nueva sesión"""
        session_id = f"ses_{secrets.token_urlsafe(16)}"
        
        # Generar JWT token
        from .user_service import UserService
        user_service = UserService(self.data_dir)
        user = user_service.get_user(usuario_id)
        
        if not user:
            raise ValueError("Usuario no encontrado")
        
        # Crear payload del JWT
        now = datetime.utcnow()
        exp = now + timedelta(hours=1)
        
        payload = TokenPayload(
            user_id=user.id,
            email=user.email,
            nombre=user.nombre,
            org_id=organizacion_id,
            permissions=user.permisos,
            roles=user.roles,
            exp=int(exp.timestamp()),
            iat=int(now.timestamp())
        )
        
        jwt_token = jwt.encode(payload.to_dict(), self.jwt_secret, algorithm='HS256')
        
        # Crear sesión
        session = Session(
            id=session_id,
            usuario_id=usuario_id,
            organizacion_id=organizacion_id,
            token=jwt_token,
            refresh_token=refresh_token,
            creada=now,
            expira=exp,
            ip=ip,
            user_agent=user_agent
        )
        
        self.sessions[session_id] = session
        self._save_sessions()
        
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """Obtener sesión por ID"""
        return self.sessions.get(session_id)
    
    def get_session_by_token(self, token: str) -> Optional[Session]:
        """Obtener sesión por JWT token"""
        for session in self.sessions.values():
            if session.token == token and session.activa:
                return session
        return None
    
    def get_session_by_refresh_token(self, refresh_token: str) -> Optional[Session]:
        """Obtener sesión por refresh token"""
        for session in self.sessions.values():
            if session.refresh_token == refresh_token and session.activa:
                return session
        return None
    
    def update_session_token(self, session_id: str, new_token: str) -> Optional[Session]:
        """Actualizar token de sesión"""
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        # Generar nuevo JWT
        try:
            payload = jwt.decode(session.token, self.jwt_secret, algorithms=['HS256'])
            payload['exp'] = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
            payload['iat'] = int(datetime.utcnow().timestamp())
            
            new_jwt = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
            
            session.token = new_jwt
            session.expira = datetime.utcnow() + timedelta(hours=1)
            
            self._save_sessions()
            return session
        except jwt.InvalidTokenError:
            return None
    
    def invalidate_session(self, session_id: str) -> bool:
        """Invalidar sesión"""
        session = self.sessions.get(session_id)
        if not session:
            return False
        
        session.activa = False
        self._save_sessions()
        return True
    
    def invalidate_session_by_token(self, token: str) -> bool:
        """Invalidar sesión por token"""
        for session in self.sessions.values():
            if session.token == token:
                session.activa = False
                self._save_sessions()
                return True
        return False
    
    def cleanup_expired_sessions(self):
        """Limpiar sesiones expiradas"""
        now = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if session.is_expired():
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.sessions[session_id]
        
        if expired_sessions:
            self._save_sessions()
    
    def get_user_sessions(self, usuario_id: str) -> List[Session]:
        """Obtener sesiones activas de un usuario"""
        user_sessions = []
        for session in self.sessions.values():
            if session.usuario_id == usuario_id and session.activa and not session.is_expired():
                user_sessions.append(session)
        return user_sessions
    
    def validate_jwt_token(self, token: str) -> Optional[Dict]:
        """Validar y decodificar JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None