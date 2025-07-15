#!/bin/bash
# Comandos para configurar OAuth en Google Cloud Console

PROJECT_ID="inventario-iso27001-20250708"
ACCOUNT="jorge.uriarte@gailen.es"

echo "🔧 Configuración OAuth para Gailen Tecnologías"
echo "=============================================="
echo ""
echo "Proyecto: $PROJECT_ID"
echo "Cuenta: $ACCOUNT"
echo ""

# Verificar configuración actual
echo "1. Verificando configuración actual..."
gcloud config list
echo ""

# URLs para configuración manual
echo "2. URLs para configuración manual en Google Cloud Console:"
echo ""
echo "🌐 Abrir Google Cloud Console:"
echo "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""

echo "📋 Configuración de OAuth Consent Screen:"
echo "https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo ""

echo "🔑 Crear credenciales OAuth 2.0:"
echo "https://console.cloud.google.com/apis/credentials/oauthclient?project=$PROJECT_ID"
echo ""

echo "3. Configuración recomendada:"
echo ""
echo "OAuth Consent Screen:"
echo "  - Application name: Gozain - Sistema de Inventario de Activos"
echo "  - User support email: jorge.uriarte@gailen.es"
echo "  - Developer contact email: jorge.uriarte@gailen.es"
echo "  - Authorized domains: gailen.es, gailentecnologias.com"
echo "  - Scopes: email, profile, openid"
echo ""

echo "OAuth 2.0 Client:"
echo "  - Application type: Web application"
echo "  - Name: Gozain Inventario Activos"
echo "  - Authorized JavaScript origins:"
echo "    * https://inventario-activos-dot-$PROJECT_ID.uc.r.appspot.com"
echo "    * http://localhost:8080"
echo "    * http://localhost:5001"
echo "  - Authorized redirect URIs:"
echo "    * https://inventario-activos-dot-$PROJECT_ID.uc.r.appspot.com/api/auth/callback"
echo "    * http://localhost:8080/api/auth/callback"
echo "    * http://localhost:5001/api/auth/callback"
echo ""

echo "4. Después de crear las credenciales, ejecutar:"
echo "python3 claude_tools/setup_oauth.py"
echo ""