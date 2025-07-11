# Gozain - Portal de Ciberseguridad

Sistema modular integrado para la gestión de ciberseguridad conforme a ISO 27001.

## Características

- **Arquitectura Modular**: Aplicaciones independientes con navegación fluida
- **Multi-tenant**: Soporte para múltiples organizaciones
- **Inventario de Activos**: Gestión completa de activos ISO 27001
- **Impactos de Negocio**: Automatización de cambios y procesos
- **Evaluación de Madurez**: (Próximamente) Análisis de madurez ISO 27001

## Arquitectura

```
gozain/
├── core/              # Servicios compartidos
├── apps/              # Módulos de aplicación
│   ├── shell/        # Aplicación principal
│   ├── inventario/   # Gestión de activos
│   └── impactos/     # Gestión de impactos
├── backend/          # API Flask unificada
└── static/           # Recursos estáticos
```

## Requisitos

- Python 3.9+
- Node.js 14+ (opcional, para desarrollo)
- Google Cloud SDK (para despliegue)

## Instalación Local

1. Clonar el repositorio:
```bash
git clone <repositorio>
cd gozain
```

2. Ejecutar en modo desarrollo:
```bash
./test_local.sh
```

3. Acceder a http://localhost:8080

## Despliegue en Google Cloud

1. Configurar credenciales:
```bash
gcloud auth login
```

2. Ejecutar script de despliegue:
```bash
./deploy_gcp.sh
```

El script creará automáticamente el proyecto y desplegará en Cloud Run.

## Uso

1. **Seleccionar Organización**: Elegir o crear una organización
2. **Navegar entre Módulos**: Usar el menú lateral
3. **Gestionar Activos**: Crear, editar y auditar activos
4. **Procesar Impactos**: Automatizar cambios masivos

## Módulos Disponibles

### Inventario de Activos
- Gestión CRUD de activos
- Clasificación de seguridad
- Niveles de criticidad
- Auditoría completa
- Importación/exportación

### Impactos de Negocio
- Alta/baja de empleados
- Gestión de clientes
- Cambios organizacionales
- Automatización de procesos
- Generación de tareas

## Desarrollo

### Estructura de un Módulo

```javascript
// apps/mimodulo/index.js
export default class MiModuloApp {
    constructor(options) {
        this.container = options.container;
        this.services = options.services;
    }
    
    async mount() {
        // Inicializar módulo
    }
    
    async unmount() {
        // Limpiar recursos
    }
}
```

### Agregar un Nuevo Módulo

1. Crear directorio en `apps/`
2. Implementar clase del módulo
3. Crear `manifest.json`
4. Registrar en shell principal

## API

La API REST está disponible en `/api` con los siguientes endpoints principales:

- `/api/organizaciones` - Gestión de organizaciones
- `/api/inventario/*` - Gestión de activos
- `/api/impactos/*` - Gestión de impactos

## Contribuir

1. Fork del proyecto
2. Crear rama de feature
3. Commit de cambios
4. Push a la rama
5. Crear Pull Request

## Licencia

Propietario - Todos los derechos reservados