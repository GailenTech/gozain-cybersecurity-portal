# Especificación del Sistema de Gestión de Impactos de Negocio

## 1. Resumen Ejecutivo

### 1.1 Objetivo
Desarrollar un sistema integrado de gestión de impactos que automatice los cambios en el inventario de activos derivados de eventos de negocio, asegurando la trazabilidad completa y el cumplimiento de ISO 27001.

### 1.2 Alcance
El sistema permitirá gestionar impactos relacionados con:
- Gestión de personal (altas, bajas, cambios)
- Gestión de clientes (nuevos contratos, finalizaciones)
- Cambios en infraestructura tecnológica
- Procesos de auditoría y compliance

### 1.3 Beneficios Esperados
- Reducción del 80% en tiempo de procesamiento de cambios
- Eliminación de errores manuales en asignación de activos
- Trazabilidad completa para auditorías ISO 27001
- Estandarización de procesos entre organizaciones

## 2. Definiciones y Conceptos

### 2.1 Glosario

| Término | Definición |
|---------|------------|
| **Impacto** | Evento de negocio que genera cambios automáticos en el inventario de activos |
| **Plantilla** | Conjunto predefinido de reglas y activos para un tipo de impacto |
| **Kit de activos** | Grupo de activos que se asignan como conjunto |
| **Procesamiento** | Ejecución automática de cambios derivados de un impacto |
| **Tarea derivada** | Acción manual requerida después del procesamiento automático |

### 2.2 Tipos de Impactos

#### 2.2.1 Impactos de Personal
- **IMP-PER-001**: Alta de empleado
- **IMP-PER-002**: Baja de empleado
- **IMP-PER-003**: Cambio de departamento
- **IMP-PER-004**: Inicio de período de prácticas
- **IMP-PER-005**: Cambio de modalidad (presencial/remoto)

#### 2.2.2 Impactos de Cliente
- **IMP-CLI-001**: Alta de cliente nuevo
- **IMP-CLI-002**: Baja de cliente
- **IMP-CLI-003**: Cambio de plan/servicio
- **IMP-CLI-004**: Renovación de contrato

#### 2.2.3 Impactos de Infraestructura
- **IMP-INF-001**: Renovación masiva de equipos
- **IMP-INF-002**: Implementación de nuevo software
- **IMP-INF-003**: Migración de plataforma
- **IMP-INF-004**: Actualización de licencias

## 3. Requisitos Funcionales

### 3.1 Gestión de Impactos

#### RF-001: Crear Nuevo Impacto
**Descripción**: El usuario debe poder crear un nuevo impacto seleccionando el tipo y completando los datos requeridos.

**Criterios de aceptación**:
- Mostrar lista de tipos de impacto disponibles
- Formulario dinámico según el tipo seleccionado
- Validación en tiempo real de campos
- Vista previa de cambios antes de confirmar

#### RF-002: Procesar Impacto
**Descripción**: El sistema debe procesar automáticamente los cambios definidos en el impacto.

**Criterios de aceptación**:
- Ejecución transaccional (todo o nada)
- Registro detallado de cada acción
- Notificación de resultado
- Posibilidad de rollback en caso de error

#### RF-003: Consultar Historial de Impactos
**Descripción**: Visualizar todos los impactos procesados con sus detalles.

**Criterios de aceptación**:
- Filtros por tipo, fecha, estado, usuario
- Exportación a Excel/CSV
- Vista detallada de acciones ejecutadas
- Integración con auditoría general

### 3.2 Gestión de Plantillas

#### RF-004: Configurar Plantillas
**Descripción**: Administrador puede crear y modificar plantillas de impacto.

**Criterios de aceptación**:
- Editor visual de plantillas
- Definición de campos requeridos
- Configuración de kits de activos
- Reglas condicionales

#### RF-005: Versionado de Plantillas
**Descripción**: Mantener historial de versiones de plantillas.

**Criterios de aceptación**:
- Guardar versión al modificar
- Permitir activar versión anterior
- Comparar versiones
- Auditoría de cambios

### 3.3 Gestión de Tareas

#### RF-006: Generar Tareas Automáticas
**Descripción**: Crear tareas de seguimiento según el tipo de impacto.

