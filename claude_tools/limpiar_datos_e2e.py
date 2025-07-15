#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpiar datos de prueba E2E
Elimina organizaciones que siguen patrones de prueba
"""

import os
import shutil
import json
import re
from datetime import datetime
import argparse

# Patrones de organizaciones de prueba
TEST_PATTERNS = [
    r'^e2e_',
    r'^test_',
    r'_test$',
    r'_test_',
    r'_prueba',
    r'^prueba_',
    r'cypress',
    r'test_nav_org_\d+$',
    r'test_cambio_org'
]

def es_organizacion_prueba(nombre):
    """Determina si una organización es de prueba basándose en su nombre"""
    nombre_lower = nombre.lower()
    
    for pattern in TEST_PATTERNS:
        if re.search(pattern, nombre_lower):
            return True
    return False

def limpiar_organizaciones(data_dir='data', dry_run=False, verbose=False):
    """
    Limpia las organizaciones de prueba
    
    Args:
        data_dir: Directorio donde están los datos
        dry_run: Si True, solo muestra qué se eliminaría sin hacerlo
        verbose: Si True, muestra más información
    """
    if not os.path.exists(data_dir):
        print(f"❌ El directorio {data_dir} no existe")
        return
    
    # Contar organizaciones
    total_orgs = 0
    orgs_prueba = []
    orgs_produccion = []
    
    # Analizar organizaciones
    for item in os.listdir(data_dir):
        item_path = os.path.join(data_dir, item)
        if os.path.isdir(item_path) and not item.startswith('.'):
            total_orgs += 1
            
            if es_organizacion_prueba(item):
                orgs_prueba.append(item)
            else:
                orgs_produccion.append(item)
    
    # Mostrar resumen
    print(f"\n📊 Resumen de organizaciones:")
    print(f"   Total: {total_orgs}")
    print(f"   Producción: {len(orgs_produccion)}")
    print(f"   Prueba: {len(orgs_prueba)}")
    
    if verbose and orgs_produccion:
        print(f"\n✅ Organizaciones de producción (se mantendrán):")
        for org in sorted(orgs_produccion):
            print(f"   - {org}")
    
    if not orgs_prueba:
        print("\n✨ No hay organizaciones de prueba para limpiar")
        return
    
    print(f"\n🗑️  Organizaciones de prueba a eliminar:")
    for org in sorted(orgs_prueba):
        org_path = os.path.join(data_dir, org)
        
        # Calcular tamaño
        size = 0
        for dirpath, dirnames, filenames in os.walk(org_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    size += os.path.getsize(fp)
        
        size_mb = size / 1024 / 1024
        print(f"   - {org} ({size_mb:.2f} MB)")
    
    # Calcular espacio total a liberar
    total_size = 0
    for org in orgs_prueba:
        org_path = os.path.join(data_dir, org)
        for dirpath, dirnames, filenames in os.walk(org_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    total_size += os.path.getsize(fp)
    
    total_size_mb = total_size / 1024 / 1024
    print(f"\n💾 Espacio total a liberar: {total_size_mb:.2f} MB")
    
    if dry_run:
        print("\n⚠️  Modo DRY RUN - No se eliminó nada")
        return
    
    # Confirmar eliminación
    if not args.force:
        respuesta = input(f"\n¿Eliminar {len(orgs_prueba)} organizaciones de prueba? (s/N): ")
        if respuesta.lower() != 's':
            print("❌ Operación cancelada")
            return
    
    # Eliminar organizaciones
    print("\n🔄 Eliminando organizaciones de prueba...")
    eliminadas = 0
    errores = 0
    
    for org in orgs_prueba:
        org_path = os.path.join(data_dir, org)
        try:
            shutil.rmtree(org_path)
            eliminadas += 1
            if verbose:
                print(f"   ✅ {org}")
        except Exception as e:
            errores += 1
            print(f"   ❌ Error eliminando {org}: {e}")
    
    # Actualizar archivo de organizaciones si existe
    org_file = os.path.join(data_dir, 'organizaciones.json')
    if os.path.exists(org_file):
        try:
            with open(org_file, 'r', encoding='utf-8') as f:
                organizaciones = json.load(f)
            
            # Manejar tanto formato array como objeto
            if isinstance(organizaciones, list):
                # Si es array, filtrar directamente
                organizaciones_filtradas = [
                    org for org in organizaciones 
                    if not es_organizacion_prueba(org.get('id', ''))
                ]
                if len(organizaciones_filtradas) < len(organizaciones):
                    with open(org_file, 'w', encoding='utf-8') as f:
                        json.dump(organizaciones_filtradas, f, indent=2, ensure_ascii=False)
                    print(f"\n📝 Actualizado organizaciones.json")
            else:
                # Si es objeto, filtrar por claves
                organizaciones_filtradas = {
                    key: org for key, org in organizaciones.items()
                    if not es_organizacion_prueba(key)
                }
                if len(organizaciones_filtradas) < len(organizaciones):
                    with open(org_file, 'w', encoding='utf-8') as f:
                        json.dump(organizaciones_filtradas, f, indent=2, ensure_ascii=False)
                    print(f"\n📝 Actualizado organizaciones.json")
        except Exception as e:
            print(f"\n⚠️  Error actualizando organizaciones.json: {e}")
    
    # Resumen final
    print(f"\n✅ Limpieza completada:")
    print(f"   Eliminadas: {eliminadas}")
    if errores:
        print(f"   Errores: {errores}")
    print(f"   Espacio liberado: {total_size_mb:.2f} MB")

def crear_backup(data_dir='data', backup_dir='backups'):
    """Crea un backup antes de limpiar (opcional)"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(backup_dir, f'data_backup_{timestamp}')
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    print(f"📦 Creando backup en {backup_path}...")
    shutil.copytree(data_dir, backup_path)
    print("✅ Backup creado")
    
    return backup_path

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Limpia datos de prueba E2E')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Solo muestra qué se eliminaría sin hacerlo')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Muestra información detallada')
    parser.add_argument('--force', '-f', action='store_true',
                       help='No pide confirmación')
    parser.add_argument('--backup', action='store_true',
                       help='Crea backup antes de eliminar')
    parser.add_argument('--data-dir', default='data',
                       help='Directorio de datos (default: data)')
    
    args = parser.parse_args()
    
    print("🧹 Limpieza de datos E2E")
    print("=" * 50)
    
    # Crear backup si se solicita
    if args.backup and not args.dry_run:
        crear_backup(args.data_dir)
    
    # Ejecutar limpieza
    limpiar_organizaciones(
        data_dir=args.data_dir,
        dry_run=args.dry_run,
        verbose=args.verbose
    )