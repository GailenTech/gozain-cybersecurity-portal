#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar qué datos hay en Google Cloud Storage
"""

import os
import json
from google.cloud import storage
from google.auth.exceptions import DefaultCredentialsError

def verificar_gcs():
    """Verifica el contenido del bucket de GCS"""
    bucket_name = 'inventario-iso27001-data'
    
    try:
        # Intentar conectar a GCS
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        
        print(f"✅ Conectado al bucket: {bucket_name}")
        print("\n📦 Contenido del bucket:")
        print("=" * 50)
        
        # Listar todos los archivos
        blobs = list(bucket.list_blobs())
        
        if not blobs:
            print("❌ El bucket está vacío")
            return
        
        # Organizar por directorio
        estructura = {}
        for blob in blobs:
            partes = blob.name.split('/')
            if len(partes) > 1:
                org = partes[0]
                archivo = '/'.join(partes[1:])
                if org not in estructura:
                    estructura[org] = []
                estructura[org].append(archivo)
            else:
                if 'root' not in estructura:
                    estructura['root'] = []
                estructura['root'].append(blob.name)
        
        # Mostrar estructura
        for org, archivos in sorted(estructura.items()):
            print(f"\n📁 {org}/")
            for archivo in sorted(archivos):
                print(f"   - {archivo}")
        
        # Mostrar resumen
        print(f"\n📊 Resumen:")
        print(f"   Total archivos: {len(blobs)}")
        print(f"   Organizaciones: {len([k for k in estructura.keys() if k != 'root'])}")
        
    except DefaultCredentialsError:
        print("❌ No se encontraron credenciales de Google Cloud")
        print("   Configura GOOGLE_APPLICATION_CREDENTIALS o ejecuta 'gcloud auth application-default login'")
    except Exception as e:
        print(f"❌ Error conectando a GCS: {e}")

def limpiar_gcs_pruebas():
    """Ofrece limpiar datos de prueba en GCS"""
    respuesta = input("\n¿Deseas ver opciones para limpiar datos de prueba en GCS? (s/N): ")
    if respuesta.lower() == 's':
        print("\n🧹 Para limpiar GCS manualmente:")
        print("   1. Usa gsutil: gsutil -m rm -r gs://inventario-iso27001-data/e2e_*")
        print("   2. O usa la consola de Google Cloud Storage")
        print("   3. O modifica este script para eliminar automáticamente")

if __name__ == '__main__':
    print("🔍 Verificando datos en Google Cloud Storage")
    print("=" * 50)
    
    verificar_gcs()
    limpiar_gcs_pruebas()