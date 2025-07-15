#!/usr/bin/env python3
"""
Script para configurar OAuth en el sistema
"""
import json
import os
import sys
from datetime import datetime

def load_config():
    """Cargar configuración actual"""
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    orgs_file = os.path.join(data_dir, 'organizaciones.json')
    
    if os.path.exists(orgs_file):
        with open(orgs_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_config(config):
    """Guardar configuración"""
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    orgs_file = os.path.join(data_dir, 'organizaciones.json')
    
    with open(orgs_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def configure_gailen_oauth():
    """Configurar OAuth para Gailen"""
    print("🔧 Configurando OAuth para Gailen Tecnologías")
    print()
    
    # Solicitar credenciales
    print("Introduce las credenciales de Google OAuth:")
    client_id = input("Client ID: ").strip()
    client_secret = input("Client Secret: ").strip()
    
    if not client_id or not client_secret:
        print("❌ Client ID y Client Secret son requeridos")
        return False
    
    # Cargar configuración actual
    config = load_config()
    
    # Actualizar configuración de Gailen
    if 'gailen' not in config:
        config['gailen'] = {
            "id": "gailen",
            "nombre": "Gailen Tecnologías",
            "fecha_creacion": datetime.now().isoformat(),
            "activa": True
        }
    
    config['gailen']['oauth_config'] = {
        "provider": "google",
        "client_id": client_id,
        "client_secret": client_secret,
        "allowed_domains": ["gailen.com", "gailentecnologias.com"],
        "require_domain_match": True,
        "custom_claims": {
            "department": "department",
            "role": "job_title"
        }
    }
    
    config['gailen']['seguridad'] = {
        "require_mfa": False,
        "session_timeout": 3600,
        "ip_whitelist": []
    }
    
    # Guardar configuración
    save_config(config)
    
    print("✅ Configuración OAuth guardada para Gailen")
    print()
    
    return True

def setup_environment_variables():
    """Configurar variables de entorno"""
    print("🌍 Configuración de variables de entorno")
    print()
    
    env_vars = [
        ("OAUTH_ENABLED", "true", "Habilitar OAuth"),
        ("JWT_SECRET", "", "Clave secreta para JWT (dejar vacío para generar)"),
        ("SECRET_KEY", "", "Clave secreta para Flask (dejar vacío para generar)")
    ]
    
    env_config = {}
    
    for var_name, default_value, description in env_vars:
        current_value = os.environ.get(var_name, default_value)
        
        if var_name in ["JWT_SECRET", "SECRET_KEY"] and not current_value:
            import secrets
            current_value = secrets.token_urlsafe(32)
        
        value = input(f"{description} ({var_name}) [{current_value}]: ").strip()
        if not value:
            value = current_value
        
        env_config[var_name] = value
    
    # Crear archivo .env
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
    
    with open(env_file, 'w') as f:
        f.write("# OAuth Configuration\n")
        for key, value in env_config.items():
            f.write(f"{key}={value}\n")
    
    print(f"✅ Variables de entorno guardadas en {env_file}")
    print()
    
    return env_config

def create_admin_user():
    """Crear usuario administrador inicial"""
    print("👤 Crear usuario administrador inicial")
    print()
    
    email = input("Email del administrador: ").strip()
    nombre = input("Nombre completo: ").strip()
    
    if not email or not nombre:
        print("❌ Email y nombre son requeridos")
        return False
    
    # Verificar dominio
    domain = email.split('@')[1].lower()
    allowed_domains = ["gailen.com", "gailentecnologias.com"]
    
    if domain not in allowed_domains:
        print(f"⚠️  Advertencia: El dominio {domain} no está en la lista de dominios permitidos")
        print(f"Dominios permitidos: {', '.join(allowed_domains)}")
        
        if input("¿Continuar de todos modos? (y/N): ").lower() != 'y':
            return False
    
    # Crear usuario en el sistema
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    users_file = os.path.join(data_dir, 'users.json')
    
    users = {}
    if os.path.exists(users_file):
        with open(users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)
    
    # Generar ID único
    import secrets
    user_id = f"usr_{secrets.token_urlsafe(8)}"
    
    user_data = {
        "id": user_id,
        "email": email,
        "nombre": nombre,
        "organizacion_id": "gailen",
        "oauth_provider": "google",
        "oauth_id": f"google_{email}",
        "permisos": {
            "inventario": ["read", "write", "delete", "admin"],
            "impactos": ["read", "write", "delete", "admin"],
            "madurez": ["read", "write", "delete", "admin"]
        },
        "roles": ["usuario", "admin"],
        "ultimo_acceso": datetime.now().isoformat(),
        "activo": True,
        "metadata": {
            "departamento": "TI",
            "cargo": "Administrador"
        }
    }
    
    users[user_id] = user_data
    
    os.makedirs(data_dir, exist_ok=True)
    with open(users_file, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Usuario administrador creado: {email}")
    print(f"   ID: {user_id}")
    print(f"   Roles: {', '.join(user_data['roles'])}")
    print()
    
    return True

def verify_setup():
    """Verificar que la configuración está completa"""
    print("🔍 Verificando configuración...")
    print()
    
    errors = []
    warnings = []
    
    # Verificar archivos de datos
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    required_files = [
        'organizaciones.json',
        'users.json', 
        'sessions.json',
        'audit_logs.json'
    ]
    
    for filename in required_files:
        file_path = os.path.join(data_dir, filename)
        if not os.path.exists(file_path):
            errors.append(f"Archivo faltante: {filename}")
    
    # Verificar configuración OAuth
    orgs = load_config()
    if 'gailen' not in orgs:
        errors.append("Organización Gailen no configurada")
    elif 'oauth_config' not in orgs['gailen']:
        errors.append("OAuth no configurado para Gailen")
    else:
        oauth_config = orgs['gailen']['oauth_config']
        if not oauth_config.get('client_id'):
            errors.append("Client ID de Google no configurado")
        if not oauth_config.get('client_secret'):
            errors.append("Client Secret de Google no configurado")
    
    # Verificar variables de entorno
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
    if not os.path.exists(env_file):
        warnings.append("Archivo .env no encontrado")
    
    # Mostrar resultados
    if errors:
        print("❌ Errores encontrados:")
        for error in errors:
            print(f"   - {error}")
        print()
        return False
    
    if warnings:
        print("⚠️  Advertencias:")
        for warning in warnings:
            print(f"   - {warning}")
        print()
    
    print("✅ Configuración verificada correctamente")
    print()
    return True

def main():
    """Función principal"""
    print("=" * 60)
    print("🔐 CONFIGURACIÓN OAUTH - SISTEMA INVENTARIO ACTIVOS")
    print("=" * 60)
    print()
    
    try:
        # Configurar OAuth para Gailen
        if not configure_gailen_oauth():
            return 1
        
        # Configurar variables de entorno
        setup_environment_variables()
        
        # Crear usuario administrador
        create_admin_user()
        
        # Verificar configuración
        if not verify_setup():
            return 1
        
        print("🎉 ¡Configuración OAuth completada exitosamente!")
        print()
        print("Próximos pasos:")
        print("1. Configurar credenciales OAuth en Google Cloud Console")
        print("2. Actualizar URIs de redirección en Google Console")
        print("3. Desplegar aplicación con OAuth habilitado")
        print("4. Probar flujo de autenticación")
        print()
        print("Ver documentación: docs/oauth-gailen-setup.md")
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n❌ Configuración cancelada por el usuario")
        return 1
    except Exception as e:
        print(f"\n\n❌ Error durante la configuración: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())