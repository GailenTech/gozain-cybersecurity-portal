#!/bin/bash

# Script para limpiar datos de prueba en Google Cloud Storage
# Sistema Gozain - Portal de Ciberseguridad

set -e

# Configuración
BUCKET_NAME="inventario-iso27001-data"
PROJECT_ID="inventario-iso27001-20250708"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Limpieza de datos en Google Cloud Storage${NC}"
echo "=================================================="

# Verificar que gsutil esté instalado
if ! command -v gsutil &> /dev/null; then
    echo -e "${RED}❌ gsutil no está instalado${NC}"
    exit 1
fi

# Configurar proyecto
echo -e "${YELLOW}📁 Configurando proyecto...${NC}"
gcloud config set project $PROJECT_ID

# Listar contenido actual
echo -e "${YELLOW}📦 Contenido actual del bucket:${NC}"
gsutil ls -r gs://$BUCKET_NAME/ || echo "Bucket vacío o no accesible"

# Patrones de datos de prueba a eliminar
echo -e "${YELLOW}🔍 Identificando datos de prueba...${NC}"
PATTERNS=(
    "e2e_*"
    "test_*"
    "*_test"
    "*_prueba*"
    "cypress*"
)

# Mostrar qué se va a eliminar
echo -e "${YELLOW}🗑️  Datos a eliminar:${NC}"
for pattern in "${PATTERNS[@]}"; do
    echo "   - Pattern: $pattern"
    gsutil ls gs://$BUCKET_NAME/$pattern 2>/dev/null || true
    gsutil ls gs://$BUCKET_NAME/**/$pattern 2>/dev/null || true
done

# Confirmar
read -p "¿Eliminar estos datos de prueba? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Operación cancelada${NC}"
    exit 1
fi

# Eliminar datos de prueba
echo -e "${YELLOW}🗑️  Eliminando datos de prueba...${NC}"
for pattern in "${PATTERNS[@]}"; do
    gsutil -m rm -r gs://$BUCKET_NAME/$pattern 2>/dev/null || true
    gsutil -m rm -r gs://$BUCKET_NAME/**/$pattern 2>/dev/null || true
done

# Eliminar archivos antiguos específicos
echo -e "${YELLOW}🗑️  Eliminando archivos antiguos...${NC}"
OLD_FILES=(
    "inventario.json"
    "inventario_*.json"
    "inventario.json.backup*"
)

for file in "${OLD_FILES[@]}"; do
    gsutil rm gs://$BUCKET_NAME/$file 2>/dev/null || true
done

# Crear estructura limpia para Gailen
echo -e "${YELLOW}📁 Creando estructura limpia para Gailen...${NC}"

# Crear archivos JSON vacíos
cat > /tmp/empty_inventario.json << EOF
{
  "activos": [],
  "metadata": {
    "version": "1.0",
    "ultima_actualizacion": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_activos": 0
  }
}
EOF

cat > /tmp/empty_impactos.json << EOF
{
  "impactos": [],
  "tareas": [],
  "metadata": {
    "version": "1.0",
    "ultima_actualizacion": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_impactos": 0,
    "total_tareas": 0
  }
}
EOF

cat > /tmp/empty_madurez.json << EOF
{
  "assessments": [],
  "metadata": {
    "version": "1.0",
    "ultima_actualizacion": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_assessments": 0
  }
}
EOF

# Subir archivos vacíos para Gailen
echo -e "${YELLOW}📤 Subiendo estructura para Gailen...${NC}"
gsutil cp /tmp/empty_inventario.json gs://$BUCKET_NAME/gailen/inventario.json
gsutil cp /tmp/empty_impactos.json gs://$BUCKET_NAME/gailen/impactos.json
gsutil cp /tmp/empty_madurez.json gs://$BUCKET_NAME/gailen/madurez_assessments.json

# Actualizar organizaciones.json
cat > /tmp/organizaciones.json << EOF
{
  "gailen": {
    "id": "gailen",
    "nombre": "Gailen Tecnologías",
    "fecha_creacion": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "activa": true,
    "oauth_config": {
      "provider": "google",
      "client_id": "CONFIGURAR_CLIENT_ID_REAL",
      "client_secret": "CONFIGURAR_CLIENT_SECRET_REAL",
      "allowed_domains": [
        "gailen.es",
        "gailen.com",
        "gailentecnologias.com"
      ],
      "require_domain_match": true,
      "custom_claims": {
        "department": "department",
        "role": "job_title"
      }
    },
    "seguridad": {
      "require_mfa": false,
      "session_timeout": 3600,
      "ip_whitelist": []
    }
  },
  "demo": {
    "id": "demo",
    "nombre": "Organización Demo",
    "fecha_creacion": "2025-01-01T00:00:00",
    "activa": true,
    "oauth_config": {
      "provider": "google",
      "client_id": "demo-client-id",
      "client_secret": "demo-client-secret",
      "allowed_domains": ["demo.com"],
      "require_domain_match": false,
      "custom_claims": {
        "department": "dept",
        "role": "role"
      }
    },
    "seguridad": {
      "require_mfa": false,
      "session_timeout": 3600,
      "ip_whitelist": []
    }
  }
}
EOF

gsutil cp /tmp/organizaciones.json gs://$BUCKET_NAME/organizaciones.json

# Crear archivos globales vacíos
echo "[]" > /tmp/empty_array.json
echo "{}" > /tmp/empty_object.json

gsutil cp /tmp/empty_array.json gs://$BUCKET_NAME/audit_logs.json
gsutil cp /tmp/empty_object.json gs://$BUCKET_NAME/sessions.json
gsutil cp /tmp/empty_object.json gs://$BUCKET_NAME/users.json

# Limpiar archivos temporales
rm /tmp/empty_*.json /tmp/organizaciones.json

# Mostrar resultado final
echo -e "${GREEN}✅ Limpieza completada${NC}"
echo
echo -e "${YELLOW}📦 Contenido final del bucket:${NC}"
gsutil ls -r gs://$BUCKET_NAME/

echo
echo -e "${BLUE}⚠️  IMPORTANTE:${NC}"
echo "   1. Actualiza organizaciones.json en GCS con las credenciales OAuth reales"
echo "   2. Puedes hacerlo descargando, editando y subiendo:"
echo "      gsutil cp gs://$BUCKET_NAME/organizaciones.json ."
echo "      nano organizaciones.json"
echo "      gsutil cp organizaciones.json gs://$BUCKET_NAME/"
echo