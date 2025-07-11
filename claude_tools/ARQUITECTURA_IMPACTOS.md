# Arquitectura del Sistema de Impactos

## 1. Visión General

El sistema de impactos actúa como una **capa de orquestación** sobre los APIs CRUD existentes del inventario de activos. Este diseño permite automatizar procesos de negocio complejos sin duplicar la lógica de gestión de activos.

```
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Presentación                     │
│  (UI de Impactos - Menú lateral independiente)             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                 Capa de Orquestación                        │
│              (Sistema de Impactos)                          │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Plantillas │ │ Procesador   │ │ Gestor de    │        │
│  │  de Impacto │ │ de Impactos  │ │ Tareas       │        │
│  └─────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                   Capa de Negocio                           │
│               (APIs CRUD Existentes)                        │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ API Activos │ │ API Usuarios │ │ API Auditoría│        │
│  │  (interno)  │ │   (interno)  │ │   (interno)  │        │
│  └─────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                   Capa de Datos                             │
│              (Google Cloud Storage)                         │
└─────────────────────────────────────────────────────────────┘
```

## 2. Principios de Diseño

### 2.1 Separación de Responsabilidades
- **Sistema de Impactos**: Orquestación y automatización de procesos
- **APIs CRUD**: Gestión individual de entidades (activos, usuarios, etc.)
- **Sin duplicación**: El sistema de impactos NO reimplementa lógica CRUD

### 2.2 Transaccionalidad
- Cada impacto se procesa como una transacción atómica
- Si falla cualquier operación, se revierten todos los cambios
- Registro completo de todas las acciones para auditoría

### 2.3 Extensibilidad
- Nuevos tipos de impacto sin modificar el core
- Plantillas configurables para cada tipo
- Reglas de negocio parametrizables

## 3. Componentes Principales

### 3.1 Módulo de Impactos (`impactos.py`)

```python
# Estructura del módulo principal
class ImpactManager:
    """Gestor principal de impactos"""
    
    def __init__(self, asset_service, user_service, audit_service):
        self.asset_service = asset_service
        self.user_service = user_service
        self.audit_service = audit_service
        self.template_manager = TemplateManager()
        self.processor = ImpactProcessor()
    
    def create_impact(self, impact_type, data, user):
        """Crea un nuevo impacto pendiente de procesamiento"""
        pass
    
    def process_impact(self, impact_id):
        """Procesa un impacto ejecutando todas sus acciones"""
        pass
    
    def rollback_impact(self, impact_id):
        """Revierte todas las acciones de un impacto"""
        pass
```

### 3.2 Servicios Internos

Para evitar duplicación, extraemos la lógica de negocio de los endpoints HTTP a servicios internos:

```python
# services/asset_service.py
class AssetService:
    """Servicio interno para gestión de activos"""
    
    def create_asset(self, asset_data, user, org_id):
        """Crea un activo sin pasar por HTTP"""
        # Lógica extraída del endpoint POST /api/activos
        pass
    
    def update_asset(self, asset_id, updates, user, org_id):
        """Actualiza un activo sin pasar por HTTP"""
        # Lógica extraída del endpoint PUT /api/activos/<id>
        pass
    
    def delete_asset(self, asset_id, user, org_id):
        """Elimina un activo sin pasar por HTTP"""
        # Lógica extraída del endpoint DELETE /api/activos/<id>
        pass
```

### 3.3 Procesador de Impactos

```python
class ImpactProcessor:
    """Procesa impactos de forma transaccional"""
    
    def execute(self, impact, services):
        """Ejecuta todas las acciones de un impacto"""
        executed_actions = []
        
        try:
            # Obtener plantilla activa
            template = self.get_active_template(impact.type)
            
            # Ejecutar acciones según plantilla
            for action in template.actions:
                result = self.execute_action(action, impact.data, services)
                executed_actions.append(result)
            
            # Generar tareas de seguimiento
            tasks = self.generate_tasks(template, impact)
            
            return {
                'success': True,
                'actions': executed_actions,
                'tasks': tasks
            }
            
        except Exception as e:
            # Rollback de acciones ejecutadas
            self.rollback_actions(executed_actions, services)
            raise
```

## 4. Integración con APIs Existentes

### 4.1 Refactoring de `app.py`

Los endpoints existentes se refactorizan para usar servicios internos:

```python
# app.py - ANTES
@app.route('/api/activos', methods=['POST'])
def crear_activo():
    # Lógica directa en el endpoint
    nuevo_activo = request.json
    nuevo_activo['id'] = str(uuid.uuid4())
    # ... más lógica ...
    datos['activos'].append(nuevo_activo)
    guardar_datos_org(org_id, datos)
    return jsonify({'success': True})

# app.py - DESPUÉS
@app.route('/api/activos', methods=['POST'])
def crear_activo():
    # Delegación a servicio interno
    org_id = request.headers.get('X-Organization-Id')
    user = request.json.get('usuario_registro', 'Sistema')
    
    asset_service = AssetService()
    result = asset_service.create_asset(
        asset_data=request.json,
        user=user,
        org_id=org_id
    )
    
    return jsonify(result)
```

### 4.2 Uso desde el Sistema de Impactos

