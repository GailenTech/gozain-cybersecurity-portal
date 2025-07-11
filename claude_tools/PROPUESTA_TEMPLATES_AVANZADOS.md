# Propuesta: Sistema de Templates Avanzados para Impactos

## 1. Campos Dinámicos con Fuentes de Datos

### 1.1 Definición en Template

```json
{
  "id": "baja_empleado",
  "nombre": "Baja de Empleado",
  "campos": [
    {
      "id": "empleado_id",
      "tipo": "select_dynamic",
      "label": "Empleado a dar de baja",
      "requerido": true,
      "fuente": {
        "tipo": "query",
        "origen": "activos",
        "filtro": {
          "campo": "responsable",
          "operador": "distinct"
        },
        "formato": {
          "valor": "responsable",
          "etiqueta": "responsable"
        }
      }
    },
    {
      "id": "departamento",
      "tipo": "select_dynamic",
      "label": "Departamento",
      "fuente": {
        "tipo": "api",
        "endpoint": "/api/departamentos",
        "campo_valor": "id",
        "campo_etiqueta": "nombre"
      }
    }
  ]
}
```

### 1.2 Tipos de Fuentes de Datos

#### A. Query sobre datos existentes
```python
class DataSourceQuery:
    """Consulta datos existentes en el sistema"""
    
    def execute(self, org_id: str, query_config: Dict) -> List[Dict]:
        if query_config['origen'] == 'activos':
            activos = self.asset_service.list_assets(org_id)
            
            if query_config['operador'] == 'distinct':
                # Obtener valores únicos
                campo = query_config['campo']
                valores_unicos = list(set(a.get(campo) for a in activos if a.get(campo)))
                return [{'valor': v, 'etiqueta': v} for v in sorted(valores_unicos)]
        
        elif query_config['origen'] == 'usuarios':
            # Similar para usuarios
            pass
```

#### B. API endpoints dedicados
```python
@app.route('/api/empleados', methods=['GET'])
def listar_empleados():
    """Lista empleados activos con información completa"""
    org_id = request.headers.get('X-Organization-Id')
    
    # Obtener empleados únicos desde activos
    activos = asset_service.list_assets(org_id)
    empleados = {}
    
    for activo in activos:
        responsable = activo.get('responsable')
        if responsable and responsable not in empleados:
            empleados[responsable] = {
                'nombre': responsable,
                'departamento': activo.get('departamento'),
                'activos_count': 0
            }
        if responsable:
            empleados[responsable]['activos_count'] += 1
    
    return jsonify({
        'success': True,
        'empleados': list(empleados.values())
    })
```

## 2. Campos Condicionales y Dependientes

### 2.1 Campos que aparecen según condiciones

```json
{
  "campos": [
    {
      "id": "tipo_cambio",
      "tipo": "select",
      "label": "Tipo de cambio",
      "opciones": ["Cambio de departamento", "Cambio de sede", "Cambio de cargo"],
      "requerido": true
    },
    {
      "id": "nuevo_departamento",
      "tipo": "select_dynamic",
      "label": "Nuevo departamento",
      "visible_cuando": "tipo_cambio == 'Cambio de departamento'",
      "fuente": {
        "tipo": "query",
        "origen": "departamentos"
      }
    },
    {
      "id": "crear_departamento",
      "tipo": "boolean",
      "label": "¿Crear nuevo departamento?",
      "visible_cuando": "tipo_cambio == 'Cambio de departamento'"
    },
    {
      "id": "nombre_nuevo_departamento",
      "tipo": "text",
      "label": "Nombre del nuevo departamento",
      "visible_cuando": "crear_departamento == true",
      "requerido_cuando": "crear_departamento == true"
    }
  ]
}
```

### 2.2 Validaciones cruzadas

