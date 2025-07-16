#!/bin/bash

# Script de despliegue para Google Cloud Run
# Sistema Gozain - Portal de Ciberseguridad

set -e  # Salir si hay errores

# Configuración
PROJECT_ID="inventario-iso27001-20250708"
SERVICE_NAME="gozain"
REGION="us-central1"
BILLING_ACCOUNT_ID="0137EC-58A3A3-78EA95"  # La misma cuenta de facturación
USER_EMAIL="jorge.uriarte@gailen.es"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando despliegue de Gozain en Google Cloud Run${NC}"
echo "=================================================="

# Función para manejar errores
handle_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    handle_error "gcloud CLI no está instalado. Por favor instálalo primero."
fi

# Verificar autenticación
echo -e "${YELLOW}🔐 Verificando autenticación...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "$USER_EMAIL"; then
    echo -e "${YELLOW}Necesitas autenticarte con tu cuenta${NC}"
    gcloud auth login
fi

# Crear proyecto si no existe
echo -e "${YELLOW}📁 Configurando proyecto GCP...${NC}"
if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}Creando nuevo proyecto: $PROJECT_ID${NC}"
    gcloud projects create $PROJECT_ID --name="Gozain Portal de Ciberseguridad" || handle_error "No se pudo crear el proyecto"
    
    # Asociar cuenta de facturación
    echo -e "${YELLOW}💳 Asociando cuenta de facturación...${NC}"
    gcloud beta billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID || handle_error "No se pudo asociar la cuenta de facturación"
fi

# Establecer proyecto por defecto
gcloud config set project $PROJECT_ID

# Habilitar APIs necesarias
echo -e "${YELLOW}🔧 Habilitando APIs necesarias...${NC}"
gcloud services enable cloudbuild.googleapis.com || handle_error "No se pudo habilitar Cloud Build API"
gcloud services enable run.googleapis.com || handle_error "No se pudo habilitar Cloud Run API"
gcloud services enable artifactregistry.googleapis.com || handle_error "No se pudo habilitar Artifact Registry API"

# Esperar a que las APIs se activen
echo -e "${YELLOW}⏳ Esperando activación de APIs (30 segundos)...${NC}"
sleep 30

# Generar JWT_SECRET si no existe
if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}🔐 Generando JWT_SECRET seguro...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ JWT_SECRET generado${NC}"
fi

# Generar FLASK_SECRET_KEY si no existe
if [ -z "$FLASK_SECRET_KEY" ]; then
    echo -e "${YELLOW}🔐 Generando FLASK_SECRET_KEY seguro...${NC}"
    FLASK_SECRET_KEY=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ FLASK_SECRET_KEY generado${NC}"
fi

# Construir y desplegar
echo -e "${YELLOW}🏗️  Construyendo y desplegando aplicación con OAuth...${NC}"
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --port 8080 \
    --set-env-vars "FLASK_ENV=production,\
JWT_SECRET=$JWT_SECRET,\
FLASK_SECRET_KEY=$FLASK_SECRET_KEY,\
OAUTH_ENABLED=true" \
    || handle_error "Fallo en el despliegue"

# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

# Resumen
echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo "=================================================="
echo -e "${GREEN}📌 Detalles del despliegue:${NC}"
echo -e "   Proyecto: ${BLUE}$PROJECT_ID${NC}"
echo -e "   Servicio: ${BLUE}$SERVICE_NAME${NC}"
echo -e "   Región: ${BLUE}$REGION${NC}"
echo -e "   URL: ${BLUE}$SERVICE_URL${NC}"
echo "=================================================="

# Notificar por Slack
if [ -f "claude_tools/notificar_slack.py" ]; then
    echo -e "${YELLOW}📢 Enviando notificación a Slack...${NC}"
    python3 claude_tools/notificar_slack.py "✅ *Gozain desplegado en GCP*

🔗 URL: $SERVICE_URL
📦 Proyecto: $PROJECT_ID
🌍 Región: $REGION

El sistema está listo para usar. Accede a la URL para comenzar."
fi

echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "   1. Accede a $SERVICE_URL"
echo "   2. Crea las organizaciones necesarias"
echo "   3. Comienza a usar el sistema"
echo ""
echo -e "${BLUE}🔐 Configuración OAuth (IMPORTANTE - Guardar estas claves):${NC}"
echo "JWT_SECRET=$JWT_SECRET"
echo "FLASK_SECRET_KEY=$FLASK_SECRET_KEY"
echo ""
echo -e "${YELLOW}Para configurar OAuth completamente:${NC}"
echo "   1. Configurar credenciales en Google Cloud Console"
echo "   2. Actualizar data/organizaciones.json con client_id y client_secret"
echo "   3. Añadir URIs de redirección: $SERVICE_URL/api/auth/callback"
echo ""