#!/usr/bin/env python3
"""
Script para migrar datos de impactos del sistema antiguo a Gozain
"""

import json
import os
import requests
from datetime import datetime
from pathlib import Path

# URL de producción de Gozain
GOZAIN_URL = "https://gozain-687354193398.us-central1.run.app"

def buscar_archivos_impactos():
    """Buscar archivos de impactos en el sistema antiguo"""
    archivos_encontrados = []
    
    # Buscar en datos_antiguos
    datos_antiguos = Path('datos_antiguos')
    if datos_antiguos.exists():
        for archivo in datos_antiguos.glob('impactos_*.json'):
            archivos_encontrados.append(archivo)
    
    # Buscar en data
    data_dir = Path('data')
    if data_dir.exists():
        for org_dir in data_dir.iterdir():
            if org_dir.is_dir():
                impactos_file = org_dir / 'impactos.json'
                if impactos_file.exists():
                    archivos_encontrados.append(impactos_file)
    
    return archivos_encontrados

def mapear_organizacion(org_id_antigua):
    """Mapear ID de organización antigua a nueva"""
    # Primero obtener organizaciones de Gozain
    response = requests.get(f"{GOZAIN_URL}/api/organizaciones")
    if response.status_code != 200:
        print(f"Error obteniendo organizaciones: {response.text}")
        return None
    
    orgs_gozain = response.json()
    
    # Mapeo manual basado en nombres conocidos
    mapeo = {
        'gailen_578ddf12': 'Gailen',
        'haiko_f4e25ee8': 'Haiko',
        'superventas_b832b977': 'Superventas'
    }
    
    nombre_org = mapeo.get(org_id_antigua, org_id_antigua)
    
    # Buscar en Gozain
    for org in orgs_gozain:
        if org['nombre'].lower() == nombre_org.lower():
            return org['id']
    
    return None

def migrar_impactos_archivo(archivo_path):
    """Migrar impactos de un archivo específico"""
    print(f"\nProcesando archivo: {archivo_path}")
    
    # Leer archivo
    with open(archivo_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Determinar estructura del archivo
    if isinstance(data, list):
        impactos = data
    elif isinstance(data, dict) and 'impactos' in data:
        impactos = data['impactos']
    else:
        print(f"  ! Estructura no reconocida en {archivo_path}")
        return 0
    
    if not impactos:
        print(f"  ! No hay impactos en {archivo_path}")
        return 0
    
    # Extraer ID de organización del nombre del archivo
    nombre_archivo = archivo_path.name
    if nombre_archivo.startswith('impactos_'):
        org_id_antigua = nombre_archivo.replace('impactos_', '').replace('.json', '')
    else:
        # Intentar obtener del path (data/org_id/impactos.json)
        org_id_antigua = archivo_path.parent.name
    
    # Mapear a organización en Gozain
    org_id_nueva = mapear_organizacion(org_id_antigua)
    if not org_id_nueva:
        print(f"  ! No se pudo mapear la organización {org_id_antigua}")
        return 0
    
    print(f"  Organización mapeada: {org_id_antigua} -> {org_id_nueva}")
    print(f"  Migrando {len(impactos)} impactos...")
    
    migrados = 0
    for i, impacto in enumerate(impactos):
        # Adaptar estructura del impacto
        impacto_nuevo = {
            'tipo': impacto.get('tipo', 'alta_empleado'),
            'datos': impacto.get('datos', {})
        }
        
        # Si el impacto tiene campos específicos, mapearlos a datos
        if 'nombre_completo' in impacto:
            impacto_nuevo['datos']['nombre_completo'] = impacto['nombre_completo']
        if 'departamento' in impacto:
            impacto_nuevo['datos']['departamento'] = impacto['departamento']
        if 'cargo' in impacto:
            impacto_nuevo['datos']['cargo'] = impacto['cargo']
        if 'fecha_inicio' in impacto:
            impacto_nuevo['datos']['fecha_inicio'] = impacto['fecha_inicio']
        
        # Enviar a Gozain
        try:
            response = requests.post(
                f"{GOZAIN_URL}/api/impactos",
                json=impacto_nuevo,
                headers={
                    'Content-Type': 'application/json',
                    'X-Organization-Id': org_id_nueva
                }
            )
            
            if response.status_code in [200, 201]:
                migrados += 1
                if (i + 1) % 5 == 0:
                    print(f"    Progreso: {i + 1}/{len(impactos)} impactos migrados")
            else:
                print(f"    ✗ Error migrando impacto: {response.text}")
        except Exception as e:
            print(f"    ✗ Error migrando impacto: {e}")
    
    print(f"  ✓ Migrados {migrados} de {len(impactos)} impactos")
    return migrados

def main():
    print("=== MIGRACIÓN DE IMPACTOS A GOZAIN ===")
    print(f"Destino: {GOZAIN_URL}")
    
    # Buscar archivos de impactos
    archivos = buscar_archivos_impactos()
    print(f"\nArchivos de impactos encontrados: {len(archivos)}")
    for archivo in archivos:
        print(f"  - {archivo}")
    
    if not archivos:
        print("\nNo se encontraron archivos de impactos para migrar")
        print("Buscando en:")
        print("  - datos_antiguos/impactos_*.json")
        print("  - data/*/impactos.json")
        return
    
    total_impactos = 0
    
    # Migrar cada archivo
    for archivo in archivos:
        impactos_migrados = migrar_impactos_archivo(archivo)
        total_impactos += impactos_migrados
    
    print(f"\n{'='*50}")
    print(f"✅ MIGRACIÓN COMPLETADA")
    print(f"Total de impactos migrados: {total_impactos}")
    print(f"\nAccede a {GOZAIN_URL} para verificar los datos")

if __name__ == "__main__":
    main()