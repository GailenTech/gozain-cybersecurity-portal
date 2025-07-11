#!/usr/bin/env python3
"""
Script para migrar datos del inventario antiguo a Gozain
"""

import json
import os
import requests
from datetime import datetime

# URL de producción de Gozain
GOZAIN_URL = "https://gozain-687354193398.us-central1.run.app"

def cargar_organizaciones_antiguas():
    """Cargar organizaciones del sistema antiguo"""
    with open('datos_antiguos/organizaciones.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['organizaciones']

def crear_organizacion_gozain(org_antigua):
    """Crear organización en Gozain"""
    print(f"\nCreando organización: {org_antigua['nombre']}")
    
    # Primero verificar si ya existe
    response = requests.get(f"{GOZAIN_URL}/api/organizaciones")
    if response.status_code == 200:
        orgs_existentes = response.json()
        for org in orgs_existentes:
            if org['nombre'].lower() == org_antigua['nombre'].lower():
                print(f"  ✓ La organización {org_antigua['nombre']} ya existe con ID: {org['id']}")
                return org['id']
    
    # Crear nueva organización
    data = {
        "nombre": org_antigua['nombre']
    }
    
    response = requests.post(
        f"{GOZAIN_URL}/api/organizaciones",
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code in [200, 201]:
        result = response.json()
        print(f"  ✓ Organización creada con ID: {result['id']}")
        return result['id']
    else:
        print(f"  ✗ Error creando organización: {response.text}")
        return None

def migrar_activos(org_id_antigua, org_id_nueva):
    """Migrar activos de una organización"""
    archivo_inventario = f"datos_antiguos/inventario_{org_id_antigua}.json"
    
    if not os.path.exists(archivo_inventario):
        print(f"  ! No se encontró archivo: {archivo_inventario}")
        return 0
    
    with open(archivo_inventario, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    activos = data.get('activos', [])
    if not activos:
        print(f"  ! No hay activos para migrar en {org_id_antigua}")
        return 0
    
    print(f"  Migrando {len(activos)} activos...")
    migrados = 0
    
    for i, activo in enumerate(activos):
        # Mapear campos del formato antiguo al nuevo
        activo_nuevo = {
            "tipo": activo.get("tipo_activo", "Hardware"),
            "nombre": activo.get("nombre", "Sin nombre"),
            "responsable": activo.get("responsable", "Sin asignar"),
            "departamento": activo.get("departamento", "General"),
            "estado": activo.get("estado", "Activo"),
            "clasificacion": activo.get("clasificacion_seguridad", "Interno"),
            "criticidad": mapear_criticidad(activo.get("criticidad", "Normal")),
            "descripcion": activo.get("descripcion", ""),
            "sede": activo.get("sede", "")
        }
        
        # Agregar campos específicos según el tipo
        if activo.get("tipo_activo") == "Hardware":
            activo_nuevo.update({
                "marca": activo.get("marca", ""),
                "modelo": activo.get("modelo", ""),
                "numero_serie": activo.get("numero_serie", ""),
                "fecha_compra": activo.get("fecha_compra", ""),
                "garantia": activo.get("garantia", "")
            })
        elif activo.get("tipo_activo") == "Software":
            activo_nuevo.update({
                "version": activo.get("version", ""),
                "licencia": activo.get("licencia", ""),
                "tipo_software": activo.get("tipo_software", "General")
            })
        
        # Enviar a Gozain
        response = requests.post(
            f"{GOZAIN_URL}/api/inventario/activos",
            json=activo_nuevo,
            headers={
                'Content-Type': 'application/json',
                'X-Organization-Id': org_id_nueva
            }
        )
        
        if response.status_code in [200, 201]:
            migrados += 1
            if (i + 1) % 10 == 0:
                print(f"    Progreso: {i + 1}/{len(activos)} activos migrados")
        else:
            print(f"    ✗ Error migrando activo {activo.get('nombre', 'Sin nombre')}: {response.text}")
    
    print(f"  ✓ Migrados {migrados} de {len(activos)} activos")
    return migrados

def mapear_criticidad(criticidad_antigua):
    """Mapear valores de criticidad del sistema antiguo al nuevo"""
    mapeo = {
        "Bajo": "Baja",
        "bajo": "Baja",
        "Normal": "Normal",
        "normal": "Normal",
        "Alto": "Importante",
        "alto": "Importante",
        "Crítico": "Crítica",
        "crítico": "Crítica"
    }
    return mapeo.get(criticidad_antigua, "Normal")

def main():
    print("=== MIGRACIÓN DE DATOS A GOZAIN ===")
    print(f"Destino: {GOZAIN_URL}")
    
    # Cargar organizaciones antiguas
    orgs_antiguas = cargar_organizaciones_antiguas()
    print(f"\nOrganizaciones encontradas: {len(orgs_antiguas)}")
    
    total_activos = 0
    
    for org in orgs_antiguas:
        print(f"\n{'='*50}")
        print(f"Procesando: {org['nombre']} (ID antiguo: {org['id']})")
        
        # Crear o encontrar organización en Gozain
        org_id_nueva = crear_organizacion_gozain(org)
        
        if org_id_nueva:
            # Migrar activos
            activos_migrados = migrar_activos(org['id'], org_id_nueva)
            total_activos += activos_migrados
    
    print(f"\n{'='*50}")
    print(f"✅ MIGRACIÓN COMPLETADA")
    print(f"Total de activos migrados: {total_activos}")
    print(f"\nAccede a {GOZAIN_URL} para verificar los datos")

if __name__ == "__main__":
    main()