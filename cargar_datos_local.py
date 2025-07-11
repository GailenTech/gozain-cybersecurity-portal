#!/usr/bin/env python3
import json
import shutil
import os
from datetime import datetime

# Rutas de archivos
origen = 'data/inventario_con_auditoria.json'
destino = 'data/inventario.json'

# Verificar que existe el archivo de origen
if not os.path.exists(origen):
    print(f"❌ Error: No se encuentra el archivo {origen}")
    print("💡 Ejecuta primero: python generar_datos_con_auditoria.py")
    exit(1)

# Hacer backup del archivo actual si existe
if os.path.exists(destino):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = f"{destino}.backup_{timestamp}"
    shutil.copy2(destino, backup)
    print(f"📋 Backup creado: {backup}")

# Copiar archivo con auditoría a producción
shutil.copy2(origen, destino)
print(f"✅ Datos con auditoría cargados en {destino}")

# Verificar el contenido
with open(destino, 'r', encoding='utf-8') as f:
    datos = json.load(f)
    print(f"📊 Total de activos cargados: {len(datos.get('activos', []))}")
    
    # Mostrar resumen por tipo
    tipos = {}
    for activo in datos.get('activos', []):
        tipo = activo.get('tipo_activo', 'Sin tipo')
        tipos[tipo] = tipos.get(tipo, 0) + 1
    
    print("\n📈 Resumen por tipo:")
    for tipo, cantidad in sorted(tipos.items()):
        print(f"   - {tipo}: {cantidad}")
    
    # Estadísticas de auditoría
    total_cambios = sum(len(a.get('historial_cambios', [])) for a in datos.get('activos', []))
    print(f"\n📝 Total de cambios en auditoría: {total_cambios}")
    
    # Mostrar rango de fechas
    fechas_cambios = []
    for activo in datos.get('activos', []):
        for cambio in activo.get('historial_cambios', []):
            if 'fecha' in cambio:
                fechas_cambios.append(cambio['fecha'])
    
    if fechas_cambios:
        fecha_min = min(fechas_cambios)
        fecha_max = max(fechas_cambios)
        print(f"📅 Período de auditoría: {fecha_min[:10]} a {fecha_max[:10]}")

print("\n✅ Proceso completado. Los datos con historial de auditoría están listos para usar.")