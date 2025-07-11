#!/usr/bin/env python3
from flask import Flask, jsonify, request, send_from_directory, redirect
from flask_cors import CORS
import json
import os
import re
from datetime import datetime
import pandas as pd
from werkzeug.utils import secure_filename
import uuid

# Importar comunicador de Slack (opcional)
import sys
try:
    sys.path.append('./claude_tools')
    from slack_comunicacion import slack
    SLACK_ENABLED = True
except:
    SLACK_ENABLED = False
    class SlackDummy:
        def send_update(self, msg):
            print(f"[SLACK] {msg}")
    slack = SlackDummy()

app = Flask(__name__)
CORS(app)

# Configuración
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xls', 'xlsx', 'csv'}
DATA_DIR = 'data'
ORGS_FILE = 'data/organizaciones.json'

# Crear directorios necesarios
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs('static', exist_ok=True)

# Funciones auxiliares para organizaciones
def sanitizar_nombre_org(nombre):
    """Sanitiza el nombre de la organización para usar como nombre de archivo"""
    # Reemplazar caracteres no válidos
    nombre_sanitizado = re.sub(r'[^\w\s-]', '', nombre.lower())
    nombre_sanitizado = re.sub(r'[-\s]+', '-', nombre_sanitizado)
    return nombre_sanitizado[:50]  # Limitar longitud

def obtener_archivo_org(org_id):
    """Obtiene la ruta del archivo de datos de una organización"""
    return os.path.join(DATA_DIR, f'inventario_{org_id}.json')

def cargar_organizaciones():
    """Carga la lista de organizaciones"""
    if not os.path.exists(ORGS_FILE):
        return []
    
    with open(ORGS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f).get('organizaciones', [])

def guardar_organizaciones(organizaciones):
    """Guarda la lista de organizaciones"""
    with open(ORGS_FILE, 'w', encoding='utf-8') as f:
        json.dump({'organizaciones': organizaciones}, f, ensure_ascii=False, indent=2)

def cargar_datos_org(org_id):
    """Carga los datos de una organización específica"""
    archivo = obtener_archivo_org(org_id)
    
    if not os.path.exists(archivo):
        # Crear archivo vacío para nueva organización
        datos_iniciales = {'activos': [], 'categorias': [], 'usuarios': []}
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(datos_iniciales, f, ensure_ascii=False, indent=2)
        return datos_iniciales
    
    with open(archivo, 'r', encoding='utf-8') as f:
        return json.load(f)

