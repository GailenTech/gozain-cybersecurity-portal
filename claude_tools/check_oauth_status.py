#!/usr/bin/env python3
"""
Script para verificar el estado de la configuración OAuth
"""
import subprocess
import json
import os
import sys

def run_command(cmd):
    """Ejecutar comando y devolver resultado"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None

def check_gcloud_config():
    """Verificar configuración de gcloud"""
    print("🔍 Verificando configuración de Google Cloud...")
    
    project = run_command("gcloud config get-value project")
    account = run_command("gcloud config get-value account")
    
    print(f"  📊 Proyecto: {project}")
    print(f"  👤 Cuenta: {account}")
    
    return {'project': project, 'account': account}

def check_enabled_apis():
    """Verificar APIs habilitadas"""
    print("\n🔍 Verificando APIs habilitadas...")
    
    required_apis = [
        'people.googleapis.com',
        'plus.googleapis.com', 
        'iam.googleapis.com',
        'iamcredentials.googleapis.com',
        'run.googleapis.com',
        'cloudbuild.googleapis.com'
    ]
    
    enabled_apis = run_command("gcloud services list --enabled --format='value(name)'")
    enabled_list = enabled_apis.split('\n') if enabled_apis else []
    
    all_enabled = True
    for api in required_apis:
        if api in enabled_list:
            print(f"  ✅ {api}")
        else:
            print(f"  ❌ {api}")
            all_enabled = False
    
    return all_enabled

def check_oauth_credentials():
    """Verificar si existen credenciales OAuth"""
    print("\n🔍 Verificando credenciales OAuth...")
    
    project = run_command("gcloud config get-value project")
    
    # Intentar listar credenciales OAuth
    creds_output = run_command(f"gcloud auth oauth2 list-oauth2-clients --project={project} --format=json")
    
    if creds_output:
        try:
            creds = json.loads(creds_output)
            if creds:
                print(f"  ✅ Encontradas {len(creds)} credenciales OAuth")
                for cred in creds:
                    client_id = cred.get('name', '').split('/')[-1]
                    print(f"    - Client ID: {client_id}")
                return True
            else:
                print("  ❌ No se encontraron credenciales OAuth")
                return False
        except json.JSONDecodeError:
            print("  ⚠️  Error parsing credenciales OAuth")
            return False
    else:
        print("  ❌ No se pudieron obtener credenciales OAuth")
        return False

def check_local_config():
    """Verificar configuración local"""
    print("\n🔍 Verificando configuración local...")
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    
    # Verificar archivo .env
    env_file = os.path.join(base_dir, '.env')
    if os.path.exists(env_file):
        print("  ✅ Archivo .env existe")
        
        # Leer contenido
        with open(env_file, 'r') as f:
            content = f.read()
        
        if 'ACTUALIZAR-CON-CLIENT-ID' in content:
            print("  ⚠️  Client ID pendiente de actualizar")
        else:
            print("  ✅ Client ID configurado")
        
        if 'OAUTH_ENABLED=true' in content:
            print("  ✅ OAuth habilitado")
        else:
            print("  ❌ OAuth no habilitado")
    else:
        print("  ❌ Archivo .env no existe")
    
    # Verificar organizaciones.json
    orgs_file = os.path.join(base_dir, 'data', 'organizaciones.json')
    if os.path.exists(orgs_file):
        print("  ✅ Archivo organizaciones.json existe")
        
        with open(orgs_file, 'r', encoding='utf-8') as f:
            orgs = json.load(f)
        
        if 'gailen' in orgs and 'oauth_config' in orgs['gailen']:
            oauth_config = orgs['gailen']['oauth_config']
            if oauth_config.get('client_id') and 'ACTUALIZAR' not in oauth_config.get('client_id', ''):
                print("  ✅ OAuth configurado para Gailen")
            else:
                print("  ⚠️  OAuth para Gailen pendiente de configurar")
        else:
            print("  ❌ OAuth para Gailen no configurado")
    else:
        print("  ❌ Archivo organizaciones.json no existe")

def provide_next_steps(gcloud_info):
    """Proporcionar próximos pasos"""
    print("\n" + "="*60)
    print("📋 PRÓXIMOS PASOS")
    print("="*60)
    
    project = gcloud_info['project']
    
    print("\n1. 🌐 Configurar OAuth Consent Screen:")
    print(f"   https://console.cloud.google.com/apis/credentials/consent?project={project}")
    
    print("\n2. 🔑 Crear credenciales OAuth 2.0:")
    print(f"   https://console.cloud.google.com/apis/credentials/oauthclient?project={project}")
    
    print("\n3. 💾 Actualizar credenciales locales:")
    print("   python3 claude_tools/setup_oauth.py")
    
    print("\n4. 🧪 Probar localmente:")
    print("   ./test_local.sh")
    print("   # Visitar http://localhost:8080 y probar login")
    
    print("\n5. 🚀 Desplegar a producción:")
    print("   ./deploy_gcp.sh")

def main():
    """Función principal"""
    print("🔐 VERIFICACIÓN DE ESTADO OAUTH")
    print("=" * 40)
    
    # Verificar configuración de gcloud
    gcloud_info = check_gcloud_config()
    
    if not gcloud_info['project']:
        print("❌ No se pudo obtener el proyecto de gcloud")
        return 1
    
    # Verificar APIs
    apis_ok = check_enabled_apis()
    
    # Verificar credenciales OAuth (si es posible)
    # oauth_ok = check_oauth_credentials()
    
    # Verificar configuración local
    check_local_config()
    
    # Proporcionar próximos pasos
    provide_next_steps(gcloud_info)
    
    print(f"\n✅ Verificación completada!")
    print(f"📊 Estado: APIs ({'✅' if apis_ok else '❌'})")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())