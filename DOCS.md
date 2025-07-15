# Documentación del Sistema Gozain

## Índice de Documentación

### Arquitectura y Diseño
- [Plan de Integración OAuth Multi-tenant](docs/oauth-integration-plan.md) - Plan completo para implementar autenticación OAuth con soporte multi-tenant (Google, Microsoft EntraID)
- [Plan de Integración OAuth](docs/plan-oauth-integration.md) - Arquitectura y fases para agregar autenticación empresarial

### Autenticación y Seguridad
- [Configuración OAuth para Gailen](docs/oauth-gailen-setup.md) - Guía específica para configurar OAuth en Gailen Tecnologías
- **Módulos de Autenticación**: 
  - `backend/modules/auth/` - Servicios de autenticación, OAuth, usuarios, sesiones
  - JWT + OAuth 2.0 con Google Workspace
  - Sistema de auditoría completo
  - Gestión de permisos y roles

### Guías de Configuración
- **Script de Configuración**: `claude_tools/setup_oauth.py` - Configuración automática de OAuth
- **Variables de Entorno**: Ver `.env` para configuración de OAuth
- **Datos de Configuración**: `data/organizaciones.json` con configuración OAuth por organización

### Funcionalidades Implementadas

#### Sistema de Autenticación
- ✅ **OAuth 2.0 Multi-tenant**: Soporte para Google Workspace y Microsoft EntraID
- ✅ **JWT Tokens**: Autenticación segura con tokens de acceso y refresh
- ✅ **Gestión de Sesiones**: Control de sesiones activas por usuario y organización
- ✅ **Middleware de Autenticación**: Protección automática de endpoints
- ✅ **Validación de Dominios**: Restricción por dominios empresariales

#### Gestión de Usuarios y Permisos
- ✅ **CRUD de Usuarios**: Creación automática desde OAuth + administración manual
- ✅ **Sistema de Roles**: usuario, analista, auditor, admin
- ✅ **Permisos Granulares**: Control por módulo y acción (read, write, delete, admin)
- ✅ **Plantillas de Permisos**: Configuraciones predefinidas para roles comunes
- ✅ **Activación/Desactivación**: Control de acceso por usuario

#### Auditoría y Monitoreo
- ✅ **Logs de Auditoría**: Registro automático de todas las acciones
- ✅ **Trazabilidad Completa**: Usuario, IP, timestamp, detalles de cada acción
- ✅ **Búsqueda y Filtrado**: Consulta avanzada de logs de auditoría
- ✅ **Estadísticas**: Métricas de uso por usuario, módulo y organización
- ✅ **Exportación**: Logs en JSON y CSV para análisis externo

#### Frontend de Autenticación
- ✅ **Modal de Login**: Selección de organización y proveedor OAuth
- ✅ **Menú de Usuario**: Información de sesión, perfil y permisos
- ✅ **Guards de Autenticación**: Protección de rutas y componentes
- ✅ **Interceptor HTTP**: Manejo automático de tokens en requests
- ✅ **Auto-refresh**: Renovación automática de tokens expirados

### API Reference

#### Endpoints de Autenticación (`/api/auth/`)
- `GET /providers?org_id=X` - Proveedores OAuth disponibles
- `GET /login?org_id=X` - Iniciar flujo OAuth
- `GET /callback` - Callback OAuth
- `POST /refresh` - Refrescar token
- `POST /logout` - Cerrar sesión
- `GET /me` - Usuario actual
- `POST /validate` - Validar token

#### Endpoints de Administración (`/api/admin/`)
- `GET /users` - Lista de usuarios
- `GET /users/:id` - Detalles de usuario
- `PUT /users/:id/permissions` - Actualizar permisos
- `PUT /users/:id/roles` - Gestionar roles
- `POST /users/:id/activate` - Activar usuario
- `POST /users/:id/deactivate` - Desactivar usuario
- `GET /sessions` - Sesiones activas
- `POST /sessions/:id/revoke` - Revocar sesión
- `GET /permissions/templates` - Plantillas de permisos
- `POST /users/:id/apply-template` - Aplicar plantilla

#### Endpoints de Auditoría (`/api/audit/`)
- `GET /logs` - Logs de auditoría con filtros
- `GET /search?q=X` - Búsqueda en logs
- `GET /user/:id/activity` - Actividad por usuario
- `GET /organization/activity` - Actividad de organización
- `GET /stats` - Estadísticas de auditoría
- `GET /export` - Exportar logs (JSON/CSV)
- `POST /cleanup` - Limpiar logs antiguos

### Guías de Desarrollo

#### Middleware de Auditoría
```python
from modules.auth.audit_middleware import audit_action

@audit_action('inventario', 'create', 'activo')
def create_activo():
    # La acción se audita automáticamente
    pass
```

#### Verificación de Permisos
```python
from modules.auth.auth_middleware import require_auth

@require_auth(['inventario:write', 'admin:all'])
def protected_endpoint():
    # Solo usuarios con permisos específicos
    pass
```

#### Frontend - Uso de AuthService
```javascript
// Verificar autenticación
if (authService.isAuthenticated()) {
    const user = authService.getUser();
    
    // Verificar permisos
    if (authService.hasPermission('inventario', 'write')) {
        // Mostrar funcionalidad
    }
}

// Iniciar login
authService.login('gailen');
```

### Deployment

#### Variables de Entorno Requeridas
```bash
OAUTH_ENABLED=true
JWT_SECRET=clave-secreta-jwt
SECRET_KEY=clave-secreta-flask
GOOGLE_CLIENT_ID=client-id-oauth
GOOGLE_CLIENT_SECRET=client-secret-oauth
```

#### Configuración de Producción
- Dominio personalizado configurado en Google Cloud
- HTTPS obligatorio para OAuth
- Configuración de CORS para dominio de producción
- Variables de entorno seguras en App Engine

### Herramientas de Desarrollo
- **Setup Script**: `python claude_tools/setup_oauth.py` - Configuración inicial automática
- **Testing Local**: Usar `http://localhost:8080` como redirect URI para desarrollo
- **Logs de Debug**: Habilitados en modo desarrollo para troubleshooting OAuth

### Próximos Pasos
- [ ] Agregar soporte para Microsoft EntraID/Azure AD
- [ ] Implementar MFA (Multi-Factor Authentication)
- [ ] Dashboard de administración web para gestión de usuarios
- [ ] Integración con Active Directory on-premises
- [ ] Políticas de contraseñas y rotación de tokens