```json
{
  "validaciones": [
    {
      "tipo": "unico",
      "campo": "nombre_nuevo_departamento",
      "mensaje": "Ya existe un departamento con ese nombre",
      "consulta": {
        "origen": "departamentos",
        "campo": "nombre"
      }
    },
    {
      "tipo": "consistencia",
      "campos": ["fecha_inicio", "fecha_fin"],
      "regla": "fecha_fin > fecha_inicio",
      "mensaje": "La fecha de fin debe ser posterior a la de inicio"
    }
  ]
}
```

## 3. Acciones Inteligentes

### 3.1 Acciones con lógica compleja

```json
{
  "acciones": [
    {
      "tipo": "actualizar_masivo",
      "descripcion": "Reasignar activos del empleado",
      "ejecutar_si": "reasignar_activos == true",
      "pasos": [
        {
          "buscar": {
            "tipo_activo": "Hardware",
            "responsable": "{{empleado_nombre}}"
          },
          "actualizar": {
            "responsable": "{{nuevo_responsable}}",
            "departamento": "{{nuevo_departamento}}",
            "estado": "En transición"
          }
        }
      ]
    },
    {
      "tipo": "crear_condicional",
      "descripcion": "Crear departamento si no existe",
      "ejecutar_si": "crear_departamento == true",
      "verificar_primero": {
        "origen": "departamentos",
        "campo": "nombre",
        "valor": "{{nombre_nuevo_departamento}}"
      },
      "si_no_existe": {
        "tipo": "crear_entidad",
        "entidad": "departamento",
        "datos": {
          "nombre": "{{nombre_nuevo_departamento}}",
          "responsable": "{{responsable_departamento}}",
          "fecha_creacion": "{{_fecha_actual}}"
        }
      }
    }
  ]
}
```

### 3.2 Acciones en cascada

```json
{
  "acciones": [
    {
      "tipo": "workflow",
      "nombre": "Cambio de departamento completo",
      "pasos_secuenciales": [
        {
          "id": "paso1",
          "tipo": "validar_departamento",
          "crear_si_no_existe": true
        },
        {
          "id": "paso2",
          "tipo": "actualizar_empleado",
          "usar_resultado_de": "paso1.departamento_id"
        },
        {
          "id": "paso3",
          "tipo": "reasignar_activos",
          "solo_si": "paso2.success == true"
        },
        {
          "id": "paso4",
          "tipo": "notificar",
          "destinatarios": ["{{empleado_email}}", "{{nuevo_jefe_email}}"]
        }
      ]
    }
  ]
}
```

## 4. Implementación Propuesta

### 4.1 Extender TemplateManager

```python
class AdvancedTemplateManager(TemplateManager):
    """Gestor avanzado de plantillas con campos dinámicos"""
    
    def __init__(self, data_sources: Dict[str, DataSource]):
        super().__init__()
        self.data_sources = data_sources
    
    def get_template_with_data(self, template_id: str, org_id: str) -> Dict:
        """Obtiene plantilla con datos dinámicos resueltos"""
        template = self.get_template(template_id)
        
        # Resolver campos dinámicos
        for campo in template.get('campos', []):
            if campo.get('tipo') == 'select_dynamic':
                fuente = campo.get('fuente', {})
                campo['opciones'] = self._resolver_fuente(fuente, org_id)
        
        return template
    
    def _resolver_fuente(self, fuente_config: Dict, org_id: str) -> List[Dict]:
        """Resuelve una fuente de datos dinámica"""
        tipo_fuente = fuente_config.get('tipo')
        
        if tipo_fuente == 'query':
            return self.data_sources['query'].execute(org_id, fuente_config)
        elif tipo_fuente == 'api':
            return self.data_sources['api'].fetch(fuente_config['endpoint'], org_id)
        elif tipo_fuente == 'enum':
            return fuente_config.get('valores', [])
```

### 4.2 Procesador mejorado

