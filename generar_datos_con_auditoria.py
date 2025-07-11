#!/usr/bin/env python3
import json
import random
from datetime import datetime, timedelta
import uuid

# Leer datos de ejemplo existentes
with open('data/inventario_ejemplo_legal.json', 'r', encoding='utf-8') as f:
    datos = json.load(f)

# Usuarios simulados
usuarios = [
    "Admin Sistema",
    "María García",
    "Juan Martínez", 
    "Carlos López",
    "Ana Rodríguez",
    "Pedro Sánchez",
    "Laura Fernández",
    "José González"
]

# Tipos de cambios posibles
tipos_cambios = [
    ("Actualización de estado", ["estado"]),
    ("Cambio de responsable", ["responsable"]),
    ("Reasignación de departamento", ["departamento", "sede"]),
    ("Actualización de criticidad", ["criticidad"]),
    ("Actualización de seguridad", ["clasificacion_seguridad"]),
    ("Mantenimiento realizado", ["estado", "condicion"]),
    ("Actualización de información", ["descripcion", "numero_identificacion"]),
    ("Cambio de ubicación", ["sede"]),
    ("Revisión de seguridad", ["clasificacion_seguridad", "criticidad"]),
    ("Auditoría anual", ["estado", "condicion", "criticidad"])
]

# Estados posibles
estados = ["Activo", "En mantenimiento", "Inactivo", "En revisión"]
condiciones = ["Nuevo", "Bueno", "Regular", "Requiere atención"]
criticidades = ["Bajo", "Normal", "Importante", "Crítico"]
clasificaciones = ["Público", "Interno", "Confidencial", "Secreto"]
sedes = ["Oficina Principal", "Sucursal Norte", "Sucursal Sur", "Home Office", "Almacén Central"]

def generar_valor_aleatorio(campo, activo):
    """Genera un valor aleatorio para un campo"""
    if campo == "estado":
        return random.choice(estados)
    elif campo == "condicion":
        return random.choice(condiciones)
    elif campo == "criticidad":
        return random.choice(criticidades)
    elif campo == "clasificacion_seguridad":
        return random.choice(clasificaciones)
    elif campo == "responsable":
        # Mantener el mismo departamento
        responsables_depto = [u for u in usuarios if u != activo.get('responsable', '')]
        return random.choice(responsables_depto) if responsables_depto else activo.get('responsable', '')
    elif campo == "departamento":
        deptos = ["Legal", "IT", "Administración", "Contabilidad", "Recursos Humanos", "Operaciones"]
        return random.choice(deptos)
    elif campo == "sede":
        return random.choice(sedes)
    elif campo == "descripcion":
        return activo.get('descripcion', '') + " - Actualizado"
    elif campo == "numero_identificacion":
        return f"INV-{random.randint(1000, 9999)}"
    return activo.get(campo, '')

def generar_historial_cambios(activo, fecha_inicio):
    """Genera un historial de cambios realista para un activo"""
    historial = []
    
    # Cambio inicial - creación/importación
    historial.append({
        "fecha": fecha_inicio.isoformat(),
        "usuario": "Admin Sistema",
        "accion": "Importación inicial del activo",
        "detalles": "Activo importado desde sistema anterior"
    })
    
    # Generar entre 3 y 10 cambios aleatorios
    num_cambios = random.randint(3, 10)
    fecha_actual = fecha_inicio
    
    for _ in range(num_cambios):
        # Avanzar entre 5 y 45 días
        dias_avance = random.randint(5, 45)
        fecha_actual += timedelta(days=dias_avance)
        
        # No generar cambios futuros
        if fecha_actual > datetime.now():
            break
        
        # Seleccionar tipo de cambio
        tipo_cambio, campos = random.choice(tipos_cambios)
        usuario = random.choice(usuarios)
        
        # Generar detalles del cambio
        cambios_realizados = []
        valores_antiguos = {}
        valores_nuevos = {}
        
        for campo in campos:
            valor_antiguo = activo.get(campo, '')
            valor_nuevo = generar_valor_aleatorio(campo, activo)
            
            if valor_antiguo != valor_nuevo:
                valores_antiguos[campo] = valor_antiguo
                valores_nuevos[campo] = valor_nuevo
                activo[campo] = valor_nuevo
                cambios_realizados.append(f"{campo}: {valor_antiguo} → {valor_nuevo}")
        
        if cambios_realizados:
            cambio = {
                "fecha": fecha_actual.isoformat(),
                "usuario": usuario,
                "accion": tipo_cambio,
                "detalles": "; ".join(cambios_realizados)
            }
            
            # Agregar valores antiguos y nuevos para algunos cambios
            if random.random() > 0.5:
                cambio["valores_antiguos"] = valores_antiguos
                cambio["valores_nuevos"] = valores_nuevos
            
            historial.append(cambio)
    
    # Actualizar fecha de modificación
    if historial:
        activo['fecha_modificacion'] = historial[-1]['fecha']
    
    return historial

# Procesar todos los activos
fecha_base = datetime.now() - timedelta(days=180)  # Empezar hace 6 meses

for i, activo in enumerate(datos['activos']):
    # Fecha de registro aleatoria en los últimos 6 meses
    dias_desde_inicio = random.randint(0, 150)
    fecha_registro = fecha_base + timedelta(days=dias_desde_inicio)
    
    activo['fecha_registro'] = fecha_registro.isoformat()
    
    # Generar historial de cambios
    activo['historial_cambios'] = generar_historial_cambios(activo, fecha_registro)
    
    # Asegurar que todos los activos tengan los campos necesarios
    if 'estado' not in activo:
        activo['estado'] = 'Activo'
    if 'clasificacion_seguridad' not in activo:
        activo['clasificacion_seguridad'] = random.choice(clasificaciones)
    if 'criticidad' not in activo:
        activo['criticidad'] = random.choice(criticidades)

# Guardar datos con historial
with open('data/inventario_con_auditoria.json', 'w', encoding='utf-8') as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)

print(f"✅ Generados {len(datos['activos'])} activos con historial de auditoría")
print(f"📅 Período cubierto: {fecha_base.strftime('%Y-%m-%d')} a {datetime.now().strftime('%Y-%m-%d')}")

# Estadísticas
total_cambios = sum(len(a['historial_cambios']) for a in datos['activos'])
print(f"📝 Total de cambios generados: {total_cambios}")
print(f"📊 Promedio de cambios por activo: {total_cambios / len(datos['activos']):.1f}")