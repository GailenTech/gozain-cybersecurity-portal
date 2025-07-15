# Configuración OAuth Consent Screen - Guía Paso a Paso

## 🎯 Objetivo
Configurar la pantalla de consentimiento OAuth en Google Cloud Console para completar la integración de autenticación.

## 📋 Información del Proyecto
- **Project ID**: `inventario-iso27001-20250708`
- **Client ID**: `687354193398-jqhmggpmp2pmi0jcfi0edgcv9c0ibe7a.apps.googleusercontent.com`
- **Organización**: Gailen Tecnologías
- **Dominios**: `gailen.com`, `gailentecnologias.com`

## 🔧 Pasos para Configurar Consent Screen

### 1. Acceder a Google Cloud Console
```
URL: https://console.cloud.google.com/auth/branding?project=inventario-iso27001-20250708
```

### 2. Configuración Básica de la Aplicación

#### Información de la Aplicación:
- **App name**: `Sistema de Inventario ISO 27001`
- **User support email**: `jorge.uriarte@gailen.es`
- **App logo**: (Opcional - subir logo de Gailen si está disponible)

#### Developer contact information:
- **Email addresses**: `jorge.uriarte@gailen.es`

### 3. Configuración de Dominios

#### Authorized domains:
```
gailen.com
gailentecnologias.com
localhost (solo para desarrollo)
```

### 4. Scopes Necesarios

Agregar los siguientes scopes:
- `../auth/userinfo.email` - Para obtener el email del usuario
- `../auth/userinfo.profile` - Para obtener información básica del perfil
- `openid` - Para autenticación OpenID Connect

### 5. Test Users (Durante Desarrollo)

Agregar usuarios de prueba:
- `jorge.uriarte@gailen.es`
- (Agregar otros emails de Gailen si es necesario)

## 🚀 URLs de Configuración Directas

### OAuth Consent Screen:
```
https://console.cloud.google.com/auth/branding?project=inventario-iso27001-20250708
```

### OAuth Credentials:
```
https://console.cloud.google.com/auth/credentials?project=inventario-iso27001-20250708
```

### API Library:
```
https://console.cloud.google.com/apis/library?project=inventario-iso27001-20250708
```

## ✅ Lista de Verificación

- [ ] Configurar información básica de la aplicación
- [ ] Agregar dominios autorizados
- [ ] Configurar scopes necesarios
- [ ] Agregar usuarios de prueba
- [ ] Verificar configuración de credenciales OAuth
- [ ] Confirmar que Google+ API está habilitada
- [ ] Probar flujo OAuth localmente

## 🔍 Verificar APIs Habilitadas

Asegurar que estas APIs están habilitadas:
- **Google+ API** (para información de usuario)
- **OAuth2 API** (para autenticación)

## 📝 Configuración Detallada

### App Information:
```
App name: Sistema de Inventario ISO 27001
User support email: jorge.uriarte@gailen.es
App domain: https://gozain-687354193398.us-central1.run.app
Privacy Policy: https://gozain-687354193398.us-central1.run.app/privacy
Terms of Service: https://gozain-687354193398.us-central1.run.app/terms
```

### Developer Contact:
```
Email: jorge.uriarte@gailen.es
```

### Authorized Domains:
```
gailen.com
gailentecnologias.com
us-central1.run.app (para Cloud Run)
```

## 🧪 Proceso de Testing

### 1. Verificación Local
```bash
# Ejecutar servidor local
./test_local.sh

# Probar en: http://localhost:8080
# Intentar login con usuario de Gailen
```

### 2. Verificación en Producción
```bash
# Desplegar a producción
./deploy_gcp.sh

# Probar en: https://gozain-687354193398.us-central1.run.app
```

## ⚠️ Problemas Comunes

### Error: "This app isn't verified"
- **Causa**: Consent screen no está publicado
- **Solución**: Publicar la aplicación o usar usuarios de prueba

### Error: "redirect_uri_mismatch"
- **Causa**: URL de redirección no coincide
- **Solución**: Verificar URLs en credenciales OAuth

### Error: "access_denied"
- **Causa**: Usuario no tiene permisos
- **Solución**: Agregar usuario a lista de prueba

## 📚 Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/6158849)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## 🎯 Siguiente Paso

Después de completar esta configuración, ejecutar:
```bash
python claude_tools/test_oauth_flow.py
```

---

**Creado**: 15 de julio de 2025
**Proyecto**: inventario-iso27001-20250708
**Actualizar**: Después de cada cambio en configuración