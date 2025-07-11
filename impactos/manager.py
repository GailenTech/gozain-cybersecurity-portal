#!/usr/bin/env python3
"""
Gestor principal del sistema de impactos.
"""
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from .models import Impact, ImpactState, ImpactType
from .templates import TemplateManager
from .processor import ImpactProcessor

class ImpactManager:
    """Gestor principal de impactos de negocio"""
    
    def __init__(self, asset_service, data_provider):
        """
        Args:
            asset_service: Servicio de activos
            data_provider: Proveedor de datos para persistencia
        """
        self.asset_service = asset_service
        self.data_provider = data_provider
        self.template_manager = TemplateManager()
        self.processor = ImpactProcessor(asset_service, self.template_manager)
    
    def create_impact(self, impact_type: str, data: Dict[str, Any], user: str, org_id: str) -> Dict[str, Any]:
        """
        Crea un nuevo impacto pendiente de procesamiento.
        
        Args:
            impact_type: Tipo de impacto
            data: Datos del impacto
            user: Usuario creador
            org_id: ID de la organización
            
        Returns:
            Dict con el resultado
        """
        # Validar tipo de impacto
        template = self.template_manager.get_template(impact_type)
        if not template:
            return {
                'success': False,
                'message': f'Tipo de impacto no válido: {impact_type}'
            }
        
        # Validar datos
        validation = self.template_manager.validate_data(impact_type, data)
        if not validation['valid']:
            return {
                'success': False,
                'message': 'Datos inválidos',
                'errors': validation['errors']
            }
        
        # Crear impacto
        impact = Impact(impact_type, data, user, org_id)
        impact.id = str(uuid.uuid4())
        
        # Generar vista previa
        preview = self.processor.preview_impact(impact)
        
        # Guardar impacto
        self._save_impact(impact)
        
        return {
            'success': True,
            'impacto_id': impact.id,
            'estado': impact.state.value,
            'vista_previa': preview
        }
    
    def process_impact(self, impact_id: str, user: str, org_id: str, force: bool = False) -> Dict[str, Any]:
        """
        Procesa un impacto pendiente.
        
        Args:
            impact_id: ID del impacto
            user: Usuario que procesa
            org_id: ID de la organización
            force: Si True, permite reprocesar impactos en estado ERROR
            
        Returns:
            Dict con el resultado
        """
        # Cargar impacto
        impact = self._load_impact(impact_id, org_id)
        if not impact:
            return {
                'success': False,
                'message': 'Impacto no encontrado'
            }
        
        # Verificar estado
        if impact.state == ImpactState.COMPLETED:
            return {
                'success': False,
                'message': 'El impacto ya fue procesado exitosamente'
            }
        
        if impact.state == ImpactState.ERROR and not force:
            return {
                'success': False,
                'message': f'El impacto está en estado error. Para reprocesar, use el parámetro force=true',
                'estado_actual': impact.state.value,
                'error_previo': impact.error
            }
        
        if impact.state not in [ImpactState.PENDING, ImpactState.ERROR]:
            return {
                'success': False,
                'message': f'El impacto no puede ser procesado (estado: {impact.state.value})'
            }
        
        # Si es un reintento, limpiar error previo
        if impact.state == ImpactState.ERROR:
            impact.error = None
            impact.executed_actions = []
            impact.generated_tasks = []
        
        # Procesar
        result = self.processor.process_impact(impact)
        
        # Guardar resultado
        self._save_impact(impact)
        
        # Notificar si está habilitado
        if result['success']:
            self._notify_impact_processed(impact)
        
        return result
    
    def get_impact(self, impact_id: str, org_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un impacto por ID.
        
        Args:
            impact_id: ID del impacto
            org_id: ID de la organización
            
        Returns:
            Impacto o None
        """
        impact = self._load_impact(impact_id, org_id)
        if impact:
            return impact.to_dict()
        return None
    
    def list_impacts(self, org_id: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Lista impactos con filtros opcionales.
        
        Args:
            org_id: ID de la organización
            filters: Filtros opcionales (tipo, estado, fecha_desde, fecha_hasta, usuario)
            
        Returns:
            Lista de impactos
        """
        # Cargar todos los impactos
        impacts = self._load_all_impacts(org_id)
        
        # Aplicar filtros
        if filters:
            if filters.get('tipo'):
                impacts = [i for i in impacts if i.type == filters['tipo']]
            if filters.get('estado'):
                impacts = [i for i in impacts if i.state.value == filters['estado']]
            if filters.get('usuario'):
                impacts = [i for i in impacts if filters['usuario'].lower() in i.user_creator.lower()]
            if filters.get('fecha_desde'):
                fecha_desde = datetime.fromisoformat(filters['fecha_desde'])
                impacts = [i for i in impacts if i.created_at >= fecha_desde]
            if filters.get('fecha_hasta'):
                fecha_hasta = datetime.fromisoformat(filters['fecha_hasta'])
                impacts = [i for i in impacts if i.created_at <= fecha_hasta]
        
        # Ordenar por fecha descendente
        impacts.sort(key=lambda x: x.created_at, reverse=True)
        
        # Convertir a diccionarios
        return [i.to_dict() for i in impacts]
    
    def get_pending_tasks(self, org_id: str, responsible: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Obtiene tareas pendientes.
        
        Args:
            org_id: ID de la organización
            responsible: Filtrar por responsable (opcional)
            
        Returns:
            Lista de tareas pendientes
        """
        tasks = []
        impacts = self._load_all_impacts(org_id)
        
        for impact in impacts:
            if impact.state == ImpactState.COMPLETED:
                for task_data in impact.generated_tasks:
                    if task_data.get('estado') != 'completado':
                        if not responsible or task_data.get('responsable') == responsible:
                            task_data['impacto_tipo'] = impact.type
                            task_data['impacto_fecha'] = impact.created_at.isoformat()
                            tasks.append(task_data)
        
        # Ordenar por fecha límite
        tasks.sort(key=lambda x: x.get('fecha_limite') or '9999-12-31')
        
        return tasks
    
    def get_statistics(self, org_id: str) -> Dict[str, Any]:
        """
        Obtiene estadísticas de impactos.
        
        Args:
            org_id: ID de la organización
            
        Returns:
            Estadísticas
        """
        impacts = self._load_all_impacts(org_id)
        
        stats = {
            'total': len(impacts),
            'por_estado': {},
            'por_tipo': {},
            'ultimos_7_dias': 0,
            'tareas_pendientes': 0
        }
        
        # Fecha de hace 7 días
        from datetime import timedelta
        hace_7_dias = datetime.now() - timedelta(days=7)
        
        for impact in impacts:
            # Por estado
            estado = impact.state.value
            stats['por_estado'][estado] = stats['por_estado'].get(estado, 0) + 1
            
            # Por tipo
            tipo = impact.type
            stats['por_tipo'][tipo] = stats['por_tipo'].get(tipo, 0) + 1
            
            # Últimos 7 días
            if impact.created_at >= hace_7_dias:
                stats['ultimos_7_dias'] += 1
            
            # Tareas pendientes
            if impact.state == ImpactState.COMPLETED:
                for task in impact.generated_tasks:
                    if task.get('estado') != 'completado':
                        stats['tareas_pendientes'] += 1
        
        return stats
    
    def complete_task(self, task_id: str, org_id: str, comments: str = '') -> Dict[str, Any]:
        """
        Marca una tarea como completada.
        
        Args:
            task_id: ID de la tarea
            org_id: ID de la organización
            comments: Comentarios opcionales
            
        Returns:
            Dict con el resultado
        """
        # Buscar el impacto que contiene esta tarea
        impacts = self._load_all_impacts(org_id)
        
        for impact in impacts:
            if impact.state == ImpactState.COMPLETED:
                for i, task_data in enumerate(impact.generated_tasks):
                    if task_data.get('id') == task_id:
                        # Marcar como completada
                        impact.generated_tasks[i]['estado'] = 'completado'
                        impact.generated_tasks[i]['fecha_completado'] = datetime.now().isoformat()
                        impact.generated_tasks[i]['comentarios'] = comments
                        
                        # Guardar cambios
                        self._save_impact(impact)
                        
                        return {
                            'success': True,
                            'message': 'Tarea completada exitosamente'
                        }
        
        return {
            'success': False,
            'message': 'Tarea no encontrada'
        }
    
    def _save_impact(self, impact: Impact):
        """Guarda un impacto en el almacenamiento"""
        # Por ahora, guardamos los impactos junto con los datos de la organización
        # En producción, esto debería estar en una tabla separada
        datos = self.data_provider.cargar_datos_org(impact.org_id)
        
        if 'impactos' not in datos:
            datos['impactos'] = []
        
        # Buscar si ya existe
        impact_dict = impact.to_dict()
        existing_index = next((i for i, imp in enumerate(datos['impactos']) if imp['id'] == impact.id), None)
        
        if existing_index is not None:
            datos['impactos'][existing_index] = impact_dict
        else:
            datos['impactos'].append(impact_dict)
        
        self.data_provider.guardar_datos_org(impact.org_id, datos)
    
    def _load_impact(self, impact_id: str, org_id: str) -> Optional[Impact]:
        """Carga un impacto desde el almacenamiento"""
        datos = self.data_provider.cargar_datos_org(org_id)
        impactos = datos.get('impactos', [])
        
        for imp_data in impactos:
            if imp_data['id'] == impact_id:
                return Impact.from_dict(imp_data)
        
        return None
    
    def _load_all_impacts(self, org_id: str) -> List[Impact]:
        """Carga todos los impactos de una organización"""
        datos = self.data_provider.cargar_datos_org(org_id)
        impactos_data = datos.get('impactos', [])
        
        impacts = []
        for imp_data in impactos_data:
            try:
                impacts.append(Impact.from_dict(imp_data))
            except:
                pass  # Ignorar impactos mal formados
        
        return impacts
    
    def _notify_impact_processed(self, impact: Impact):
        """Envía notificación de impacto procesado"""
        # Por ahora, solo log
        # En producción, enviar email/Slack
        print(f"✅ Impacto procesado: {impact.type} - {impact.id}")