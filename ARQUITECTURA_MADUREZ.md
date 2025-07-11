# Arquitectura del Módulo de Madurez en Ciberseguridad

## Análisis del Requisito

### Funcionalidades Principales
1. **Cuestionarios configurables** por organización
2. **Estados del assessment**: abierto, cerrado, firmado
3. **Histórico de assessments** con progresión temporal
4. **Visualizaciones**: radar, líneas de tiempo, gaps, progresión
5. **Persistencia** en JSON por organización

### Estructura de Datos Identificada

```javascript
// Configuración de Cuestionario (template)
{
  "id": "cuestionario_v1_2024",
  "version": "1.0",
  "fecha_creacion": "2024-01-01",
  "dominios": [
    {
      "id": "proteccion_acceso",
      "nombre": "Protección de acceso", 
      "preguntas": [
        {
          "id": "p1",
          "texto": "¿Todos los empleados utilizan contraseñas únicas y seguras?",
          "tipo": "escala", // escala, si_no, multiple
          "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
          "valores": [1, 2, 3, 4]
        }
      ]
    }
  ]
}

// Assessment completado
{
  "id": "assessment_org1_2024_01",
  "organizacion_id": "org1",
  "cuestionario_id": "cuestionario_v1_2024",
  "fecha_inicio": "2024-01-15",
  "fecha_completado": "2024-01-20", 
  "fecha_firmado": null,
  "estado": "completado", // abierto, completado, firmado
  "firmado_por": null,
  "resultados": {
    "dominios": [
      {
        "dominio_id": "proteccion_acceso",
        "nivel_actual": 1.67,
        "respuestas": [
          {
            "pregunta_id": "p1",
            "respuesta": "Parcialmente",
            "valor": 2,
            "comentario": "Algunos empleados usan gestores"
          }
        ]
      }
    ],
    "puntuacion_total": 2.1,
    "fecha_calculo": "2024-01-20"
  },
  "objetivos": {
    "6_meses": 2.5,
    "1_año": 3.0, 
    "2_años": 4.0
  }
}
```

## Arquitectura de Componentes

### Backend (`backend/modules/madurez/`)
- `madurez_service.py` - Lógica de negocio
- `templates_service.py` - Gestión de plantillas de cuestionarios
- `calculation_service.py` - Cálculo de puntuaciones y métricas

### Frontend (`apps/madurez/`)
- `index.js` - App principal del módulo
- `views/` - Vistas específicas
  - `list-view.js` - Lista de assessments
  - `questionnaire-view.js` - Vista del cuestionario
  - `dashboard-view.js` - Dashboard con visualizaciones
  - `history-view.js` - Histórico y progresión
- `services/`
  - `madurez-api.js` - Cliente API específico
  - `chart-service.js` - Servicio para gráficos

### Persistencia
- `data/{org_id}/assessments/` - Assessments completados
- `data/{org_id}/templates/` - Plantillas personalizadas (opcional)
- `data/templates/` - Plantillas globales del sistema

## Flujo de Trabajo

1. **Configuración inicial**: Cargar template de cuestionario predeterminado
2. **Crear assessment**: Nuevo assessment para organización en fecha específica
3. **Completar cuestionario**: Responder preguntas por dominio
4. **Calcular resultados**: Puntuaciones automáticas por dominio y total
5. **Definir objetivos**: Establecer metas a 6m, 1a, 2a
6. **Visualizar dashboard**: Mostrar radar, roadmap, gaps
7. **Gestionar histórico**: Ver evolución temporal
8. **Firmar assessment**: Cerrar y firmar formalmente

## APIs Necesarias

```
GET  /api/madurez/templates - Listar plantillas disponibles
GET  /api/madurez/templates/{id} - Obtener plantilla específica
POST /api/madurez/templates - Crear nueva plantilla

GET  /api/madurez/assessments - Listar assessments de organización
GET  /api/madurez/assessments/{id} - Obtener assessment específico
POST /api/madurez/assessments - Crear nuevo assessment
PUT  /api/madurez/assessments/{id} - Actualizar assessment
POST /api/madurez/assessments/{id}/complete - Completar assessment
POST /api/madurez/assessments/{id}/sign - Firmar assessment

GET  /api/madurez/dashboard/{assessment_id} - Datos para visualizaciones
GET  /api/madurez/history - Histórico de assessments
```

## Visualizaciones

1. **Radar Chart**: Estado actual vs objetivos por dominio
2. **Line Chart**: Evolución temporal (roadmap)
3. **Bar Chart**: Gaps entre actual y objetivo
4. **Progress Chart**: Histórico de assessments
5. **Métricas**: KPIs principales (score total, dominios débiles, etc.)