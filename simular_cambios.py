#!/usr/bin/env python3
import requests
import json
import random
from datetime import datetime, timedelta

# URL de la aplicación
BASE_URL = "https://inventario-activos-687354193398.us-central1.run.app"

# Usuarios simulados que harán cambios
usuarios = ["Jorge Admin", "María Auditora", "Carlos IT", "Ana Legal", "Sistema Automático"]

# Cambios a simular
cambios_simulados = [
    {
        "nombre": "MacBook Pro 14 M3",
        "cambios": {
            "estado": "En mantenimiento",
            "usuario_modificacion": "Carlos IT"
        }
    },
    {
        "nombre": "Microsoft 365 Business", 
        "cambios": {
            "licencia": "20 usuarios",
            "version": "v2024.11",
            "usuario_modificacion": "Jorge Admin"
        }
    },
    {
        "nombre": "Base Datos Clientes",
        "cambios": {
            "clasificacion_seguridad": "Secreto",
            "criticidad": "Crítico",
            "usuario_modificacion": "María Auditora"
        }
    },
    {
        "nombre": "Expedientes Clientes 2024",
        "cambios": {
            "responsable": "Ana Legal",
            "usuario_modificacion": "Ana Legal"
        }
    },
    {
        "nombre": "Fortinet FortiGate 60F",
        "cambios": {
            "estado": "Activo",
            "condicion": "Nuevo",
            "usuario_modificacion": "Carlos IT"
        }
    },
    {
        "nombre": "Protección Datos GDPR",
        "cambios": {
            "descripcion": "Consultoría LOPD/GDPR - Renovación anual",
            "fecha_compra": datetime.now().isoformat(),
            "usuario_modificacion": "Jorge Admin"
        }
    }
]

def obtener_activos():
    """Obtener lista de activos actuales"""
    response = requests.get(f"{BASE_URL}/api/activos")
    if response.status_code == 200:
        return response.json()['activos']
    return []

def actualizar_activo(activo_id, cambios):
    """Actualizar un activo"""
    response = requests.put(
        f"{BASE_URL}/api/activos/{activo_id}",
        json=cambios,
        headers={'Content-Type': 'application/json'}
    )
    return response.status_code == 200

def simular_cambios():
    print("🔄 Obteniendo activos actuales...")
    activos = obtener_activos()
    
    if not activos:
        print("❌ No se pudieron obtener activos")
        return
    
    print(f"✅ Se encontraron {len(activos)} activos")
    
    # Realizar cambios simulados
    cambios_realizados = 0
    
    for cambio_sim in cambios_simulados:
        # Buscar el activo por nombre
        activo = next((a for a in activos if a['nombre'] == cambio_sim['nombre']), None)
        
        if activo:
            print(f"\n📝 Actualizando: {activo['nombre']}")
            if actualizar_activo(activo['id'], cambio_sim['cambios']):
                cambios_realizados += 1
                print(f"   ✅ Cambios aplicados por {cambio_sim['cambios']['usuario_modificacion']}")
            else:
                print(f"   ❌ Error al actualizar")
        else:
            print(f"\n⚠️  No se encontró: {cambio_sim['nombre']}")
    
    # Hacer algunos cambios aleatorios adicionales
    print("\n🎲 Realizando cambios aleatorios adicionales...")
    
    for _ in range(5):
        activo = random.choice(activos)
        cambio = {
            "estado": random.choice(["Activo", "En mantenimiento", "Inactivo"]),
            "usuario_modificacion": random.choice(usuarios)
        }
        
        if actualizar_activo(activo['id'], cambio):
            cambios_realizados += 1
            print(f"   ✅ {activo['nombre']} - Estado: {cambio['estado']} por {cambio['usuario_modificacion']}")
    
    print(f"\n📊 Resumen: {cambios_realizados} cambios realizados")
    print(f"🌐 Ver auditoría en: {BASE_URL}")

if __name__ == "__main__":
    simular_cambios()