```python
class SmartImpactProcessor(ImpactProcessor):
    """Procesador inteligente con soporte para acciones avanzadas"""
    
    def _execute_action(self, action_def: Dict, impact: Impact) -> ImpactAction:
        action_type = action_def['tipo']
        
        if action_type == 'actualizar_masivo':
            return self._execute_bulk_update(action_def, impact)
        elif action_type == 'crear_condicional':
            return self._execute_conditional_create(action_def, impact)
        elif action_type == 'workflow':
            return self._execute_workflow(action_def, impact)
        else:
            return super()._execute_action(action_def, impact)
    
    def _execute_workflow(self, workflow_def: Dict, impact: Impact) -> ImpactAction:
        """Ejecuta un workflow de múltiples pasos"""
        resultados = {}
        
        for paso in workflow_def['pasos_secuenciales']:
            # Verificar condiciones
            if 'solo_si' in paso:
                if not self._evaluar_condicion(paso['solo_si'], resultados):
                    continue
            
            # Ejecutar paso
            resultado = self._ejecutar_paso_workflow(paso, impact, resultados)
            resultados[paso['id']] = resultado
            
            # Detener si falla
            if not resultado.get('success'):
                break
        
        return ImpactAction('workflow', workflow_def['nombre'], resultados)
```

## 5. UI Mejorada

### 5.1 Formularios dinámicos inteligentes

```javascript
class SmartFormBuilder {
    constructor(templateManager) {
        this.templateManager = templateManager;
        this.formData = {};
        this.watchers = {};
    }
    
    async buildForm(templateId, container) {
        const template = await this.templateManager.getTemplateWithData(templateId);
        
        template.campos.forEach(campo => {
            const element = this.createField(campo);
            
            // Configurar visibilidad condicional
            if (campo.visible_cuando) {
                this.setupConditionalVisibility(campo);
            }
            
            // Configurar carga dinámica
            if (campo.tipo === 'select_dynamic') {
                this.setupDynamicLoading(campo);
            }
            
            container.appendChild(element);
        });
    }
    
    setupConditionalVisibility(campo) {
        const condition = campo.visible_cuando;
        const dependencies = this.extractDependencies(condition);
        
        dependencies.forEach(dep => {
            this.watch(dep, () => {
                const visible = this.evaluateCondition(condition);
                this.toggleFieldVisibility(campo.id, visible);
            });
        });
    }
    
    async setupDynamicLoading(campo) {
        if (campo.fuente.dependeDe) {
            // Recargar cuando cambie la dependencia
            this.watch(campo.fuente.dependeDe, async (nuevoValor) => {
                const opciones = await this.loadDynamicOptions(
                    campo.fuente,
                    nuevoValor
                );
                this.updateSelectOptions(campo.id, opciones);
            });
        }
    }
}
```

## 6. Casos de Uso Mejorados

### 6.1 Baja de empleado inteligente

1. **Seleccionar empleado** de lista con información completa
2. **Ver resumen** de activos asignados antes de procesar
3. **Opciones de reasignación**:
   - Devolver al almacén
   - Asignar a otro empleado
   - Marcar para destrucción
4. **Validaciones**:
   - No permitir baja si hay tareas pendientes
   - Alertar si hay activos críticos

### 6.2 Reorganización departamental

1. **Crear nuevo departamento** si no existe
2. **Mover empleados** entre departamentos
3. **Reasignar activos** automáticamente
4. **Actualizar jerarquías** y responsables
5. **Generar informes** de cambios

## 7. Beneficios

1. **Mayor flexibilidad**: Adaptable a procesos complejos
2. **Menos errores**: Validaciones en tiempo real
3. **Mejor UX**: Formularios inteligentes y contextuales
4. **Escalabilidad**: Fácil agregar nuevos tipos de impacto
5. **Inteligencia**: El sistema aprende de los datos existentes

## 8. Plan de Implementación

### Fase 1: Campos dinámicos (1 semana)
- Select dinámicos con queries
- API de empleados y departamentos

### Fase 2: Condicionales (1 semana)
- Campos condicionales
- Validaciones cruzadas

### Fase 3: Acciones avanzadas (2 semanas)
- Workflows
- Acciones condicionales
- Procesamiento en cascada

### Fase 4: UI inteligente (1 semana)
- Formularios reactivos
- Preview mejorado
- Validación en tiempo real