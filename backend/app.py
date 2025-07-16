#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from functools import wraps
import traceback

# Importar módulos
from modules.inventario.inventario_service import InventarioService
from modules.impactos.impactos_service import ImpactosService
from modules.madurez.madurez_service import MadurezService
from modules.auth.auth_routes import auth_bp
from modules.auth.admin_routes import admin_bp
from modules.auth.audit_routes import audit_bp
from modules.auth.audit_middleware import audit_action

# Intenta importar GCS storage
try:
    from modules.storage.gcs_storage import GCSStorageService
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación Flask
app = Flask(__name__, static_folder='../static', static_url_path='/static')
CORS(app)

# Configuración de sesión para OAuth
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configuración
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['DATA_DIR'] = os.path.join(os.path.dirname(__file__), '..', 'data')
app.config['OAUTH_ENABLED'] = os.environ.get('OAUTH_ENABLED', 'false').lower() == 'true'
DATA_DIR = app.config['DATA_DIR']
os.makedirs(DATA_DIR, exist_ok=True)

# Habilitar GCS si está disponible y configurado
USE_GCS = GCS_AVAILABLE and os.environ.get('USE_GCS', 'false').lower() == 'true'
if USE_GCS:
    gcs_storage = GCSStorageService()
    app.gcs_storage = gcs_storage  # Hacer disponible para blueprints
    logger.info("Using GCS storage for data persistence")
else:
    gcs_storage = None
    app.gcs_storage = None  # Hacer disponible para blueprints
    logger.info("Using local file storage")

# Servicios
inventario_service = InventarioService(DATA_DIR)
impactos_service = ImpactosService(DATA_DIR)
madurez_service = MadurezService(DATA_DIR)

# Middleware para organización
def get_organization():
    return request.headers.get('X-Organization-Id', 'default')