def guardar_datos_org(org_id, datos):
    """Guarda los datos de una organización específica"""
    archivo = obtener_archivo_org(org_id)
    with open(archivo, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Rutas principales
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/login')
def login():
    return send_from_directory('static', 'login.html')

# API de organizaciones
@app.route('/api/organizaciones', methods=['GET'])
def obtener_organizaciones():
    """Obtener lista de organizaciones"""
    organizaciones = cargar_organizaciones()
    return jsonify({
        'success': True,
        'organizaciones': organizaciones
    })

@app.route('/api/organizaciones', methods=['POST'])
def crear_organizacion():
    """Crear nueva organización"""
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    
    if not nombre:
        return jsonify({'success': False, 'message': 'Nombre requerido'}), 400
    
    # Generar ID único
    org_id = sanitizar_nombre_org(nombre) + '_' + str(uuid.uuid4())[:8]
    
    # Cargar organizaciones existentes
    organizaciones = cargar_organizaciones()
    
    # Verificar si ya existe
    if any(org['nombre'].lower() == nombre.lower() for org in organizaciones):
        return jsonify({'success': False, 'message': 'La organización ya existe'}), 400
    
    # Agregar nueva organización
    nueva_org = {
        'id': org_id,
        'nombre': nombre,
        'fecha_creacion': datetime.now().isoformat(),
        'ultimo_acceso': datetime.now().isoformat()
    }
    
    organizaciones.append(nueva_org)
    guardar_organizaciones(organizaciones)
    
    # Crear archivo de datos vacío
    cargar_datos_org(org_id)
    
    slack.send_update(f"🏢 Nueva organización creada: {nombre}")
    
    return jsonify({
        'success': True,
        'organizacion_id': org_id,
        'message': 'Organización creada exitosamente'
    })

@app.route('/api/organizaciones/<org_id>/acceder', methods=['POST'])
def acceder_organizacion(org_id):
    """Registrar acceso a una organización"""
    organizaciones = cargar_organizaciones()
    
    for org in organizaciones:
        if org['id'] == org_id:
            org['ultimo_acceso'] = datetime.now().isoformat()
            guardar_organizaciones(organizaciones)
            
            return jsonify({
                'success': True,
                'nombre': org['nombre']
            })
    
    return jsonify({'success': False, 'message': 'Organización no encontrada'}), 404

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/activos', methods=['GET'])
def obtener_activos():
    """Obtener todos los activos con filtros opcionales"""
    org_id = request.headers.get('X-Organization-Id')
    if not org_id:
        return jsonify({'success': False, 'message': 'Organización no especificada'}), 400
    
    datos = cargar_datos_org(org_id)
    activos = datos.get('activos', [])
    
    # Aplicar filtros
    tipo = request.args.get('tipo')
    responsable = request.args.get('responsable')
    departamento = request.args.get('departamento')
    
    if tipo:
        activos = [a for a in activos if a.get('tipo_activo') == tipo]
    if responsable:
        activos = [a for a in activos if responsable.lower() in a.get('responsable', '').lower()]
    if departamento:
        activos = [a for a in activos if departamento.lower() in a.get('departamento', '').lower()]
    
    return jsonify({
        'success': True,
        'activos': activos,
        'total': len(activos)
    })

@app.route('/api/activos/<activo_id>', methods=['GET'])
def obtener_activo(activo_id):
    """Obtener un activo específico"""
    datos = cargar_datos()
    activo = next((a for a in datos['activos'] if a['id'] == activo_id), None)
    
    if activo:
        return jsonify({'success': True, 'activo': activo})
    else:
        return jsonify({'success': False, 'message': 'Activo no encontrado'}), 404

@app.route('/api/activos', methods=['POST'])
def crear_activo():
    """Crear un nuevo activo"""
    org_id = request.headers.get('X-Organization-Id')
    if not org_id:
        return jsonify({'success': False, 'message': 'Organización no especificada'}), 400
    
    datos = cargar_datos_org(org_id)
    nuevo_activo = request.json
    
    # Generar ID único
    nuevo_activo['id'] = str(uuid.uuid4())
    nuevo_activo['fecha_registro'] = datetime.now().isoformat()
    nuevo_activo['fecha_modificacion'] = datetime.now().isoformat()
    
    # Agregar campos de auditoría
    nuevo_activo['historial_cambios'] = [{
        'fecha': datetime.now().isoformat(),
        'usuario': request.json.get('usuario_registro', 'Sistema'),
        'accion': 'Creación del activo'
    }]
    
    datos['activos'].append(nuevo_activo)
    guardar_datos_org(org_id, datos)
    
    slack.send_update(f"✅ Nuevo activo creado: {nuevo_activo.get('nombre', 'Sin nombre')} (Tipo: {nuevo_activo.get('tipo_activo')})")
    
    return jsonify({'success': True, 'activo': nuevo_activo}), 201

@app.route('/api/activos/<activo_id>', methods=['PUT'])
def actualizar_activo(activo_id):
    """Actualizar un activo existente"""
    datos = cargar_datos()
    activo_index = next((i for i, a in enumerate(datos['activos']) if a['id'] == activo_id), None)
    
    if activo_index is None:
        return jsonify({'success': False, 'message': 'Activo no encontrado'}), 404
    
    # Actualizar datos
    datos['activos'][activo_index].update(request.json)
    datos['activos'][activo_index]['fecha_modificacion'] = datetime.now().isoformat()
    
    # Agregar al historial
    if 'historial_cambios' not in datos['activos'][activo_index]:
        datos['activos'][activo_index]['historial_cambios'] = []
    
    datos['activos'][activo_index]['historial_cambios'].append({
        'fecha': datetime.now().isoformat(),
        'usuario': request.json.get('usuario_modificacion', 'Sistema'),
        'accion': 'Actualización del activo',
        'campos_modificados': list(request.json.keys())
    })
    
    guardar_datos(datos)
    
    return jsonify({'success': True, 'activo': datos['activos'][activo_index]})

@app.route('/api/activos/<activo_id>', methods=['DELETE'])
def eliminar_activo(activo_id):
    """Eliminar un activo"""
    datos = cargar_datos()
    activo_index = next((i for i, a in enumerate(datos['activos']) if a['id'] == activo_id), None)
    
    if activo_index is None:
        return jsonify({'success': False, 'message': 'Activo no encontrado'}), 404
    
    activo_eliminado = datos['activos'].pop(activo_index)
    guardar_datos(datos)
    
    slack.send_update(f"🗑️ Activo eliminado: {activo_eliminado.get('nombre', 'Sin nombre')}")
    
    return jsonify({'success': True, 'message': 'Activo eliminado correctamente'})

@app.route('/api/importar', methods=['POST'])
def importar_activos():
    """Importar activos desde archivo Excel/CSV"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No se proporcionó archivo'}), 400
    
    file = request.files['file']
    tipo_activo_default = request.form.get('tipo_activo', '')
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Leer archivo
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Procesar y agregar activos
            datos = cargar_datos()
            nuevos_activos = 0
            activos_por_tipo = {}
            
            # Lista de todos los campos posibles del CSV
            campos_csv = [
                'tipo_activo', 'nombre', 'responsable', 'departamento', 'sede',
                'descripcion', 'marca', 'modelo', 'numero_serie', 'numero_identificacion',
                'fecha_compra', 'garantia', 'condicion', 'estado', 'clasificacion_seguridad',
                'criticidad', 'salida_exterior', 'dispositivo_cpd', 'dispositivo_byod',
                'version', 'tipo_software', 'licencia'
            ]
            
            for _, row in df.iterrows():
                # Determinar tipo de activo (desde el CSV o por defecto)
                if 'tipo_activo' in row.index and pd.notna(row['tipo_activo']):
                    tipo_activo = str(row['tipo_activo'])
                else:
                    tipo_activo = tipo_activo_default or 'Hardware'
                
                # Contar activos por tipo
                if tipo_activo not in activos_por_tipo:
                    activos_por_tipo[tipo_activo] = 0
                activos_por_tipo[tipo_activo] += 1
                
                nuevo_activo = {
                    'id': str(uuid.uuid4()),
                    'tipo_activo': tipo_activo,
                    'fecha_registro': datetime.now().isoformat(),
                    'fecha_modificacion': datetime.now().isoformat(),
                    'historial_cambios': [{
                        'fecha': datetime.now().isoformat(),
                        'usuario': 'Sistema',
                        'accion': 'Importación de activo'
                    }]
                }
                
                # Primero intentar mapeo directo de campos CSV
                for campo in campos_csv:
                    if campo in row and pd.notna(row[campo]):
                        valor = row[campo]
                        # Convertir valores booleanos
                        if campo in ['salida_exterior', 'dispositivo_cpd', 'dispositivo_byod']:
                            if str(valor).lower() in ['sí', 'si', 'yes', 'true', '1']:
                                valor = True
                            elif str(valor).lower() in ['no', 'false', '0']:
                                valor = False
                        nuevo_activo[campo] = valor
                
                # Si no hay campos directos, intentar mapeo por tipo (compatibilidad con formato antiguo)
                if 'nombre' not in nuevo_activo or not nuevo_activo['nombre']:
                    if tipo_activo in ['Hardware', 'Material de Oficina Personal', 'Papel', 'Servicios']:
                        campo_mapping = {
                            'Equipo': 'nombre',
                            'Responsable del activo': 'responsable',
                            'Departamento': 'departamento',
                            'Sede': 'sede',
                            'Descripción': 'descripcion',
                            'Marca': 'marca',
                            'Modelo': 'modelo',
                            'Serial Nº': 'numero_serie'
                        }
                    elif tipo_activo == 'Software e Información':
                        campo_mapping = {
                            'Nombre de Activo': 'nombre',
                            'Responsable del activo': 'responsable',
                            'Características / versión': 'version',
                            'Tipo de Software': 'tipo_software',
                            'Licencia Software': 'licencia',
                            'Estado': 'estado'
                        }
                    else:
                        campo_mapping = {}
                    
                    for col_excel, col_modelo in campo_mapping.items():
                        if col_excel in row.index and pd.notna(row[col_excel]):
                            nuevo_activo[col_modelo] = str(row[col_excel])
                
                # Agregar valores por defecto si faltan
                if 'estado' not in nuevo_activo:
                    nuevo_activo['estado'] = 'Activo'
                if 'clasificacion_seguridad' not in nuevo_activo:
                    nuevo_activo['clasificacion_seguridad'] = 'Interno'
                if 'criticidad' not in nuevo_activo:
                    nuevo_activo['criticidad'] = 'Normal'
                
                datos['activos'].append(nuevo_activo)
                nuevos_activos += 1
            
            guardar_datos(datos)
            os.remove(filepath)  # Limpiar archivo temporal
            
            # Mensaje detallado para Slack
            mensaje_tipos = ', '.join([f"{tipo}: {count}" for tipo, count in activos_por_tipo.items()])
            slack.send_update(f"📤 Importación completada: {nuevos_activos} activos importados ({mensaje_tipos})")
            
            return jsonify({
                'success': True, 
                'message': f'Se importaron {nuevos_activos} activos correctamente',
                'detalles': activos_por_tipo
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'success': False, 'message': f'Error procesando archivo: {str(e)}'}), 500
    
    return jsonify({'success': False, 'message': 'Tipo de archivo no permitido'}), 400

@app.route('/api/estadisticas', methods=['GET'])
def obtener_estadisticas():
    """Obtener estadísticas del inventario"""
    datos = cargar_datos()
    activos = datos.get('activos', [])
    
    estadisticas = {
        'total_activos': len(activos),
        'por_tipo': {},
        'por_departamento': {},
        'por_estado': {},
        'activos_criticos': 0,
        'proximas_revisiones': []
    }
    
    for activo in activos:
        # Por tipo
        tipo = activo.get('tipo_activo', 'Sin tipo')
        estadisticas['por_tipo'][tipo] = estadisticas['por_tipo'].get(tipo, 0) + 1
        
        # Por departamento
        depto = activo.get('departamento', 'Sin departamento')
        estadisticas['por_departamento'][depto] = estadisticas['por_departamento'].get(depto, 0) + 1
        
        # Por estado
        estado = activo.get('estado', 'Sin estado')
        estadisticas['por_estado'][estado] = estadisticas['por_estado'].get(estado, 0) + 1
        
        # Críticos
        if activo.get('criticidad') == 'Crítico':
            estadisticas['activos_criticos'] += 1
    
    return jsonify({'success': True, 'estadisticas': estadisticas})

@app.route('/api/tipos_activos', methods=['GET'])
def obtener_tipos_activos():
    """Obtener lista de tipos de activos disponibles"""
    tipos = [
        "Hardware",
        "Material de Oficina Personal",
        "Papel",
        "Servicios", 
        "Software e Información"
    ]
    return jsonify({'success': True, 'tipos': tipos})

@app.route('/api/auditoria', methods=['GET'])
def obtener_auditoria():
    """Obtener registros de auditoría"""
    datos = cargar_datos()
    activos = datos.get('activos', [])
    
    # Recopilar todos los eventos de auditoría
    eventos = []
    for activo in activos:
        if 'historial_cambios' in activo:
            for cambio in activo['historial_cambios']:
                evento = {
                    **cambio,
                    'activo_id': activo['id'],
                    'activo_nombre': activo.get('nombre', 'Sin nombre'),
                    'activo_tipo': activo.get('tipo_activo', 'Sin tipo')
                }
                eventos.append(evento)
    
    # Ordenar por fecha descendente
    eventos.sort(key=lambda x: x.get('fecha', ''), reverse=True)
    
    # Limitar a los últimos 500 eventos
    eventos = eventos[:500]
    
    return jsonify({'success': True, 'eventos': eventos})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    slack.send_update(f"🚀 Servidor de gestión de activos iniciado en puerto {port}")
    app.run(debug=False, host='0.0.0.0', port=port)