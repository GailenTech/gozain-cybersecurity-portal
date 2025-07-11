#!/usr/bin/env python3
"""
Servicio interno para gestión de activos.
Extrae la lógica de negocio de los endpoints HTTP para reutilización.
"""
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

class AssetService:
    """Servicio para operaciones con activos sin pasar por HTTP"""
    
    def __init__(self, data_provider):
        """
        Args:
            data_provider: Objeto con métodos cargar_datos_org y guardar_datos_org
        """
        self.data_provider = data_provider
    
    def create_asset(self, asset_data: Dict[str, Any], user: str, org_id: str) -> Dict[str, Any]:
        """
        Crea un nuevo activo.
        
        Args:
            asset_data: Datos del activo a crear
            user: Usuario que realiza la acción
            org_id: ID de la organización
            
        Returns:
            Dict con el activo creado y success=True
        """
        # Cargar datos actuales
        datos = self.data_provider.cargar_datos_org(org_id)
        
        # Preparar nuevo activo
        nuevo_activo = asset_data.copy()
        nuevo_activo['id'] = str(uuid.uuid4())
        nuevo_activo['fecha_registro'] = datetime.now().isoformat()
        nuevo_activo['fecha_modificacion'] = datetime.now().isoformat()
        
        # Agregar historial
        nuevo_activo['historial_cambios'] = [{
            'fecha': datetime.now().isoformat(),
            'usuario': user,
            'accion': 'Creación del activo'
        }]
        
        # Agregar a la lista
        datos['activos'].append(nuevo_activo)
        
        # Guardar
        self.data_provider.guardar_datos_org(org_id, datos)
        
        return {
            'success': True,
            'activo': nuevo_activo,
            'id': nuevo_activo['id']
        }
    
    def update_asset(self, asset_id: str, updates: Dict[str, Any], user: str, org_id: str) -> Dict[str, Any]:
        """
        Actualiza un activo existente.
        
        Args:
            asset_id: ID del activo a actualizar
            updates: Campos a actualizar
            user: Usuario que realiza la acción
            org_id: ID de la organización
            
        Returns:
            Dict con el activo actualizado o error
        """
        # Cargar datos
        datos = self.data_provider.cargar_datos_org(org_id)
        
        # Buscar activo
        activo_index = next((i for i, a in enumerate(datos['activos']) if a['id'] == asset_id), None)
        
        if activo_index is None:
            return {
                'success': False,
                'message': 'Activo no encontrado'
            }
        
        # Actualizar campos
        datos['activos'][activo_index].update(updates)
        datos['activos'][activo_index]['fecha_modificacion'] = datetime.now().isoformat()
        
        # Agregar al historial
        if 'historial_cambios' not in datos['activos'][activo_index]:
            datos['activos'][activo_index]['historial_cambios'] = []
        
        datos['activos'][activo_index]['historial_cambios'].append({
            'fecha': datetime.now().isoformat(),
            'usuario': user,
            'accion': 'Actualización del activo',
            'campos_modificados': list(updates.keys())
        })
        
        # Guardar
        self.data_provider.guardar_datos_org(org_id, datos)
        
        return {
            'success': True,
            'activo': datos['activos'][activo_index]
        }
    
    def delete_asset(self, asset_id: str, user: str, org_id: str) -> Dict[str, Any]:
        """
        Elimina un activo.
        
        Args:
            asset_id: ID del activo a eliminar
            user: Usuario que realiza la acción
            org_id: ID de la organización
            
        Returns:
            Dict con success y mensaje
        """
        # Cargar datos
        datos = self.data_provider.cargar_datos_org(org_id)
        
        # Buscar activo
        activo_index = next((i for i, a in enumerate(datos['activos']) if a['id'] == asset_id), None)
        
        if activo_index is None:
            return {
                'success': False,
                'message': 'Activo no encontrado'
            }
        
        # Eliminar
        activo_eliminado = datos['activos'].pop(activo_index)
        
        # Guardar
        self.data_provider.guardar_datos_org(org_id, datos)
        
        return {
            'success': True,
            'message': 'Activo eliminado correctamente',
            'activo_eliminado': activo_eliminado
        }
    
    def get_asset(self, asset_id: str, org_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un activo por ID.
        
        Args:
            asset_id: ID del activo
            org_id: ID de la organización
            
        Returns:
            Activo o None si no existe
        """
        datos = self.data_provider.cargar_datos_org(org_id)
        return next((a for a in datos['activos'] if a['id'] == asset_id), None)
    
    def list_assets(self, org_id: str, filters: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """
        Lista activos con filtros opcionales.
        
        Args:
            org_id: ID de la organización
            filters: Filtros opcionales (tipo, responsable, departamento)
            
        Returns:
            Lista de activos filtrados
        """
        datos = self.data_provider.cargar_datos_org(org_id)
        activos = datos.get('activos', [])
        
        if filters:
            # Aplicar filtros
            if filters.get('tipo'):
                activos = [a for a in activos if a.get('tipo_activo') == filters['tipo']]
            if filters.get('responsable'):
                activos = [a for a in activos if filters['responsable'].lower() in a.get('responsable', '').lower()]
            if filters.get('departamento'):
                activos = [a for a in activos if filters['departamento'].lower() in a.get('departamento', '').lower()]
        
        return activos
    
    def bulk_create_assets(self, assets_data: List[Dict[str, Any]], user: str, org_id: str) -> Dict[str, Any]:
        """
        Crea múltiples activos en una sola operación.
        
        Args:
            assets_data: Lista de datos de activos a crear
            user: Usuario que realiza la acción
            org_id: ID de la organización
            
        Returns:
            Dict con los activos creados y estadísticas
        """
        created_assets = []
        
        for asset_data in assets_data:
            result = self.create_asset(asset_data, user, org_id)
            if result['success']:
                created_assets.append(result['activo'])
        
        return {
            'success': True,
            'created_count': len(created_assets),
            'assets': created_assets
        }
    
    def change_asset_status(self, asset_id: str, new_status: str, user: str, org_id: str) -> Dict[str, Any]:
        """
        Cambia el estado de un activo.
        
        Args:
            asset_id: ID del activo
            new_status: Nuevo estado
            user: Usuario que realiza la acción
            org_id: ID de la organización
            
        Returns:
            Dict con el resultado
        """
        return self.update_asset(
            asset_id,
            {'estado': new_status},
            user,
            org_id
        )
    
    def assign_asset(self, asset_id: str, new_responsible: str, department: str, user: str, org_id: str) -> Dict[str, Any]:
        """
        Asigna un activo a un nuevo responsable.
        
        Args:
            asset_id: ID del activo
            new_responsible: Nuevo responsable
            department: Departamento del responsable
            user: Usuario que realiza la acción
            org_id: ID de la organización
            
        Returns:
            Dict con el resultado
        """
        return self.update_asset(
            asset_id,
            {
                'responsable': new_responsible,
                'departamento': department
            },
            user,
            org_id
        )