def require_organization(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        org_id = get_organization()
        if not org_id or org_id == 'default':
            return jsonify({'error': 'Organización no especificada'}), 400
        return f(*args, **kwargs)
    return decorated_function

# Rutas estáticas
@app.route('/')
def index():
    return send_from_directory('../apps/shell', 'index.html')

@app.route('/apps/<path:path>')
def serve_app(path):
    return send_from_directory('../apps', path)

@app.route('/core/<path:path>')
def serve_core(path):
    return send_from_directory('../core', path)

@app.route('/version.json')
def serve_version():
    return send_from_directory('..', 'version.json')

# API de Organizaciones
@app.route('/api/organizaciones', methods=['GET'])
def get_organizaciones():
    try:
        if USE_GCS:
            # Cargar desde GCS
            data = gcs_storage.leer_archivo('organizaciones.json')
            if data:
                # El archivo puede tener estructura {organizaciones: [...]} o ser directamente una lista
                if isinstance(data, dict) and 'organizaciones' in data:
                    orgs = data['organizaciones']
                elif isinstance(data, list):
                    orgs = data
                else:
                    orgs = []
            else:
                orgs = []
        else:
            # Cargar desde sistema local
            orgs_file = os.path.join(DATA_DIR, 'organizaciones.json')
            if os.path.exists(orgs_file):
                with open(orgs_file, 'r', encoding='utf-8') as f:
                    orgs = json.load(f)
            else:
                orgs = []
        
        return jsonify(orgs)
    except Exception as e:
        logger.error(f"Error obteniendo organizaciones: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/organizaciones', methods=['POST'])
def create_organizacion():
    try:
        data = request.get_json()
        nombre = data.get('nombre', '').strip()
        
        if not nombre:
            return jsonify({'error': 'Nombre requerido'}), 400
        
        # Cargar organizaciones existentes
        if USE_GCS:
            orgs_data = gcs_storage.leer_archivo('organizaciones.json')
            if orgs_data:
                if isinstance(orgs_data, dict) and 'organizaciones' in orgs_data:
                    orgs = orgs_data['organizaciones']
                elif isinstance(orgs_data, list):
                    orgs = orgs_data
                else:
                    orgs = []
            else:
                orgs = []
        else:
            orgs_file = os.path.join(DATA_DIR, 'organizaciones.json')
            if os.path.exists(orgs_file):
                with open(orgs_file, 'r', encoding='utf-8') as f:
                    orgs = json.load(f)
            else:
                orgs = []
        
        # Generar ID único
        org_id = nombre.lower().replace(' ', '_')
        if any(org['id'] == org_id for org in orgs):
            return jsonify({'error': 'Organización ya existe'}), 400
        
        # Crear nueva organización
        nueva_org = {
            'id': org_id,
            'nombre': nombre,
            'fecha_creacion': datetime.now().isoformat(),
            'activa': True
        }
        
        orgs.append(nueva_org)
        
        # Guardar
        if USE_GCS:
            # Guardar en GCS con la estructura correcta
            gcs_storage.escribir_archivo('organizaciones.json', {'organizaciones': orgs})
        else:
            # Guardar localmente
            with open(orgs_file, 'w', encoding='utf-8') as f:
                json.dump(orgs, f, indent=2, ensure_ascii=False)
            
            # Crear directorios para la organización
            org_data_dir = os.path.join(DATA_DIR, org_id)
            os.makedirs(org_data_dir, exist_ok=True)
        
        return jsonify(nueva_org), 201
        
    except Exception as e:
        logger.error(f"Error creando organización: {e}")
        return jsonify({'error': str(e)}), 500

# API de Inventario
@app.route('/api/inventario/activos', methods=['GET'])
@require_organization
def get_activos():
    try:
        org_id = get_organization()
        filtros = {
            'tipo': request.args.get('tipo'),
            'departamento': request.args.get('departamento'),
            'busqueda': request.args.get('busqueda')
        }
        activos = inventario_service.get_activos(org_id, filtros)
        return jsonify(activos)
    except Exception as e:
        logger.error(f"Error obteniendo activos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/activos', methods=['POST'])
@require_organization
def create_activo():
    try:
        org_id = get_organization()
        data = request.get_json()
        activo = inventario_service.create_activo(org_id, data)
        return jsonify(activo), 201
    except Exception as e:
        logger.error(f"Error creando activo: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/activos/<activo_id>', methods=['PUT'])
@require_organization
def update_activo(activo_id):
    try:
        org_id = get_organization()
        data = request.get_json()
        # DEBUG: Log los datos recibidos
        logger.info(f"PUT /api/inventario/activos/{activo_id}")
        logger.info(f"Datos recibidos: {data}")
        
        activo = inventario_service.update_activo(org_id, activo_id, data)
        if activo:
            # DEBUG: Log el activo actualizado
            logger.info(f"Activo actualizado - responsable: {activo.get('responsable')}")
            return jsonify(activo)
        return jsonify({'error': 'Activo no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error actualizando activo: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/activos/<activo_id>', methods=['DELETE'])
@require_organization
def delete_activo(activo_id):
    try:
        org_id = get_organization()
        if inventario_service.delete_activo(org_id, activo_id):
            return '', 204
        return jsonify({'error': 'Activo no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error eliminando activo: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/estadisticas', methods=['GET'])
@require_organization
def get_estadisticas():
    try:
        org_id = get_organization()
        stats = inventario_service.get_estadisticas(org_id)
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/departamentos', methods=['GET'])
@require_organization
def get_departamentos():
    try:
        org_id = get_organization()
        departamentos = inventario_service.get_departamentos(org_id)
        return jsonify(departamentos)
    except Exception as e:
        logger.error(f"Error obteniendo departamentos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/preview-import', methods=['POST'])
@require_organization
def preview_import():
    try:
        org_id = get_organization()
        if 'file' not in request.files:
            return jsonify({'error': 'No se proporcionó archivo'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó archivo'}), 400
        
        # Obtener extensión
        extension = file.filename.split('.')[-1].lower()
        if extension not in ['csv', 'xlsx']:
            return jsonify({'error': 'Formato no soportado'}), 400
        
        # Procesar preview
        preview_data = inventario_service.preview_import(file, extension)
        return jsonify(preview_data)
        
    except Exception as e:
        logger.error(f"Error en preview importación: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/importar', methods=['POST'])
@require_organization
def importar_activos():
    try:
        org_id = get_organization()
        if 'file' not in request.files:
            return jsonify({'error': 'No se proporcionó archivo'}), 400
        
        file = request.files['file']
        reemplazar = request.form.get('reemplazar', 'false').lower() == 'true'
        
        # Obtener extensión
        extension = file.filename.split('.')[-1].lower()
        if extension not in ['csv', 'xlsx']:
            return jsonify({'error': 'Formato no soportado'}), 400
        
        # Procesar importación
        resultado = inventario_service.importar_activos(org_id, file, extension, reemplazar)
        return jsonify(resultado)
        
    except Exception as e:
        logger.error(f"Error importando activos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventario/exportar', methods=['GET'])
@require_organization
def exportar_activos():
    try:
        org_id = get_organization()
        formato = request.args.get('formato', 'csv')
        
        # Obtener filtros
        filtros = {
            'tipo': request.args.get('tipo'),
            'departamento': request.args.get('departamento'),
            'busqueda': request.args.get('busqueda')
        }
        
        # Generar archivo
        archivo_data, filename = inventario_service.exportar_activos(org_id, formato, filtros)
        
        # Enviar archivo
        from flask import Response
        response = Response(
            archivo_data,
            mimetype='text/csv' if formato == 'csv' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename={filename}'
            }
        )
        return response
        
    except Exception as e:
        logger.error(f"Error exportando activos: {e}")
        return jsonify({'error': str(e)}), 500

# API de Impactos
@app.route('/api/impactos', methods=['GET'])
@require_organization
def get_impactos():
    try:
        org_id = get_organization()
        filtros = {
            'tipo': request.args.get('tipo'),
            'estado': request.args.get('estado'),
            'fecha_desde': request.args.get('fecha_desde'),
            'fecha_hasta': request.args.get('fecha_hasta')
        }
        impactos = impactos_service.get_impactos(org_id, filtros)
        return jsonify(impactos)
    except Exception as e:
        logger.error(f"Error obteniendo impactos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos', methods=['POST'])
@require_organization
def create_impacto():
    try:
        org_id = get_organization()
        data = request.get_json()
        impacto = impactos_service.create_impacto(org_id, data)
        return jsonify(impacto), 201
    except Exception as e:
        logger.error(f"Error creando impacto: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/<impacto_id>', methods=['GET'])
@require_organization
def get_impacto(impacto_id):
    try:
        org_id = get_organization()
        impacto = impactos_service.get_impacto(org_id, impacto_id)
        if impacto:
            return jsonify(impacto)
        return jsonify({'error': 'Impacto no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error obteniendo impacto {impacto_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/<impacto_id>/procesar', methods=['POST'])
@require_organization
def procesar_impacto(impacto_id):
    try:
        org_id = get_organization()
        resultado = impactos_service.procesar_impacto(org_id, impacto_id, inventario_service)
        if resultado:
            return jsonify(resultado)
        return jsonify({'error': 'Impacto no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error procesando impacto: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/plantillas/<tipo>', methods=['GET'])
def get_plantilla(tipo):
    try:
        plantilla = impactos_service.get_plantilla(tipo)
        if plantilla:
            return jsonify(plantilla)
        return jsonify({'error': 'Plantilla no encontrada'}), 404
    except Exception as e:
        logger.error(f"Error obteniendo plantilla: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/estadisticas', methods=['GET'])
def get_impactos_estadisticas():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        impactos = impactos_service._load_impactos(org_id)
        
        # Calcular estadísticas
        estadisticas = {
            'total': len(impactos),
            'pendientes': len([i for i in impactos if i.get('estado') == 'pendiente']),
            'procesados': len([i for i in impactos if i.get('estado') == 'procesado']),
            'porTipo': {},
            'tareas_pendientes': 0
        }
        
        # Contar por tipo y tareas pendientes
        for impacto in impactos:
            tipo = impacto.get('tipo', 'sin_tipo')
            estadisticas['porTipo'][tipo] = estadisticas['porTipo'].get(tipo, 0) + 1
            
            # Contar tareas pendientes (buscar en diferentes formatos)
            tareas_impacto = []
            if impacto.get('acciones_ejecutadas') and isinstance(impacto['acciones_ejecutadas'], dict):
                tareas_impacto = impacto['acciones_ejecutadas'].get('tareas_creadas', [])
            elif impacto.get('tareas_generadas'):
                tareas_impacto = impacto['tareas_generadas']
            
            for tarea in tareas_impacto:
                if tarea.get('estado') == 'pendiente':
                    estadisticas['tareas_pendientes'] += 1
        
        return jsonify(estadisticas)
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas de impactos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas', methods=['GET'])
def get_impactos_tareas():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        filtros = {
            'estado': request.args.get('estado'),
            'responsable': request.args.get('responsable')
        }
        filtros = {k: v for k, v in filtros.items() if v}
        
        tareas = impactos_service.get_tareas(org_id, filtros)
        
        return jsonify(tareas)
    except Exception as e:
        logger.error(f"Error obteniendo tareas: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/<tarea_id>/completar', methods=['POST'])
def completar_tarea(tarea_id):
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        data = request.get_json() or {}
        usuario = data.get('usuario', 'sistema')
        comentarios = data.get('comentarios', '')
        
        resultado = impactos_service.completar_tarea(org_id, tarea_id, usuario, comentarios)
        
        return jsonify({'success': True, 'message': 'Tarea completada correctamente'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error completando tarea {tarea_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/completar-masivo', methods=['POST'])
def completar_tareas_masivo():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        data = request.get_json()
        if not data or 'tareas' not in data:
            return jsonify({'error': 'Lista de tareas requerida'}), 400
        
        tarea_ids = data['tareas']
        usuario = data.get('usuario', 'sistema')
        comentarios = data.get('comentarios', 'Completadas en lote')
        
        resultados = impactos_service.completar_tareas_masivo(org_id, tarea_ids, usuario, comentarios)
        
        return jsonify({
            'success': True,
            'completadas': resultados['completadas'],
            'errores': resultados['errores'],
            'message': f"{resultados['completadas']} tarea(s) completada(s) correctamente"
        })
    except Exception as e:
        logger.error(f"Error completando tareas masivamente: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/<tarea_id>/posponer', methods=['POST'])
def posponer_tarea(tarea_id):
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        data = request.get_json()
        if not data or 'nueva_fecha' not in data:
            return jsonify({'error': 'Nueva fecha requerida'}), 400
        
        nueva_fecha = data['nueva_fecha']
        usuario = data.get('usuario', 'sistema')
        comentarios = data.get('comentarios', '')
        
        resultado = impactos_service.posponer_tarea(org_id, tarea_id, nueva_fecha, usuario, comentarios)
        
        return jsonify({'success': True, 'message': 'Tarea pospuesta correctamente'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error posponiendo tarea {tarea_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/posponer', methods=['POST'])
def posponer_tareas_masivo():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        data = request.get_json()
        if not data or 'tareas' not in data or 'nueva_fecha' not in data:
            return jsonify({'error': 'Lista de tareas y nueva fecha requeridas'}), 400
        
        tarea_ids = data['tareas']
        nueva_fecha = data['nueva_fecha']
        usuario = data.get('usuario', 'sistema')
        comentarios = data.get('comentarios', 'Pospuestas en lote')
        
        resultados = impactos_service.posponer_tareas_masivo(org_id, tarea_ids, nueva_fecha, usuario, comentarios)
        
        return jsonify({
            'success': True,
            'pospuestas': resultados['pospuestas'],
            'errores': resultados['errores'],
            'message': f"{resultados['pospuestas']} tarea(s) pospuesta(s) correctamente"
        })
    except Exception as e:
        logger.error(f"Error posponiendo tareas masivamente: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/<tarea_id>/historial', methods=['GET'])
def get_tarea_historial(tarea_id):
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        historial = impactos_service.get_tarea_historial(org_id, tarea_id)
        
        return jsonify(historial)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error obteniendo historial de tarea {tarea_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/estadisticas', methods=['GET'])
def get_estadisticas_tareas():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        estadisticas = impactos_service.get_estadisticas_tareas(org_id)
        
        return jsonify(estadisticas)
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas de tareas: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/tareas/<tarea_id>/comentario', methods=['POST'])
def agregar_comentario_tarea(tarea_id):
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        data = request.get_json()
        if not data or 'comentarios' not in data:
            return jsonify({'error': 'Comentario requerido'}), 400
        
        comentarios = data['comentarios']
        usuario = data.get('usuario', 'sistema')
        
        resultado = impactos_service.agregar_comentario_tarea(org_id, tarea_id, comentarios, usuario)
        
        return jsonify({'success': True, 'message': 'Comentario agregado correctamente'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error agregando comentario a tarea {tarea_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/recientes', methods=['GET'])
def get_impactos_recientes():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        limit = int(request.args.get('limit', 10))
        impactos = impactos_service._load_impactos(org_id)
        
        # Ordenar por fecha de creación descendente y tomar los últimos N
        impactos_ordenados = sorted(impactos, key=lambda x: x.get('fecha_creacion', ''), reverse=True)
        recientes = impactos_ordenados[:limit]
        
        return jsonify(recientes)
    except Exception as e:
        logger.error(f"Error obteniendo impactos recientes: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impactos/actividad', methods=['GET'])
def get_impactos_actividad():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        limit = int(request.args.get('limit', 15))
        
        # Por ahora devolver lista vacía, después implementaremos actividad real
        actividad = []
        
        return jsonify(actividad)
    except Exception as e:
        logger.error(f"Error obteniendo actividad: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/estadisticas', methods=['GET'])
def get_madurez_estadisticas():
    try:
        org_id = request.headers.get('X-Organization-Id')
        if not org_id:
            return jsonify({'error': 'Organización no especificada'}), 400
        
        evaluaciones = madurez_service.get_assessments(org_id)
        
        # Calcular estadísticas
        total = len(evaluaciones)
        completadas = len([e for e in evaluaciones if e.get('estado') in ['completado', 'firmado']])
        progreso = len([e for e in evaluaciones if e.get('estado') == 'abierto'])
        
        # Calcular puntuación promedio
        puntuaciones = [e.get('resultados', {}).get('puntuacion_total', 0) for e in evaluaciones if e.get('estado') in ['completado', 'firmado'] and e.get('resultados')]
        puntuacion = sum(puntuaciones) / len(puntuaciones) if puntuaciones else None
        
        estadisticas = {
            'total': total,
            'completadas': completadas,
            'progreso': progreso,
            'puntuacion': puntuacion,
            'ultimaEvaluacion': evaluaciones[0] if evaluaciones else None
        }
        
        return jsonify(estadisticas)
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas de madurez: {e}")
        return jsonify({'error': str(e)}), 500

# API de Madurez
@app.route('/api/madurez/templates', methods=['GET'])
def get_madurez_templates():
    try:
        templates = madurez_service.get_templates()
        return jsonify(templates)
    except Exception as e:
        logger.error(f"Error obteniendo templates de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/templates/<template_id>', methods=['GET'])
def get_madurez_template(template_id):
    try:
        template = madurez_service.get_template(template_id)
        if template:
            return jsonify(template)
        return jsonify({'error': 'Template no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error obteniendo template de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments', methods=['GET'])
@require_organization
def get_madurez_assessments():
    try:
        org_id = get_organization()
        filtros = {
            'estado': request.args.get('estado'),
            'fecha_desde': request.args.get('fecha_desde'),
            'fecha_hasta': request.args.get('fecha_hasta')
        }
        assessments = madurez_service.get_assessments(org_id, filtros)
        return jsonify(assessments)
    except Exception as e:
        logger.error(f"Error obteniendo assessments de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments', methods=['POST'])
@require_organization
def create_madurez_assessment():
    try:
        org_id = get_organization()
        data = request.get_json()
        assessment = madurez_service.create_assessment(org_id, data)
        return jsonify(assessment), 201
    except Exception as e:
        logger.error(f"Error creando assessment de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments/<assessment_id>', methods=['GET'])
@require_organization
def get_madurez_assessment(assessment_id):
    try:
        org_id = get_organization()
        assessments = madurez_service.get_assessments(org_id)
        assessment = next((a for a in assessments if a['id'] == assessment_id), None)
        if assessment:
            return jsonify(assessment)
        return jsonify({'error': 'Assessment no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error obteniendo assessment de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments/<assessment_id>', methods=['PUT'])
@require_organization
def update_madurez_assessment(assessment_id):
    try:
        org_id = get_organization()
        data = request.get_json()
        assessment = madurez_service.update_assessment(org_id, assessment_id, data)
        if assessment:
            return jsonify(assessment)
        return jsonify({'error': 'Assessment no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error actualizando assessment de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments/<assessment_id>/complete', methods=['POST'])
@require_organization
def complete_madurez_assessment(assessment_id):
    try:
        org_id = get_organization()
        data = request.get_json()
        respuestas = data.get('respuestas', {})
        assessment = madurez_service.complete_assessment(org_id, assessment_id, respuestas)
        if assessment:
            return jsonify(assessment)
        return jsonify({'error': 'Assessment no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error completando assessment de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments/<assessment_id>/sign', methods=['POST'])
@require_organization
def sign_madurez_assessment(assessment_id):
    try:
        org_id = get_organization()
        data = request.get_json()
        firmante = data.get('firmante', 'Usuario')
        assessment = madurez_service.sign_assessment(org_id, assessment_id, firmante)
        if assessment:
            return jsonify(assessment)
        return jsonify({'error': 'Assessment no encontrado'}), 404
    except Exception as e:
        logger.error(f"Error firmando assessment de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/assessments/<assessment_id>', methods=['DELETE'])
@require_organization
def delete_madurez_assessment(assessment_id):
    try:
        org_id = get_organization()
        if madurez_service.delete_assessment(org_id, assessment_id):
            return '', 204
        return jsonify({'error': 'Assessment no encontrado'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error eliminando assessment de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/dashboard/<assessment_id>', methods=['GET'])
@require_organization
def get_madurez_dashboard(assessment_id):
    try:
        org_id = get_organization()
        dashboard_data = madurez_service.get_dashboard_data(org_id, assessment_id)
        if dashboard_data:
            return jsonify(dashboard_data)
        return jsonify({'error': 'Datos de dashboard no encontrados'}), 404
    except Exception as e:
        logger.error(f"Error obteniendo dashboard de madurez: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/madurez/history', methods=['GET'])
@require_organization
def get_madurez_history():
    try:
        org_id = get_organization()
        history = madurez_service.get_history(org_id)
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error obteniendo histórico de madurez: {e}")
        return jsonify({'error': str(e)}), 500

# Debug endpoint (remove in production)
@app.route('/api/debug/gcs', methods=['GET'])
def debug_gcs():
    """Debug endpoint to check GCS connection"""
    try:
        debug_info = {
            'use_gcs': USE_GCS,
            'gcs_available': GCS_AVAILABLE,
            'bucket_name': os.environ.get('GCS_BUCKET_NAME', 'Not set'),
            'project_id': os.environ.get('GOOGLE_CLOUD_PROJECT', 'Not set')
        }
        
        if USE_GCS and gcs_storage:
            # Try to list files
            files = gcs_storage.listar_archivos()
            debug_info['files_count'] = len(files)
            debug_info['organization_files'] = [f for f in files if f.startswith('inventario_')][:10]
        
        return jsonify(debug_info)
    except Exception as e:
        return jsonify({'error': str(e), 'use_gcs': USE_GCS}), 500

# Registrar blueprints de autenticación
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(audit_bp)

# Endpoint para obtener organizaciones (para modal de login)
@app.route('/api/organizations', methods=['GET'])
def get_organizations():
    try:
        # Leer organizaciones desde GCS o local
        if USE_GCS:
            data = gcs_storage.leer_archivo('organizaciones.json')
            if not data:
                return jsonify([])
            organizations = data
        else:
            orgs_file = os.path.join(DATA_DIR, 'organizaciones.json')
            if not os.path.exists(orgs_file):
                return jsonify([])
            
            with open(orgs_file, 'r', encoding='utf-8') as f:
                organizations = json.load(f)
        
        # Convertir a lista y filtrar solo datos públicos
        org_list = []
        
        # Manejar diferentes formatos de archivo
        if isinstance(organizations, dict):
            # Si es un diccionario de organizaciones
            for org_id, org_data in organizations.items():
                if isinstance(org_data, dict) and org_data.get('activa', True):
                    org_list.append({
                        'id': org_data.get('id', org_id),
                        'nombre': org_data.get('nombre', ''),
                        'tiene_oauth': 'oauth_config' in org_data
                    })
        elif isinstance(organizations, list):
            # Si ya es una lista
            for org_data in organizations:
                if isinstance(org_data, dict) and org_data.get('activa', True):
                    org_list.append({
                        'id': org_data.get('id', ''),
                        'nombre': org_data.get('nombre', ''),
                        'tiene_oauth': 'oauth_config' in org_data
                    })
        
        return jsonify(org_list)
    
    except Exception as e:
        logger.error(f"Error obteniendo organizaciones: {e}")
        return jsonify({'error': 'Error obteniendo organizaciones'}), 500

# Manejo de errores
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Error interno: {error}")
    return jsonify({'error': 'Error interno del servidor'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)