**Criterios de aceptación**:
- Asignación automática de responsable
- Fecha límite calculada
- Notificaciones por email
- Integración con calendario

#### RF-007: Dashboard de Tareas
**Descripción**: Vista consolidada de tareas pendientes por impactos.

**Criterios de aceptación**:
- Agrupación por responsable
- Indicadores de vencimiento
- Marcar como completada
- Comentarios y evidencias

## 4. Requisitos No Funcionales

### 4.1 Rendimiento
- **RNF-001**: Procesamiento de impacto simple < 3 segundos
- **RNF-002**: Procesamiento de impacto masivo < 30 segundos
- **RNF-003**: Carga de dashboard < 2 segundos

### 4.2 Seguridad
- **RNF-004**: Logs de auditoría inmutables
- **RNF-005**: Segregación de funciones por rol
- **RNF-006**: Encriptación de datos sensibles

### 4.3 Disponibilidad
- **RNF-007**: Disponibilidad 99.9% en horario laboral
- **RNF-008**: Backup automático cada hora
- **RNF-009**: Recovery Point Objective (RPO) < 1 hora

### 4.4 Usabilidad
- **RNF-010**: Interfaz responsive
- **RNF-011**: Accesibilidad WCAG 2.1 AA
- **RNF-012**: Soporte multiidioma

## 5. Modelo de Datos

### 5.1 Entidad: impactos

```sql
CREATE TABLE impactos (
    id UUID PRIMARY KEY,
    organizacion_id VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_procesamiento TIMESTAMP,
    usuario_creador VARCHAR(100) NOT NULL,
    datos JSONB NOT NULL,
    acciones_ejecutadas JSONB,
    tareas_generadas JSONB,
    version_plantilla INTEGER,
    comentarios TEXT,
    
    CONSTRAINT fk_organizacion 
        FOREIGN KEY(organizacion_id) 
        REFERENCES organizaciones(id),
    
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_creacion)
);
```

### 5.2 Entidad: plantillas_impacto

```sql
CREATE TABLE plantillas_impacto (
    id UUID PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    version INTEGER NOT NULL,
    activa BOOLEAN DEFAULT true,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    campos_requeridos JSONB NOT NULL,
    kit_activos JSONB NOT NULL,
    reglas_procesamiento JSONB,
    tareas_automaticas JSONB,
    fecha_creacion TIMESTAMP NOT NULL,
    usuario_creador VARCHAR(100) NOT NULL,
    
    UNIQUE KEY uk_tipo_version (tipo, version),
    INDEX idx_tipo_activa (tipo, activa)
);
```

### 5.3 Entidad: tareas_impacto

```sql
CREATE TABLE tareas_impacto (
    id UUID PRIMARY KEY,
    impacto_id UUID NOT NULL,
    tipo_tarea VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    responsable VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_limite TIMESTAMP,
    fecha_completado TIMESTAMP,
    estado VARCHAR(20) NOT NULL,
    evidencias JSONB,
    comentarios TEXT,
    
    CONSTRAINT fk_impacto 
        FOREIGN KEY(impacto_id) 
        REFERENCES impactos(id),
    
    INDEX idx_responsable_estado (responsable, estado),
    INDEX idx_fecha_limite (fecha_limite)
);
```

## 6. Interfaces de Usuario

### 6.1 Pantalla: Nuevo Impacto

