#!/bin/bash

# Script para configurar GitHub Actions para Gozain
# Este script ayuda a crear la cuenta de servicio necesaria en GCP

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuración de GitHub Actions para Gozain ===${NC}"
echo

# Variables
PROJECT_ID="inventario-iso27001-20250708"
SA_NAME="github-actions-deployer"
SA_DISPLAY_NAME="GitHub Actions Deployer"
KEY_FILE="gcp-service-account-key.json"

echo -e "${YELLOW}Proyecto GCP:${NC} $PROJECT_ID"
echo -e "${YELLOW}Cuenta de servicio:${NC} $SA_NAME"
echo

# Verificar que gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI no está instalado${NC}"
    echo "Instala Google Cloud SDK desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar autenticación
echo "Verificando autenticación con GCP..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}No hay cuenta activa. Iniciando autenticación...${NC}"
    gcloud auth login
fi

# Configurar proyecto
echo "Configurando proyecto..."
gcloud config set project $PROJECT_ID

# Habilitar APIs necesarias
echo "Habilitando APIs necesarias..."
apis=(
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
    "iam.googleapis.com"
)

for api in "${apis[@]}"; do
    echo "  - Habilitando $api..."
    gcloud services enable $api --quiet
done

# Crear cuenta de servicio
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo
echo "Creando cuenta de servicio..."
if gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
    echo -e "${YELLOW}La cuenta de servicio ya existe${NC}"
else
    gcloud iam service-accounts create $SA_NAME \
        --display-name="$SA_DISPLAY_NAME" \
        --project=$PROJECT_ID
    echo -e "${GREEN}Cuenta de servicio creada${NC}"
fi

# Asignar roles
echo
echo "Asignando roles necesarios..."
roles=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/artifactregistry.writer"
    "roles/cloudbuild.builds.editor"
    "roles/storage.admin"
    "roles/serviceusage.serviceUsageConsumer"
)

for role in "${roles[@]}"; do
    echo "  - Asignando $role..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$role" \
        --quiet
done

# Crear clave
echo
echo "Creando clave de cuenta de servicio..."
if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}Ya existe un archivo de clave. ¿Deseas crear una nueva? (s/n)${NC}"
    read -r response
    if [[ "$response" != "s" ]]; then
        echo "Usando clave existente..."
    else
        rm -f $KEY_FILE
        gcloud iam service-accounts keys create $KEY_FILE \
            --iam-account=$SA_EMAIL \
            --project=$PROJECT_ID
        echo -e "${GREEN}Nueva clave creada${NC}"
    fi
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL \
        --project=$PROJECT_ID
    echo -e "${GREEN}Clave creada${NC}"
fi

# Mostrar instrucciones finales
echo
echo -e "${GREEN}=== Configuración completada ===${NC}"
echo
echo -e "${YELLOW}Próximos pasos:${NC}"
echo
echo "1. Ve a tu repositorio en GitHub"
echo "2. Ve a Settings → Secrets and variables → Actions"
echo "3. Crea un nuevo secret llamado 'GCP_SA_KEY'"
echo "4. Copia el contenido del archivo '$KEY_FILE' y pégalo como valor del secret"
echo
echo -e "${YELLOW}Contenido del archivo (NO compartas esto públicamente):${NC}"
echo "----------------------------------------"
cat $KEY_FILE
echo "----------------------------------------"
echo
echo -e "${RED}IMPORTANTE:${NC} Guarda este archivo de forma segura y NO lo subas a Git"
echo
echo "5. (Opcional) Si usas Slack, crea una variable 'SLACK_WEBHOOK_URL' con tu webhook"
echo
echo -e "${GREEN}¡Listo! Tu GitHub Actions está configurado para desplegar a GCP${NC}"