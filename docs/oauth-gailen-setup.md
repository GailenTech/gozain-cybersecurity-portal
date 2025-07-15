# Configuración OAuth para Gailen Tecnologías

## 1. Configuración en Google Cloud Console

### Paso 1: Crear Proyecto OAuth
1. Acceder a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto o usar existente: `gailen-inventario-oauth`
3. Habilitar Google+ API y Google Identity API

### Paso 2: Configurar Pantalla de Consentimiento
1. Ir a **APIs & Services > OAuth consent screen**
2. Seleccionar **External** (para usuarios fuera de la organización)
3. Configurar información de la aplicación:
   - **Application name**: Gozain - Sistema de Inventario de Activos
   - **User support email**: soporte@gailentecnologias.com
   - **Developer contact email**: desarrollo@gailentecnologias.com
   - **Authorized domains**: 
     - gailentecnologias.com
     - gailen.com
   - **Scopes**: email, profile, openid

### Paso 3: Crear Credenciales OAuth
1. Ir a **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Configurar:
   - **Application type**: Web application
   - **Name**: Gozain Inventario Activos
   - **Authorized JavaScript origins**:
     - `https://inventario.gailentecnologias.com`
     - `https://inventario-activos-dot-inventario-iso27001-20250708.uc.r.appspot.com`
     - `http://localhost:8080` (desarrollo)
   - **Authorized redirect URIs**:
     - `https://inventario.gailentecnologias.com/api/auth/callback`
     - `https://inventario-activos-dot-inventario-iso27001-20250708.uc.r.appspot.com/api/auth/callback`
     - `http://localhost:8080/api/auth/callback` (desarrollo)

### Paso 4: Obtener Credenciales
- **Client ID**: Se generará automáticamente
- **Client Secret**: Se generará automáticamente
- Descargar JSON de configuración

## 2. Configuración en la Aplicación

### Variables de Entorno
```bash
# OAuth Configuration
OAUTH_ENABLED=true
JWT_SECRET=tu-clave-secreta-jwt-muy-segura
SECRET_KEY=tu-clave-secreta-flask-muy-segura

# Google OAuth for Gailen
GOOGLE_CLIENT_ID=tu-client-id-de-google
GOOGLE_CLIENT_SECRET=tu-client-secret-de-google
```

### Actualizar organizaciones.json
El archivo ya está configurado con:
```json
{
  "gailen": {
    "id": "gailen",
    "nombre": "Gailen Tecnologías",
    "fecha_creacion": "2025-07-15T00:00:00",
    "activa": true,
    "oauth_config": {
      "provider": "google",
      "client_id": "ACTUALIZAR-CON-CLIENT-ID-REAL",
      "client_secret": "ACTUALIZAR-CON-CLIENT-SECRET-REAL",
      "allowed_domains": ["gailen.com", "gailentecnologias.com"],
      "require_domain_match": true,
      "custom_claims": {
        "department": "department",
        "role": "job_title"
      }
    },
    "seguridad": {
      "require_mfa": false,
      "session_timeout": 3600,
      "ip_whitelist": []
    }
  }
}
```

## 3. Configuración del Dominio

### DNS Records
Para usar `inventario.gailentecnologias.com`:

```
CNAME inventario ghs.googlehosted.com.
```

### Google App Engine Custom Domain
1. En Google Cloud Console, ir a **App Engine > Settings > Custom domains**
2. Agregar dominio: `inventario.gailentecnologias.com`
3. Verificar propiedad del dominio
4. Configurar SSL certificate (automático)

## 4. Despliegue

### Actualizar app.yaml
```yaml
runtime: python39

env_variables:
  OAUTH_ENABLED: "true"
  JWT_SECRET: "tu-clave-jwt-produccion"
  SECRET_KEY: "tu-clave-flask-produccion"
  GOOGLE_CLIENT_ID: "tu-client-id"
  GOOGLE_CLIENT_SECRET: "tu-client-secret"

handlers:
- url: /static
  static_dir: static
  secure: always

- url: /.*
  script: auto
  secure: always
```

### Script de Despliegue Actualizado
```bash
#!/bin/bash
# deploy_gcp_oauth.sh

echo "🚀 Desplegando con OAuth habilitado..."

# Variables
PROJECT_ID="inventario-iso27001-20250708"
SERVICE_NAME="inventario-activos"
REGION="us-central1"

# Configurar proyecto
gcloud config set project $PROJECT_ID

# Verificar variables de entorno
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ Error: GOOGLE_CLIENT_ID no está configurado"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Error: GOOGLE_CLIENT_SECRET no está configurado"
    exit 1
fi

# Construir y desplegar
gcloud app deploy --quiet

echo "✅ Despliegue completado con OAuth"
echo "🌐 URL: https://inventario.gailentecnologias.com"
```

## 5. Testing

### Usuarios de Prueba
1. Crear cuentas de Google con dominios permitidos:
   - `admin@gailentecnologias.com`
   - `usuario@gailen.com`

### Flujo de Prueba
1. Acceder a la aplicación
2. Click en "Iniciar Sesión"
3. Seleccionar organización "Gailen Tecnologías"
4. Click en "Continuar con Google"
5. Autorizar aplicación
6. Verificar redirección y creación de usuario
7. Verificar permisos y roles asignados

## 6. Monitoreo

### Logs de Auditoría
- Todos los logins quedan registrados en `/api/audit/logs`
- Incluye IP, user agent, y detalles de la sesión

### Métricas a Monitorear
- Intentos de login
- Logins exitosos vs fallidos
- Usuarios activos
- Sesiones por usuario
- Errores de autenticación

## 7. Seguridad

### Consideraciones
- JWT expira en 1 hora (configurable)
- Refresh tokens para renovación automática
- Validación de dominio obligatoria
- Logs de auditoría completos
- Revocación de sesiones

### Backup de Configuración
- Exportar credenciales OAuth regularmente
- Backup de archivo `organizaciones.json`
- Backup de `users.json` y `sessions.json`

## 8. Troubleshooting

### Errores Comunes
1. **"redirect_uri_mismatch"**: Verificar URIs en Google Console
2. **"access_denied"**: Usuario no tiene dominio permitido
3. **"invalid_client"**: Client ID/Secret incorrectos
4. **Token expirado**: Verificar renovación automática

### Comandos de Debug
```bash
# Ver logs de la aplicación
gcloud app logs tail -s inventario-activos

# Verificar configuración OAuth
curl -X GET "https://inventario.gailentecnologias.com/api/auth/providers?org_id=gailen"

# Verificar organizaciones
curl -X GET "https://inventario.gailentecnologias.com/api/organizations"
```

Este documento debe ser actualizado cuando se obtengan las credenciales reales de Google OAuth.