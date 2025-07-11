#!/bin/bash

# Script para configurar los secretos de GitHub Actions
# Este script ayuda a generar y configurar la clave de servicio de GCP

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Configuración de Secretos para GitHub Actions${NC}"
echo "============================================"

# Configuración
PROJECT_ID="inventario-iso27001-20250708"
SERVICE_ACCOUNT_NAME="github-actions-deployer"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI no está instalado${NC}"
    exit 1
fi

# Verificar que gh esté instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) no está instalado${NC}"
    echo "Instálalo con: brew install gh"
    exit 1
fi

# Establecer proyecto
echo -e "${YELLOW}1. Estableciendo proyecto GCP...${NC}"
gcloud config set project $PROJECT_ID

# Crear cuenta de servicio si no existe
echo -e "${YELLOW}2. Verificando cuenta de servicio...${NC}"
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &> /dev/null; then
    echo "Creando cuenta de servicio..."
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Deployer" \
        --description="Service account for GitHub Actions deployments"
else
    echo "Cuenta de servicio ya existe"
fi

# Asignar roles necesarios
echo -e "${YELLOW}3. Asignando roles IAM...${NC}"
ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/cloudbuild.builds.editor"
    "roles/viewer"
    "roles/artifactregistry.writer"
)

for ROLE in "${ROLES[@]}"; do
    echo "Asignando rol: $ROLE"
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="$ROLE" \
        --quiet
done

# Generar clave JSON
echo -e "${YELLOW}4. Generando clave de servicio...${NC}"
KEY_FILE="gcp-sa-key.json"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

# Verificar autenticación de GitHub CLI
echo -e "${YELLOW}5. Verificando autenticación de GitHub...${NC}"
if ! gh auth status &> /dev/null; then
    echo "Necesitas autenticarte con GitHub CLI"
    gh auth login
fi

# Obtener el repositorio remoto
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ -z "$REPO_URL" ]]; then
    echo -e "${RED}Error: No se encontró un repositorio remoto${NC}"
    echo "Asegúrate de estar en un repositorio Git con un remoto configurado"
    exit 1
fi

# Extraer owner/repo de la URL
if [[ $REPO_URL =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
else
    echo -e "${RED}Error: No se pudo extraer owner/repo de la URL${NC}"
    exit 1
fi

echo "Repositorio detectado: $OWNER/$REPO"

# Configurar secreto en GitHub
echo -e "${YELLOW}6. Configurando secreto en GitHub...${NC}"
gh secret set GCP_SA_KEY < $KEY_FILE --repo $OWNER/$REPO

# Limpiar
rm -f $KEY_FILE

echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "Secretos configurados:"
echo "- GCP_SA_KEY: Clave de servicio para despliegue"
echo ""
echo "Opcional: Para notificaciones de Slack, agrega SLACK_WEBHOOK_URL manualmente"
echo ""
echo "Los workflows de GitHub Actions están listos para usar."