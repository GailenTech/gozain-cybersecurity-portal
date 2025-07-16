#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para actualizar credenciales OAuth en organizaciones.json de GCS
"""

import os
import json
import subprocess
import sys
from datetime import datetime

def ejecutar_comando(comando):
    """Ejecuta un comando y retorna el resultado"""
    try:
        resultado = subprocess.run(comando, shell=True, capture_output=True, text=True)
        if resultado.returncode != 0:
            print(f"❌ Error: {resultado.stderr}")
            return None
        return resultado.stdout.strip()
    except Exception as e:
        print(f"❌ Error ejecutando comando: {e}")
        return None

def descargar_organizaciones():
    """Descarga organizaciones.json de GCS"""
    print("📥 Descargando organizaciones.json de GCS...")
    resultado = ejecutar_comando("gsutil cp gs://inventario-iso27001-data/organizaciones.json /tmp/organizaciones_gcs.json")
    if resultado is None:
        return None
    
    try:
        with open('/tmp/organizaciones_gcs.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error leyendo archivo: {e}")
        return None

def actualizar_oauth(organizaciones, org_id, client_id, client_secret):
    """Actualiza las credenciales OAuth para una organización"""
    if org_id not in organizaciones:
        print(f"❌ Organización '{org_id}' no encontrada")
        return False
    
    if 'oauth_config' not in organizaciones[org_id]:
        print(f"❌ La organización '{org_id}' no tiene configuración OAuth")
        return False
    
    # Actualizar credenciales
    organizaciones[org_id]['oauth_config']['client_id'] = client_id
    organizaciones[org_id]['oauth_config']['client_secret'] = client_secret
    
    # Actualizar fecha de modificación
    organizaciones[org_id]['oauth_config']['ultima_actualizacion'] = datetime.now().isoformat()
    
    print(f"✅ Credenciales actualizadas para '{org_id}'")
    return True

def subir_organizaciones(organizaciones):
    """Sube organizaciones.json actualizado a GCS"""
    # Guardar archivo temporal
    try:
        with open('/tmp/organizaciones_actualizado.json', 'w', encoding='utf-8') as f:
            json.dump(organizaciones, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"❌ Error guardando archivo: {e}")
        return False
    
    # Subir a GCS
    print("📤 Subiendo organizaciones.json actualizado a GCS...")
    resultado = ejecutar_comando("gsutil cp /tmp/organizaciones_actualizado.json gs://inventario-iso27001-data/organizaciones.json")
    if resultado is None:
        return False
    
    print("✅ Archivo subido exitosamente")
    return True

def mostrar_organizaciones(organizaciones):
    """Muestra las organizaciones disponibles"""
    print("\n📋 Organizaciones disponibles:")
    for org_id, org_data in organizaciones.items():
        tiene_oauth = 'oauth_config' in org_data
        if tiene_oauth:
            client_id = org_data['oauth_config'].get('client_id', 'NO CONFIGURADO')
            configurado = not client_id.startswith('CONFIGURAR_') and client_id != 'NO CONFIGURADO'
            estado = "✅ Configurado" if configurado else "❌ Sin configurar"
        else:
            estado = "🔓 Sin OAuth"
        
        print(f"   - {org_id}: {org_data['nombre']} [{estado}]")

def main():
    """Función principal"""
    print("🔐 Actualización de credenciales OAuth en GCS")
    print("=" * 50)
    
    # Descargar organizaciones
    organizaciones = descargar_organizaciones()
    if not organizaciones:
        print("❌ No se pudo descargar organizaciones.json")
        return 1
    
    # Mostrar organizaciones
    mostrar_organizaciones(organizaciones)
    
    # Si se proporcionan argumentos, actualizar directamente
    if len(sys.argv) == 4:
        org_id = sys.argv[1]
        client_id = sys.argv[2]
        client_secret = sys.argv[3]
        
        print(f"\n🔧 Actualizando '{org_id}'...")
        if actualizar_oauth(organizaciones, org_id, client_id, client_secret):
            if subir_organizaciones(organizaciones):
                print("\n✅ Actualización completada")
                return 0
        return 1
    
    # Modo interactivo
    print("\n🔧 Modo interactivo")
    org_id = input("Organización a actualizar (ej: gailen): ").strip()
    
    if org_id not in organizaciones:
        print(f"❌ Organización '{org_id}' no encontrada")
        return 1
    
    print(f"\nActualizando credenciales OAuth para: {organizaciones[org_id]['nombre']}")
    client_id = input("Client ID: ").strip()
    client_secret = input("Client Secret: ").strip()
    
    if not client_id or not client_secret:
        print("❌ Client ID y Client Secret son requeridos")
        return 1
    
    # Confirmar
    print(f"\n📝 Resumen:")
    print(f"   Organización: {org_id}")
    print(f"   Client ID: {client_id[:20]}...")
    print(f"   Client Secret: {'*' * 10}")
    
    confirmar = input("\n¿Confirmar actualización? (s/N): ").strip().lower()
    if confirmar != 's':
        print("❌ Operación cancelada")
        return 1
    
    # Actualizar y subir
    if actualizar_oauth(organizaciones, org_id, client_id, client_secret):
        if subir_organizaciones(organizaciones):
            print("\n✅ Actualización completada exitosamente")
            
            # Mostrar estado final
            print("\n📊 Estado final:")
            mostrar_organizaciones(organizaciones)
            return 0
    
    return 1

if __name__ == '__main__':
    # Uso: python actualizar_oauth_gcs.py [org_id] [client_id] [client_secret]
    # Sin argumentos: modo interactivo
    exit(main())