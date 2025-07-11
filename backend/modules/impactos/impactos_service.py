import os
import json
import uuid
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class ImpactosService:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.plantillas = self._cargar_plantillas()
    
    def _get_impactos_file(self, org_id):
        return os.path.join(self.data_dir, org_id, 'impactos.json')
    
    def _load_impactos(self, org_id):
        file_path = self._get_impactos_file(org_id)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def _save_impactos(self, org_id, impactos):
        file_path = self._get_impactos_file(org_id)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(impactos, f, indent=2, ensure_ascii=False)
    
    def _cargar_plantillas(self):
        """Carga las plantillas predefinidas de impactos"""
        return {
            'alta_empleado': {
                'nombre': 'Alta de Empleado',
                'descripcion': 'Proceso de alta de nuevo empleado',
                'campos': [
                    {'id': 'nombre_completo', 'label': 'Nombre Completo', 'tipo': 'text', 'requerido': True},
                    {'id': 'departamento', 'label': 'Departamento', 'tipo': 'text', 'requerido': True},
                    {'id': 'cargo', 'label': 'Cargo', 'tipo': 'text', 'requerido': True},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True},
                    {'id': 'modalidad', 'label': 'Modalidad', 'tipo': 'select', 'opciones': ['Presencial', 'Remoto', 'Híbrido'], 'requerido': True},
                    {'id': 'equipo_movil', 'label': 'Necesita equipo móvil', 'tipo': 'checkbox', 'requerido': False}
                ],
                'activos_base': [
                    {
                        'tipo': 'Hardware',
                        'nombre_template': 'Laptop para {nombre_completo}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': 'Interno',
                            'criticidad': 'Importante'
                        }
                    },
                    {
                        'tipo': 'Software',
                        'nombre_template': 'Office 365 - {nombre_completo}',
                        'campos': {
                            'tipo_software': 'Productividad',
                            'estado': 'Activo',
                            'clasificacion': 'Interno'
                        }
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Preparar equipo para {nombre_completo}',
                        'responsable': 'IT',
                        'dias_antes': 1
                    },
                    {
                        'descripcion': 'Entregar kit de bienvenida a {nombre_completo}',
                        'responsable': 'RRHH',
                        'dias_antes': 0
                    }
                ]
            },
            'baja_empleado': {
                'nombre': 'Baja de Empleado',
                'descripcion': 'Proceso de baja de empleado',
                'campos': [
                    {'id': 'nombre_completo', 'label': 'Nombre del Empleado', 'tipo': 'text', 'requerido': True},
                    {'id': 'fecha_baja', 'label': 'Fecha de Baja', 'tipo': 'date', 'requerido': True},
                    {'id': 'motivo', 'label': 'Motivo', 'tipo': 'select', 'opciones': ['Renuncia', 'Despido', 'Fin de contrato'], 'requerido': True},
                    {'id': 'devolucion_equipos', 'label': 'Equipos devueltos', 'tipo': 'checkbox', 'requerido': False}
                ],
                'acciones': [
                    {
                        'tipo': 'desactivar_activos',
                        'filtro': 'responsable={nombre_completo}'
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Recoger equipos de {nombre_completo}',
                        'responsable': 'IT',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Revocar accesos de {nombre_completo}',
                        'responsable': 'Seguridad',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Backup de información de {nombre_completo}',
                        'responsable': 'IT',
                        'dias_despues': 1
                    }
                ]
            },
            'nuevo_cliente': {
                'nombre': 'Alta de Cliente',
                'descripcion': 'Registro de nuevo cliente',
                'campos': [
                    {'id': 'nombre_cliente', 'label': 'Nombre del Cliente', 'tipo': 'text', 'requerido': True},
                    {'id': 'tipo_servicio', 'label': 'Tipo de Servicio', 'tipo': 'select', 'opciones': ['Básico', 'Estándar', 'Premium'], 'requerido': True},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True},
                    {'id': 'account_manager', 'label': 'Account Manager', 'tipo': 'text', 'requerido': True}
                ],
                'activos_base': [
                    {
                        'tipo': 'Servicio',
                        'nombre_template': 'Servicio {tipo_servicio} - {nombre_cliente}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': 'Confidencial',
                            'criticidad': 'Importante',
                            'responsable': '{account_manager}'
                        }
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Crear carpeta de cliente para {nombre_cliente}',
                        'responsable': 'Administración',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Configurar servicios para {nombre_cliente}',
                        'responsable': 'IT',
                        'dias_despues': 1
                    }
                ]
            },
            
            # Gestión de Proyectos
            'nuevo_proyecto': {
                'nombre': 'Inicio de Proyecto',
                'descripcion': 'Configuración inicial de un nuevo proyecto',
                'campos': [
                    {'id': 'nombre_proyecto', 'label': 'Nombre del Proyecto', 'tipo': 'text', 'requerido': True},
                    {'id': 'cliente', 'label': 'Cliente', 'tipo': 'text', 'requerido': True},
                    {'id': 'project_manager', 'label': 'Project Manager', 'tipo': 'text', 'requerido': True},
                    {'id': 'equipo_proyecto', 'label': 'Miembros del Equipo', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True},
                    {'id': 'fecha_fin', 'label': 'Fecha Estimada de Fin', 'tipo': 'date', 'requerido': True},
                    {'id': 'nivel_confidencialidad', 'label': 'Nivel de Confidencialidad', 'tipo': 'select', 'opciones': ['Público', 'Interno', 'Confidencial', 'Secreto'], 'requerido': True}
                ],
                'activos_base': [
                    {
                        'tipo': 'Información',
                        'nombre_template': 'Repositorio del proyecto {nombre_proyecto}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': '{nivel_confidencialidad}',
                            'criticidad': 'Importante',
                            'responsable': '{project_manager}'
                        }
                    },
                    {
                        'tipo': 'Servicio',
                        'nombre_template': 'Espacio colaborativo - {nombre_proyecto}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': '{nivel_confidencialidad}',
                            'criticidad': 'Normal'
                        }
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Crear estructura de carpetas para proyecto {nombre_proyecto}',
                        'responsable': 'IT',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Configurar permisos de acceso para equipo del proyecto',
                        'responsable': 'Seguridad',
                        'dias_despues': 1
                    },
                    {
                        'descripcion': 'Crear canales de comunicación para {nombre_proyecto}',
                        'responsable': 'IT',
                        'dias_despues': 1
                    }
                ]
            },
            
            # Gestión de Proveedores
            'alta_proveedor': {
                'nombre': 'Alta de Proveedor',
                'descripcion': 'Incorporación de nuevo proveedor con acceso a sistemas',
                'campos': [
                    {'id': 'nombre_proveedor', 'label': 'Nombre del Proveedor', 'tipo': 'text', 'requerido': True},
                    {'id': 'tipo_servicio', 'label': 'Tipo de Servicio', 'tipo': 'text', 'requerido': True},
                    {'id': 'personas_autorizadas', 'label': 'Personas Autorizadas', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'sistemas_acceso', 'label': 'Sistemas con Acceso', 'tipo': 'textarea', 'requerido': False},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True},
                    {'id': 'fecha_fin_contrato', 'label': 'Fecha Fin de Contrato', 'tipo': 'date', 'requerido': True},
                    {'id': 'nda_firmado', 'label': 'NDA Firmado', 'tipo': 'checkbox', 'requerido': True}
                ],
                'activos_base': [
                    {
                        'tipo': 'Personal',
                        'nombre_template': 'Acceso Proveedor - {nombre_proveedor}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': 'Confidencial',
                            'criticidad': 'Importante',
                            'departamento': 'Externo'
                        }
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Verificar documentación legal de {nombre_proveedor}',
                        'responsable': 'Legal',
                        'dias_antes': 2
                    },
                    {
                        'descripcion': 'Crear cuentas de acceso limitado para {nombre_proveedor}',
                        'responsable': 'Seguridad',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Programar revisión de accesos para {nombre_proveedor}',
                        'responsable': 'Seguridad',
                        'dias_despues': 30
                    }
                ]
            },
            
            # Cambio de Infraestructura
            'cambio_sistema': {
                'nombre': 'Cambio de Sistema/Infraestructura',
                'descripcion': 'Migración o actualización de sistemas críticos',
                'campos': [
                    {'id': 'sistema_afectado', 'label': 'Sistema Afectado', 'tipo': 'text', 'requerido': True},
                    {'id': 'tipo_cambio', 'label': 'Tipo de Cambio', 'tipo': 'select', 'opciones': ['Actualización', 'Migración', 'Reemplazo', 'Desmantelamiento'], 'requerido': True},
                    {'id': 'fecha_cambio', 'label': 'Fecha del Cambio', 'tipo': 'date', 'requerido': True},
                    {'id': 'responsable_cambio', 'label': 'Responsable del Cambio', 'tipo': 'text', 'requerido': True},
                    {'id': 'usuarios_afectados', 'label': 'Usuarios Afectados', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'plan_rollback', 'label': 'Plan de Rollback Definido', 'tipo': 'checkbox', 'requerido': True}
                ],
                'tareas': [
                    {
                        'descripcion': 'Realizar backup completo de {sistema_afectado}',
                        'responsable': 'IT',
                        'dias_antes': 1
                    },
                    {
                        'descripcion': 'Notificar a usuarios sobre cambio en {sistema_afectado}',
                        'responsable': 'Comunicaciones',
                        'dias_antes': 3
                    },
                    {
                        'descripcion': 'Actualizar documentación de {sistema_afectado}',
                        'responsable': 'IT',
                        'dias_despues': 1
                    },
                    {
                        'descripcion': 'Realizar pruebas de seguridad post-cambio',
                        'responsable': 'Seguridad',
                        'dias_despues': 2
                    }
                ]
            },
            
            # Apertura de Nueva Sede
            'nueva_sede': {
                'nombre': 'Apertura de Nueva Sede/Oficina',
                'descripcion': 'Configuración de infraestructura para nueva ubicación',
                'campos': [
                    {'id': 'nombre_sede', 'label': 'Nombre/Ubicación de la Sede', 'tipo': 'text', 'requerido': True},
                    {'id': 'direccion', 'label': 'Dirección Completa', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'responsable_sede', 'label': 'Responsable de la Sede', 'tipo': 'text', 'requerido': True},
                    {'id': 'num_empleados', 'label': 'Número de Empleados', 'tipo': 'number', 'requerido': True},
                    {'id': 'fecha_apertura', 'label': 'Fecha de Apertura', 'tipo': 'date', 'requerido': True},
                    {'id': 'sistemas_locales', 'label': 'Requiere Sistemas Locales', 'tipo': 'checkbox', 'requerido': False}
                ],
                'activos_base': [
                    {
                        'tipo': 'Hardware',
                        'nombre_template': 'Infraestructura de red - {nombre_sede}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': 'Interno',
                            'criticidad': 'Crítica',
                            'ubicacion': '{direccion}'
                        }
                    },
                    {
                        'tipo': 'Servicio',
                        'nombre_template': 'Conectividad VPN - {nombre_sede}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': 'Confidencial',
                            'criticidad': 'Crítica'
                        }
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Configurar infraestructura de red en {nombre_sede}',
                        'responsable': 'IT',
                        'dias_antes': 5
                    },
                    {
                        'descripcion': 'Instalar y configurar sistemas de seguridad física',
                        'responsable': 'Seguridad',
                        'dias_antes': 3
                    },
                    {
                        'descripcion': 'Configurar VPN y accesos remotos para {nombre_sede}',
                        'responsable': 'IT',
                        'dias_antes': 2
                    },
                    {
                        'descripcion': 'Realizar auditoría de seguridad inicial en {nombre_sede}',
                        'responsable': 'Seguridad',
                        'dias_despues': 7
                    }
                ]
            },
            
            # Gestión de Incidentes
            'incidente_seguridad': {
                'nombre': 'Incidente de Seguridad',
                'descripcion': 'Respuesta a incidente de seguridad detectado',
                'campos': [
                    {'id': 'tipo_incidente', 'label': 'Tipo de Incidente', 'tipo': 'select', 'opciones': ['Malware', 'Phishing', 'Acceso no autorizado', 'Fuga de datos', 'Ataque DDoS', 'Otro'], 'requerido': True},
                    {'id': 'sistemas_afectados', 'label': 'Sistemas Afectados', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'usuarios_afectados', 'label': 'Usuarios Afectados', 'tipo': 'textarea', 'requerido': False},
                    {'id': 'fecha_deteccion', 'label': 'Fecha y Hora de Detección', 'tipo': 'datetime', 'requerido': True},
                    {'id': 'severidad', 'label': 'Severidad', 'tipo': 'select', 'opciones': ['Baja', 'Media', 'Alta', 'Crítica'], 'requerido': True},
                    {'id': 'descripcion_incidente', 'label': 'Descripción del Incidente', 'tipo': 'textarea', 'requerido': True}
                ],
                'acciones': [
                    {
                        'tipo': 'cambiar_estado_activos',
                        'filtro': 'nombre_contiene={sistemas_afectados}',
                        'nuevo_estado': 'En mantenimiento'
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Aislar sistemas afectados: {sistemas_afectados}',
                        'responsable': 'Seguridad',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Recopilar evidencias del incidente',
                        'responsable': 'Seguridad',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Notificar a usuarios afectados',
                        'responsable': 'Comunicaciones',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Generar informe post-incidente',
                        'responsable': 'Seguridad',
                        'dias_despues': 3
                    },
                    {
                        'descripcion': 'Implementar medidas correctivas',
                        'responsable': 'IT',
                        'dias_despues': 5
                    }
                ]
            },
            
            # Fusión/Adquisición
            'fusion_empresa': {
                'nombre': 'Fusión/Adquisición de Empresa',
                'descripcion': 'Integración de activos y sistemas de empresa adquirida',
                'campos': [
                    {'id': 'nombre_empresa', 'label': 'Nombre de la Empresa', 'tipo': 'text', 'requerido': True},
                    {'id': 'num_empleados', 'label': 'Número de Empleados a Integrar', 'tipo': 'number', 'requerido': True},
                    {'id': 'fecha_efectiva', 'label': 'Fecha Efectiva', 'tipo': 'date', 'requerido': True},
                    {'id': 'responsable_integracion', 'label': 'Responsable de Integración', 'tipo': 'text', 'requerido': True},
                    {'id': 'sistemas_integrar', 'label': 'Sistemas a Integrar', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'mantener_marca', 'label': 'Mantener Marca Separada', 'tipo': 'checkbox', 'requerido': False}
                ],
                'tareas': [
                    {
                        'descripcion': 'Auditoría de seguridad de sistemas de {nombre_empresa}',
                        'responsable': 'Seguridad',
                        'dias_antes': 10
                    },
                    {
                        'descripcion': 'Inventario completo de activos IT de {nombre_empresa}',
                        'responsable': 'IT',
                        'dias_antes': 7
                    },
                    {
                        'descripcion': 'Plan de migración de usuarios de {nombre_empresa}',
                        'responsable': 'IT',
                        'dias_antes': 5
                    },
                    {
                        'descripcion': 'Integración de directorio activo',
                        'responsable': 'IT',
                        'dias_despues': 1
                    },
                    {
                        'descripcion': 'Homologación de políticas de seguridad',
                        'responsable': 'Seguridad',
                        'dias_despues': 3
                    }
                ]
            },
            
            # Cambio de Rol
            'cambio_rol': {
                'nombre': 'Cambio de Rol/Departamento',
                'descripcion': 'Ajuste de permisos por cambio de responsabilidades',
                'campos': [
                    {'id': 'empleado', 'label': 'Nombre del Empleado', 'tipo': 'text', 'requerido': True},
                    {'id': 'rol_anterior', 'label': 'Rol Anterior', 'tipo': 'text', 'requerido': True},
                    {'id': 'rol_nuevo', 'label': 'Nuevo Rol', 'tipo': 'text', 'requerido': True},
                    {'id': 'departamento_anterior', 'label': 'Departamento Anterior', 'tipo': 'text', 'requerido': True},
                    {'id': 'departamento_nuevo', 'label': 'Nuevo Departamento', 'tipo': 'text', 'requerido': True},
                    {'id': 'fecha_cambio', 'label': 'Fecha del Cambio', 'tipo': 'date', 'requerido': True},
                    {'id': 'requiere_formacion', 'label': 'Requiere Formación Adicional', 'tipo': 'checkbox', 'requerido': False}
                ],
                'tareas': [
                    {
                        'descripcion': 'Revisar y ajustar permisos de {empleado}',
                        'responsable': 'Seguridad',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Actualizar grupos y listas de distribución',
                        'responsable': 'IT',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Transferir activos asignados si aplica',
                        'responsable': 'IT',
                        'dias_despues': 1
                    },
                    {
                        'descripcion': 'Actualizar organigrama y documentación',
                        'responsable': 'RRHH',
                        'dias_despues': 2
                    }
                ]
            },
            
            # Cumplimiento Normativo
            'auditoria_externa': {
                'nombre': 'Auditoría Externa',
                'descripcion': 'Preparación para auditoría de cumplimiento o certificación',
                'campos': [
                    {'id': 'tipo_auditoria', 'label': 'Tipo de Auditoría', 'tipo': 'select', 'opciones': ['ISO 27001', 'SOC 2', 'PCI DSS', 'GDPR', 'Financiera', 'Otra'], 'requerido': True},
                    {'id': 'empresa_auditora', 'label': 'Empresa Auditora', 'tipo': 'text', 'requerido': True},
                    {'id': 'alcance', 'label': 'Alcance de la Auditoría', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True},
                    {'id': 'fecha_fin', 'label': 'Fecha de Fin', 'tipo': 'date', 'requerido': True},
                    {'id': 'responsable_interno', 'label': 'Responsable Interno', 'tipo': 'text', 'requerido': True}
                ],
                'tareas': [
                    {
                        'descripcion': 'Recopilar documentación para {tipo_auditoria}',
                        'responsable': 'Compliance',
                        'dias_antes': 15
                    },
                    {
                        'descripcion': 'Revisar y actualizar políticas de seguridad',
                        'responsable': 'Seguridad',
                        'dias_antes': 10
                    },
                    {
                        'descripcion': 'Realizar auditoría interna previa',
                        'responsable': 'Auditoría Interna',
                        'dias_antes': 7
                    },
                    {
                        'descripcion': 'Crear cuentas de acceso para auditores de {empresa_auditora}',
                        'responsable': 'IT',
                        'dias_antes': 1
                    },
                    {
                        'descripcion': 'Desactivar accesos de auditores',
                        'responsable': 'IT',
                        'dias_despues': 1
                    }
                ]
            },
            
            # Gestión de Datos
            'solicitud_gdpr': {
                'nombre': 'Solicitud GDPR/Privacidad',
                'descripcion': 'Gestión de solicitudes de derechos de protección de datos',
                'campos': [
                    {'id': 'tipo_solicitud', 'label': 'Tipo de Solicitud', 'tipo': 'select', 'opciones': ['Acceso', 'Rectificación', 'Supresión', 'Portabilidad', 'Oposición'], 'requerido': True},
                    {'id': 'solicitante', 'label': 'Nombre del Solicitante', 'tipo': 'text', 'requerido': True},
                    {'id': 'email_solicitante', 'label': 'Email del Solicitante', 'tipo': 'email', 'requerido': True},
                    {'id': 'fecha_solicitud', 'label': 'Fecha de Solicitud', 'tipo': 'date', 'requerido': True},
                    {'id': 'sistemas_afectados', 'label': 'Sistemas que Contienen Datos', 'tipo': 'textarea', 'requerido': True}
                ],
                'tareas': [
                    {
                        'descripcion': 'Verificar identidad del solicitante {solicitante}',
                        'responsable': 'Legal',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Localizar datos en sistemas: {sistemas_afectados}',
                        'responsable': 'IT',
                        'dias_despues': 2
                    },
                    {
                        'descripcion': 'Ejecutar solicitud de {tipo_solicitud}',
                        'responsable': 'DPO',
                        'dias_despues': 5
                    },
                    {
                        'descripcion': 'Notificar resultado a {solicitante}',
                        'responsable': 'Legal',
                        'dias_despues': 7
                    }
                ]
            },
            
            # Desarrollo de Software
            'despliegue_produccion': {
                'nombre': 'Despliegue a Producción',
                'descripcion': 'Liberación de nueva versión o funcionalidad a producción',
                'campos': [
                    {'id': 'nombre_aplicacion', 'label': 'Aplicación/Sistema', 'tipo': 'text', 'requerido': True},
                    {'id': 'version', 'label': 'Versión', 'tipo': 'text', 'requerido': True},
                    {'id': 'tipo_despliegue', 'label': 'Tipo de Despliegue', 'tipo': 'select', 'opciones': ['Nueva funcionalidad', 'Corrección de bugs', 'Parche de seguridad', 'Actualización mayor'], 'requerido': True},
                    {'id': 'fecha_despliegue', 'label': 'Fecha y Hora de Despliegue', 'tipo': 'datetime', 'requerido': True},
                    {'id': 'responsable_tecnico', 'label': 'Responsable Técnico', 'tipo': 'text', 'requerido': True},
                    {'id': 'requiere_downtime', 'label': 'Requiere Tiempo de Inactividad', 'tipo': 'checkbox', 'requerido': False}
                ],
                'tareas': [
                    {
                        'descripcion': 'Ejecutar pruebas en entorno staging para {nombre_aplicacion} v{version}',
                        'responsable': 'QA',
                        'dias_antes': 2
                    },
                    {
                        'descripcion': 'Realizar escaneo de seguridad del código',
                        'responsable': 'Seguridad',
                        'dias_antes': 1
                    },
                    {
                        'descripcion': 'Backup completo antes del despliegue',
                        'responsable': 'IT',
                        'dias_antes': 0
                    },
                    {
                        'descripcion': 'Monitoreo post-despliegue de {nombre_aplicacion}',
                        'responsable': 'DevOps',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Actualizar documentación técnica',
                        'responsable': 'Desarrollo',
                        'dias_despues': 2
                    }
                ]
            },
            
            # Trabajo Remoto
            'configuracion_remoto': {
                'nombre': 'Configuración Trabajo Remoto',
                'descripcion': 'Habilitación de acceso remoto seguro para empleados',
                'campos': [
                    {'id': 'empleado', 'label': 'Nombre del Empleado', 'tipo': 'text', 'requerido': True},
                    {'id': 'tipo_acceso', 'label': 'Tipo de Acceso', 'tipo': 'select', 'opciones': ['VPN completa', 'VPN limitada', 'Escritorio remoto', 'Aplicaciones cloud'], 'requerido': True},
                    {'id': 'duracion', 'label': 'Duración', 'tipo': 'select', 'opciones': ['Temporal', 'Permanente'], 'requerido': True},
                    {'id': 'equipo_personal', 'label': 'Usará Equipo Personal', 'tipo': 'checkbox', 'requerido': False},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True}
                ],
                'activos_base': [
                    {
                        'tipo': 'Software',
                        'nombre_template': 'Licencia VPN - {empleado}',
                        'campos': {
                            'estado': 'Activo',
                            'clasificacion': 'Confidencial',
                            'criticidad': 'Importante'
                        },
                        'condicion': 'tipo_acceso contiene VPN'
                    }
                ],
                'tareas': [
                    {
                        'descripcion': 'Configurar acceso VPN para {empleado}',
                        'responsable': 'IT',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Enviar guía de seguridad para trabajo remoto',
                        'responsable': 'Seguridad',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Verificar configuración de seguridad en equipo personal',
                        'responsable': 'IT',
                        'dias_despues': 1,
                        'condicion': 'equipo_personal es verdadero'
                    }
                ]
            },
            
            # Gestión de Contratos
            'renovacion_contrato': {
                'nombre': 'Renovación de Contrato/Licencia',
                'descripcion': 'Gestión de renovaciones de contratos y licencias de software',
                'campos': [
                    {'id': 'tipo_contrato', 'label': 'Tipo', 'tipo': 'select', 'opciones': ['Software', 'Hardware', 'Servicio', 'Mantenimiento'], 'requerido': True},
                    {'id': 'proveedor', 'label': 'Proveedor', 'tipo': 'text', 'requerido': True},
                    {'id': 'descripcion', 'label': 'Descripción del Contrato', 'tipo': 'text', 'requerido': True},
                    {'id': 'fecha_vencimiento', 'label': 'Fecha de Vencimiento', 'tipo': 'date', 'requerido': True},
                    {'id': 'costo_anual', 'label': 'Costo Anual', 'tipo': 'number', 'requerido': True},
                    {'id': 'renovar', 'label': 'Proceder con Renovación', 'tipo': 'checkbox', 'requerido': True}
                ],
                'tareas': [
                    {
                        'descripcion': 'Evaluar uso y necesidad de {descripcion}',
                        'responsable': 'IT',
                        'dias_antes': 45
                    },
                    {
                        'descripcion': 'Negociar términos con {proveedor}',
                        'responsable': 'Compras',
                        'dias_antes': 30
                    },
                    {
                        'descripcion': 'Aprobar presupuesto para renovación',
                        'responsable': 'Finanzas',
                        'dias_antes': 15
                    },
                    {
                        'descripcion': 'Ejecutar renovación de contrato',
                        'responsable': 'Legal',
                        'dias_antes': 7
                    },
                    {
                        'descripcion': 'Actualizar inventario de licencias',
                        'responsable': 'IT',
                        'dias_despues': 1
                    }
                ]
            },
            
            # Gestión de Crisis
            'activacion_bcp': {
                'nombre': 'Activación Plan Continuidad (BCP)',
                'descripcion': 'Activación del plan de continuidad de negocio',
                'campos': [
                    {'id': 'tipo_evento', 'label': 'Tipo de Evento', 'tipo': 'select', 'opciones': ['Desastre natural', 'Fallo técnico', 'Ciberataque', 'Pandemia', 'Otro'], 'requerido': True},
                    {'id': 'sistemas_afectados', 'label': 'Sistemas Afectados', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'ubicaciones_afectadas', 'label': 'Ubicaciones Afectadas', 'tipo': 'textarea', 'requerido': True},
                    {'id': 'coordinador_crisis', 'label': 'Coordinador de Crisis', 'tipo': 'text', 'requerido': True},
                    {'id': 'fecha_activacion', 'label': 'Fecha y Hora de Activación', 'tipo': 'datetime', 'requerido': True}
                ],
                'tareas': [
                    {
                        'descripcion': 'Activar comité de crisis',
                        'responsable': '{coordinador_crisis}',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Evaluar impacto en sistemas críticos',
                        'responsable': 'IT',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Activar sitio de recuperación',
                        'responsable': 'IT',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Comunicar a todos los empleados',
                        'responsable': 'Comunicaciones',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Notificar a clientes críticos',
                        'responsable': 'Servicio al Cliente',
                        'dias_despues': 0
                    },
                    {
                        'descripcion': 'Generar informe post-crisis',
                        'responsable': '{coordinador_crisis}',
                        'dias_despues': 7
                    }
                ]
            },
            
            # Formación y Concienciación
            'campana_seguridad': {
                'nombre': 'Campaña de Concienciación',
                'descripcion': 'Lanzamiento de campaña de seguridad o formación',
                'campos': [
                    {'id': 'nombre_campana', 'label': 'Nombre de la Campaña', 'tipo': 'text', 'requerido': True},
                    {'id': 'tipo_campana', 'label': 'Tipo', 'tipo': 'select', 'opciones': ['Phishing simulado', 'Formación obligatoria', 'Awareness general', 'Política específica'], 'requerido': True},
                    {'id': 'audiencia', 'label': 'Audiencia Objetivo', 'tipo': 'select', 'opciones': ['Todos los empleados', 'Nuevos empleados', 'Directivos', 'IT', 'Departamento específico'], 'requerido': True},
                    {'id': 'fecha_inicio', 'label': 'Fecha de Inicio', 'tipo': 'date', 'requerido': True},
                    {'id': 'duracion_dias', 'label': 'Duración (días)', 'tipo': 'number', 'requerido': True}
                ],
                'tareas': [
                    {
                        'descripcion': 'Preparar contenido para {nombre_campana}',
                        'responsable': 'Seguridad',
                        'dias_antes': 7
                    },
                    {
                        'descripcion': 'Configurar plataforma de formación',
                        'responsable': 'IT',
                        'dias_antes': 3
                    },
                    {
                        'descripcion': 'Enviar comunicación inicial sobre {nombre_campana}',
                        'responsable': 'Comunicaciones',
                        'dias_antes': 1
                    },
                    {
                        'descripcion': 'Monitorear participación y progreso',
                        'responsable': 'RRHH',
                        'dias_despues': 3
                    },
                    {
                        'descripcion': 'Generar reporte de resultados',
                        'responsable': 'Seguridad',
                        'dias_despues': '{duracion_dias}'
                    }
                ]
            }
        }
    
    def get_plantilla(self, tipo):
        return self.plantillas.get(tipo)
    
    def get_impactos(self, org_id, filtros=None):
        impactos = self._load_impactos(org_id)
        
        if filtros:
            # Filtrar por tipo
            if filtros.get('tipo'):
                impactos = [i for i in impactos if i.get('tipo') == filtros['tipo']]
            
            # Filtrar por estado
            if filtros.get('estado'):
                impactos = [i for i in impactos if i.get('estado') == filtros['estado']]
            
            # Filtrar por fechas
            if filtros.get('fecha_desde'):
                fecha_desde = datetime.fromisoformat(filtros['fecha_desde'])
                impactos = [i for i in impactos if datetime.fromisoformat(i['fecha_creacion']) >= fecha_desde]
            
            if filtros.get('fecha_hasta'):
                fecha_hasta = datetime.fromisoformat(filtros['fecha_hasta'])
                impactos = [i for i in impactos if datetime.fromisoformat(i['fecha_creacion']) <= fecha_hasta]
        
        # Ordenar por fecha descendente
        impactos.sort(key=lambda x: x['fecha_creacion'], reverse=True)
        
        return impactos
    
    def create_impacto(self, org_id, data):
        impactos = self._load_impactos(org_id)
        
        # Generar ID único
        impacto_id = str(uuid.uuid4())
        
        # Crear impacto
        impacto = {
            'id': impacto_id,
            'tipo': data['tipo'],
            'estado': 'pendiente',
            'fecha_creacion': datetime.now().isoformat(),
            'usuario_creador': 'sistema',
            'datos': data.get('datos', {}),
            'acciones_ejecutadas': [],
            'tareas_generadas': []
        }
        
        # Vista previa de cambios
        plantilla = self.plantillas.get(data['tipo'])
        if plantilla:
            vista_previa = self._generar_vista_previa(plantilla, data.get('datos', {}))
            impacto['vista_previa'] = vista_previa
        
        impactos.append(impacto)
        self._save_impactos(org_id, impactos)
        
        return impacto
    
    def _generar_vista_previa(self, plantilla, datos):
        vista_previa = {
            'activos_crear': 0,
            'activos_modificar': 0,
            'tareas_generar': 0
        }
        
        if 'activos_base' in plantilla:
            vista_previa['activos_crear'] = len(plantilla['activos_base'])
        
        if 'tareas' in plantilla:
            vista_previa['tareas_generar'] = len(plantilla['tareas'])
        
        return vista_previa
    
    def procesar_impacto(self, org_id, impacto_id, inventario_service):
        impactos = self._load_impactos(org_id)
        
        for i, impacto in enumerate(impactos):
            if impacto['id'] == impacto_id:
                if impacto['estado'] != 'pendiente':
                    return {'error': 'El impacto ya fue procesado'}
                
                plantilla = self.plantillas.get(impacto['tipo'])
                if not plantilla:
                    return {'error': 'Plantilla no encontrada'}
                
                resultado = {
                    'activos_creados': [],
                    'activos_modificados': [],
                    'tareas_creadas': []
                }
                
                try:
                    # Procesar activos base
                    if 'activos_base' in plantilla:
                        for activo_template in plantilla['activos_base']:
                            nuevo_activo = self._crear_activo_desde_template(
                                activo_template, 
                                impacto['datos']
                            )
                            activo_creado = inventario_service.create_activo(org_id, nuevo_activo)
                            resultado['activos_creados'].append(activo_creado)
                    
                    # Procesar tareas
                    if 'tareas' in plantilla:
                        for tarea_template in plantilla['tareas']:
                            nueva_tarea = self._crear_tarea_desde_template(
                                tarea_template,
                                impacto['datos'],
                                impacto_id
                            )
                            resultado['tareas_creadas'].append(nueva_tarea)
                    
                    # Actualizar impacto
                    impacto['estado'] = 'procesado'
                    impacto['fecha_procesamiento'] = datetime.now().isoformat()
                    impacto['acciones_ejecutadas'] = resultado
                    
                    impactos[i] = impacto
                    self._save_impactos(org_id, impactos)
                    
                    return {
                        'success': True,
                        'resultado': resultado,
                        'tiempo_procesamiento': 0.5
                    }
                    
                except Exception as e:
                    logger.error(f"Error procesando impacto: {e}")
                    impacto['estado'] = 'error'
                    impacto['error'] = str(e)
                    impactos[i] = impacto
                    self._save_impactos(org_id, impactos)
                    return {'error': str(e)}
        
        return None
    
    def _crear_activo_desde_template(self, template, datos):
        # Reemplazar variables en el template
        nombre = template['nombre_template']
        for key, value in datos.items():
            nombre = nombre.replace(f'{{{key}}}', str(value))
        
        activo = {
            'tipo': template['tipo'],
            'nombre': nombre,
            **template.get('campos', {})
        }
        
        # Reemplazar variables en campos
        for campo, valor in activo.items():
            if isinstance(valor, str):
                for key, value in datos.items():
                    activo[campo] = valor.replace(f'{{{key}}}', str(value))
        
        # Agregar responsable si está en los datos
        if 'nombre_completo' in datos:
            activo['responsable'] = datos['nombre_completo']
        
        # Agregar departamento si está en los datos
        if 'departamento' in datos:
            activo['departamento'] = datos['departamento']
        
        return activo
    
    def _crear_tarea_desde_template(self, template, datos, impacto_id):
        # Reemplazar variables en la descripción
        descripcion = template['descripcion']
        for key, value in datos.items():
            descripcion = descripcion.replace(f'{{{key}}}', str(value))
        
        # Calcular fecha límite
        fecha_limite = datetime.now()
        if 'dias_antes' in template:
            if 'fecha_inicio' in datos:
                fecha_inicio = datetime.fromisoformat(datos['fecha_inicio'])
                fecha_limite = fecha_inicio - timedelta(days=template['dias_antes'])
        elif 'dias_despues' in template:
            fecha_limite = datetime.now() + timedelta(days=template['dias_despues'])
        
        tarea = {
            'id': str(uuid.uuid4()),
            'impacto_id': impacto_id,
            'descripcion': descripcion,
            'responsable': template.get('responsable', 'Sin asignar'),
            'fecha_creacion': datetime.now().isoformat(),
            'fecha_limite': fecha_limite.isoformat(),
            'estado': 'pendiente'
        }
        
        return tarea