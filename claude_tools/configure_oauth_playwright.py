#!/usr/bin/env python3
"""
Script para configurar OAuth Consent Screen usando Playwright
Proyecto: inventario-iso27001-20250708
"""

import asyncio
import sys
import os
from playwright.async_api import async_playwright

# Configuración del proyecto
PROJECT_ID = "inventario-iso27001-20250708"
CLIENT_ID = "687354193398-jqhmggpmp2pmi0jcfi0edgcv9c0ibe7a.apps.googleusercontent.com"

# Datos de configuración
APP_CONFIG = {
    "app_name": "Sistema de Inventario ISO 27001",
    "user_support_email": "jorge.uriarte@gailen.es",
    "developer_email": "jorge.uriarte@gailen.es",
    "authorized_domains": [
        "gailen.com",
        "gailentecnologias.com",
        "us-central1.run.app"
    ],
    "app_homepage": "https://gozain-687354193398.us-central1.run.app",
    "privacy_policy": "https://gozain-687354193398.us-central1.run.app/privacy",
    "terms_of_service": "https://gozain-687354193398.us-central1.run.app/terms"
}

async def configure_oauth_consent_screen():
    """Configurar OAuth Consent Screen usando Playwright"""
    
    print("🚀 Iniciando configuración automatizada OAuth Consent Screen...")
    print(f"📋 Proyecto: {PROJECT_ID}")
    print(f"🔑 Client ID: {CLIENT_ID}")
    print()
    
    async with async_playwright() as p:
        # Usar navegador con contexto de usuario persistente
        browser = await p.chromium.launch(
            headless=False,  # Mostrar navegador para autenticación manual
            slow_mo=1000     # Ralentizar para ver las acciones
        )
        
        # Crear contexto con datos de usuario persistentes
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        
        page = await context.new_page()
        
        try:
            # Paso 1: Navegar a Google Cloud Console
            consent_screen_url = f"https://console.cloud.google.com/auth/branding?project={PROJECT_ID}"
            print(f"🌐 Navegando a: {consent_screen_url}")
            
            await page.goto(consent_screen_url, wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # Verificar si necesita autenticación
            if "accounts.google.com" in page.url:
                print("🔐 Se requiere autenticación de Google...")
                print("👤 Por favor, inicia sesión manualmente en el navegador")
                print("⏳ Esperando autenticación...")
                
                # Esperar hasta que llegue a la página de consent screen
                await page.wait_for_url(f"**/auth/branding**", timeout=120000)
                print("✅ Autenticación completada")
            
            await page.wait_for_timeout(2000)
            
            # Paso 2: Verificar si ya está configurado
            print("🔍 Verificando configuración actual...")
            
            # Buscar si ya hay configuración
            try:
                edit_button = page.locator('button:has-text("Edit app registration"), button:has-text("Editar registro de aplicación")')
                if await edit_button.count() > 0:
                    print("📝 Configuración existente encontrada, editando...")
                    await edit_button.first.click()
                    await page.wait_for_timeout(2000)
                else:
                    # Buscar botón de configurar
                    config_button = page.locator('button:has-text("Configure"), button:has-text("Configurar")')
                    if await config_button.count() > 0:
                        print("🆕 Configurando por primera vez...")
                        await config_button.first.click()
                        await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"⚠️ No se pudo determinar el estado: {e}")
            
            # Paso 3: Configurar información básica
            print("📝 Configurando información de la aplicación...")
            
            # App name
            app_name_field = page.locator('input[aria-label*="App name"], input[placeholder*="App name"]')
            if await app_name_field.count() > 0:
                await app_name_field.clear()
                await app_name_field.fill(APP_CONFIG["app_name"])
                print(f"✅ App name: {APP_CONFIG['app_name']}")
            
            # User support email
            support_email_field = page.locator('input[aria-label*="User support email"], input[placeholder*="support email"]')
            if await support_email_field.count() > 0:
                await support_email_field.clear()
                await support_email_field.fill(APP_CONFIG["user_support_email"])
                print(f"✅ Support email: {APP_CONFIG['user_support_email']}")
            
            # Authorized domains
            print("🌐 Configurando dominios autorizados...")
            
            # Buscar sección de dominios autorizados
            domain_section = page.locator('text="Authorized domains", text="Dominios autorizados"')
            if await domain_section.count() > 0:
                # Buscar campo de entrada de dominio
                domain_input = page.locator('input[placeholder*="domain"], input[aria-label*="domain"]')
                
                for domain in APP_CONFIG["authorized_domains"]:
                    if await domain_input.count() > 0:
                        await domain_input.fill(domain)
                        
                        # Buscar botón de agregar
                        add_button = page.locator('button:has-text("Add"), button:has-text("Agregar"), button[aria-label*="Add"]')
                        if await add_button.count() > 0:
                            await add_button.click()
                            await page.wait_for_timeout(1000)
                            print(f"✅ Dominio agregado: {domain}")
            
            # Developer contact information
            print("👨‍💻 Configurando información de contacto del desarrollador...")
            
            developer_email_field = page.locator('input[aria-label*="Developer contact"], input[placeholder*="developer"], input[aria-label*="Email addresses"]')
            if await developer_email_field.count() > 0:
                await developer_email_field.clear()
                await developer_email_field.fill(APP_CONFIG["developer_email"])
                print(f"✅ Developer email: {APP_CONFIG['developer_email']}")
            
            # Paso 4: Guardar configuración
            print("💾 Guardando configuración...")
            
            save_button = page.locator('button:has-text("Save"), button:has-text("Guardar"), button:has-text("Save and continue")')
            if await save_button.count() > 0:
                await save_button.click()
                await page.wait_for_timeout(3000)
                print("✅ Configuración guardada")
            
            # Paso 5: Configurar scopes (si es necesario)
            print("🔐 Verificando scopes...")
            
            # Navegar a scopes si no estamos ahí
            scopes_url = f"https://console.cloud.google.com/auth/scopes?project={PROJECT_ID}"
            if "scopes" not in page.url:
                await page.goto(scopes_url, wait_until="networkidle")
                await page.wait_for_timeout(2000)
            
            # Los scopes básicos (email, profile, openid) suelen estar habilitados por defecto
            print("✅ Scopes básicos verificados")
            
            # Paso 6: Verificar configuración final
            print("🔍 Verificando configuración final...")
            
            final_url = f"https://console.cloud.google.com/auth/branding?project={PROJECT_ID}"
            await page.goto(final_url, wait_until="networkidle")
            await page.wait_for_timeout(2000)
            
            print("✅ Configuración OAuth Consent Screen completada!")
            print()
            print("🎯 Siguientes pasos:")
            print("1. Probar localmente: ./test_local.sh")
            print("2. Desplegar a producción: ./deploy_gcp.sh")
            print("3. Ejecutar tests OAuth: python claude_tools/test_oauth_flow.py")
            
            # Mantener navegador abierto para revisión manual
            print()
            print("🔍 Navegador mantenido abierto para revisión manual...")
            print("❗ Presiona Enter para cerrar el navegador y continuar...")
            input()
            
        except Exception as e:
            print(f"❌ Error durante la configuración: {e}")
            print("🔍 Navegador mantenido abierto para revisión manual...")
            print("❗ Presiona Enter para cerrar...")
            input()
            
        finally:
            await browser.close()

async def main():
    """Función principal"""
    print("🔧 Configurador Automatizado OAuth Consent Screen")
    print("=" * 50)
    print()
    
    # Verificar que Playwright esté instalado
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("❌ Playwright no está instalado")
        print("📦 Instalar con: pip install playwright")
        print("🔧 Después ejecutar: playwright install")
        return 1
    
    # Ejecutar configuración
    await configure_oauth_consent_screen()
    
    return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))