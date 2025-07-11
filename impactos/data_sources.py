#!/usr/bin/env python3
"""
Fuentes de datos dinámicas para el sistema de templates.
"""
from typing import Dict, List, Any, Optional
from abc import ABC, abstractmethod

class DataSource(ABC):
    """Clase base para fuentes de datos"""
    
    @abstractmethod
    def fetch(self, config: Dict[str, Any], org_id: str) -> List[Dict[str, Any]]:
        """Obtiene datos según la configuración"""
        pass

class AssetDataSource(DataSource):
    """Fuente de datos desde activos"""
    
    def __init__(self, asset_service):
        self.asset_service = asset_service
    
    def fetch(self, config: Dict[str, Any], org_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene datos de activos según configuración.
        
        Config puede incluir:
        - campo: campo a extraer (ej: 'responsable', 'departamento')
        - distinct: si obtener valores únicos
        - filtros: filtros adicionales
        """
        # Obtener todos los activos
        activos = self.asset_service.list_assets(org_id, config.get('filtros'))
        
        campo = config.get('campo', 'nombre')
        distinct = config.get('distinct', False)
        
        if distinct:
            # Obtener valores únicos
            valores = set()
            for activo in activos:
                valor = activo.get(campo)
                if valor:
                    valores.add(valor)
            
            # Formatear como opciones
            return [
                {
                    'valor': v,
                    'etiqueta': v,
                    'extra': self._get_extra_info(v, campo, activos)
                }
                for v in sorted(valores)
            ]
        else:
            # Retornar todos los valores
            return [
                {
                    'valor': activo.get('id'),
                    'etiqueta': activo.get(campo, 'Sin nombre'),
                    'extra': activo
                }
                for activo in activos
            ]
    
    def _get_extra_info(self, valor: str, campo: str, activos: List[Dict]) -> Dict:
        """Obtiene información adicional para un valor"""
        if campo == 'responsable':
            # Contar activos del responsable
            count = sum(1 for a in activos if a.get('responsable') == valor)
            departamentos = set(a.get('departamento', '') for a in activos 
                              if a.get('responsable') == valor)
            return {
                'activos_count': count,
                'departamentos': list(departamentos)
            }
        elif campo == 'departamento':
            # Contar activos y personas del departamento
            count = sum(1 for a in activos if a.get('departamento') == valor)
            responsables = set(a.get('responsable', '') for a in activos 
                             if a.get('departamento') == valor)
            return {
                'activos_count': count,
                'empleados_count': len(responsables)
            }
        return {}

class EmployeeDataSource(DataSource):
    """Fuente de datos de empleados"""
    
    def __init__(self, asset_service):
        self.asset_service = asset_service
    
    def fetch(self, config: Dict[str, Any], org_id: str) -> List[Dict[str, Any]]:
        """Obtiene lista de empleados desde los activos"""
        activos = self.asset_service.list_assets(org_id)
        
        # Construir diccionario de empleados
        empleados = {}
        for activo in activos:
            responsable = activo.get('responsable')
            if responsable and responsable not in empleados:
                empleados[responsable] = {
                    'nombre': responsable,
                    'departamento': activo.get('departamento', 'Sin departamento'),
                    'activos': [],
                    'tipos_activos': set()
                }
            
            if responsable:
                empleados[responsable]['activos'].append({
                    'id': activo.get('id'),
                    'nombre': activo.get('nombre'),
                    'tipo': activo.get('tipo_activo'),
                    'estado': activo.get('estado')
                })
                empleados[responsable]['tipos_activos'].add(activo.get('tipo_activo'))
        
        # Formatear para select
        resultado = []
        for nombre, info in empleados.items():
            resultado.append({
                'valor': nombre,
                'etiqueta': f"{nombre} ({info['departamento']}) - {len(info['activos'])} activos",
                'extra': {
                    'departamento': info['departamento'],
                    'activos_count': len(info['activos']),
                    'tipos_activos': list(info['tipos_activos']),
                    'activos': info['activos']
                }
            })
        
        # Ordenar por nombre
        resultado.sort(key=lambda x: x['valor'])
        
        return resultado

class DepartmentDataSource(DataSource):
    """Fuente de datos de departamentos"""
    
    def __init__(self, asset_service):
        self.asset_service = asset_service
    
    def fetch(self, config: Dict[str, Any], org_id: str) -> List[Dict[str, Any]]:
        """Obtiene lista de departamentos desde los activos"""
        activos = self.asset_service.list_assets(org_id)
        
        # Construir información de departamentos
        departamentos = {}
        for activo in activos:
            depto = activo.get('departamento')
            if depto:
                if depto not in departamentos:
                    departamentos[depto] = {
                        'nombre': depto,
                        'activos_count': 0,
                        'empleados': set(),
                        'tipos_activos': set()
                    }
                
                departamentos[depto]['activos_count'] += 1
                if activo.get('responsable'):
                    departamentos[depto]['empleados'].add(activo['responsable'])
                if activo.get('tipo_activo'):
                    departamentos[depto]['tipos_activos'].add(activo['tipo_activo'])
        
        # Formatear resultado
        resultado = []
        for nombre, info in departamentos.items():
            resultado.append({
                'valor': nombre,
                'etiqueta': f"{nombre} ({len(info['empleados'])} empleados, {info['activos_count']} activos)",
                'extra': {
                    'activos_count': info['activos_count'],
                    'empleados_count': len(info['empleados']),
                    'tipos_activos': list(info['tipos_activos'])
                }
            })
        
        # Ordenar por nombre
        resultado.sort(key=lambda x: x['valor'])
        
        # Añadir opción de crear nuevo al principio
        if config.get('permitir_nuevo', False):
            resultado.insert(0, {
                'valor': '__nuevo__',
                'etiqueta': '+ Crear nuevo departamento',
                'extra': {'es_nuevo': True}
            })
        
        return resultado

class DataSourceManager:
    """Gestor de fuentes de datos"""
    
    def __init__(self, asset_service):
        self.sources = {
            'activos': AssetDataSource(asset_service),
            'empleados': EmployeeDataSource(asset_service),
            'departamentos': DepartmentDataSource(asset_service)
        }
    
    def fetch(self, source_type: str, config: Dict[str, Any], org_id: str) -> List[Dict[str, Any]]:
        """Obtiene datos de una fuente específica"""
        if source_type not in self.sources:
            raise ValueError(f"Fuente de datos no encontrada: {source_type}")
        
        return self.sources[source_type].fetch(config, org_id)