```
┌─ Nuevo Impacto de Negocio ─────────────────────────────────────┐
│                                                                 │
│  Tipo de Impacto*                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▼ Seleccione un tipo de impacto                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Área de formulario dinámico]                                  │
│                                                                 │
│  ┌─ Vista Previa de Cambios ─────────────────────────────┐     │
│  │ • Se crearán 3 nuevos activos                         │     │
│  │ • Se actualizará 1 activo existente                   │     │
│  │ • Se generarán 2 tareas de seguimiento                │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
│  □ He revisado los cambios y confirmo su ejecución             │
│                                                                 │
│  [Cancelar]                    [Guardar Borrador] [Procesar →]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Pantalla: Dashboard de Impactos

```
┌─ Gestión de Impactos ──────────────────────────────────────────┐
│                                                                 │
│  [🔍 Buscar] [Tipo ▼] [Estado ▼] [Fecha ▼]  [+ Nuevo Impacto]  │
│                                                                 │
│  ┌─ Resumen ──────────────────────────────────────────────┐    │
│  │ Hoy: 5 procesados | 2 pendientes | 1 error            │    │
│  │ Semana: 23 procesados | 5 pendientes | 2 errores      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────┬───────────┬──────────┬─────────┬────────────┐    │
│  │ ID      │ Tipo      │ Usuario  │ Fecha   │ Estado     │    │
│  ├─────────┼───────────┼──────────┼─────────┼────────────┤    │
│  │ IMP-001 │ Alta emp. │ Juan P.  │ Hoy     │ ✓ Proces.  │    │
│  │ IMP-002 │ Baja cli. │ María G. │ Hoy     │ ⏳ Pend.   │    │
│  │ IMP-003 │ Nuevo SW  │ Admin    │ Ayer    │ ❌ Error   │    │
│  └─────────┴───────────┴──────────┴─────────┴────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 7. APIs

### 7.1 Endpoints Principales

#### POST /api/impactos
Crear nuevo impacto

**Request:**
```json
{
  "tipo": "alta_empleado",
  "datos": {
    "nombre_completo": "Juan Pérez García",
    "departamento": "Ventas",
    "fecha_inicio": "2025-01-15",
    "es_remoto": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "impacto_id": "550e8400-e29b-41d4-a716-446655440000",
  "estado": "pendiente",
  "vista_previa": {
    "activos_crear": 3,
    "activos_modificar": 0,
    "tareas_generar": 2
  }
}
```

#### POST /api/impactos/{id}/procesar
Procesar impacto pendiente

**Response:**
```json
{
  "success": true,
  "resultado": {
    "activos_creados": [
      {"id": "...", "tipo": "Hardware", "nombre": "Laptop Dell"}
    ],
    "activos_modificados": [],
    "tareas_creadas": [
      {"id": "...", "descripcion": "Entregar equipo"}
    ]
  },
  "tiempo_procesamiento": 2.5
}
```

#### GET /api/impactos
Listar impactos con filtros

**Query params:**
- tipo: string
- estado: string
- fecha_desde: date
- fecha_hasta: date
- usuario: string

#### GET /api/plantillas/{tipo}
Obtener plantilla activa para un tipo

#### GET /api/tareas
Listar tareas pendientes del usuario

## 8. Casos de Uso Detallados

### 8.1 CU-001: Alta de Empleado

**Actor**: Recursos Humanos

**Precondiciones**:
- Usuario autenticado con rol RRHH
- Datos del empleado disponibles

**Flujo Principal**:
1. Usuario selecciona "Nuevo Impacto"
2. Selecciona tipo "Alta de empleado"
3. Sistema muestra formulario con campos:
   - Nombre completo*
   - Email corporativo*
   - Departamento*
   - Cargo*
   - Fecha de inicio*
   - Modalidad (presencial/remoto/híbrido)*
   - Necesita equipo móvil (sí/no)
4. Usuario completa información
5. Sistema muestra vista previa:
   - Laptop a asignar según política
   - Licencias estándar (Office 365, Antivirus)
   - Accesos básicos
   - Kit adicional si es remoto
6. Usuario confirma
7. Sistema procesa:
   - Crea activos con estado "Reservado"
   - Asigna responsable = nuevo empleado
   - Genera tareas:
     - IT: Preparar equipo (fecha límite: 1 día antes)
     - RRHH: Entregar kit (fecha límite: día de inicio)
   - Envía notificaciones
8. Sistema muestra confirmación

**Flujos Alternativos**:
- 4a. Empleado es practicante:
  - Sistema aplica plantilla temporal
  - Agrega fecha fin de asignación
- 7a. No hay laptops disponibles:
  - Sistema crea tarea urgente para compras
  - Notifica al usuario

**Postcondiciones**:
- Activos reservados para el empleado
- Tareas creadas y asignadas
- Registro en auditoría

### 8.2 CU-002: Baja de Cliente

**Actor**: Account Manager

**Precondiciones**:
- Cliente activo en sistema
- Usuario con permisos sobre cliente

