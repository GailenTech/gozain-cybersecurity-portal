# Plan de Integración OAuth Multi-tenant para Gozain

## 1. Arquitectura Propuesta

### 1.1 Flujo de Autenticación OAuth
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │     │   Frontend  │     │   Backend   │     │  Provider   │
│             │     │   Vue.js    │     │   Flask     │     │  OAuth      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │                    │
       │ 1. Click login    │                    │                    │
       ├──────────────────>│                    │                    │
       │                   │                    │                    │
       │                   │ 2. GET /auth/login │                    │
       │                   ├───────────────────>│                    │
       │                   │                    │                    │
       │                   │ 3. Redirect URL    │                    │
       │                   │<───────────────────│                    │
       │                   │                    │                    │
       │ 4. Redirect to    │                    │                    │
       │<──────────────────│                    │                    │
       │    OAuth Provider │                    │                    │
       ├───────────────────┼────────────────────┼───────────────────>│
       │                   │                    │                    │
       │ 5. User consents  │                    │                    │
       ├───────────────────┼────────────────────┼───────────────────>│
       │                   │                    │                    │
       │ 6. Callback with  │                    │                    │
       │    auth code      │                    │                    │
       │<──────────────────┼────────────────────┼────────────────────│
       │                   │                    │                    │
       │ 7. /auth/callback │                    │                    │
       ├──────────────────>│                    │                    │
       │                   │                    │                    │
       │                   │ 8. Exchange code   │                    │
       │                   ├───────────────────>│                    │
       │                   │                    │ 9. Token exchange  │
       │                   │                    ├───────────────────>│
       │                   │                    │                    │
       │                   │                    │ 10. Access token   │
       │                   │                    │<───────────────────│
       │                   │                    │                    │
       │                   │ 11. JWT + User     │                    │
       │                   │<───────────────────│                    │
       │                   │                    │                    │
       │ 12. Store & Route │                    │                    │
       │<──────────────────│                    │                    │
       │                   │                    │                    │
