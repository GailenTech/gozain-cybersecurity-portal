# Propuesta: Modelo Orientado a Procesos para Gestión de Activos ISO 27001

## Justificación

El modelo CRUD tradicional no refleja adecuadamente los procesos empresariales reales. En una organización, no se "edita" un activo arbitrariamente, sino que se ejecutan procesos específicos con:
- Flujos de aprobación
- Validaciones específicas
- Registros de auditoría detallados
- Notificaciones a partes interesadas

## Procesos Propuestos

### 1. **Alta de Activo** (Onboarding)
- **Trigger**: Compra, llegada de empleado, nuevo contrato
- **Flujo**:
  1. Solicitud de alta con justificación
  2. Aprobación por responsable de área
  3. Asignación de responsable
  4. Clasificación de seguridad
  5. Registro en inventario
  6. Notificación a interesados
- **Campos requeridos**: Justificación, presupuesto, proveedor

### 2. **Transferencia de Responsabilidad**
- **Trigger**: Cambio de empleado, reorganización
- **Flujo**:
  1. Solicitud de transferencia
  2. Aceptación del nuevo responsable
  3. Verificación del estado del activo
  4. Actualización de accesos
  5. Registro del cambio
- **Validaciones**: El nuevo responsable debe existir y estar activo

### 3. **Cambio de Ubicación**
- **Trigger**: Mudanza, trabajo remoto, cambio de sede
- **Flujo**:
  1. Solicitud con motivo
  2. Aprobación si es crítico
  3. Registro de salida
  4. Confirmación de llegada
  5. Actualización de seguros/seguridad
- **Consideraciones**: Activos críticos requieren aprobación adicional

### 4. **Mantenimiento/Actualización**
- **Trigger**: Calendario, incidencia, upgrade
- **Flujo**:
  1. Programación o solicitud
  2. Registro de inicio
  3. Documentación de cambios
  4. Pruebas si aplica
  5. Cierre con resultado
- **Estados**: Programado → En proceso → Completado/Fallido

### 5. **Incidencia de Seguridad**
- **Trigger**: Pérdida, robo, compromiso
- **Flujo**:
  1. Reporte inmediato
  2. Evaluación de impacto
  3. Acciones de contención
  4. Investigación
  5. Resolución y lecciones aprendidas
- **Prioridad**: Crítica con notificaciones automáticas

### 6. **Baja de Activo** (Offboarding)
- **Trigger**: Fin de vida útil, obsolescencia, daño
- **Flujo**:
  1. Solicitud de baja con motivo
  2. Aprobación según criticidad
  3. Borrado seguro si aplica
  4. Certificado de destrucción
  5. Archivo del expediente
- **Requisitos**: Evidencia de destrucción/reciclaje

### 7. **Auditoría Periódica**
- **Trigger**: Calendario (trimestral/anual)
- **Flujo**:
  1. Generación de lista por responsable
  2. Confirmación de existencia
  3. Verificación de estado
  4. Reporte de discrepancias
  5. Plan de acción si hay hallazgos
- **Automatización**: Recordatorios automáticos

### 8. **Renovación de Licencias/Contratos**
- **Trigger**: Proximidad de vencimiento
- **Flujo**:
  1. Alerta automática (30/60/90 días)
  2. Evaluación de continuidad
  3. Proceso de renovación o cambio
  4. Actualización de fechas
  5. Archivo de nueva documentación
- **Integraciones**: Calendario, sistema de compras

## Implementación Técnica

### Cambios en el Modelo de Datos

```json
{
  "proceso": {
    "id": "uuid",
    "tipo": "TRANSFERENCIA|BAJA|MANTENIMIENTO|...",
    "estado": "INICIADO|APROBADO|EN_PROCESO|COMPLETADO|RECHAZADO",
    "activo_id": "uuid",
    "solicitante": "usuario",
    "aprobador": "usuario",
    "fecha_solicitud": "datetime",
    "fecha_resolucion": "datetime",
    "datos_especificos": {
      // Campos según el tipo de proceso
    },
    "documentos_adjuntos": [],
    "comentarios": []
  }
}
```

### Interfaz de Usuario

1. **Vista de Procesos Pendientes**
   - Bandeja de entrada por rol
   - Acciones rápidas (aprobar/rechazar)
   - Filtros por tipo y urgencia

2. **Formularios Específicos por Proceso**
   - Campos dinámicos según el tipo
   - Validaciones contextuales
   - Adjuntar evidencias

3. **Timeline del Activo**
   - Vista cronológica de todos los procesos
   - Estado actual destacado
   - Próximas acciones requeridas

4. **Dashboard de Procesos**
   - Procesos pendientes por tipo
   - SLA y tiempos de respuesta
   - Alertas y vencimientos

### Beneficios del Modelo

1. **Trazabilidad Completa**: Cada cambio tiene contexto y justificación
2. **Control de Acceso Granular**: Permisos por proceso, no por tabla
3. **Cumplimiento Normativo**: Flujos alineados con ISO 27001
4. **Prevención de Errores**: Validaciones específicas por proceso
5. **Métricas Significativas**: Tiempos de proceso, cuellos de botella
6. **Automatización**: Notificaciones, escalados, recordatorios

### Procesos Adicionales a Considerar

- **Clasificación/Reclasificación**: Cambio en nivel de confidencialidad
- **Backup/Restore**: Para activos de información
- **Compartición Temporal**: Préstamo de equipos
- **Integración de Activos**: Fusión de sistemas
- **Evaluación de Riesgos**: Proceso periódico o por cambios

## Migración Gradual

1. **Fase 1**: Mantener CRUD + añadir capa de procesos
2. **Fase 2**: Migrar operaciones críticas a procesos
3. **Fase 3**: Deprecar acceso CRUD directo
4. **Fase 4**: Solo procesos para todas las operaciones

## Conclusión

Este modelo orientado a procesos:
- Refleja mejor la realidad operativa
- Facilita el cumplimiento de ISO 27001
- Mejora la experiencia del usuario
- Proporciona mejor información para auditorías
- Permite automatización inteligente

¿Te gustaría que implemente algunos de estos procesos en la aplicación?