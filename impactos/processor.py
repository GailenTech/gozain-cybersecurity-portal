#!/usr/bin/env python3
"""
Procesador de impactos que ejecuta las acciones definidas en las plantillas.
"""
import re
import uuid
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from .models import Impact, ImpactAction, ImpactTask, ImpactState
from .templates import TemplateManager

class ImpactProcessor:
    """Procesa impactos ejecutando acciones según plantillas"""
    
    def __init__(self, asset_service, template_manager: Optional[TemplateManager] = None):
        """
        Args:
            asset_service: Servicio de activos para ejecutar acciones
            template_manager: Gestor de plantillas (opcional)
        """
        self.asset_service = asset_service
        self.template_manager = template_manager or TemplateManager()
    
    def preview_impact(self, impact: Impact) -> Dict[str, Any]:
        """
        Genera una vista previa de las acciones que se ejecutarán.
        
        Args:
            impact: Impacto a previsualizar
            
        Returns:
            Dict con el resumen de acciones
        """
        template = self.template_manager.get_template(impact.type)
        if not template:
            return {
                'error': f'Plantilla no encontrada: {impact.type}'
            }
        
        preview = {
            'activos_crear': 0,
            'activos_modificar': 0,
            'activos_eliminar': 0,
            'tareas_generar': len(template.get('tareas', [])),
            'acciones_detalle': []
        }
        
        # Analizar acciones
        for action in template.get('acciones', []):
            if self._should_execute_action(action, impact.data):
                if action['tipo'] == 'crear_activo':
                    preview['activos_crear'] += 1
                    preview['acciones_detalle'].append({
                        'tipo': 'Crear activo',
                        'descripcion': self._interpolate_template(action['datos'].get('nombre', ''), impact.data)
                    })
                elif action['tipo'] == 'crear_multiples_activos':
                    count = len(action.get('lista', []))
                    preview['activos_crear'] += count
                    preview['acciones_detalle'].append({
                        'tipo': 'Crear múltiples activos',
                        'descripcion': f'{count} activos de software/licencias'
                    })
                elif action['tipo'] == 'actualizar_activos_responsable':
                    preview['activos_modificar'] += 1  # Estimación
                    responsable = self._interpolate_template(
                        action['filtro'].get('responsable', ''), 
                        impact.data
                    )
                    preview['acciones_detalle'].append({
                        'tipo': 'Actualizar activos',
                        'descripcion': f"Cambiar departamento de activos de {responsable}"
                    })
        
        return preview
    
    def process_impact(self, impact: Impact) -> Dict[str, Any]:
        """
        Procesa un impacto ejecutando todas sus acciones.
        
        Args:
            impact: Impacto a procesar
            
        Returns:
            Dict con el resultado del procesamiento
        """
        # Cambiar estado a procesando
        impact.state = ImpactState.PROCESSING
        
        # Obtener plantilla
        template = self.template_manager.get_template(impact.type)
        if not template:
            impact.state = ImpactState.ERROR
            impact.error = f'Plantilla no encontrada: {impact.type}'
            return {
                'success': False,
                'error': impact.error
            }
        
        impact.template_version = template.get('version', 1)
        
        # Ejecutar acciones
        executed_actions = []
        try:
            # Procesar cada acción
            for action_def in template.get('acciones', []):
                if self._should_execute_action(action_def, impact.data):
                    action_result = self._execute_action(action_def, impact)
                    executed_actions.append(action_result)
                    impact.executed_actions.append(action_result.to_dict())
            
            # Generar tareas
            generated_tasks = self._generate_tasks(template, impact)
            # Asegurarse de que las tareas se conviertan a diccionario
            impact.generated_tasks = []
            for task in generated_tasks:
                if hasattr(task, 'to_dict'):
                    impact.generated_tasks.append(task.to_dict())
                else:
                    # Si es un diccionario ya, usarlo directamente
                    impact.generated_tasks.append(task if isinstance(task, dict) else {
                        'id': getattr(task, 'id', None),
                        'descripcion': getattr(task, 'description', ''),
                        'responsable': getattr(task, 'responsible', ''),
                        'fecha_limite': getattr(task, 'due_date', None).isoformat() if getattr(task, 'due_date', None) else None,
                        'estado': getattr(task, 'state', 'pendiente')
                    })
            
            # Marcar como completado
            impact.state = ImpactState.COMPLETED
            impact.processed_at = datetime.now()
            
            return {
                'success': True,
                'acciones_ejecutadas': len(executed_actions),
                'tareas_generadas': len(generated_tasks),
                'resultado': {
                    'activos_creados': [a.to_dict() if hasattr(a, 'to_dict') else a for a in executed_actions if a.type == 'crear_activo' and a.success],
                    'activos_modificados': [a.to_dict() if hasattr(a, 'to_dict') else a for a in executed_actions if a.type.startswith('actualizar') and a.success],
                    'tareas': [t.to_dict() if hasattr(t, 'to_dict') else t for t in generated_tasks]
                }
            }
            
        except Exception as e:
            # En caso de error, intentar rollback
            impact.state = ImpactState.ERROR
            impact.error = str(e)
            
            # Rollback de acciones ejecutadas
            self._rollback_actions(executed_actions, impact)
            
            return {
                'success': False,
                'error': str(e),
                'acciones_rollback': len(executed_actions)
            }
    
    def _should_execute_action(self, action_def: Dict[str, Any], data: Dict[str, Any]) -> bool:
        """
        Evalúa si una acción debe ejecutarse según su condición.
        
        Args:
            action_def: Definición de la acción
            data: Datos del impacto
            
        Returns:
            True si debe ejecutarse
        """
        condition = action_def.get('condicion')
        if not condition:
            return True
        
        # Evaluar condición simple
        # En producción, usar un evaluador más robusto
        try:
            # Reemplazar variables en la condición
            interpolated_condition = self._interpolate_template(condition, data)
            
            # Evaluar condiciones simples de forma segura
            if ' == ' in interpolated_condition:
                left, right = interpolated_condition.split(' == ')
                return left.strip().strip('"') == right.strip().strip('"')
            elif ' != ' in interpolated_condition:
                left, right = interpolated_condition.split(' != ')
                return left.strip().strip('"') != right.strip().strip('"')
            elif interpolated_condition == 'true':
                return True
            elif interpolated_condition == 'false':
                return False
            else:
                # Por defecto, ejecutar
                return True
        except:
            # En caso de error, no ejecutar
            return False
    
    def _execute_action(self, action_def: Dict[str, Any], impact: Impact) -> ImpactAction:
        """
        Ejecuta una acción individual.
        
        Args:
            action_def: Definición de la acción
            impact: Impacto que contiene los datos
            
        Returns:
            ImpactAction con el resultado
        """
        action_type = action_def['tipo']
        
        if action_type == 'crear_activo':
            return self._execute_create_asset(action_def['datos'], impact)
        elif action_type == 'crear_multiples_activos':
            return self._execute_create_multiple_assets(action_def['lista'], impact)
        elif action_type == 'actualizar_activos_responsable':
            return self._execute_update_assets_by_responsible(action_def, impact)
        elif action_type == 'crear_condicional':
            # Como crear_activo pero con lógica condicional ya evaluada
            return self._execute_create_asset(action_def['datos'], impact)
        else:
            raise ValueError(f"Tipo de acción no soportado: {action_type}")
    
    def _execute_create_asset(self, asset_template: Dict[str, Any], impact: Impact) -> ImpactAction:
        """Ejecuta la creación de un activo"""
        # Interpolar valores en la plantilla
        asset_data = {}
        for key, value in asset_template.items():
            asset_data[key] = self._interpolate_template(str(value), impact.data)
        
        # Crear activo
        result = self.asset_service.create_asset(
            asset_data,
            impact.user_creator,
            impact.org_id
        )
        
        # Crear registro de acción
        action = ImpactAction(
            'crear_activo',
            result.get('id', ''),
            asset_data
        )
        action.success = result.get('success', False)
        if not action.success:
            action.error = result.get('message', 'Error desconocido')
        
        return action
    
    def _execute_create_multiple_assets(self, assets_list: List[Dict[str, Any]], impact: Impact) -> ImpactAction:
        """Ejecuta la creación de múltiples activos"""
        created_ids = []
        
        for asset_template in assets_list:
            # Interpolar valores
            asset_data = {}
            for key, value in asset_template.items():
                asset_data[key] = self._interpolate_template(str(value), impact.data)
            
            # Crear activo
            result = self.asset_service.create_asset(
                asset_data,
                impact.user_creator,
                impact.org_id
            )
            
            if result.get('success'):
                created_ids.append(result.get('id'))
        
        # Crear registro de acción consolidado
        action = ImpactAction(
            'crear_multiples_activos',
            ','.join(created_ids),
            {'cantidad': len(assets_list), 'creados': len(created_ids)}
        )
        action.success = len(created_ids) == len(assets_list)
        if not action.success:
            action.error = f"Solo se crearon {len(created_ids)} de {len(assets_list)} activos"
        
        return action
    
    def _execute_update_assets_by_responsible(self, action_def: Dict[str, Any], impact: Impact) -> ImpactAction:
        """Ejecuta la actualización de activos por responsable"""
        try:
            # Obtener filtro
            filter_template = action_def.get('filtro', {})
            filters = {}
            for key, value in filter_template.items():
                filters[key] = self._interpolate_template(str(value), impact.data)
            
            # Obtener cambios a aplicar
            changes_template = action_def.get('cambios', {})
            changes = {}
            for key, value in changes_template.items():
                changes[key] = self._interpolate_template(str(value), impact.data)
            
            # Log para debugging
            print(f"[DEBUG] Buscando activos con filtros: {filters}")
            
            # Buscar activos
            assets = self.asset_service.list_assets(impact.org_id, filters)
            
            print(f"[DEBUG] Encontrados {len(assets)} activos para actualizar")
            
            # Si no hay activos, es una operación exitosa (no hay nada que actualizar)
            if len(assets) == 0:
                action = ImpactAction(
                    'actualizar_activos',
                    '0 activos',
                    {'filtro': filters, 'cambios': changes, 'total': 0, 'mensaje': 'No se encontraron activos para actualizar'}
                )
                action.success = True
                return action
            
            # Actualizar cada activo
            updated_count = 0
            errors = []
            
            for asset in assets:
                try:
                    result = self.asset_service.update_asset(
                        asset['id'],
                        changes,
                        impact.user_creator,
                        impact.org_id
                    )
                    if result.get('success'):
                        updated_count += 1
                    else:
                        errors.append(f"Activo {asset['id']}: {result.get('message', 'Error desconocido')}")
                except Exception as e:
                    errors.append(f"Activo {asset['id']}: {str(e)}")
            
            # Crear registro de acción
            action = ImpactAction(
                'actualizar_activos',
                f"{updated_count} activos",
                {
                    'filtro': filters, 
                    'cambios': changes, 
                    'total': len(assets),
                    'actualizados': updated_count,
                    'errores': errors
                }
            )
            action.success = updated_count == len(assets)
            if not action.success:
                action.error = f"Solo se actualizaron {updated_count} de {len(assets)} activos. Errores: {'; '.join(errors[:3])}"
            
            return action
            
        except Exception as e:
            # En caso de error no manejado, crear acción de error
            action = ImpactAction(
                'actualizar_activos',
                'error',
                {'error': str(e), 'filtro': filter_template, 'cambios': changes_template}
            )
            action.success = False
            action.error = f"Error ejecutando actualización: {str(e)}"
            return action
    
    def _generate_tasks(self, template: Dict[str, Any], impact: Impact) -> List[ImpactTask]:
        """Genera las tareas según la plantilla"""
        tasks = []
        
        for task_def in template.get('tareas', []):
            # Interpolar descripción
            description = self._interpolate_template(task_def['descripcion'], impact.data)
            
            # Calcular fecha límite
            due_date = None
            if 'dias_limite' in task_def:
                base_date = (impact.data.get('fecha_inicio') or 
                           impact.data.get('fecha_baja') or
                           impact.data.get('fecha_efectiva'))
                if base_date:
                    if isinstance(base_date, str):
                        try:
                            # Intentar diferentes formatos de fecha
                            if 'T' in base_date:
                                base_date = datetime.fromisoformat(base_date.replace('Z', '+00:00'))
                            else:
                                base_date = datetime.strptime(base_date, '%Y-%m-%d')
                        except ValueError as e:
                            # Si falla el parseo, usar fecha actual
                            print(f"Error parseando fecha '{base_date}': {e}")
                            base_date = datetime.now()
                    due_date = self.template_manager.calculate_due_date(base_date, task_def['dias_limite'])
            
            # Crear tarea
            task = ImpactTask(
                description=description,
                responsible=task_def['responsable'],
                due_date=due_date
            )
            task.impact_id = impact.id
            # Asignar ID único a la tarea
            task.id = str(uuid.uuid4())
            
            tasks.append(task)
        
        return tasks
    
    def _interpolate_template(self, template: str, data: Dict[str, Any]) -> str:
        """
        Reemplaza las variables {{variable}} en una plantilla.
        
        Args:
            template: Texto con variables
            data: Datos para reemplazar
            
        Returns:
            Texto con variables reemplazadas
        """
        def replace_var(match):
            var_name = match.group(1).strip()
            value = data.get(var_name, f'{{{{ {var_name} }}}}')
            
            # Caso especial: si nuevo_departamento es __nuevo__, usar nombre_nuevo_departamento
            if var_name == 'nuevo_departamento' and value == '__nuevo__':
                value = data.get('nombre_nuevo_departamento', 'Nuevo Departamento')
            
            return str(value)
        
        return re.sub(r'{{(.*?)}}', replace_var, template)
    
    def _rollback_actions(self, actions: List[ImpactAction], impact: Impact):
        """
        Intenta revertir las acciones ejecutadas.
        
        Args:
            actions: Lista de acciones a revertir
            impact: Impacto que las generó
        """
        for action in reversed(actions):
            if action.success and action.type == 'crear_activo':
                # Eliminar activo creado
                try:
                    self.asset_service.delete_asset(
                        action.target_id,
                        f"Rollback - {impact.user_creator}",
                        impact.org_id
                    )
                except:
                    pass  # Mejor esfuerzo en rollback