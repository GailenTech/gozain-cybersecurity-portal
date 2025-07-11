#!/usr/bin/env python3
import json
import uuid
from datetime import datetime, timedelta
import random

# Datos para empresa de servicios legales "Martínez & Asociados"
departamentos = ["Legal", "Administración", "Contabilidad", "RRHH", "IT Subcontratado"]
sedes = ["Oficina Principal", "Sucursal Norte", "Home Office"]
empleados = [
    "Juan Martínez", "María García", "Carlos López", "Ana Rodríguez", "Pedro Sánchez",
    "Laura Fernández", "José González", "Carmen Ruiz", "Miguel Ángel Díaz", "Isabel Moreno",
    "Francisco Jiménez", "Elena Pérez", "Antonio Álvarez", "Lucía Romero", "Manuel Torres"
]

def generar_id():
    return str(uuid.uuid4())

def fecha_aleatoria(inicio_dias=-730, fin_dias=0):
    dias = random.randint(inicio_dias, fin_dias)
    return (datetime.now() + timedelta(days=dias)).isoformat()

def generar_activos():
    activos = []
    
    # HARDWARE - Equipos de oficina
    hardware_items = [
        # Ordenadores portátiles para abogados
        {"nombre": "MacBook Pro 14 M3", "marca": "Apple", "modelo": "MBP14-2024", "responsable": "Juan Martínez", "departamento": "Legal", "criticidad": "Crítico"},
        {"nombre": "MacBook Pro 14 M3", "marca": "Apple", "modelo": "MBP14-2024", "responsable": "María García", "departamento": "Legal", "criticidad": "Crítico"},
        {"nombre": "Dell Latitude 7440", "marca": "Dell", "modelo": "LAT7440", "responsable": "Carlos López", "departamento": "Legal", "criticidad": "Crítico"},
        {"nombre": "ThinkPad X1 Carbon", "marca": "Lenovo", "modelo": "X1C-G11", "responsable": "Ana Rodríguez", "departamento": "Legal", "criticidad": "Crítico"},
        {"nombre": "MacBook Air M2", "marca": "Apple", "modelo": "MBA-M2", "responsable": "Pedro Sánchez", "departamento": "Legal", "criticidad": "Importante"},
        
        # Equipos administración
        {"nombre": "HP EliteBook 850", "marca": "HP", "modelo": "EB850G9", "responsable": "Laura Fernández", "departamento": "Administración", "criticidad": "Importante"},
        {"nombre": "Dell OptiPlex 7090", "marca": "Dell", "modelo": "OP7090", "responsable": "José González", "departamento": "Contabilidad", "criticidad": "Crítico"},
        {"nombre": "iMac 24", "marca": "Apple", "modelo": "IMAC24-2023", "responsable": "Carmen Ruiz", "departamento": "Administración", "criticidad": "Normal"},
        
        # Servidores y NAS
        {"nombre": "Synology DS923+", "marca": "Synology", "modelo": "DS923+", "responsable": "IT Subcontratado", "departamento": "IT Subcontratado", "criticidad": "Crítico", "dispositivo_cpd": True},
        {"nombre": "Dell PowerEdge T350", "marca": "Dell", "modelo": "PE-T350", "responsable": "IT Subcontratado", "departamento": "IT Subcontratado", "criticidad": "Crítico", "dispositivo_cpd": True},
        
        # Impresoras y escáneres
        {"nombre": "HP LaserJet Pro M428fdw", "marca": "HP", "modelo": "LJP-M428", "responsable": "Laura Fernández", "departamento": "Administración", "criticidad": "Importante"},
        {"nombre": "Canon imageFORMULA DR-C230", "marca": "Canon", "modelo": "DR-C230", "responsable": "José González", "departamento": "Administración", "criticidad": "Importante"},
        {"nombre": "Brother MFC-L8900CDW", "marca": "Brother", "modelo": "MFC-L8900", "responsable": "Carmen Ruiz", "departamento": "Legal", "criticidad": "Normal"},
        
        # Dispositivos móviles
        {"nombre": "iPhone 15 Pro", "marca": "Apple", "modelo": "IP15PRO", "responsable": "Juan Martínez", "departamento": "Legal", "criticidad": "Importante", "dispositivo_byod": True},
        {"nombre": "iPad Pro 12.9", "marca": "Apple", "modelo": "IPADPRO12", "responsable": "María García", "departamento": "Legal", "criticidad": "Normal"},
        {"nombre": "Samsung Galaxy S24", "marca": "Samsung", "modelo": "GS24", "responsable": "Carlos López", "departamento": "Legal", "criticidad": "Normal", "dispositivo_byod": True},
        
        # Equipos de red
        {"nombre": "UniFi Dream Machine Pro", "marca": "Ubiquiti", "modelo": "UDM-PRO", "responsable": "IT Subcontratado", "departamento": "IT Subcontratado", "criticidad": "Crítico"},
        {"nombre": "Cisco Catalyst 1000", "marca": "Cisco", "modelo": "C1000-24T", "responsable": "IT Subcontratado", "departamento": "IT Subcontratado", "criticidad": "Crítico"},
        
        # Equipos de videoconferencia
        {"nombre": "Logitech Rally Plus", "marca": "Logitech", "modelo": "RALLY-PLUS", "responsable": "Laura Fernández", "departamento": "Administración", "criticidad": "Importante"},
        {"nombre": "Jabra PanaCast 50", "marca": "Jabra", "modelo": "PC50", "responsable": "Laura Fernández", "departamento": "Administración", "criticidad": "Normal"},
        
        # Dispositivos de seguridad
        {"nombre": "Fortinet FortiGate 60F", "marca": "Fortinet", "modelo": "FG-60F", "responsable": "IT Subcontratado", "departamento": "IT Subcontratado", "criticidad": "Crítico"},
        {"nombre": "APC Smart-UPS 1500", "marca": "APC", "modelo": "SMT1500", "responsable": "IT Subcontratado", "departamento": "IT Subcontratado", "criticidad": "Crítico"},
    ]
    
    for item in hardware_items:
        activo = {
            "id": generar_id(),
            "tipo_activo": "Hardware",
            "nombre": item["nombre"],
            "responsable": item["responsable"],
            "departamento": item["departamento"],
            "sede": "Oficina Principal" if item.get("dispositivo_cpd") else random.choice(sedes),
            "descripcion": f"{item['nombre']} - Equipo corporativo",
            "marca": item["marca"],
            "modelo": item["modelo"],
            "numero_serie": f"SN{random.randint(100000, 999999)}",
            "numero_identificacion": f"INV-{random.randint(1000, 9999)}",
            "fecha_compra": fecha_aleatoria(-365, -30),
            "garantia": f"{random.choice([12, 24, 36])} meses",
            "condicion": random.choice(["Nuevo", "Bueno", "Regular"]),
            "estado": "Activo",
            "clasificacion_seguridad": "Confidencial" if "Crítico" in item["criticidad"] else "Interno",
            "criticidad": item["criticidad"],
            "salida_exterior": item.get("dispositivo_byod", False),
            "dispositivo_cpd": item.get("dispositivo_cpd", False),
            "dispositivo_byod": item.get("dispositivo_byod", False),
            "fecha_registro": datetime.now().isoformat(),
            "fecha_modificacion": datetime.now().isoformat(),
            "historial_cambios": [{
                "fecha": datetime.now().isoformat(),
                "usuario": "Sistema",
                "accion": "Importación inicial de datos"
            }]
        }
        activos.append(activo)
    
    # SOFTWARE E INFORMACIÓN
    software_items = [
        # Software de gestión legal
        {"nombre": "Aranzadi Fusion", "tipo": "Software Legal", "licencia": "Corporativa", "responsable": "Juan Martínez", "criticidad": "Crítico"},
        {"nombre": "LexNET", "tipo": "Software Legal", "licencia": "Acceso Web", "responsable": "Legal", "criticidad": "Crítico"},
        {"nombre": "vLex Premium", "tipo": "Base de Datos Legal", "licencia": "5 usuarios", "responsable": "María García", "criticidad": "Importante"},
        {"nombre": "Tirant Online", "tipo": "Base de Datos Legal", "licencia": "Corporativa", "responsable": "Legal", "criticidad": "Importante"},
        
        # Software de oficina
        {"nombre": "Microsoft 365 Business", "tipo": "Suite Ofimática", "licencia": "15 usuarios", "responsable": "Laura Fernández", "criticidad": "Crítico"},
        {"nombre": "Adobe Acrobat Pro DC", "tipo": "Editor PDF", "licencia": "10 usuarios", "responsable": "Administración", "criticidad": "Importante"},
        {"nombre": "Microsoft Teams", "tipo": "Comunicación", "licencia": "Incluido en M365", "responsable": "Laura Fernández", "criticidad": "Crítico"},
        
        # Software contable
        {"nombre": "Sage 50cloud", "tipo": "Software Contable", "licencia": "3 usuarios", "responsable": "José González", "criticidad": "Crítico"},
        {"nombre": "A3nom", "tipo": "Gestión Nóminas", "licencia": "Monousuario", "responsable": "Carmen Ruiz", "criticidad": "Crítico"},
        {"nombre": "Contaplus Elite", "tipo": "Contabilidad", "licencia": "Red 5 usuarios", "responsable": "José González", "criticidad": "Crítico"},
        
        # Bases de datos y archivos
        {"nombre": "Base Datos Clientes", "tipo": "Base de Datos", "licencia": "Interna", "responsable": "Juan Martínez", "criticidad": "Crítico"},
        {"nombre": "Expedientes Digitales", "tipo": "Repositorio Documental", "licencia": "Interna", "responsable": "María García", "criticidad": "Crítico"},
        {"nombre": "Contratos y Escrituras", "tipo": "Archivo Digital", "licencia": "Interna", "responsable": "Legal", "criticidad": "Crítico"},
        
        # Software de seguridad
        {"nombre": "Bitdefender GravityZone", "tipo": "Antivirus", "licencia": "25 dispositivos", "responsable": "IT Subcontratado", "criticidad": "Crítico"},
        {"nombre": "Veeam Backup", "tipo": "Backup", "licencia": "Essentials", "responsable": "IT Subcontratado", "criticidad": "Crítico"},
        {"nombre": "LastPass Business", "tipo": "Gestor Contraseñas", "licencia": "15 usuarios", "responsable": "IT Subcontratado", "criticidad": "Importante"},
        
        # Servicios cloud
        {"nombre": "Google Workspace", "tipo": "Suite Colaborativa", "licencia": "Business Standard", "responsable": "Laura Fernández", "criticidad": "Importante"},
        {"nombre": "Dropbox Business", "tipo": "Almacenamiento Cloud", "licencia": "Standard", "responsable": "Laura Fernández", "criticidad": "Normal"},
        {"nombre": "Zoom Business", "tipo": "Videoconferencia", "licencia": "Business", "responsable": "Administración", "criticidad": "Importante"},
        
        # Software especializado
        {"nombre": "TimeBillingX", "tipo": "Control Horario", "licencia": "Professional", "responsable": "RRHH", "criticidad": "Importante"},
        {"nombre": "DocuSign", "tipo": "Firma Digital", "licencia": "Business Pro", "responsable": "Legal", "criticidad": "Importante"},
        {"nombre": "Trello Business", "tipo": "Gestión Proyectos", "licencia": "15 usuarios", "responsable": "Administración", "criticidad": "Normal"},
    ]
    
    for item in software_items:
        activo = {
            "id": generar_id(),
            "tipo_activo": "Software e Información",
            "nombre": item["nombre"],
            "responsable": item["responsable"] if item["responsable"] in empleados else item["responsable"],
            "departamento": "Legal" if "Legal" in item["tipo"] else "Administración",
            "descripcion": f"{item['tipo']} - {item['licencia']}",
            "version": f"v{random.randint(2020, 2024)}.{random.randint(1, 12)}",
            "tipo_software": item["tipo"],
            "licencia": item["licencia"],
            "usuario": "Múltiples usuarios" if "usuarios" in item["licencia"] else "Usuario único",
            "estado": "Activo",
            "clasificacion_seguridad": "Secreto" if "Clientes" in item["nombre"] or "Expedientes" in item["nombre"] else "Confidencial",
            "criticidad": item["criticidad"],
            "fecha_registro": datetime.now().isoformat(),
            "fecha_modificacion": datetime.now().isoformat(),
            "historial_cambios": [{
                "fecha": datetime.now().isoformat(),
                "usuario": "Sistema",
                "accion": "Importación inicial de datos"
            }]
        }
        activos.append(activo)
    
    # SERVICIOS
    servicios_items = [
        # Servicios IT
        {"nombre": "Soporte IT TechPartners", "descripcion": "Mantenimiento y soporte técnico", "responsable": "IT Subcontratado", "criticidad": "Crítico"},
        {"nombre": "Hosting Web Arsys", "descripcion": "Alojamiento página web corporativa", "responsable": "IT Subcontratado", "criticidad": "Importante"},
        {"nombre": "Dominio martinezasociados.es", "descripcion": "Dominio principal y correos", "responsable": "IT Subcontratado", "criticidad": "Crítico"},
        
        # Telecomunicaciones
        {"nombre": "Fibra Empresarial Movistar", "descripcion": "600Mbps simétricos + IP fija", "responsable": "Administración", "criticidad": "Crítico"},
        {"nombre": "Línea Backup Vodafone", "descripcion": "4G backup 100GB", "responsable": "Administración", "criticidad": "Importante"},
        {"nombre": "Centralita Virtual", "descripcion": "20 extensiones VoIP", "responsable": "Administración", "criticidad": "Importante"},
        
        # Servicios profesionales
        {"nombre": "Asesoría Fiscal Externa", "descripcion": "Gestión fiscal trimestral", "responsable": "José González", "criticidad": "Importante"},
        {"nombre": "Auditoría KPMG", "descripcion": "Auditoría anual", "responsable": "José González", "criticidad": "Normal"},
        {"nombre": "Protección Datos GDPR", "descripcion": "Consultoría LOPD/GDPR", "responsable": "Juan Martínez", "criticidad": "Crítico"},
        
        # Servicios de seguridad
        {"nombre": "Securitas Direct", "descripcion": "Alarma y videovigilancia", "responsable": "Laura Fernández", "criticidad": "Importante"},
        {"nombre": "Destrucción Confidencial", "descripcion": "Recu - destrucción documentos", "responsable": "Administración", "criticidad": "Importante"},
        
        # Otros servicios
        {"nombre": "Limpieza ISS", "descripcion": "Servicio diario limpieza", "responsable": "Laura Fernández", "criticidad": "Normal"},
        {"nombre": "Mantenimiento Ascensor", "descripcion": "Otis - mantenimiento mensual", "responsable": "Administración", "criticidad": "Normal"},
        {"nombre": "Seguro Responsabilidad Civil", "descripcion": "RC Profesional abogados", "responsable": "Juan Martínez", "criticidad": "Crítico"},
    ]
    
    for item in servicios_items:
        activo = {
            "id": generar_id(),
            "tipo_activo": "Servicios",
            "nombre": item["nombre"],
            "responsable": item["responsable"],
            "departamento": "Administración" if item["responsable"] == "Administración" else "Legal",
            "sede": "Oficina Principal",
            "descripcion": item["descripcion"],
            "categoria": "Servicio Externo",
            "estado": "Activo",
            "clasificacion_seguridad": "Confidencial" if item["criticidad"] == "Crítico" else "Interno",
            "criticidad": item["criticidad"],
            "fecha_registro": datetime.now().isoformat(),
            "fecha_modificacion": datetime.now().isoformat(),
            "fecha_compra": fecha_aleatoria(-365, -30),
            "garantia": "Según contrato",
            "historial_cambios": [{
                "fecha": datetime.now().isoformat(),
                "usuario": "Sistema",
                "accion": "Importación inicial de datos"
            }]
        }
        activos.append(activo)
    
    # PAPEL - Documentación física importante
    papel_items = [
        {"nombre": "Escrituras Constitución", "descripcion": "Escrituras originales de la sociedad", "responsable": "Juan Martínez", "criticidad": "Crítico"},
        {"nombre": "Poderes Notariales", "descripcion": "Poderes de representación", "responsable": "Juan Martínez", "criticidad": "Crítico"},
        {"nombre": "Contratos Laborales", "descripcion": "Contratos originales empleados", "responsable": "RRHH", "criticidad": "Crítico"},
        {"nombre": "Expedientes Clientes 2023", "descripcion": "Documentación física casos 2023", "responsable": "María García", "criticidad": "Crítico"},
        {"nombre": "Expedientes Clientes 2024", "descripcion": "Documentación física casos 2024", "responsable": "María García", "criticidad": "Crítico"},
        {"nombre": "Libros Contables", "descripcion": "Libros oficiales contabilidad", "responsable": "José González", "criticidad": "Crítico"},
        {"nombre": "Archivo Facturas", "descripcion": "Facturas emitidas y recibidas", "responsable": "José González", "criticidad": "Importante"},
        {"nombre": "Pólizas Seguros", "descripcion": "Documentación seguros vigentes", "responsable": "Laura Fernández", "criticidad": "Importante"},
        {"nombre": "Títulos Académicos", "descripcion": "Títulos originales colegiados", "responsable": "RRHH", "criticidad": "Importante"},
        {"nombre": "Manuales Procedimientos", "descripcion": "Manuales internos impresos", "responsable": "Administración", "criticidad": "Normal"},
    ]
    
    for item in papel_items:
        activo = {
            "id": generar_id(),
            "tipo_activo": "Papel",
            "nombre": item["nombre"],
            "responsable": item["responsable"],
            "departamento": "Legal" if "Expedientes" in item["nombre"] else "Administración",
            "sede": "Oficina Principal",
            "descripcion": item["descripcion"],
            "categoria": "Documentación Física",
            "estado": "Activo",
            "clasificacion_seguridad": "Secreto" if "Clientes" in item["nombre"] else "Confidencial",
            "criticidad": item["criticidad"],
            "fecha_registro": datetime.now().isoformat(),
            "fecha_modificacion": datetime.now().isoformat(),
            "condicion": "Bueno",
            "historial_cambios": [{
                "fecha": datetime.now().isoformat(),
                "usuario": "Sistema",
                "accion": "Importación inicial de datos"
            }]
        }
        activos.append(activo)
    
    # MATERIAL DE OFICINA PERSONAL
    material_items = [
        {"nombre": "Armario Ignífugo", "descripcion": "Caja fuerte documentos", "responsable": "Juan Martínez", "criticidad": "Crítico"},
        {"nombre": "Destructora Fellowes", "descripcion": "Destructora nivel seguridad P-4", "responsable": "Administración", "criticidad": "Importante"},
        {"nombre": "Archivadores Metálicos", "descripcion": "4 cajones con cerradura", "responsable": "María García", "criticidad": "Importante"},
        {"nombre": "Cajonera Seguridad", "descripcion": "Cajonera con llave personal", "responsable": "José González", "criticidad": "Normal"},
        {"nombre": "Maletín Portadocumentos", "descripcion": "Maletín seguridad con código", "responsable": "Carlos López", "criticidad": "Normal"},
    ]
    
    for item in material_items:
        activo = {
            "id": generar_id(),
            "tipo_activo": "Material de Oficina Personal",
            "nombre": item["nombre"],
            "responsable": item["responsable"],
            "departamento": "Administración",
            "sede": "Oficina Principal",
            "descripcion": item["descripcion"],
            "categoria": "Mobiliario Seguridad",
            "estado": "Activo",
            "clasificacion_seguridad": "Interno",
            "criticidad": item["criticidad"],
            "fecha_registro": datetime.now().isoformat(),
            "fecha_modificacion": datetime.now().isoformat(),
            "fecha_compra": fecha_aleatoria(-730, -180),
            "condicion": "Bueno",
            "historial_cambios": [{
                "fecha": datetime.now().isoformat(),
                "usuario": "Sistema",
                "accion": "Importación inicial de datos"
            }]
        }
        activos.append(activo)
    
    return activos

# Generar datos
datos_inventario = {
    "activos": generar_activos(),
    "categorias": ["Hardware", "Software e Información", "Servicios", "Papel", "Material de Oficina Personal"],
    "usuarios": empleados
}

# Guardar en archivo
with open('data/inventario_ejemplo_legal.json', 'w', encoding='utf-8') as f:
    json.dump(datos_inventario, f, ensure_ascii=False, indent=2)

# Estadísticas
print(f"✅ Datos generados exitosamente:")
print(f"   - Total activos: {len(datos_inventario['activos'])}")
for tipo in datos_inventario['categorias']:
    count = len([a for a in datos_inventario['activos'] if a['tipo_activo'] == tipo])
    print(f"   - {tipo}: {count} activos")

print(f"\n📊 Activos por criticidad:")
for criticidad in ['Crítico', 'Importante', 'Normal', 'Bajo']:
    count = len([a for a in datos_inventario['activos'] if a.get('criticidad') == criticidad])
    if count > 0:
        print(f"   - {criticidad}: {count} activos")