```

### 1.2 Estructura de Base de Datos

#### Organizaciones (extendida)
```json
{
  "id": "empresa_com",
  "nombre": "Empresa S.A.",
  "dominio": "empresa.com",
  "oauth_config": {
    "provider": "google", // google, microsoft, okta, auth0
    "client_id": "...",
    "tenant_id": "...", // para Microsoft
    "allowed_domains": ["empresa.com", "empresa.org"],
    "require_domain_match": true,
    "custom_claims": {
      "department": "dept",
      "role": "role"
    }
  },
  "seguridad": {
    "require_mfa": false,
    "session_timeout": 3600,
    "ip_whitelist": []
  }
}
```

#### Usuarios
```json
{
  "id": "usr_123",
  "email": "usuario@empresa.com",
  "nombre": "Juan Pérez",
  "organizacion_id": "empresa_com",
  "oauth_provider": "google",
  "oauth_id": "google_123456",
  "permisos": {
    "inventario": ["read", "write"],
    "impactos": ["read", "write", "delete"],
    "madurez": ["read"]
  },
  "roles": ["usuario", "auditor"],
  "ultimo_acceso": "2025-07-15T10:00:00Z",
  "activo": true,
  "metadata": {
    "departamento": "TI",
    "cargo": "Analista"
  }
}
```

#### Sesiones
```json
{
  "id": "ses_abc123",
  "usuario_id": "usr_123",
  "organizacion_id": "empresa_com",
  "token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "creada": "2025-07-15T10:00:00Z",
  "expira": "2025-07-15T14:00:00Z",
  "ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

## 2. Componentes a Implementar

### 2.1 Backend (Flask)

#### Nuevos Módulos
- `backend/modules/auth/`
  - `oauth_service.py` - Gestión OAuth multi-proveedor
  - `auth_middleware.py` - Middleware de autenticación
  - `session_service.py` - Gestión de sesiones
  - `user_service.py` - Gestión de usuarios
  - `providers/` - Implementaciones específicas
    - `google_provider.py`
    - `microsoft_provider.py`
    - `base_provider.py`

#### Endpoints de Autenticación
- `GET /api/auth/providers` - Proveedores disponibles para la org
- `GET /api/auth/login?org_id=xxx` - Inicia flujo OAuth
- `GET /api/auth/callback` - Callback OAuth
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

### 2.2 Frontend (Vue.js)

#### Nuevos Componentes
- `core/auth/`
  - `AuthService.js` - Servicio de autenticación
  - `AuthGuard.js` - Guard para rutas protegidas
  - `TokenManager.js` - Gestión de tokens
- `apps/shell/components/`
  - `LoginModal.vue` - Modal de login
  - `UserMenu.vue` - Menú de usuario

### 2.3 Configuración OAuth

#### Google Workspace
```python
GOOGLE_OAUTH = {
    'authorization_base_url': 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url': 'https://oauth2.googleapis.com/token',
    'userinfo_url': 'https://www.googleapis.com/oauth2/v1/userinfo',
    'scopes': ['openid', 'email', 'profile'],
}
```

#### Microsoft EntraID/Azure AD
```python
MICROSOFT_OAUTH = {
    'authorization_base_url': 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    'token_url': 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    'userinfo_url': 'https://graph.microsoft.com/v1.0/me',
    'scopes': ['openid', 'email', 'profile', 'User.Read'],
}
```

## 3. Plan de Implementación

### Fase 1: Infraestructura Base (2-3 días)
1. **Crear estructura de módulos auth**
   - Módulo base de autenticación
   - Providers base y Google
   - Modelos de datos

2. **Implementar almacenamiento de usuarios/sesiones**
   - Extender organizaciones con config OAuth
   - Crear servicios de usuario y sesión
   - Migrar datos existentes

3. **Configurar JWT y middleware**
   - Generar y validar JWT
   - Middleware de autenticación
   - Manejo de permisos

### Fase 2: Flujo OAuth Backend (2-3 días)
1. **Implementar flujo OAuth**
   - Endpoints de login/callback
   - Intercambio de códigos
   - Obtención de info de usuario

2. **Gestión de sesiones**
   - Crear/actualizar sesiones
   - Refresh tokens
   - Logout y limpieza

3. **Integración con organizaciones**
   - Validar dominio del usuario
   - Crear usuario si no existe
   - Asignar permisos por defecto

### Fase 3: Frontend Auth (2-3 días)
1. **Servicio de autenticación**
   - AuthService con manejo de tokens
   - Interceptor para requests
   - Guards para rutas

2. **UI de autenticación**
   - Modal de selección de org con login
   - Manejo de callbacks OAuth
   - Indicador de sesión activa

3. **Persistencia y estado**
   - Almacenamiento seguro de tokens
   - Estado global de autenticación
   - Auto-refresh de tokens

### Fase 4: Multi-provider (1-2 días)
1. **Microsoft EntraID**
   - Provider específico
   - Manejo de tenants
   - Mapeo de claims

2. **Sistema extensible**
   - Interface común providers
   - Configuración dinámica
   - Validaciones específicas

### Fase 5: Migración y Testing (1-2 días)
1. **Migración sin downtime**
   - Flag feature para activar/desactivar
   - Compatibilidad con header actual
   - Migración gradual

2. **Testing completo**
   - Tests unitarios auth
   - Tests E2E con mocks OAuth
   - Validación de seguridad

## 4. Código Ejemplo

### Backend - Middleware Auth
```python
# backend/modules/auth/auth_middleware.py
from functools import wraps
from flask import request, jsonify, g
import jwt

def require_auth(permissions=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Compatibilidad temporal con header
            if not app.config.get('OAUTH_ENABLED'):
                org_id = request.headers.get('X-Organization-Id')
                if org_id:
                    g.organization_id = org_id
                    g.user = None
                    return f(*args, **kwargs)
            
            # Verificar JWT
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'No autorizado'}), 401
            
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
                g.user = payload
                g.organization_id = payload['org_id']
                
                # Verificar permisos si se especifican
                if permissions:
                    user_perms = payload.get('permissions', {})
                    if not check_permissions(user_perms, permissions):
                        return jsonify({'error': 'Permisos insuficientes'}), 403
                
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expirado'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Token inválido'}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

### Frontend - AuthService
```javascript
// core/auth/AuthService.js
export class AuthService {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.user = this.parseToken();
    }
    
    async login(organizationId) {
        // Redirigir al flujo OAuth
        const response = await fetch(`/api/auth/login?org_id=${organizationId}`);
        const { redirect_url } = await response.json();
        
        // Guardar estado para callback
        sessionStorage.setItem('auth_state', JSON.stringify({
            organizationId,
            returnUrl: window.location.href
        }));
        
        window.location.href = redirect_url;
    }
    
    async handleCallback(code, state) {
        const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state })
        });
        
        if (!response.ok) throw new Error('Auth failed');
        
        const { access_token, refresh_token, user } = await response.json();
        
        this.setTokens(access_token, refresh_token);
        this.user = user;
        
        // Restaurar estado y redirigir
        const authState = JSON.parse(sessionStorage.getItem('auth_state'));
        sessionStorage.removeItem('auth_state');
        
        window.location.href = authState.returnUrl || '/';
    }
    
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        // Configurar auto-refresh
        this.scheduleTokenRefresh();
    }
    
    async refreshAccessToken() {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: this.refreshToken })
        });
        
        if (!response.ok) {
            this.logout();
            throw new Error('Refresh failed');
        }
        
        const { access_token } = await response.json();
        this.token = access_token;
        localStorage.setItem('auth_token', access_token);
        
        return access_token;
    }
}
```

## 5. Consideraciones de Seguridad

### 5.1 Almacenamiento de Tokens
- JWT en memoria/sessionStorage para mayor seguridad
- Refresh token en httpOnly cookie
- Rotación automática de refresh tokens

### 5.2 Validaciones
- Verificar dominio del email vs organización
- State parameter para prevenir CSRF
- PKCE para mayor seguridad en el flujo

### 5.3 Configuración CORS
```python
CORS(app, 
    origins=['https://app.gozain.com'],
    supports_credentials=True,
    expose_headers=['X-CSRF-Token']
)
```

## 6. Estimaciones y Riesgos

### Estimación Total: 8-13 días

### Riesgos Principales
1. **Complejidad multi-tenant**: Mitigar con pruebas exhaustivas
2. **Compatibilidad hacia atrás**: Feature flag y migración gradual
3. **Configuración OAuth providers**: Documentación detallada
4. **Rendimiento con validación JWT**: Cache de validaciones

### Dependencias
- `authlib` o `requests-oauthlib` para OAuth
- `pyjwt` para tokens
- `cryptography` para seguridad adicional

## 7. Próximos Pasos

1. Validar el plan con el equipo
2. Crear feature branch `feature/oauth-integration`
3. Implementar Fase 1 con tests
4. Demo con organización de prueba
5. Iterar según feedback

Este plan permite desarrollo incremental sin afectar la funcionalidad actual y proporciona una base sólida para autenticación empresarial.