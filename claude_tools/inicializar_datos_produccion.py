#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para inicializar datos limpios para producción
"""

import os
import json
from datetime import datetime

def crear_estructura_organizacion(org_id, data_dir='data'):
    """Crea la estructura de directorios y archivos para una organización"""
    org_dir = os.path.join(data_dir, org_id)
    
    # Crear directorio si no existe
    if not os.path.exists(org_dir):
        os.makedirs(org_dir)
        print(f"✅ Creado directorio: {org_dir}")
    
    # Crear inventario vacío
    inventario_path = os.path.join(org_dir, 'inventario.json')
    if not os.path.exists(inventario_path):
        inventario_inicial = {
            "activos": [],
            "metadata": {
                "version": "1.0",
                "ultima_actualizacion": datetime.now().isoformat(),
                "total_activos": 0
            }
        }
        with open(inventario_path, 'w', encoding='utf-8') as f:
            json.dump(inventario_inicial, f, indent=2, ensure_ascii=False)
        print(f"✅ Creado: {inventario_path}")
    
    # Crear impactos vacío
    impactos_path = os.path.join(org_dir, 'impactos.json')
    if not os.path.exists(impactos_path):
        impactos_inicial = {
            "impactos": [],
            "tareas": [],
            "metadata": {
                "version": "1.0",
                "ultima_actualizacion": datetime.now().isoformat(),
                "total_impactos": 0,
                "total_tareas": 0
            }
        }
        with open(impactos_path, 'w', encoding='utf-8') as f:
            json.dump(impactos_inicial, f, indent=2, ensure_ascii=False)
        print(f"✅ Creado: {impactos_path}")
    
    # Crear evaluaciones de madurez vacío
    madurez_path = os.path.join(org_dir, 'madurez_assessments.json')
    if not os.path.exists(madurez_path):
        madurez_inicial = {
            "assessments": [],
            "metadata": {
                "version": "1.0",
                "ultima_actualizacion": datetime.now().isoformat(),
                "total_assessments": 0
            }
        }
        with open(madurez_path, 'w', encoding='utf-8') as f:
            json.dump(madurez_inicial, f, indent=2, ensure_ascii=False)
        print(f"✅ Creado: {madurez_path}")

def limpiar_archivos_antiguos(data_dir='data'):
    """Limpia archivos antiguos que ya no se usan"""
    archivos_a_eliminar = [
        'inventario.json',
        'inventario_gailen_feb42154.json',
        'inventario_haiko_97bb5175.json', 
        'inventario_superventas_7fe1ec9f.json',
        'inventario.json.backup_20250708_124037'
    ]
    
    for archivo in archivos_a_eliminar:
        archivo_path = os.path.join(data_dir, archivo)
        if os.path.exists(archivo_path):
            os.remove(archivo_path)
            print(f"🗑️  Eliminado: {archivo}")

def actualizar_organizaciones_produccion(data_dir='data'):
    """Actualiza el archivo de organizaciones para producción"""
    org_file = os.path.join(data_dir, 'organizaciones.json')
    
    organizaciones = {
        "gailen": {
            "id": "gailen",
            "nombre": "Gailen Tecnologías",
            "fecha_creacion": datetime.now().isoformat(),
            "activa": True,
            "oauth_config": {
                "provider": "google",
                "client_id": "CONFIGURAR_CLIENT_ID_REAL",
                "client_secret": "CONFIGURAR_CLIENT_SECRET_REAL",
                "allowed_domains": [
                    "gailen.es",
                    "gailen.com",
                    "gailentecnologias.com"
                ],
                "require_domain_match": True,
                "custom_claims": {
                    "department": "department",
                    "role": "job_title"
                }
            },
            "seguridad": {
                "require_mfa": False,
                "session_timeout": 3600,
                "ip_whitelist": []
            }
        }
    }
    
    # Mantener demo solo si existe
    if os.path.exists(org_file):
        with open(org_file, 'r', encoding='utf-8') as f:
            orgs_existentes = json.load(f)
            if "demo" in orgs_existentes:
                organizaciones["demo"] = orgs_existentes["demo"]
    
    with open(org_file, 'w', encoding='utf-8') as f:
        json.dump(organizaciones, f, indent=2, ensure_ascii=False)
    print(f"✅ Actualizado: {org_file}")

def inicializar_archivos_globales(data_dir='data'):
    """Inicializa archivos globales del sistema"""
    
    # Limpiar audit_logs.json
    audit_logs_path = os.path.join(data_dir, 'audit_logs.json')
    with open(audit_logs_path, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)
    print(f"✅ Limpiado: {audit_logs_path}")
    
    # Limpiar sessions.json
    sessions_path = os.path.join(data_dir, 'sessions.json')
    with open(sessions_path, 'w', encoding='utf-8') as f:
        json.dump({}, f, indent=2)
    print(f"✅ Limpiado: {sessions_path}")
    
    # Limpiar users.json
    users_path = os.path.join(data_dir, 'users.json')
    with open(users_path, 'w', encoding='utf-8') as f:
        json.dump({}, f, indent=2)
    print(f"✅ Limpiado: {users_path}")

def main():
    """Función principal"""
    print("🚀 Inicializando datos para producción")
    print("=" * 50)
    
    data_dir = 'data'
    
    # 1. Limpiar archivos antiguos
    print("\n🧹 Limpiando archivos antiguos...")
    limpiar_archivos_antiguos(data_dir)
    
    # 2. Actualizar organizaciones
    print("\n📝 Actualizando organizaciones...")
    actualizar_organizaciones_produccion(data_dir)
    
    # 3. Crear estructura para Gailen
    print("\n📁 Creando estructura para Gailen...")
    crear_estructura_organizacion('gailen', data_dir)
    
    # 4. Inicializar archivos globales
    print("\n🔧 Inicializando archivos globales...")
    inicializar_archivos_globales(data_dir)
    
    print("\n✅ Inicialización completada")
    print("\n⚠️  IMPORTANTE:")
    print("   1. Actualiza data/organizaciones.json con las credenciales OAuth reales")
    print("   2. Configura JWT_SECRET y FLASK_SECRET_KEY en las variables de entorno")
    print("   3. Configura las URIs de redirección en Google OAuth Console")

if __name__ == '__main__':
    main()