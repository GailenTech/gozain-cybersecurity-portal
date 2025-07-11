# Sistema de Inventario de Activos ISO 27001

## Descripción del Proyecto

Sistema web para gestión de inventario de activos conforme a ISO 27001. Incluye clasificación de seguridad, niveles de criticidad, trazabilidad y auditoría.

## Stack Tecnológico

- **Backend**: Python 3.9 + Flask
- **Frontend**: JavaScript vanilla + Bootstrap 5
- **Base de Datos**: JSON (data/inventario.json)
- **Despliegue**: Google Cloud Run
- **Contenedores**: Docker
- **Notificaciones**: Slack

## Estructura del Proyecto

```
/InventarioActivos/
├── backend/                 # Backend modular Flask
│   ├── app.py              # Aplicación principal con GCS
│   └── modules/            # Módulos del sistema
│       ├── inventario/     # Servicio de inventario
│       ├── impactos/       # Servicio de impactos
│       └── storage/        # Servicio GCS
├── apps/                    # Frontend modular
│   ├── shell/              # Shell principal
│   ├── inventario/         # Módulo inventario
│   └── impactos/           # Módulo impactos
├── core/                    # Servicios compartidos
│   ├── api/                # Cliente API
│   └── services/           # Event bus, storage
├── requirements.txt         # Dependencias Python
├── Dockerfile              # Configuración Docker
├── deploy_gcp.sh           # Script de despliegue a GCP
├── test_local.sh           # Script para desarrollo local
├── test_full_system.sh     # Test completo del sistema
├── data/                   # Almacenamiento local
├── uploads/                # Archivos temporales
├── claude_tools/           # Herramientas auxiliares
├── cypress/                # Tests E2E
└── venv/                   # Entorno virtual Python
```

## Configuración de Despliegue

### Google Cloud Run
- **Project ID**: inventario-iso27001-20250708
- **Service Name**: inventario-activos
- **Region**: us-central1
- **URL**: Generada automáticamente por GCP

### Desarrollo Local
- Puerto: 8080
- Comando: `./test_local.sh` (usa backend/app.py)
- Test completo: `./test_full_system.sh`

## Comandos Principales

### Desarrollo Local
```bash
./test_local.sh
```

### Despliegue a Producción
```bash
./deploy_gcp.sh
```

### Actualizar Dependencias
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## Herramientas Claude

Las herramientas auxiliares están en `claude_tools/`:

- **slack_comunicacion.py**: Envío de notificaciones a Slack
- **analizar_excel.py**: Análisis de archivos Excel
- **monitor_slack.py**: Monitoreo de canales Slack
- **esperar_facturacion.py**: Espera activación de facturación GCP
- **gestor_principal.py**: Gestión de procesos principales

## Funcionalidades Principales

1. **Gestión de Activos**
   - Tipos: Hardware, Software, Servicio, Información, Personal
   - Estados: Activo, Inactivo, En mantenimiento
   - Clasificación: Público, Interno, Confidencial, Secreto
   - Criticidad: Baja, Normal, Importante, Crítica

2. **Operaciones**
   - CRUD completo de activos
   - Importación desde Excel/CSV
   - Exportación de datos
   - Auditoría de cambios
   - Filtros por tipo y departamento

3. **Seguridad**
   - Clasificación ISO 27001
   - Trazabilidad completa
   - Registro de auditoría

## Problemas Conocidos

1. **Filtro de Departamento** (Resuelto)
   - El frontend no enviaba el parámetro departamento a la API
   - Solución: Actualizado app.js para incluir departamento en la URL

## Flujo de Trabajo

1. **Desarrollo**
   - Activar entorno virtual
   - Hacer cambios en código
   - Probar localmente con `./test_local.sh`
   - NO hay control de versiones Git actualmente

2. **Despliegue**
   - Ejecutar `./deploy_gcp.sh`
   - Script automáticamente:
     - Habilita APIs necesarias
     - Construye imagen Docker
     - Despliega a Cloud Run
     - Notifica por Slack

## Notas Importantes

- **Sin Git**: El proyecto NO está en un repositorio Git
- **Datos en JSON**: No usar base de datos tradicional
- **Puerto en Producción**: 8080 (configurado en Dockerfile)
- **Puerto en Local**: 5001 (configurado en test_local.sh)
- **Notificaciones**: Se envían automáticamente a Slack en despliegue

## Pendientes

- Implementar control de versiones Git
- Migrar de CRUD a modelo orientado a procesos (ver propuesta_modelo_procesos.md)
- Mejorar sistema de backup de datos
- Implementar autenticación de usuarios

## Contexto ISO 27001

El sistema está diseñado para cumplir con requisitos de ISO 27001:
- Control de activos de información
- Clasificación de seguridad
- Evaluación de riesgos (criticidad)
- Trazabilidad y auditoría
- Responsabilidad asignada

## Debug y Troubleshooting

### Problemas de Filtros
- Verificar que `cargarActivos()` envíe todos los parámetros
- Comprobar que el backend filtre correctamente
- Los filtros usan búsqueda parcial case-insensitive

### Problemas de Despliegue
- Verificar facturación activa en GCP
- Comprobar permisos del proyecto
- Revisar logs en Cloud Console

### Archivos Estáticos
- Los cambios en app.js requieren recarga del navegador
- No hay proceso de build/bundling
- Archivos servidos directamente por Flask

## Recomendaciones de Desarrollo

- Recuerda hacer un incremento de version antes de cada build, y hacer que la versión sea visible al lado de la marca Gozain.