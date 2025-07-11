#!/usr/bin/env python3
"""
Data provider adapter para usar con los servicios internos.
Adapta las funciones existentes de Google Cloud Storage.
"""

class DataProvider:
    """Adaptador para acceso a datos"""
    
    def __init__(self, cargar_datos_func, guardar_datos_func):
        """
        Args:
            cargar_datos_func: Función para cargar datos (cargar_datos_org)
            guardar_datos_func: Función para guardar datos (guardar_datos_org)
        """
        self.cargar_datos_org = cargar_datos_func
        self.guardar_datos_org = guardar_datos_func