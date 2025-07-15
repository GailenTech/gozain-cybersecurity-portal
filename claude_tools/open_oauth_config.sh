#!/bin/bash

# Script para abrir URLs de configuración OAuth en Google Cloud Console
# Proyecto: inventario-iso27001-20250708

PROJECT_ID="inventario-iso27001-20250708"

echo "🔧 Abriendo configuración OAuth para proyecto: $PROJECT_ID"
echo ""

# URLs de configuración
CONSENT_SCREEN_URL="https://console.cloud.google.com/auth/branding?project=$PROJECT_ID"
CREDENTIALS_URL="https://console.cloud.google.com/auth/credentials?project=$PROJECT_ID"
API_LIBRARY_URL="https://console.cloud.google.com/apis/library?project=$PROJECT_ID"
ENABLED_APIS_URL="https://console.cloud.google.com/apis/dashboard?project=$PROJECT_ID"

echo "📋 Abriendo las siguientes URLs:"
echo ""
echo "1. OAuth Consent Screen:"
echo "   $CONSENT_SCREEN_URL"
echo ""
echo "2. OAuth Credentials:"
echo "   $CREDENTIALS_URL"
echo ""
echo "3. API Library:"
echo "   $API_LIBRARY_URL"
echo ""
echo "4. Enabled APIs:"
echo "   $ENABLED_APIS_URL"
echo ""

# Función para abrir URL en el navegador por defecto
open_url() {
    local url=$1
    local description=$2
    
    echo "🌐 Abriendo: $description"
    
    # Detectar el sistema operativo y abrir URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$url"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start "$url"
    else
        echo "❌ Sistema operativo no soportado. Abrir manualmente: $url"
    fi
    
    sleep 2  # Esperar un poco entre abrir URLs
}

# Preguntar al usuario qué configurar
echo "🤔 ¿Qué deseas configurar?"
echo ""
echo "1) OAuth Consent Screen (RECOMENDADO - empezar aquí)"
echo "2) Verificar credenciales OAuth"
echo "3) Verificar APIs habilitadas"
echo "4) Abrir todas las URLs"
echo "5) Salir"
echo ""
read -p "Selecciona una opción (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🎯 Configurando OAuth Consent Screen..."
        echo ""
        echo "📝 Información necesaria:"
        echo "   - App name: Sistema de Inventario ISO 27001"
        echo "   - User support email: jorge.uriarte@gailen.es"
        echo "   - Authorized domains: gailen.com, gailentecnologias.com"
        echo "   - Scopes: email, profile, openid"
        echo ""
        open_url "$CONSENT_SCREEN_URL" "OAuth Consent Screen"
        ;;
    2)
        echo ""
        echo "🔑 Verificando credenciales OAuth..."
        echo ""
        echo "📝 Verificar que existan:"
        echo "   - Client ID: 687354193398-jqhmggpmp2pmi0jcfi0edgcv9c0ibe7a.apps.googleusercontent.com"
        echo "   - Authorized redirect URIs configuradas"
        echo ""
        open_url "$CREDENTIALS_URL" "OAuth Credentials"
        ;;
    3)
        echo ""
        echo "🔧 Verificando APIs habilitadas..."
        echo ""
        echo "📝 APIs necesarias:"
        echo "   - Google+ API (para información de usuario)"
        echo "   - OAuth2 API (para autenticación)"
        echo ""
        open_url "$ENABLED_APIS_URL" "APIs Dashboard"
        ;;
    4)
        echo ""
        echo "🚀 Abriendo todas las URLs de configuración..."
        echo ""
        open_url "$CONSENT_SCREEN_URL" "OAuth Consent Screen"
        open_url "$CREDENTIALS_URL" "OAuth Credentials"
        open_url "$API_LIBRARY_URL" "API Library"
        open_url "$ENABLED_APIS_URL" "APIs Dashboard"
        ;;
    5)
        echo ""
        echo "👋 Saliendo..."
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Opción inválida. Saliendo..."
        exit 1
        ;;
esac

echo ""
echo "✅ URLs abiertas. Sigue la guía en:"
echo "   claude_tools/configure_oauth_consent.md"
echo ""
echo "🧪 Después de configurar, probar con:"
echo "   ./test_local.sh"
echo ""