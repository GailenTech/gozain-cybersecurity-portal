#!/usr/bin/env python3
"""
Modelos de datos para el sistema de impactos.
"""
from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime

class ImpactState(Enum):
    """Estados posibles de un impacto"""
    PENDING = "pendiente"
    PROCESSING = "procesando"
    COMPLETED = "completado"
    ERROR = "error"
    CANCELLED = "cancelado"

class ImpactType(Enum):
    """Tipos de impacto predefinidos"""
    # Personal
    EMPLOYEE_ONBOARDING = "alta_empleado"
    EMPLOYEE_OFFBOARDING = "baja_empleado"
    EMPLOYEE_DEPT_CHANGE = "cambio_departamento"
    EMPLOYEE_REMOTE_CHANGE = "cambio_modalidad"
    
    # Cliente
    CLIENT_ONBOARDING = "alta_cliente"
    CLIENT_OFFBOARDING = "baja_cliente"
    CLIENT_PLAN_CHANGE = "cambio_plan_cliente"
    
    # Infraestructura
    EQUIPMENT_REFRESH = "renovacion_equipos"
    SOFTWARE_DEPLOYMENT = "despliegue_software"
    LICENSE_UPDATE = "actualizacion_licencias"

class Impact:
    """Modelo de un impacto de negocio"""
    
    def __init__(self, impact_type: str, data: Dict[str, Any], user: str, org_id: str):
        self.id = None  # Se asignará al guardar
        self.type = impact_type
        self.state = ImpactState.PENDING
        self.data = data
        self.user_creator = user
        self.org_id = org_id
        self.created_at = datetime.now()
        self.processed_at = None
        self.template_version = None
        self.executed_actions = []
        self.generated_tasks = []
        self.error = None
        self.comments = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte el impacto a diccionario para persistencia"""
        return {
            'id': self.id,
            'tipo': self.type,
            'estado': self.state.value,
            'datos': self.data,
            'usuario_creador': self.user_creator,
            'organizacion_id': self.org_id,
            'fecha_creacion': self.created_at.isoformat(),
            'fecha_procesamiento': self.processed_at.isoformat() if self.processed_at else None,
            'version_plantilla': self.template_version,
            'acciones_ejecutadas': self.executed_actions,
            'tareas_generadas': self.generated_tasks,
            'error': self.error,
            'comentarios': self.comments
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Impact':
        """Crea un impacto desde un diccionario"""
        impact = cls(
            impact_type=data['tipo'],
            data=data['datos'],
            user=data['usuario_creador'],
            org_id=data['organizacion_id']
        )
        impact.id = data['id']
        impact.state = ImpactState(data['estado'])
        impact.created_at = datetime.fromisoformat(data['fecha_creacion'])
        if data['fecha_procesamiento']:
            impact.processed_at = datetime.fromisoformat(data['fecha_procesamiento'])
        impact.template_version = data.get('version_plantilla')
        impact.executed_actions = data.get('acciones_ejecutadas', [])
        impact.generated_tasks = data.get('tareas_generadas', [])
        impact.error = data.get('error')
        impact.comments = data.get('comentarios', '')
        return impact

class ImpactAction:
    """Modelo de una acción ejecutada por un impacto"""
    
    def __init__(self, action_type: str, target_id: str, details: Dict[str, Any]):
        self.type = action_type
        self.target_id = target_id
        self.details = details
        self.timestamp = datetime.now()
        self.success = False
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'tipo': self.type,
            'id_objetivo': self.target_id,
            'detalles': self.details,
            'timestamp': self.timestamp.isoformat(),
            'exito': self.success,
            'error': self.error
        }

class ImpactTask:
    """Modelo de una tarea generada por un impacto"""
    
    def __init__(self, description: str, responsible: str, due_date: Optional[datetime] = None):
        self.id = None
        self.impact_id = None
        self.description = description
        self.responsible = responsible
        self.created_at = datetime.now()
        self.due_date = due_date
        self.completed_at = None
        self.state = "pendiente"
        self.comments = ""
        self.evidence = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'impacto_id': self.impact_id,
            'descripcion': self.description,
            'responsable': self.responsible,
            'fecha_creacion': self.created_at.isoformat(),
            'fecha_limite': self.due_date.isoformat() if self.due_date else None,
            'fecha_completado': self.completed_at.isoformat() if self.completed_at else None,
            'estado': self.state,
            'comentarios': self.comments,
            'evidencias': self.evidence
        }