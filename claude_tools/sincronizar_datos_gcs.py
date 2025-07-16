#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para sincronizar los datos limpios locales con Google Cloud Storage
"""

import os
import json
import subprocess
from datetime import datetime

def ejecutar_comando(comando):
    """Ejecuta un comando y retorna el resultado"""
    try:
        resultado = subprocess.run(comando, shell=True, capture_output=True, text=True)
        if resultado.returncode != 0:
            print(f"❌ Error: {resultado.stderr}")
            return False
        return True
    except Exception as e:
        print(f"❌ Error ejecutando comando: {e}")
        return False

def sincronizar_con_gcs():
    """Sincroniza los datos locales limpios con GCS"""
    bucket = "gs://inventario-iso27001-data"
    
    print("🔄 Sincronizando datos locales con Google Cloud Storage")
    print("=" * 50)
    
    # 1. Eliminar datos de prueba en GCS
    print("\n🗑️  Eliminando datos de prueba en GCS...")
    patrones_eliminar = [
        f"{bucket}/e2e_*",
        f"{bucket}/test_*",
        f"{bucket}/*_test",
        f"{bucket}/*_prueba*",
        f"{bucket}/inventario_*.json",
        f"{bucket}/inventario.json.backup*"
    ]
    
    for patron in patrones_eliminar:
        print(f"   Eliminando: {patron}")
        ejecutar_comando(f"gsutil -m rm -r {patron} 2>/dev/null || true")
    
    # 2. Subir estructura de Gailen
    print("\n📤 Subiendo estructura limpia de Gailen...")
    if os.path.exists("data/gailen"):
        ejecutar_comando(f"gsutil -m rsync -r -d data/gailen {bucket}/gailen/")
        print("   ✅ Gailen sincronizado")
    
    # 3. Subir organizaciones.json
    print("\n📤 Subiendo organizaciones.json...")
    if os.path.exists("data/organizaciones.json"):
        ejecutar_comando(f"gsutil cp data/organizaciones.json {bucket}/")
        print("   ✅ organizaciones.json subido")
    
    # 4. Subir archivos globales
    print("\n📤 Subiendo archivos globales...")
    archivos_globales = ["audit_logs.json", "sessions.json", "users.json"]
    for archivo in archivos_globales:
        if os.path.exists(f"data/{archivo}"):
            ejecutar_comando(f"gsutil cp data/{archivo} {bucket}/")
            print(f"   ✅ {archivo} subido")
    
    # 5. Mantener demo si existe
    print("\n📤 Verificando organización demo...")
    if os.path.exists("data/demo"):
        ejecutar_comando(f"gsutil -m rsync -r data/demo {bucket}/demo/")
        print("   ✅ Demo sincronizado")
    
    # 6. Subir madurez_templates.json si existe
    if os.path.exists("data/madurez_templates.json"):
        ejecutar_comando(f"gsutil cp data/madurez_templates.json {bucket}/")
        print("   ✅ madurez_templates.json subido")
    
    # 7. Mostrar resultado final
    print("\n📦 Verificando contenido final en GCS:")
    ejecutar_comando(f"gsutil ls -r {bucket}/")
    
    print("\n✅ Sincronización completada")
    print("\n⚠️  IMPORTANTE:")
    print("   1. Los datos locales limpios se han sincronizado con GCS")
    print("   2. Actualiza las credenciales OAuth en organizaciones.json:")
    print(f"      gsutil cp {bucket}/organizaciones.json .")
    print("      # Editar con las credenciales reales")
    print(f"      gsutil cp organizaciones.json {bucket}/")

if __name__ == '__main__':
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("data"):
        print("❌ Error: Ejecuta este script desde la raíz del proyecto")
        exit(1)
    
    # Verificar que gsutil está disponible
    if not ejecutar_comando("which gsutil > /dev/null"):
        print("❌ Error: gsutil no está instalado")
        exit(1)
    
    sincronizar_con_gcs()