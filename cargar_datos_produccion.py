#!/usr/bin/env python3
import requests
import json
import time

# URL de la aplicación desplegada
BASE_URL = "https://inventario-activos-687354193398.us-central1.run.app"

def cargar_datos():
    # Leer datos generados
    with open('data/inventario_ejemplo_legal.json', 'r', encoding='utf-8') as f:
        datos = json.load(f)
    
    print(f"🚀 Cargando {len(datos['activos'])} activos en producción...")
    
    exitos = 0
    errores = 0
    
    for i, activo in enumerate(datos['activos']):
        try:
            response = requests.post(
                f"{BASE_URL}/api/activos",
                json=activo,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                exitos += 1
                print(f"✅ {i+1}/{len(datos['activos'])} - {activo['nombre']}")
            else:
                errores += 1
                print(f"❌ Error cargando {activo['nombre']}: {response.status_code}")
                
        except Exception as e:
            errores += 1
            print(f"❌ Error: {str(e)}")
        
        # Pequeña pausa para no sobrecargar
        if i % 10 == 0:
            time.sleep(0.5)
    
    print(f"\n📊 Resumen:")
    print(f"   - Activos cargados: {exitos}")
    print(f"   - Errores: {errores}")
    print(f"\n🌐 Ver aplicación en: {BASE_URL}")

if __name__ == "__main__":
    cargar_datos()