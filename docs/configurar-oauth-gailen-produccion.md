# Configuración OAuth para Gailen en Producción

## Estado Actual ✅

1. **Datos limpios**: Se han eliminado todos los datos de prueba
2. **Estructura creada**: Directorio `data/gailen/` con archivos inicializados vacíos
3. **Script actualizado**: `deploy_gcp.sh` genera automáticamente JWT_SECRET y FLASK_SECRET_KEY
4. **GitHub Actions**: Workflow actualizado para usar secrets de OAuth

## Pasos para Completar la Configuración OAuth

### 1. Configurar Google OAuth Console

1. Acceder a [Google Cloud Console](https://console.cloud.google.com)
2. Seleccionar el proyecto: `inventario-iso27001-20250708`
3. Ir a **APIs & Services > Credentials**
4. Crear nuevas credenciales OAuth 2.0:
   - **Application type**: Web application
   - **Name**: Gozain Gailen Production
   - **Authorized JavaScript origins**:
     ```
     https://gozain-dot-inventario-iso27001-20250708.uc.r.appspot.com
     https://inventario.gailentecnologias.com
     http://localhost:8080
     ```
   - **Authorized redirect URIs**:
     ```
     https://gozain-dot-inventario-iso27001-20250708.uc.r.appspot.com/api/auth/callback
     https://inventario.gailentecnologias.com/api/auth/callback
     http://localhost:8080/api/auth/callback
     ```

### 2. Actualizar Credenciales en organizaciones.json

```bash
# Editar el archivo
nano data/organizaciones.json

# Buscar la sección de gailen y actualizar:
"client_id": "TU_CLIENT_ID_REAL",
"client_secret": "TU_CLIENT_SECRET_REAL",
```

### 3. Desplegar a Producción

```bash
# El script generará automáticamente las claves JWT si no existen
./deploy_gcp.sh

# IMPORTANTE: Guardar las claves que se muestran:
# JWT_SECRET=xxxxx
# FLASK_SECRET_KEY=xxxxx
```

### 4. Configurar GitHub Secrets (para CI/CD)

En el repositorio de GitHub:
1. Settings → Secrets and variables → Actions
2. Crear los siguientes secrets:
   - `JWT_SECRET`: (usar la clave generada en el paso 3)
   - `FLASK_SECRET_KEY`: (usar la clave generada en el paso 3)

### 5. Verificar Dominios Permitidos

El sistema está configurado para aceptar usuarios de:
- `@gailen.es`
- `@gailen.com`
- `@gailentecnologias.com`

### 6. Probar el Sistema

1. Acceder a la URL de producción
2. Hacer clic en "Iniciar Sesión"
3. Seleccionar "Gailen Tecnologías"
4. Iniciar sesión con una cuenta de Google con dominio permitido
5. Verificar que se crea el usuario y se puede acceder al sistema

## Estructura de Datos Actual

```
data/
├── gailen/                    # Organización Gailen (vacía, lista para usar)
│   ├── inventario.json       # Inventario de activos
│   ├── impactos.json         # Gestión de impactos
│   └── madurez_assessments.json  # Evaluaciones de madurez
├── demo/                      # Organización Demo (mantenida para pruebas)
├── organizaciones.json        # Configuración de organizaciones
├── users.json                 # Usuarios del sistema (vacío)
├── sessions.json              # Sesiones activas (vacío)
└── audit_logs.json           # Logs de auditoría (vacío)
```

## Seguridad

- **JWT_SECRET**: Se genera automáticamente, debe guardarse de forma segura
- **FLASK_SECRET_KEY**: Se genera automáticamente, debe guardarse de forma segura
- **OAuth Secrets**: Nunca deben commitearse al repositorio
- **Validación de dominio**: Solo usuarios con dominios permitidos pueden acceder

## Siguiente Paso Crítico

⚠️ **ACTUALIZAR `data/organizaciones.json`** con las credenciales OAuth reales antes de que los usuarios puedan autenticarse con Google.