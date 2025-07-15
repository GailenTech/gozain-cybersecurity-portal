#!/bin/bash
# Script para abrir todas las URLs necesarias para configurar OAuth

PROJECT_ID="inventario-iso27001-20250708"

echo "🌐 Abriendo URLs para configuración OAuth..."
echo "Proyecto: $PROJECT_ID"
echo ""

# Abrir URLs en el navegador
echo "1. Abriendo OAuth Consent Screen..."
open "https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"

sleep 2

echo "2. Abriendo Credenciales OAuth 2.0..."
open "https://console.cloud.google.com/apis/credentials/oauthclient?project=$PROJECT_ID"

sleep 2

echo "3. Abriendo página principal de credenciales..."
open "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"

echo ""
echo "✅ URLs abiertas en el navegador"
echo ""
echo "📋 Siguiente paso: Configurar OAuth Consent Screen y crear credenciales"
echo "📖 Ver detalles en: claude_tools/oauth_manual_steps.md"