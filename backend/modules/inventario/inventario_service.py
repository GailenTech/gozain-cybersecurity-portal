import os
import json
import uuid
from datetime import datetime
import logging
import csv
import io
from werkzeug.datastructures import FileStorage

logger = logging.getLogger(__name__)

# Intenta importar GCS storage
try:
    from ..storage.gcs_storage import GCSStorageService
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False
    logger.warning("GCS Storage not available, using local storage")

class InventarioService:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.use_gcs = GCS_AVAILABLE and os.environ.get('USE_GCS', 'false').lower() == 'true'
        
        if self.use_gcs:
            self.gcs = GCSStorageService()
            logger.info("Using GCS storage for inventario")
        else:
            logger.info("Using local storage for inventario")
    
    def _get_inventario_file(self, org_id):
        if self.use_gcs:
            # En GCS, el archivo es inventario_<org_id>.json
            return f'inventario_{org_id}.json'
        else:
            return os.path.join(self.data_dir, org_id, 'inventario.json')
    
    def _load_inventario(self, org_id):
        if self.use_gcs:
            # Intentar cargar desde GCS
            filename = self._get_inventario_file(org_id)
            data = self.gcs.leer_archivo(filename)
            if data is not None:
                # El archivo en GCS tiene estructura {activos: [...]}
                if isinstance(data, dict) and 'activos' in data:
                    return data['activos']
                elif isinstance(data, list):
                    return data
            return []
        else:
            # Cargar desde sistema local
            file_path = self._get_inventario_file(org_id)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
    
    def _save_inventario(self, org_id, inventario):
        if self.use_gcs:
            # Guardar en GCS con la estructura correcta
            filename = self._get_inventario_file(org_id)
            data = {'activos': inventario}
            self.gcs.escribir_archivo(filename, data)
        else:
            # Guardar en sistema local
            file_path = self._get_inventario_file(org_id)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(inventario, f, indent=2, ensure_ascii=False)
    
    def get_activos(self, org_id, filtros=None):
        activos = self._load_inventario(org_id)
        
        if filtros:
            # Filtrar por tipo
            if filtros.get('tipo'):
                activos = [a for a in activos if a.get('tipo') == filtros['tipo']]
            
            # Filtrar por departamento
            if filtros.get('departamento'):
                activos = [a for a in activos if filtros['departamento'].lower() in a.get('departamento', '').lower()]
            
            # Búsqueda general
            if filtros.get('busqueda'):
                busqueda = filtros['busqueda'].lower()
                activos = [a for a in activos if 
                          busqueda in a.get('nombre', '').lower() or
                          busqueda in a.get('descripcion', '').lower() or
                          busqueda in a.get('responsable', '').lower()]
        
        return activos
    
    def create_activo(self, org_id, data):
        inventario = self._load_inventario(org_id)
        
        # Generar ID único
        activo_id = str(uuid.uuid4())
        
        # Crear activo con campos base
        activo = {
            'id': activo_id,
            'fecha_creacion': datetime.now().isoformat(),
            'fecha_modificacion': datetime.now().isoformat(),
            **data
        }
        
        # Agregar auditoría
        activo['auditoria'] = [{
            'accion': 'creacion',
            'fecha': datetime.now().isoformat(),
            'usuario': 'sistema',
            'detalles': 'Activo creado'
        }]
        
        inventario.append(activo)
        self._save_inventario(org_id, inventario)
        
        return activo
    
    def update_activo(self, org_id, activo_id, data):
        inventario = self._load_inventario(org_id)
        
        for i, activo in enumerate(inventario):
            if activo['id'] == activo_id:
                # Preservar campos del sistema
                data['id'] = activo_id
                data['fecha_creacion'] = activo['fecha_creacion']
                data['fecha_modificacion'] = datetime.now().isoformat()
                
                # Agregar entrada de auditoría
                if 'auditoria' not in data:
                    data['auditoria'] = activo.get('auditoria', [])
                
                data['auditoria'].append({
                    'accion': 'modificacion',
                    'fecha': datetime.now().isoformat(),
                    'usuario': 'sistema',
                    'detalles': 'Activo modificado'
                })
                
                inventario[i] = data
                self._save_inventario(org_id, inventario)
                return data
        
        return None
    
    def delete_activo(self, org_id, activo_id):
        inventario = self._load_inventario(org_id)
        inventario_filtrado = [a for a in inventario if a['id'] != activo_id]
        
        if len(inventario_filtrado) < len(inventario):
            self._save_inventario(org_id, inventario_filtrado)
            return True
        
        return False
    
    def get_estadisticas(self, org_id):
        activos = self._load_inventario(org_id)
        
        stats = {
            'total': len(activos),
            'por_tipo': {},
            'por_estado': {},
            'por_criticidad': {},
            'por_departamento': {}
        }
        
        for activo in activos:
            # Por tipo
            tipo = activo.get('tipo', 'Sin tipo')
            stats['por_tipo'][tipo] = stats['por_tipo'].get(tipo, 0) + 1
            
            # Por estado
            estado = activo.get('estado', 'Sin estado')
            stats['por_estado'][estado] = stats['por_estado'].get(estado, 0) + 1
            
            # Por criticidad
            criticidad = activo.get('criticidad', 'Sin criticidad')
            stats['por_criticidad'][criticidad] = stats['por_criticidad'].get(criticidad, 0) + 1
            
            # Por departamento
            depto = activo.get('departamento', 'Sin departamento')
            stats['por_departamento'][depto] = stats['por_departamento'].get(depto, 0) + 1
        
        return stats
    
    def get_departamentos(self, org_id):
        activos = self._load_inventario(org_id)
        departamentos = set()
        
        for activo in activos:
            if 'departamento' in activo and activo['departamento']:
                departamentos.add(activo['departamento'])
        
        return sorted(list(departamentos))
    
    def preview_import(self, file: FileStorage, extension: str):
        """Previsualiza el contenido del archivo a importar"""
        try:
            if extension == 'csv':
                # Leer CSV
                text_stream = io.StringIO(file.stream.read().decode('utf-8'))
                reader = csv.reader(text_stream)
                rows = list(reader)
                
                if not rows:
                    raise ValueError("El archivo está vacío")
                
                headers = rows[0]
                data_rows = rows[1:]
                
                return {
                    'headers': headers,
                    'preview': data_rows[:10],  # Primeras 10 filas
                    'total': len(data_rows)
                }
                
            elif extension == 'xlsx':
                # Para Excel, necesitaríamos openpyxl
                # Por ahora solo soportamos CSV
                raise ValueError("Excel no soportado aún. Use formato CSV.")
                
        except Exception as e:
            logger.error(f"Error en preview import: {e}")
            raise
        finally:
            file.stream.seek(0)  # Reset stream
    
    def importar_activos(self, org_id: str, file: FileStorage, extension: str, reemplazar: bool):
        """Importa activos desde un archivo"""
        try:
            inventario_actual = self._load_inventario(org_id) if not reemplazar else []
            activos_importados = 0
            
            if extension == 'csv':
                # Leer CSV
                text_stream = io.StringIO(file.stream.read().decode('utf-8'))
                reader = csv.DictReader(text_stream)
                
                # Mapeo de campos
                campo_mapeo = {
                    'tipo': ['tipo', 'tipo_activo', 'type'],
                    'nombre': ['nombre', 'name', 'activo'],
                    'responsable': ['responsable', 'owner', 'propietario'],
                    'departamento': ['departamento', 'department', 'area'],
                    'estado': ['estado', 'status', 'state'],
                    'criticidad': ['criticidad', 'criticality', 'priority'],
                    'clasificacion': ['clasificacion', 'classification', 'seguridad'],
                    'descripcion': ['descripcion', 'description', 'detalle']
                }
                
                for row in reader:
                    # Mapear campos
                    activo = {}
                    
                    for campo_destino, campos_origen in campo_mapeo.items():
                        for campo in campos_origen:
                            if campo in row and row[campo]:
                                activo[campo_destino] = row[campo]
                                break
                    
                    # Validar campos requeridos
                    if not activo.get('nombre'):
                        continue  # Saltar filas sin nombre
                    
                    # Asignar valores por defecto
                    activo.setdefault('tipo', 'Hardware')
                    activo.setdefault('estado', 'Activo')
                    activo.setdefault('criticidad', 'Normal')
                    activo.setdefault('clasificacion', 'Interno')
                    activo.setdefault('responsable', 'Sin asignar')
                    activo.setdefault('departamento', 'General')
                    
                    # Crear activo
                    activo['id'] = str(uuid.uuid4())
                    activo['fecha_creacion'] = datetime.now().isoformat()
                    activo['fecha_modificacion'] = datetime.now().isoformat()
                    activo['auditoria'] = [{
                        'accion': 'importacion',
                        'fecha': datetime.now().isoformat(),
                        'usuario': 'sistema',
                        'detalles': f'Importado desde {file.filename}'
                    }]
                    
                    inventario_actual.append(activo)
                    activos_importados += 1
                
                # Guardar inventario actualizado
                self._save_inventario(org_id, inventario_actual)
                
                return {
                    'importados': activos_importados,
                    'total_activos': len(inventario_actual)
                }
                
            else:
                raise ValueError("Formato no soportado")
                
        except Exception as e:
            logger.error(f"Error importando activos: {e}")
            raise
        finally:
            file.stream.seek(0)
    
    def exportar_activos(self, org_id: str, formato: str, filtros=None):
        """Exporta activos a diferentes formatos"""
        try:
            # Obtener activos con filtros
            activos = self.get_activos(org_id, filtros)
            
            if formato == 'csv':
                # Crear CSV
                output = io.StringIO()
                
                # Definir columnas
                fieldnames = [
                    'tipo', 'nombre', 'responsable', 'departamento',
                    'estado', 'criticidad', 'clasificacion', 'descripcion',
                    'fecha_creacion', 'fecha_modificacion'
                ]
                
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                
                for activo in activos:
                    row = {field: activo.get(field, '') for field in fieldnames}
                    writer.writerow(row)
                
                # Generar nombre de archivo
                fecha = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f'inventario_{org_id}_{fecha}.csv'
                
                return output.getvalue().encode('utf-8'), filename
                
            else:
                raise ValueError(f"Formato {formato} no soportado")
                
        except Exception as e:
            logger.error(f"Error exportando activos: {e}")
            raise