```python
# En el procesador de impactos
def process_employee_onboarding(self, employee_data, services):
    """Procesa el alta de un empleado"""
    
    # 1. Crear laptop para el empleado
    laptop = services.asset.create_asset({
        'tipo_activo': 'Hardware',
        'nombre': f'Laptop - {employee_data["nombre"]}',
        'responsable': employee_data['nombre'],
        'departamento': employee_data['departamento'],
        'estado': 'Reservado',
        'criticidad': 'Normal'
    }, user='Sistema RRHH', org_id=employee_data['org_id'])
    
    # 2. Asignar licencias software
    licenses = ['Office 365', 'Antivirus', 'VPN']
    for license_name in licenses:
        services.asset.create_asset({
            'tipo_activo': 'Software e Información',
            'nombre': license_name,
            'responsable': employee_data['nombre'],
            'departamento': employee_data['departamento'],
            'estado': 'Activo',
            'licencia': 'Corporativa'
        }, user='Sistema RRHH', org_id=employee_data['org_id'])
    
    # 3. Si es remoto, kit adicional
    if employee_data.get('es_remoto'):
        services.asset.create_asset({
            'tipo_activo': 'Hardware',
            'nombre': f'Kit Remoto - {employee_data["nombre"]}',
            'responsable': employee_data['nombre'],
            'descripcion': 'Monitor, teclado, mouse, webcam',
            'estado': 'Reservado'
        }, user='Sistema RRHH', org_id=employee_data['org_id'])
    
    return {
        'laptop_id': laptop['id'],
        'licenses_count': len(licenses),
        'remote_kit': employee_data.get('es_remoto', False)
    }
```

## 5. Flujo de Datos

### 5.1 Creación de Impacto

```
Usuario → UI Impactos → POST /api/impactos
                              ↓
                      ImpactManager.create_impact()
                              ↓
                      Validar datos con plantilla
                              ↓
                      Guardar impacto (estado: pendiente)
                              ↓
                      Mostrar vista previa de cambios
```

### 5.2 Procesamiento de Impacto

```
Usuario confirma → POST /api/impactos/{id}/procesar
                              ↓
                   ImpactManager.process_impact()
                              ↓
                   ImpactProcessor.execute()
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
  AssetService.create()                    TaskService.create()
  AssetService.update()                    NotificationService.send()
        ↓                                           ↓
        └─────────────────────┬─────────────────────┘
                              ↓
                   Guardar resultado en impacto
                              ↓
                   AuditService.log_impact()
```

## 6. Estructura de Archivos

```
/InventarioActivos/
├── app.py                          # Endpoints HTTP (refactorizado)
├── services/                       # Servicios internos (nuevo)
│   ├── __init__.py
│   ├── asset_service.py           # Lógica de activos extraída
│   ├── user_service.py            # Lógica de usuarios
│   └── audit_service.py           # Lógica de auditoría
├── impactos/                      # Sistema de impactos (nuevo)
│   ├── __init__.py
│   ├── manager.py                 # Gestor principal
│   ├── processor.py               # Procesador transaccional
│   ├── templates.py               # Gestor de plantillas
│   └── models.py                  # Modelos de datos
├── static/
│   ├── app.js                     # JS existente
│   ├── impactos.js               # JS para UI de impactos (nuevo)
│   └── impactos.html             # UI de impactos (nuevo)
└── templates/                     # Plantillas de impacto
    ├── alta_empleado.json
    ├── baja_empleado.json
    └── alta_cliente.json
```

## 7. Ejemplo de Plantilla

```json
{
  "id": "alta_empleado",
  "nombre": "Alta de Empleado",
  "version": 1,
  "campos": [
    {
      "id": "nombre_completo",
      "tipo": "text",
      "label": "Nombre Completo",
      "requerido": true
    },
    {
      "id": "departamento",
      "tipo": "select",
      "label": "Departamento",
      "opciones": ["Ventas", "IT", "RRHH", "Finanzas"],
      "requerido": true
    },
    {
      "id": "es_remoto",
      "tipo": "boolean",
      "label": "Trabajo Remoto",
      "default": false
    }
  ],
  "acciones": [
    {
      "tipo": "crear_activo",
      "condicion": "true",
      "datos": {
        "tipo_activo": "Hardware",
        "nombre": "Laptop - {{nombre_completo}}",
        "responsable": "{{nombre_completo}}",
        "departamento": "{{departamento}}"
      }
    },
    {
      "tipo": "crear_activo",
      "condicion": "es_remoto == true",
      "datos": {
        "tipo_activo": "Hardware",
        "nombre": "Kit Remoto - {{nombre_completo}}",
        "descripcion": "Monitor, teclado, mouse, webcam"
      }
    }
  ],
  "tareas": [
    {
      "descripcion": "Preparar equipo para {{nombre_completo}}",
      "responsable": "IT",
      "dias_limite": -1
    },
    {
      "descripcion": "Entregar equipo a {{nombre_completo}}",
      "responsable": "RRHH",
      "dias_limite": 0
    }
  ]
}
```

## 8. Ventajas de esta Arquitectura

1. **Sin duplicación**: Reutiliza toda la lógica existente
2. **Mantenibilidad**: Cambios en lógica CRUD se reflejan automáticamente
3. **Testeable**: Servicios internos facilitan testing unitario
4. **Escalable**: Nuevos tipos de impacto sin tocar el core
5. **Auditable**: Trazabilidad completa de todas las acciones
6. **Reversible**: Capacidad de rollback transaccional

## 9. Migración Incremental

### Fase 1: Refactoring de servicios (1 semana)
- Extraer lógica de endpoints a servicios
- Mantener compatibilidad total con UI existente

### Fase 2: Sistema de impactos básico (2 semanas)
- Implementar gestor y procesador
- Crear UI desde menú lateral
- Plantillas hardcodeadas

### Fase 3: Plantillas dinámicas (1 semana)
- Sistema de plantillas configurables
- Editor de plantillas

### Fase 4: Características avanzadas (2 semanas)
- Tareas automáticas
- Notificaciones
- Dashboard de impactos

## 10. Conclusión

Esta arquitectura permite implementar el sistema de impactos de forma modular e independiente, reutilizando toda la infraestructura existente y manteniendo la coherencia del sistema completo.