#!/usr/bin/env python3
"""
Script para configurar OAuth usando Google Cloud CLI y APIs
"""
import subprocess
import json
import os
import sys
from datetime import datetime

def run_command(cmd, capture_output=True):
    """Ejecutar comando y devolver resultado"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=capture_output, 
            text=True, 
            check=True
        )
        return result.stdout.strip() if capture_output else None
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando comando: {cmd}")
        print(f"Error: {e.stderr if capture_output else e}")
        return None

def get_project_info():
    """Obtener información del proyecto actual"""
    project_id = run_command("gcloud config get-value project")
    account = run_command("gcloud config get-value account")
    
    return {
        'project_id': project_id,
        'account': account
    }

def check_apis_enabled():
    """Verificar qué APIs están habilitadas"""
    print("🔍 Verificando APIs habilitadas...")
    
    required_apis = [
        'people.googleapis.com',
        'plus.googleapis.com',
        'iam.googleapis.com',
        'iamcredentials.googleapis.com'
    ]
    
    enabled_apis = run_command("gcloud services list --enabled --format='value(name)'")
    enabled_list = enabled_apis.split('\n') if enabled_apis else []
    
    missing_apis = []
    for api in required_apis:
        if api in enabled_list:
            print(f"  ✅ {api}")
        else:
            print(f"  ❌ {api}")
            missing_apis.append(api)
    
    return missing_apis

def enable_missing_apis(missing_apis):
    """Habilitar APIs faltantes"""
    if not missing_apis:
        print("✅ Todas las APIs necesarias están habilitadas")
        return True
    
    print(f"\n🔧 Habilitando APIs faltantes...")
    
    for api in missing_apis:
        print(f"  Habilitando {api}...")
        result = run_command(f"gcloud services enable {api}")
        if result is not None:
            print(f"  ✅ {api} habilitada")
        else:
            print(f"  ❌ Error habilitando {api}")
            return False
    
    return True

def update_organization_config(client_id, client_secret):
    """Actualizar configuración de la organización Gailen"""
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    orgs_file = os.path.join(data_dir, 'organizaciones.json')
    
    # Cargar configuración actual
    if os.path.exists(orgs_file):
        with open(orgs_file, 'r', encoding='utf-8') as f:
            orgs = json.load(f)
    else:
        orgs = {}
    
    # Actualizar configuración de Gailen
    if 'gailen' not in orgs:
        orgs['gailen'] = {
            "id": "gailen",
            "nombre": "Gailen Tecnologías",
            "fecha_creacion": datetime.now().isoformat(),
            "activa": True
        }
    
    orgs['gailen']['oauth_config'] = {
        "provider": "google",
        "client_id": client_id,
        "client_secret": client_secret,
        "allowed_domains": ["gailen.es", "gailentecnologias.com"],
        "require_domain_match": True,
        "custom_claims": {
            "department": "department",
            "role": "job_title"
        }
    }
    
    orgs['gailen']['seguridad'] = {
        "require_mfa": False,
        "session_timeout": 3600,
        "ip_whitelist": []
    }
    
    # Guardar configuración
    os.makedirs(data_dir, exist_ok=True)
    with open(orgs_file, 'w', encoding='utf-8') as f:
        json.dump(orgs, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Configuración OAuth guardada para Gailen en {orgs_file}")

def create_env_file(project_info):
    """Crear archivo .env con variables necesarias"""
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
    
    env_content = f"""# OAuth Configuration
OAUTH_ENABLED=true
JWT_SECRET={generate_secret()}
SECRET_KEY={generate_secret()}

# Google Cloud Project
PROJECT_ID={project_info['project_id']}
GOOGLE_ACCOUNT={project_info['account']}

# OAuth Credentials (ACTUALIZAR CON CREDENCIALES REALES)
GOOGLE_CLIENT_ID=ACTUALIZAR-CON-CLIENT-ID
GOOGLE_CLIENT_SECRET=ACTUALIZAR-CON-CLIENT-SECRET

# App Engine URLs
APP_URL=https://inventario-activos-dot-{project_info['project_id']}.uc.r.appspot.com
LOCAL_URL=http://localhost:8080
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Archivo .env creado en {env_file}")

def generate_secret():
    """Generar clave secreta"""
    import secrets
    return secrets.token_urlsafe(32)

def show_manual_steps(project_info):
    """Mostrar pasos manuales necesarios"""
    print("\n" + "="*60)
    print("📋 PASOS MANUALES REQUERIDOS")
    print("="*60)
    
    print(f"\n1. 🌐 Abrir Google Cloud Console:")
    print(f"   https://console.cloud.google.com/apis/credentials?project={project_info['project_id']}")
    
    print(f"\n2. 📋 Configurar OAuth Consent Screen:")
    print(f"   https://console.cloud.google.com/apis/credentials/consent?project={project_info['project_id']}")
    print("   Configuración:")
    print("   - User Type: External")
    print("   - Application name: Gozain - Sistema de Inventario de Activos")
    print(f"   - User support email: {project_info['account']}")
    print(f"   - Developer contact email: {project_info['account']}")
    print("   - Authorized domains: gailen.es, gailentecnologias.com")
    print("   - Scopes: email, profile, openid")
    
    print(f"\n3. 🔑 Crear credenciales OAuth 2.0:")
    print(f"   https://console.cloud.google.com/apis/credentials/oauthclient?project={project_info['project_id']}")
    print("   Configuración:")
    print("   - Application type: Web application")
    print("   - Name: Gozain Inventario Activos")
    print("   - Authorized JavaScript origins:")
    print(f"     * https://inventario-activos-dot-{project_info['project_id']}.uc.r.appspot.com")
    print("     * http://localhost:8080")
    print("     * http://localhost:5001")
    print("   - Authorized redirect URIs:")
    print(f"     * https://inventario-activos-dot-{project_info['project_id']}.uc.r.appspot.com/api/auth/callback")
    print("     * http://localhost:8080/api/auth/callback")
    print("     * http://localhost:5001/api/auth/callback")
    
    print(f"\n4. 💾 Después de obtener las credenciales:")
    print("   - Copiar Client ID y Client Secret")
    print("   - Ejecutar: python3 claude_tools/setup_oauth.py")
    print("   - O actualizar manualmente el archivo .env")
    
    print(f"\n5. 🚀 Desplegar con OAuth:")
    print("   - Configurar variables de entorno en App Engine")
    print("   - Ejecutar ./deploy_gcp.sh")

def main():
    """Función principal"""
    print("🔐 CONFIGURACIÓN OAUTH CON GOOGLE CLOUD CLI")
    print("=" * 50)
    
    # Obtener información del proyecto
    project_info = get_project_info()
    
    if not project_info['project_id']:
        print("❌ No se pudo obtener el proyecto actual")
        print("Ejecuta: gcloud config set project TU-PROJECT-ID")
        return 1
    
    print(f"📊 Proyecto: {project_info['project_id']}")
    print(f"👤 Cuenta: {project_info['account']}")
    print()
    
    # Verificar y habilitar APIs
    missing_apis = check_apis_enabled()
    if missing_apis:
        if not enable_missing_apis(missing_apis):
            print("❌ Error habilitando APIs. Verifica permisos.")
            return 1
    
    # Crear archivo .env
    create_env_file(project_info)
    
    # Mostrar pasos manuales
    show_manual_steps(project_info)
    
    print(f"\n✅ Configuración inicial completada!")
    print(f"📁 Archivos creados:")
    print(f"   - .env (variables de entorno)")
    print(f"   - data/organizaciones.json se actualizará con setup_oauth.py")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())