#!/usr/bin/env python3
"""
Script para actualizar credenciales OAuth en GCS sin exponerlas en el repositorio
"""

import os
import json
import subprocess
import sys

def main():
    # Obtener credenciales de variables de entorno
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        print("❌ Error: Debes proporcionar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET como variables de entorno")
        return 1
    
    print("🔐 Actualizando credenciales OAuth en GCS...")
    
    # Descargar archivo actual
    print("📥 Descargando organizaciones.json de GCS...")
    subprocess.run(['gsutil', 'cp', 'gs://inventario-iso27001-data/organizaciones.json', '/tmp/organizaciones.json'], check=True)
    
    # Leer y actualizar
    with open('/tmp/organizaciones.json', 'r') as f:
        orgs = json.load(f)
    
    # Actualizar credenciales de Gailen
    if 'gailen' in orgs and 'oauth_config' in orgs['gailen']:
        orgs['gailen']['oauth_config']['client_id'] = client_id
        orgs['gailen']['oauth_config']['client_secret'] = client_secret
        print("✅ Credenciales de Gailen actualizadas")
    else:
        print("❌ Error: No se encontró la configuración OAuth de Gailen")
        return 1
    
    # Guardar archivo actualizado
    with open('/tmp/organizaciones_updated.json', 'w') as f:
        json.dump(orgs, f, indent=2, ensure_ascii=False)
    
    # Subir de vuelta a GCS
    print("📤 Subiendo archivo actualizado a GCS...")
    subprocess.run(['gsutil', 'cp', '/tmp/organizaciones_updated.json', 'gs://inventario-iso27001-data/organizaciones.json'], check=True)
    
    # Limpiar archivos temporales
    os.remove('/tmp/organizaciones.json')
    os.remove('/tmp/organizaciones_updated.json')
    
    print("✅ Credenciales actualizadas exitosamente en GCS")
    print("⚠️  Las credenciales NO se han guardado en el repositorio local")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())