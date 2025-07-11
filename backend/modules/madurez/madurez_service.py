import os
import json
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Intenta importar GCS storage
try:
    from ..storage.gcs_storage import GCSStorageService
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False
    logger.warning("GCS Storage not available, using local storage")

class MadurezService:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.use_gcs = GCS_AVAILABLE and os.environ.get('USE_GCS', 'false').lower() == 'true'
        
        if self.use_gcs:
            self.gcs = GCSStorageService()
            logger.info("Using GCS storage for madurez")
        else:
            logger.info("Using local storage for madurez")
    
    def _get_assessments_file(self, org_id):
        if self.use_gcs:
            return f'madurez_assessments_{org_id}.json'
        else:
            return os.path.join(self.data_dir, org_id, 'madurez_assessments.json')
    
    def _get_templates_file(self):
        if self.use_gcs:
            return 'madurez_templates.json'
        else:
            return os.path.join(self.data_dir, 'madurez_templates.json')
    
    def _load_assessments(self, org_id):
        if self.use_gcs:
            filename = self._get_assessments_file(org_id)
            data = self.gcs.leer_archivo(filename)
            if data is not None:
                if isinstance(data, dict) and 'assessments' in data:
                    return data['assessments']
                elif isinstance(data, list):
                    return data
            return []
        else:
            file_path = self._get_assessments_file(org_id)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
    
    def _save_assessments(self, org_id, assessments):
        if self.use_gcs:
            filename = self._get_assessments_file(org_id)
            data = {'assessments': assessments}
            self.gcs.escribir_archivo(filename, data)
        else:
            file_path = self._get_assessments_file(org_id)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(assessments, f, indent=2, ensure_ascii=False)
    
    def _load_templates(self):
        if self.use_gcs:
            filename = self._get_templates_file()
            data = self.gcs.leer_archivo(filename)
            if data is not None:
                if isinstance(data, dict) and 'templates' in data:
                    return data['templates']
                elif isinstance(data, list):
                    return data
            # Si no existe, crear template por defecto
            return self._create_default_template()
        else:
            file_path = self._get_templates_file()
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return self._create_default_template()
    
    def _save_templates(self, templates):
        if self.use_gcs:
            filename = self._get_templates_file()
            data = {'templates': templates}
            self.gcs.escribir_archivo(filename, data)
        else:
            file_path = self._get_templates_file()
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(templates, f, indent=2, ensure_ascii=False)
    
    def _create_default_template(self):
        """Crear template por defecto basado en el cuestionario extraído"""
        default_template = {
            "id": "cuestionario_ciberplan_v1",
            "version": "1.0",
            "fecha_creacion": datetime.now().isoformat(),
            "nombre": "Cuestionario de Madurez Ciberplan v1",
            "descripcion": "Evaluación de madurez en ciberseguridad basada en 7 dominios principales",
            "dominios": [
                {
                    "id": "proteccion_acceso",
                    "nombre": "Protección de acceso",
                    "descripcion": "Gestión de contraseñas, autenticación y accesos",
                    "preguntas": [
                        {
                            "id": "pa_1",
                            "texto": "¿Todos los empleados utilizan contraseñas únicas y seguras?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pa_2", 
                            "texto": "¿La autenticación multifactor está activada en cuentas críticas?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pa_3",
                            "texto": "¿Existen políticas de cambio regular de contraseñas?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                },
                {
                    "id": "seguridad_dispositivos",
                    "nombre": "Seguridad en dispositivos y redes",
                    "descripcion": "Protección de dispositivos, actualizaciones y redes",
                    "preguntas": [
                        {
                            "id": "sd_1",
                            "texto": "¿El sistema operativo y software están actualizados?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "sd_2",
                            "texto": "¿Todos los dispositivos tienen antivirus y firewall activos?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "sd_3",
                            "texto": "¿La red Wi-Fi está protegida con cifrado fuerte?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                },
                {
                    "id": "proteccion_datos",
                    "nombre": "Protección de datos",
                    "descripcion": "Backup, cifrado y protección de información sensible",
                    "preguntas": [
                        {
                            "id": "pd_1",
                            "texto": "¿Se realizan copias de seguridad periódicas de los datos críticos?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pd_2",
                            "texto": "¿Los datos confidenciales están cifrados en tránsito y en reposo?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pd_3",
                            "texto": "¿El acceso a información sensible está restringido según roles?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                },
                {
                    "id": "prevencion_amenazas",
                    "nombre": "Prevención de amenazas",
                    "descripcion": "Formación, detección y prevención de ataques",
                    "preguntas": [
                        {
                            "id": "pa_am_1",
                            "texto": "¿Se capacita regularmente a los empleados sobre phishing y otras amenazas?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pa_am_2",
                            "texto": "¿Existen protocolos para verificar correos electrónicos y enlaces?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pa_am_3",
                            "texto": "¿Se utilizan herramientas de detección de amenazas en la empresa?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                },
                {
                    "id": "gestion_accesos",
                    "nombre": "Gestión de accesos y permisos",
                    "descripcion": "Control de accesos, privilegios y gestión de identidades",
                    "preguntas": [
                        {
                            "id": "ga_1",
                            "texto": "¿Se gestionan eficientemente los accesos y permisos de los empleados?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "ga_2",
                            "texto": "¿Los privilegios de administrador están limitados a personal autorizado?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "ga_3",
                            "texto": "¿Se implementan soluciones de gestión de identidad y acceso (IAM)?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                },
                {
                    "id": "respuesta_incidentes",
                    "nombre": "Respuesta ante incidentes",
                    "descripcion": "Planes de respuesta y gestión de incidentes de seguridad",
                    "preguntas": [
                        {
                            "id": "ri_1",
                            "texto": "¿La empresa cuenta con un plan de respuesta ante ciberataques?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "ri_2",
                            "texto": "¿Existe un equipo o responsable de gestión de incidentes?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "ri_3",
                            "texto": "¿Los incidentes de seguridad se reportan y documentan adecuadamente?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                },
                {
                    "id": "procesos_criticos",
                    "nombre": "Identificación de procesos críticos y activos",
                    "descripcion": "Inventario y protección de activos y procesos críticos",
                    "preguntas": [
                        {
                            "id": "pc_1",
                            "texto": "¿Se tiene un inventario actualizado de activos tecnológicos clave?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pc_2",
                            "texto": "¿Los procesos críticos de negocio han sido identificados y documentados?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pc_3",
                            "texto": "¿Se evalúan regularmente los riesgos asociados a los activos y procesos esenciales?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        },
                        {
                            "id": "pc_4",
                            "texto": "¿Se aplican medidas de monitoreo y protección para los activos más sensibles?",
                            "tipo": "escala",
                            "opciones": ["No", "Parcialmente", "Sí", "Avanzado"],
                            "valores": [1, 2, 3, 4]
                        }
                    ]
                }
            ]
        }
        
        # Guardar template por defecto
        templates = [default_template]
        self._save_templates(templates)
        return templates
    
    def get_templates(self):
        """Obtener todas las plantillas disponibles"""
        return self._load_templates()
    
    def get_template(self, template_id):
        """Obtener una plantilla específica"""
        templates = self._load_templates()
        return next((t for t in templates if t['id'] == template_id), None)
    
    def get_assessments(self, org_id, filtros=None):
        """Obtener assessments de una organización"""
        assessments = self._load_assessments(org_id)
        
        if filtros:
            # Filtrar por estado
            if filtros.get('estado'):
                assessments = [a for a in assessments if a.get('estado') == filtros['estado']]
            
            # Filtrar por fecha
            if filtros.get('fecha_desde'):
                assessments = [a for a in assessments if a.get('fecha_inicio', '') >= filtros['fecha_desde']]
            
            if filtros.get('fecha_hasta'):
                assessments = [a for a in assessments if a.get('fecha_inicio', '') <= filtros['fecha_hasta']]
        
        return assessments
    
    def create_assessment(self, org_id, data):
        """Crear un nuevo assessment"""
        assessments = self._load_assessments(org_id)
        
        # Generar ID único
        assessment_id = str(uuid.uuid4())
        
        # Crear assessment
        assessment = {
            'id': assessment_id,
            'organizacion_id': org_id,
            'cuestionario_id': data.get('cuestionario_id', 'cuestionario_ciberplan_v1'),
            'fecha_inicio': datetime.now().isoformat(),
            'fecha_completado': None,
            'fecha_firmado': None,
            'estado': 'abierto',
            'firmado_por': None,
            'nombre': data.get('nombre', f'Assessment {datetime.now().strftime("%Y-%m-%d")}'),
            'descripcion': data.get('descripcion', ''),
            'resultados': None,
            'objetivos': {
                '6_meses': data.get('objetivo_6meses', 2.5),
                '1_año': data.get('objetivo_1año', 3.0),
                '2_años': data.get('objetivo_2años', 4.0)
            },
            'auditoria': [{
                'accion': 'creacion',
                'fecha': datetime.now().isoformat(),
                'usuario': data.get('usuario', 'sistema'),
                'detalles': 'Assessment creado'
            }]
        }
        
        assessments.append(assessment)
        self._save_assessments(org_id, assessments)
        
        return assessment
    
    def update_assessment(self, org_id, assessment_id, data):
        """Actualizar un assessment"""
        assessments = self._load_assessments(org_id)
        
        for i, assessment in enumerate(assessments):
            if assessment['id'] == assessment_id:
                # Preservar campos del sistema
                data['id'] = assessment_id
                data['organizacion_id'] = org_id
                data['fecha_inicio'] = assessment['fecha_inicio']
                
                # Agregar entrada de auditoría
                if 'auditoria' not in data:
                    data['auditoria'] = assessment.get('auditoria', [])
                
                data['auditoria'].append({
                    'accion': 'modificacion',
                    'fecha': datetime.now().isoformat(),
                    'usuario': data.get('usuario', 'sistema'),
                    'detalles': 'Assessment modificado'
                })
                
                assessments[i] = data
                self._save_assessments(org_id, assessments)
                return data
        
        return None
    
    def complete_assessment(self, org_id, assessment_id, respuestas):
        """Completar un assessment con las respuestas"""
        assessments = self._load_assessments(org_id)
        template = None
        
        for i, assessment in enumerate(assessments):
            if assessment['id'] == assessment_id:
                # Obtener template del cuestionario
                template = self.get_template(assessment['cuestionario_id'])
                if not template:
                    raise ValueError("Template de cuestionario no encontrado")
                
                # Calcular resultados
                resultados = self._calculate_results(template, respuestas)
                
                # Actualizar assessment
                assessment['resultados'] = resultados
                assessment['fecha_completado'] = datetime.now().isoformat()
                assessment['estado'] = 'completado'
                
                # Agregar auditoría
                assessment['auditoria'].append({
                    'accion': 'completado',
                    'fecha': datetime.now().isoformat(),
                    'usuario': respuestas.get('usuario', 'sistema'),
                    'detalles': f'Assessment completado con puntuación {resultados["puntuacion_total"]:.2f}'
                })
                
                assessments[i] = assessment
                self._save_assessments(org_id, assessments)
                return assessment
        
        return None
    
    def _calculate_results(self, template, respuestas_data):
        """Calcular resultados del assessment"""
        dominios_resultados = []
        puntuacion_total = 0
        total_preguntas = 0
        
        for dominio in template['dominios']:
            dominio_puntos = 0
            dominio_preguntas = 0
            respuestas_dominio = []
            
            for pregunta in dominio['preguntas']:
                pregunta_id = pregunta['id']
                respuesta = respuestas_data.get(pregunta_id, {})
                
                if respuesta:
                    valor = respuesta.get('valor', 1)
                    dominio_puntos += valor
                    dominio_preguntas += 1
                    total_preguntas += 1
                    
                    respuestas_dominio.append({
                        'pregunta_id': pregunta_id,
                        'respuesta': respuesta.get('respuesta', ''),
                        'valor': valor,
                        'comentario': respuesta.get('comentario', '')
                    })
            
            nivel_dominio = dominio_puntos / dominio_preguntas if dominio_preguntas > 0 else 0
            puntuacion_total += dominio_puntos
            
            dominios_resultados.append({
                'dominio_id': dominio['id'],
                'nivel_actual': round(nivel_dominio, 2),
                'respuestas': respuestas_dominio
            })
        
        return {
            'dominios': dominios_resultados,
            'puntuacion_total': round(puntuacion_total / total_preguntas, 2) if total_preguntas > 0 else 0,
            'fecha_calculo': datetime.now().isoformat()
        }
    
    def sign_assessment(self, org_id, assessment_id, firmante):
        """Firmar un assessment"""
        assessments = self._load_assessments(org_id)
        
        for i, assessment in enumerate(assessments):
            if assessment['id'] == assessment_id:
                assessment['fecha_firmado'] = datetime.now().isoformat()
                assessment['firmado_por'] = firmante
                assessment['estado'] = 'firmado'
                
                # Agregar auditoría
                assessment['auditoria'].append({
                    'accion': 'firmado',
                    'fecha': datetime.now().isoformat(),
                    'usuario': firmante,
                    'detalles': f'Assessment firmado por {firmante}'
                })
                
                assessments[i] = assessment
                self._save_assessments(org_id, assessments)
                return assessment
        
        return None
    
    def get_dashboard_data(self, org_id, assessment_id):
        """Obtener datos para el dashboard de un assessment"""
        assessments = self._load_assessments(org_id)
        assessment = next((a for a in assessments if a['id'] == assessment_id), None)
        
        if not assessment or not assessment.get('resultados'):
            return None
        
        template = self.get_template(assessment['cuestionario_id'])
        if not template:
            return None
        
        # Preparar datos para visualizaciones
        dashboard_data = {
            'assessment': assessment,
            'template': template,
            'metricas': self._calculate_metrics(assessment, template),
            'radar_data': self._prepare_radar_data(assessment, template),
            'gaps_data': self._prepare_gaps_data(assessment, template),
            'timeline_data': self._prepare_timeline_data(assessment)
        }
        
        return dashboard_data
    
    def _calculate_metrics(self, assessment, template):
        """Calcular métricas del assessment"""
        resultados = assessment['resultados']
        
        # Contar preguntas total
        total_preguntas = sum(len(d['preguntas']) for d in template['dominios'])
        
        # Encontrar dominio más débil
        dominios_scores = [(d['dominio_id'], d['nivel_actual']) for d in resultados['dominios']]
        dominio_debil = min(dominios_scores, key=lambda x: x[1]) if dominios_scores else (None, 0)
        
        return {
            'puntuacion_total': resultados['puntuacion_total'],
            'total_preguntas': total_preguntas,
            'dominios_evaluados': len(resultados['dominios']),
            'dominio_mas_debil': dominio_debil[0],
            'puntuacion_mas_baja': dominio_debil[1],
            'porcentaje_completado': round((resultados['puntuacion_total'] / 4) * 100, 1)
        }
    
    def _prepare_radar_data(self, assessment, template):
        """Preparar datos para gráfico radar"""
        resultados = assessment['resultados']
        objetivos = assessment['objetivos']
        
        labels = []
        actual_data = []
        objetivo_6m_data = []
        objetivo_1a_data = []
        objetivo_2a_data = []
        
        for dominio_template in template['dominios']:
            dominio_id = dominio_template['id']
            dominio_resultado = next((d for d in resultados['dominios'] if d['dominio_id'] == dominio_id), None)
            
            labels.append(dominio_template['nombre'])
            actual_data.append(dominio_resultado['nivel_actual'] if dominio_resultado else 0)
            objetivo_6m_data.append(objetivos.get('6_meses', 2.5))
            objetivo_1a_data.append(objetivos.get('1_año', 3.0))
            objetivo_2a_data.append(objetivos.get('2_años', 4.0))
        
        return {
            'labels': labels,
            'datasets': [
                {
                    'label': 'Estado Actual',
                    'data': actual_data,
                    'borderColor': 'rgba(255, 107, 107, 1)',
                    'backgroundColor': 'rgba(255, 107, 107, 0.2)'
                },
                {
                    'label': 'Objetivo 6 meses',
                    'data': objetivo_6m_data,
                    'borderColor': 'rgba(255, 193, 61, 1)',
                    'backgroundColor': 'rgba(255, 193, 61, 0.2)'
                },
                {
                    'label': 'Objetivo 1 año',
                    'data': objetivo_1a_data,
                    'borderColor': 'rgba(107, 207, 127, 1)',
                    'backgroundColor': 'rgba(107, 207, 127, 0.2)'
                },
                {
                    'label': 'Objetivo 2 años',
                    'data': objetivo_2a_data,
                    'borderColor': 'rgba(76, 172, 254, 1)',
                    'backgroundColor': 'rgba(76, 172, 254, 0.2)'
                }
            ]
        }
    
    def _prepare_gaps_data(self, assessment, template):
        """Preparar datos para análisis de gaps"""
        resultados = assessment['resultados']
        objetivos = assessment['objetivos']
        
        gaps = []
        for dominio_template in template['dominios']:
            dominio_id = dominio_template['id']
            dominio_resultado = next((d for d in resultados['dominios'] if d['dominio_id'] == dominio_id), None)
            
            if dominio_resultado:
                actual = dominio_resultado['nivel_actual']
                objetivo = objetivos.get('2_años', 4.0)
                gap = objetivo - actual
                
                gaps.append({
                    'dominio': dominio_template['nombre'],
                    'actual': actual,
                    'objetivo': objetivo,
                    'gap': gap,
                    'porcentaje': round((actual / objetivo) * 100, 1) if objetivo > 0 else 0
                })
        
        return gaps
    
    def _prepare_timeline_data(self, assessment):
        """Preparar datos para timeline del roadmap"""
        objetivos = assessment['objetivos']
        resultados = assessment['resultados']
        
        return {
            'actual': {
                'fecha': assessment['fecha_completado'],
                'puntuacion': resultados['puntuacion_total']
            },
            'objetivos': [
                {
                    'periodo': '6 meses',
                    'puntuacion': objetivos.get('6_meses', 2.5)
                },
                {
                    'periodo': '1 año',
                    'puntuacion': objetivos.get('1_año', 3.0)
                },
                {
                    'periodo': '2 años',
                    'puntuacion': objetivos.get('2_años', 4.0)
                }
            ]
        }
    
    def get_history(self, org_id):
        """Obtener histórico de assessments"""
        assessments = self._load_assessments(org_id)
        
        # Filtrar solo assessments completados y ordenar por fecha
        completed_assessments = [a for a in assessments if a.get('estado') in ['completado', 'firmado']]
        completed_assessments.sort(key=lambda x: x.get('fecha_completado', ''))
        
        # Preparar datos de evolución
        evolution_data = []
        for assessment in completed_assessments:
            if assessment.get('resultados'):
                evolution_data.append({
                    'fecha': assessment['fecha_completado'],
                    'puntuacion_total': assessment['resultados']['puntuacion_total'],
                    'assessment_id': assessment['id'],
                    'nombre': assessment.get('nombre', 'Assessment')
                })
        
        return {
            'assessments': completed_assessments,
            'evolution': evolution_data
        }