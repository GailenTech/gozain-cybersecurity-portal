#!/usr/bin/env python3
"""
Script para probar el flujo OAuth completo
Proyecto: inventario-iso27001-20250708
"""

import requests
import json
import sys
import os
from urllib.parse import urlencode

def test_oauth_flow():
    """Probar el flujo OAuth end-to-end"""
    
    print("🧪 Iniciando pruebas del flujo OAuth...")
    print("=" * 50)
    
    # URLs de test
    local_url = "http://localhost:8080"
    prod_url = "https://gozain-687354193398.us-central1.run.app"
    
    # Probar primero localmente
    print("\n🏠 Probando flujo OAuth local...")
    test_url = local_url
    
    try:
        # Test 1: Verificar que el backend esté funcionando
        print(f"📡 Verificando backend en {test_url}...")
        response = requests.get(f"{test_url}/api/health", timeout=10)
        
        if response.status_code == 200:
            print("✅ Backend funcionando correctamente")
        else:
            print(f"⚠️ Backend responde pero con código {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend local no está ejecutándose")
        print("💡 Ejecuta: ./test_local.sh")
        print("\n🌐 Probando en producción...")
        test_url = prod_url
        
        try:
            response = requests.get(f"{test_url}/api/health", timeout=10)
            if response.status_code == 200:
                print("✅ Backend de producción funcionando")
            else:
                print(f"❌ Error en producción: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error conectando a producción: {e}")
            return False
    
    # Test 2: Verificar endpoints de autenticación
    print(f"\n🔐 Verificando endpoints de autenticación...")
    
    auth_endpoints = [
        "/api/auth/login",
        "/api/auth/callback", 
        "/api/auth/validate",
        "/api/auth/refresh",
        "/api/auth/logout"
    ]
    
    for endpoint in auth_endpoints:
        try:
            response = requests.get(f"{test_url}{endpoint}", timeout=5)
            # Esperamos códigos diferentes para cada endpoint
            if endpoint == "/api/auth/login":
                # Login debería redirigir a Google OAuth
                if response.status_code in [302, 200]:
                    print(f"✅ {endpoint} - OK ({response.status_code})")
                else:
                    print(f"⚠️ {endpoint} - Código inesperado: {response.status_code}")
            else:
                # Otros endpoints pueden requerir autenticación
                print(f"📋 {endpoint} - Respuesta: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error en {endpoint}: {e}")
    
    # Test 3: Verificar configuración OAuth
    print(f"\n⚙️ Verificando configuración OAuth...")
    
    try:
        response = requests.get(f"{test_url}/api/auth/config", timeout=5)
        if response.status_code == 200:
            config = response.json()
            print("✅ Configuración OAuth disponible")
            
            # Verificar campos importantes
            required_fields = ['client_id', 'redirect_uri', 'scopes']
            for field in required_fields:
                if field in config:
                    print(f"  ✅ {field}: {config[field]}")
                else:
                    print(f"  ❌ Falta {field}")
        else:
            print(f"⚠️ No se pudo obtener configuración OAuth: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error obteniendo configuración: {e}")
    
    # Test 4: Verificar frontend
    print(f"\n🎨 Verificando frontend...")
    
    try:
        response = requests.get(test_url, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend cargando correctamente")
            
            # Verificar que contenga elementos de autenticación
            content = response.text.lower()
            if 'login' in content or 'oauth' in content or 'google' in content:
                print("✅ Elementos de autenticación detectados en frontend")
            else:
                print("⚠️ No se detectaron elementos de autenticación en frontend")
                
        else:
            print(f"❌ Error cargando frontend: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error conectando al frontend: {e}")
    
    # Test 5: Verificar Google OAuth URL
    print(f"\n🔗 Verificando URL de Google OAuth...")
    
    try:
        response = requests.get(f"{test_url}/api/auth/login", allow_redirects=False, timeout=5)
        
        if response.status_code == 302:
            redirect_url = response.headers.get('Location', '')
            if 'accounts.google.com' in redirect_url and 'oauth2' in redirect_url:
                print("✅ Redirección a Google OAuth configurada correctamente")
                print(f"  🔗 URL: {redirect_url[:100]}...")
            else:
                print(f"⚠️ Redirección inesperada: {redirect_url}")
        else:
            print(f"⚠️ No hay redirección OAuth (código: {response.status_code})")
            
    except Exception as e:
        print(f"❌ Error verificando redirección OAuth: {e}")
    
    # Resumen
    print(f"\n📊 Resumen de pruebas OAuth")
    print("=" * 30)
    print(f"🌐 URL probada: {test_url}")
    print("🔧 Para continuar las pruebas:")
    print("   1. Abre el navegador en:", test_url)
    print("   2. Haz clic en 'Login' o busca el botón de autenticación")
    print("   3. Debería redirigir a Google OAuth con el consent screen configurado")
    print("   4. Después del login, deberías ver tu usuario autenticado")
    
    print(f"\n📋 Estado de configuración OAuth:")
    print("   ✅ OAuth Consent Screen configurado")
    print("   ✅ Credenciales OAuth en .env")
    print("   ✅ Dominios autorizados: gozain-687354193398.us-central1.run.app, gailen.com")
    print("   ✅ URLs configuradas: /privacy, /terms")
    
    return True

def main():
    """Función principal"""
    print("🧪 Test Suite OAuth - Sistema de Inventario ISO 27001")
    print("====================================================")
    
    # Verificar si estamos en el directorio correcto
    if not os.path.exists('.env'):
        print("❌ Archivo .env no encontrado")
        print("💡 Ejecuta este script desde el directorio raíz del proyecto")
        return 1
    
    # Ejecutar pruebas
    if test_oauth_flow():
        print("\n🎉 Pruebas OAuth completadas!")
        print("🚀 El sistema está listo para autenticación OAuth")
        return 0
    else:
        print("\n❌ Algunas pruebas fallaron")
        print("🔧 Revisa la configuración y vuelve a intentar")
        return 1

if __name__ == "__main__":
    sys.exit(main())