**Flujo Principal**:
1. Usuario selecciona "Nuevo Impacto"
2. Selecciona tipo "Baja de cliente"
3. Sistema muestra:
   - Selector de cliente*
   - Fecha efectiva de baja*
   - Motivo*
   - Checklist de devoluciones
4. Sistema muestra resumen:
   - Activos asignados al cliente
   - Documentos a archivar
   - Accesos a revocar
5. Usuario confirma checklist
6. Sistema procesa:
   - Cambia estado activos a "Por devolver"
   - Programa revocación de accesos
   - Genera tareas:
     - Legal: Archivar documentación
     - IT: Backup y eliminación de datos
     - Finanzas: Liquidación final
7. Sistema confirma y envía resumen

**Postcondiciones**:
- Cliente marcado como inactivo
- Activos liberados tras confirmación
- Cumplimiento GDPR iniciado

## 9. Reglas de Negocio

### 9.1 Reglas Generales
- **RN-001**: Todo impacto debe tener trazabilidad completa
- **RN-002**: Los impactos no pueden eliminarse, solo cancelarse
- **RN-003**: Cambios en plantillas no afectan impactos procesados

### 9.2 Reglas por Tipo

#### Alta de Empleado
- **RN-AE-001**: Laptop obligatoria para todos excepto practicantes < 3 meses
- **RN-AE-002**: Kit remoto solo si modalidad incluye trabajo desde casa
- **RN-AE-003**: Máximo 1 laptop y 1 móvil por empleado activo

#### Baja de Empleado
- **RN-BE-001**: Todos los activos deben devolverse en 5 días hábiles
- **RN-BE-002**: Accesos se revocan el mismo día de la baja
- **RN-BE-003**: Backup obligatorio de información antes de eliminar

#### Alta de Cliente
- **RN-AC-001**: Carpeta física y digital obligatorias
- **RN-AC-002**: Asignación de account manager requerida
- **RN-AC-003**: SLA debe definirse en primeros 30 días

## 10. Plan de Implementación

### Fase 1: Fundación (4 semanas)
- Modelo de datos base
- CRUD de impactos
- Plantillas hardcodeadas para alta/baja empleado
- UI básica de creación
- Motor de procesamiento simple

### Fase 2: Plantillas (3 semanas)
- Sistema de plantillas configurables
- Editor de plantillas
- Versionado
- Reglas condicionales básicas

### Fase 3: Procesamiento Avanzado (4 semanas)
- Transacciones complejas
- Rollback automático
- Procesamiento asíncrono
- Notificaciones email

### Fase 4: Integraciones (3 semanas)
- API REST completa
- Webhooks
- Integración con calendario
- Exportación avanzada

### Fase 5: Optimización (2 semanas)
- Performance tuning
- UI/UX refinements
- Documentación
- Capacitación

## 11. Métricas de Éxito

### 11.1 KPIs Técnicos
- Tiempo medio de procesamiento < 5 segundos
- Tasa de error < 0.1%
- Disponibilidad > 99.9%

### 11.2 KPIs de Negocio
- Reducción 80% tiempo gestión de cambios
- 100% trazabilidad para auditorías
- Satisfacción usuarios > 4.5/5
- ROI positivo en 6 meses

### 11.3 Métricas de Adopción
- 90% de cambios vía sistema en 3 meses
- < 5% de rollbacks manuales
- Tiempo medio de capacitación < 2 horas

## 12. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Resistencia al cambio | Alta | Medio | Capacitación intensiva, champions por área |
| Complejidad de reglas | Media | Alto | Implementación gradual, validación con usuarios |
| Performance con volumen | Baja | Alto | Arquitectura escalable, procesamiento asíncrono |
| Integridad de datos | Media | Alto | Transacciones ACID, auditoría completa |

## 13. Anexos

### 13.1 Mockups Adicionales
[Incluir enlaces a diseños detallados]

### 13.2 Diagramas de Flujo
[Incluir diagramas de procesos]

### 13.3 Matriz de Trazabilidad
[Mapeo requisitos - implementación]

---

**Documento preparado por**: Sistema de Especificaciones  
**Fecha**: 2025-01-08  
**Versión**: 1.0  
**Estado**: Borrador para revisión