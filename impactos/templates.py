#!/usr/bin/env python3
"""
Gestor de plantillas para el sistema de impactos.
"""
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

class TemplateManager:
    """Gestiona las plantillas de impacto"""
    
    def __init__(self, templates_dir: str = "templates"):
        self.templates_dir = templates_dir
        self.templates_cache = {}
        self._load_builtin_templates()
    
    def _load_builtin_templates(self):
        """Carga las plantillas incorporadas"""
        # Plantilla de alta de empleado
        self.templates_cache['alta_empleado'] = {
            'id': 'alta_empleado',
            'nombre': 'Alta de Empleado',
            'version': 1,
            'activa': True,
            'campos': [
                {
                    'id': 'nombre_completo',
                    'tipo': 'text',
                    'label': 'Nombre Completo',
                    'requerido': True
                },
                {
                    'id': 'email',
                    'tipo': 'email',
                    'label': 'Email Corporativo',
                    'requerido': True
                },
                {
                    'id': 'departamento',
                    'tipo': 'select',
                    'label': 'Departamento',
                    'opciones': ['Ventas', 'IT', 'RRHH', 'Finanzas', 'Marketing', 'Operaciones'],
                    'requerido': True
                },
                {
                    'id': 'cargo',
                    'tipo': 'text',
                    'label': 'Cargo',
                    'requerido': True
                },
                {
                    'id': 'fecha_inicio',
                    'tipo': 'date',
                    'label': 'Fecha de Inicio',
                    'requerido': True
                },
                {
                    'id': 'modalidad',
                    'tipo': 'select',
                    'label': 'Modalidad',
                    'opciones': ['Presencial', 'Remoto', 'Híbrido'],
                    'requerido': True,
                    'default': 'Presencial'
                },
                {
                    'id': 'necesita_movil',
                    'tipo': 'boolean',
                    'label': 'Necesita Equipo Móvil',
                    'default': False
                }
            ],
            'acciones': [
                {
                    'tipo': 'crear_activo',
                    'condicion': None,  # Siempre
                    'datos': {
                        'tipo_activo': 'Hardware',
                        'nombre': 'Laptop - {{nombre_completo}}',
                        'responsable': '{{nombre_completo}}',
                        'departamento': '{{departamento}}',
                        'descripcion': 'Laptop corporativa asignada',
                        'estado': 'Reservado',
                        'criticidad': 'Normal'
                    }
                },
                {
                    'tipo': 'crear_activo',
                    'condicion': 'modalidad != "Presencial"',
                    'datos': {
                        'tipo_activo': 'Hardware',
                        'nombre': 'Kit Remoto - {{nombre_completo}}',
                        'responsable': '{{nombre_completo}}',
                        'departamento': '{{departamento}}',
                        'descripcion': 'Monitor 24", teclado, mouse, webcam HD',
                        'estado': 'Reservado',
                        'criticidad': 'Normal'
                    }
                },
                {
                    'tipo': 'crear_activo',
                    'condicion': 'necesita_movil == true',
                    'datos': {
                        'tipo_activo': 'Hardware',
                        'nombre': 'Móvil Corporativo - {{nombre_completo}}',
                        'responsable': '{{nombre_completo}}',
                        'departamento': '{{departamento}}',
                        'descripcion': 'Smartphone corporativo con línea',
                        'estado': 'Reservado',
                        'criticidad': 'Normal'
                    }
                },
                {
                    'tipo': 'crear_multiples_activos',
                    'condicion': None,
                    'lista': [
                        {
                            'tipo_activo': 'Software e Información',
                            'nombre': 'Office 365 - {{nombre_completo}}',
                            'responsable': '{{nombre_completo}}',
                            'departamento': '{{departamento}}',
                            'tipo_software': 'Productividad',
                            'licencia': 'E3',
                            'estado': 'Activo'
                        },
                        {
                            'tipo_activo': 'Software e Información',
                            'nombre': 'Antivirus Corporativo - {{nombre_completo}}',
                            'responsable': '{{nombre_completo}}',
                            'departamento': '{{departamento}}',
                            'tipo_software': 'Seguridad',
                            'licencia': 'Enterprise',
                            'estado': 'Activo'
                        },
                        {
                            'tipo_activo': 'Software e Información',
                            'nombre': 'Acceso VPN - {{nombre_completo}}',
                            'responsable': '{{nombre_completo}}',
                            'departamento': '{{departamento}}',
                            'tipo_software': 'Acceso Remoto',
                            'estado': 'Activo'
                        }
                    ]
                }
            ],
            'tareas': [
                {
                    'descripcion': 'Preparar equipo para {{nombre_completo}}',
                    'responsable': 'IT',
                    'dias_limite': -1,  # 1 día antes del inicio
                    'tipo': 'preparacion_equipo'
                },
                {
                    'descripcion': 'Entregar equipo y credenciales a {{nombre_completo}}',
                    'responsable': 'RRHH',
                    'dias_limite': 0,  # El día del inicio
                    'tipo': 'entrega_equipo'
                },
                {
                    'descripcion': 'Sesión de inducción IT para {{nombre_completo}}',
                    'responsable': 'IT',
                    'dias_limite': 1,  # 1 día después del inicio
                    'tipo': 'induccion'
                }
            ]
        }
        
        # Plantilla de baja de empleado
        self.templates_cache['baja_empleado'] = {
            'id': 'baja_empleado',
            'nombre': 'Baja de Empleado',
            'version': 1,
            'activa': True,
            'campos': [
                {
                    'id': 'nombre_completo',
                    'tipo': 'select_dynamic',
                    'label': 'Empleado a dar de baja',
                    'requerido': True,
                    'fuente': {
                        'tipo': 'empleados',
                        'config': {}
                    }
                },
                {
                    'id': 'fecha_baja',
                    'tipo': 'date',
                    'label': 'Fecha Efectiva de Baja',
                    'requerido': True
                },
                {
                    'id': 'motivo',
                    'tipo': 'select',
                    'label': 'Motivo',
                    'opciones': ['Renuncia voluntaria', 'Fin de contrato', 'Despido', 'Jubilación'],
                    'requerido': True
                },
                {
                    'id': 'devolucion_inmediata',
                    'tipo': 'boolean',
                    'label': 'Requiere Devolución Inmediata',
                    'default': False
                }
            ],
            'acciones': [
                {
                    'tipo': 'actualizar_activos_responsable',
                    'condicion': None,
                    'filtro': {
                        'responsable': '{{nombre_completo}}'
                    },
                    'cambios': {
                        'estado': 'Por devolver',
                        'fecha_devolucion_prevista': '{{fecha_baja}}'
                    }
                },
                {
                    'tipo': 'crear_activo',
                    'condicion': None,
                    'datos': {
                        'tipo_activo': 'Servicios',
                        'nombre': 'Checklist Baja - {{nombre_completo}}',
                        'responsable': 'RRHH',
                        'departamento': 'RRHH',
                        'descripcion': 'Checklist de devolución de activos y revocación de accesos',
                        'estado': 'En proceso',
                        'criticidad': 'Importante'
                    }
                }
            ],
            'tareas': [
                {
                    'descripcion': 'Revocar accesos de {{nombre_completo}}',
                    'responsable': 'IT',
                    'dias_limite': 0,  # El mismo día de la baja
                    'tipo': 'revocacion_accesos'
                },
                {
                    'descripcion': 'Recibir equipos de {{nombre_completo}}',
                    'responsable': 'IT',
                    'dias_limite': 5,  # 5 días después
                    'tipo': 'devolucion_equipos'
                },
                {
                    'descripcion': 'Backup y archivo de información de {{nombre_completo}}',
                    'responsable': 'IT',
                    'dias_limite': 7,  # 7 días después
                    'tipo': 'backup_informacion'
                },
                {
                    'descripcion': 'Liquidación final de {{nombre_completo}}',
                    'responsable': 'Finanzas',
                    'dias_limite': 15,  # 15 días después
                    'tipo': 'liquidacion'
                }
            ]
        }
        
        # Plantilla de cambio de departamento
        self.templates_cache['cambio_departamento'] = {
            'id': 'cambio_departamento',
            'nombre': 'Cambio de Departamento',
            'version': 1,
            'activa': True,
            'descripcion': 'Cambiar empleado de departamento, con opción de crear nuevo departamento',
            'campos': [
                {
                    'id': 'empleado',
                    'tipo': 'select_dynamic',
                    'label': 'Empleado',
                    'requerido': True,
                    'fuente': {
                        'tipo': 'empleados',
                        'config': {}
                    }
                },
                {
                    'id': 'nuevo_departamento',
                    'tipo': 'select_dynamic',
                    'label': 'Nuevo Departamento',
                    'requerido': True,
                    'fuente': {
                        'tipo': 'departamentos',
                        'config': {
                            'permitir_nuevo': True
                        }
                    }
                },
                {
                    'id': 'nombre_nuevo_departamento',
                    'tipo': 'text',
                    'label': 'Nombre del Nuevo Departamento',
                    'requerido': False,
                    'visible_cuando': "nuevo_departamento == '__nuevo__'"
                },
                {
                    'id': 'fecha_efectiva',
                    'tipo': 'date',
                    'label': 'Fecha Efectiva',
                    'requerido': True
                },
                {
                    'id': 'notificar_empleado',
                    'tipo': 'boolean',
                    'label': 'Notificar al empleado',
                    'default': True
                }
            ],
            'acciones': [
                {
                    'tipo': 'crear_condicional',
                    'condicion': "nuevo_departamento == '__nuevo__'",
                    'datos': {
                        'tipo_activo': 'Servicios',
                        'nombre': 'Departamento - {{nombre_nuevo_departamento}}',
                        'responsable': 'Administración',
                        'departamento': '{{nombre_nuevo_departamento}}',
                        'descripcion': 'Registro de nuevo departamento',
                        'estado': 'Activo'
                    }
                },
                {
                    'tipo': 'actualizar_activos_responsable',
                    'condicion': None,
                    'filtro': {
                        'responsable': '{{empleado}}'
                    },
                    'cambios': {
                        'departamento': '{{nuevo_departamento}}'
                    }
                }
            ],
            'tareas': [
                {
                    'descripcion': 'Actualizar sistemas de RRHH para {{empleado}}',
                    'responsable': 'RRHH',
                    'dias_limite': 2,
                    'tipo': 'actualizacion_sistemas'
                },
                {
                    'descripcion': 'Actualizar tarjetas de acceso de {{empleado}}',
                    'responsable': 'Seguridad',
                    'dias_limite': 5,
                    'tipo': 'actualizacion_accesos'
                }
            ]
        }
    
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene una plantilla por ID.
        
        Args:
            template_id: ID de la plantilla
            
        Returns:
            Plantilla o None si no existe
        """
        # Primero buscar en caché
        if template_id in self.templates_cache:
            return self.templates_cache[template_id]
        
        # Intentar cargar desde archivo
        template_path = os.path.join(self.templates_dir, f"{template_id}.json")
        if os.path.exists(template_path):
            with open(template_path, 'r', encoding='utf-8') as f:
                template = json.load(f)
                self.templates_cache[template_id] = template
                return template
        
        return None
    
    def list_templates(self) -> List[Dict[str, Any]]:
        """
        Lista todas las plantillas disponibles.
        
        Returns:
            Lista de plantillas
        """
        templates = []
        
        # Plantillas en caché
        for template in self.templates_cache.values():
            templates.append({
                'id': template['id'],
                'nombre': template['nombre'],
                'version': template['version'],
                'activa': template.get('activa', True)
            })
        
        # Plantillas en archivos
        if os.path.exists(self.templates_dir):
            for filename in os.listdir(self.templates_dir):
                if filename.endswith('.json'):
                    template_id = filename[:-5]
                    if template_id not in self.templates_cache:
                        template = self.get_template(template_id)
                        if template:
                            templates.append({
                                'id': template['id'],
                                'nombre': template['nombre'],
                                'version': template['version'],
                                'activa': template.get('activa', True)
                            })
        
        return templates
    
    def validate_data(self, template_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida los datos contra una plantilla.
        
        Args:
            template_id: ID de la plantilla
            data: Datos a validar
            
        Returns:
            Dict con 'valid' bool y 'errors' list
        """
        template = self.get_template(template_id)
        if not template:
            return {'valid': False, 'errors': ['Plantilla no encontrada']}
        
        errors = []
        
        # Validar campos requeridos
        for field in template['campos']:
            if field.get('requerido', False) and field['id'] not in data:
                errors.append(f"Campo requerido: {field['label']}")
            
            # Validar tipo de datos
            if field['id'] in data:
                value = data[field['id']]
                field_type = field['tipo']
                
                if field_type == 'select' and value not in field.get('opciones', []):
                    errors.append(f"Valor inválido para {field['label']}: {value}")
                elif field_type == 'email' and '@' not in str(value):
                    errors.append(f"Email inválido: {value}")
                elif field_type == 'date':
                    try:
                        datetime.fromisoformat(value) if isinstance(value, str) else value
                    except:
                        errors.append(f"Fecha inválida: {value}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def calculate_due_date(self, base_date: datetime, days_offset: int) -> datetime:
        """
        Calcula fecha límite basada en días hábiles.
        
        Args:
            base_date: Fecha base
            days_offset: Días a sumar/restar (negativos para antes)
            
        Returns:
            Fecha límite calculada
        """
        # Por simplicidad, solo sumamos días calendario
        # En producción, esto debería considerar días hábiles
        return base_date + timedelta(days=days_offset)